import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const SERPER_API_URL = 'https://google.serper.dev/search';

const FEED_CATEGORIES = {
  finops_community: {
    label: 'FinOps & Cloud Cost Community',
    queries: [
      'FinOps cloud cost optimization',
      'FinOps Foundation cloud financial management',
      '"cloud cost" community best practices',
    ],
  },
  competitors: {
    label: 'Competitor Updates',
    queries: [
      'Vantage OR CloudHealth OR Kubecost cloud cost tool',
      'Infracost OR CloudZero OR Apptio cloud cost',
      'CAST AI OR Harness cloud cost optimization',
    ],
  },
  cloud_provider_updates: {
    label: 'Cloud Provider News',
    queries: [
      'AWS new feature pricing billing update',
      'Azure new service cost pricing update',
      'Google Cloud GCP new feature pricing',
      'Oracle Cloud OCI new feature pricing',
    ],
  },
  cloud_billing_pain: {
    label: 'Cloud Billing Pain',
    queries: [
      '"cloud bill" OR "cloud cost" problem too high',
      '"AWS bill" OR "Azure cost" unexpected high optimize',
      'cloud spend reduce optimize FinOps waste',
    ],
  },
  linkedin_posts: {
    label: 'LinkedIn Discussions',
    queries: [
      'site:linkedin.com FinOps OR "cloud cost" OR "cloud billing"',
      'site:linkedin.com "cloud spend" OR "cloud optimization"',
    ],
  },
};

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

interface SerperResponse {
  organic?: SerperResult[];
  searchParameters?: { q: string };
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
}

export async function GET() {
  try {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Serper API key is required. Set SERPER_API_KEY in .env.local (get free key at serper.dev)' },
        { status: 500 }
      );
    }

    const allPosts: TrendingPost[] = [];
    const seenUrls = new Set<string>();

    // Pick 1 random query per category = 5 API calls, cached 30 min
    const selectedQueries: { category: string; label: string; query: string }[] = [];

    for (const [categoryKey, category] of Object.entries(FEED_CATEGORIES)) {
      const randomIndex = Math.floor(Math.random() * category.queries.length);
      selectedQueries.push({
        category: categoryKey,
        label: category.label,
        query: category.queries[randomIndex],
      });
    }

    // Fetch all categories in parallel
    const fetchPromises = selectedQueries.map(async ({ category, label, query }) => {
      try {
        const response = await fetch(SERPER_API_URL, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            num: 5,
            tbs: 'qdr:w', // last week
          }),
        });

        if (!response.ok) {
          console.error(`Serper error for "${category}":`, response.status);
          return [];
        }

        const data: SerperResponse = await response.json();
        if (!data.organic) return [];

        return data.organic
          .filter((item) => {
            if (seenUrls.has(item.link)) return false;
            seenUrls.add(item.link);
            return true;
          })
          .map((item): TrendingPost => {
            let author: string | undefined;

            const linkedinMatch = item.link.match(/linkedin\.com\/(?:posts|pulse|in)\/([^_/]+)/);
            if (linkedinMatch) {
              author = linkedinMatch[1].replace(/-/g, ' ');
            }

            let source: string;
            try {
              source = new URL(item.link).hostname.replace('www.', '');
            } catch {
              source = 'web';
            }

            return {
              id: uuidv4(),
              category,
              categoryLabel: label,
              title: item.title,
              snippet: item.snippet,
              url: item.link,
              source,
              author,
              publishedDate: item.date,
            };
          });
      } catch (err) {
        console.error(`Fetch error for "${category}":`, err);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach((posts) => allPosts.push(...posts));

    // Group by category
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
