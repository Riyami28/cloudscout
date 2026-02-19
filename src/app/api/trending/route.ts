import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_CSE_API_URL = 'https://www.googleapis.com/customsearch/v1';

// Categorized queries for broader coverage
const FEED_CATEGORIES = {
  finops_community: {
    label: 'FinOps & Cloud Cost Community',
    queries: [
      'FinOps cloud cost optimization 2025 2026',
      'FinOps Foundation cloud financial management',
      '"cloud cost" community best practices',
    ],
    dateRestrict: 'd7',
  },
  competitors: {
    label: 'Competitor Updates',
    queries: [
      'Vantage OR CloudHealth OR Kubecost OR "Spot.io" cloud cost tool update',
      'Infracost OR CloudZero OR Apptio OR Flexera cloud cost new feature',
      'CAST AI OR Harness cloud cost optimization announcement',
    ],
    dateRestrict: 'd7',
  },
  cloud_provider_updates: {
    label: 'Cloud Provider News',
    queries: [
      'AWS new feature pricing billing update 2025 2026',
      'Azure new service cost pricing update 2025 2026',
      'Google Cloud GCP new feature pricing 2025 2026',
      'Oracle Cloud OCI new feature pricing 2025 2026',
    ],
    dateRestrict: 'd7',
  },
  cloud_billing_pain: {
    label: 'Cloud Billing Pain',
    queries: [
      '"cloud bill" OR "cloud cost" problem OR too high OR shocked OR surprised',
      '"AWS bill" OR "Azure cost" OR "GCP billing" unexpected OR high OR optimize',
      'cloud spend reduce OR optimize OR FinOps OR waste',
    ],
    dateRestrict: 'd7',
  },
  linkedin_posts: {
    label: 'LinkedIn Discussions',
    queries: [
      'site:linkedin.com FinOps OR "cloud cost" OR "cloud billing"',
      'site:linkedin.com "cloud spend" OR "cloud optimization" OR "cloud waste"',
    ],
    dateRestrict: 'd14',
  },
};

interface GoogleCSEResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  pagemap?: {
    metatags?: Array<{ [key: string]: string }>;
    cse_image?: Array<{ src: string }>;
  };
}

interface GoogleCSEResponse {
  searchInformation: { totalResults: string };
  items?: GoogleCSEResult[];
}

export interface TrendingPost {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  author?: string;
  publishedDate?: string;
  imageUrl?: string;
}

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cseId) {
      return NextResponse.json(
        { error: 'Google CSE API key and CSE ID are required. Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .env.local' },
        { status: 500 }
      );
    }

    const allPosts: TrendingPost[] = [];
    const seenUrls = new Set<string>();

    // We have limited API calls (100/day free tier), so pick 1 query per category
    // That's 5 API calls per page load, cached for 30 min
    const selectedQueries: { category: string; label: string; query: string; dateRestrict: string }[] = [];

    for (const [categoryKey, category] of Object.entries(FEED_CATEGORIES)) {
      // Pick a random query from each category to get variety across page loads
      const randomIndex = Math.floor(Math.random() * category.queries.length);
      selectedQueries.push({
        category: categoryKey,
        label: category.label,
        query: category.queries[randomIndex],
        dateRestrict: category.dateRestrict,
      });
    }

    // Fetch all categories in parallel
    const fetchPromises = selectedQueries.map(async ({ category, label, query, dateRestrict }) => {
      const params = new URLSearchParams({
        key: apiKey,
        cx: cseId,
        q: query,
        num: '5',
        dateRestrict,
        sort: 'date',
      });

      try {
        const response = await fetch(`${GOOGLE_CSE_API_URL}?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`CSE error for "${category}":`, response.status, errorData);
          return [];
        }

        const data: GoogleCSEResponse = await response.json();
        if (!data.items) return [];

        return data.items
          .filter((item) => {
            if (seenUrls.has(item.link)) return false;
            seenUrls.add(item.link);
            return true;
          })
          .map((item): TrendingPost => {
            let author: string | undefined;

            // Try to extract author from LinkedIn URLs
            const linkedinMatch = item.link.match(/linkedin\.com\/(?:posts|pulse|in)\/([^_/]+)/);
            if (linkedinMatch) {
              author = linkedinMatch[1].replace(/-/g, ' ');
            }

            // Try metatags for author
            if (!author && item.pagemap?.metatags?.[0]) {
              author = item.pagemap.metatags[0]['author'] ||
                item.pagemap.metatags[0]['og:site_name'] ||
                item.pagemap.metatags[0]['twitter:creator'];
            }

            return {
              id: uuidv4(),
              category,
              categoryLabel: label,
              title: item.title,
              snippet: item.snippet,
              url: item.link,
              source: item.displayLink || new URL(item.link).hostname,
              author,
              publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
              imageUrl: item.pagemap?.cse_image?.[0]?.src,
            };
          });
      } catch (err) {
        console.error(`Fetch error for "${category}":`, err);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach((posts) => allPosts.push(...posts));

    // Group by category for the frontend
    const grouped: Record<string, { label: string; posts: TrendingPost[] }> = {};
    for (const post of allPosts) {
      if (!grouped[post.category]) {
        grouped[post.category] = { label: post.categoryLabel, posts: [] };
      }
      grouped[post.category].posts.push(post);
    }

    return NextResponse.json(
      {
        grouped,
        total: allPosts.length,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('Trending fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch trending posts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
