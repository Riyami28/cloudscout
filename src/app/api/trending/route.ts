import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const TAVILY_API_URL = 'https://api.tavily.com/search';

const FEED_CATEGORIES = {
  linkedin_cloud_billing: {
    label: 'LinkedIn: Cloud Billing',
    queries: [
      'site:linkedin.com "cloud bill" OR "cloud cost" OR "cloud billing" problem',
      'site:linkedin.com "AWS bill" OR "Azure cost" OR "GCP billing" high',
      'site:linkedin.com "cloud spend" OR "cloud expenses" OR "cloud budget"',
    ],
    num: 8,
  },
  linkedin_finops: {
    label: 'LinkedIn: FinOps',
    queries: [
      'site:linkedin.com FinOps OR "cloud financial management" OR "cloud cost optimization"',
      'site:linkedin.com "cloud savings" OR "right-sizing" OR "reserved instances"',
      'site:linkedin.com "cloud waste" OR "cost optimization" OR "reduce cloud spend"',
    ],
    num: 8,
  },
  linkedin_cloud_engineering: {
    label: 'LinkedIn: Cloud Engineering',
    queries: [
      'site:linkedin.com "cloud infrastructure" OR "cloud migration" OR "cloud architecture"',
      'site:linkedin.com "DevOps" OR "SRE" OR "platform engineering" cloud',
      'site:linkedin.com "kubernetes cost" OR "cloud native" OR "multi-cloud"',
    ],
    num: 6,
  },
  linkedin_decision_makers: {
    label: 'LinkedIn: Decision Makers',
    queries: [
      'site:linkedin.com CTO OR "VP Engineering" "cloud cost" OR "cloud bill"',
      'site:linkedin.com "Head of Infrastructure" OR "Director of Engineering" cloud',
      'site:linkedin.com CFO OR "VP Operations" "cloud spend" OR "cloud budget"',
    ],
    num: 6,
  },
  competitors: {
    label: 'Competitor Updates',
    queries: [
      'site:linkedin.com Vantage OR CloudHealth OR Kubecost OR Infracost cloud cost',
      'site:linkedin.com CloudZero OR Apptio OR "CAST AI" OR Harness cloud cost',
    ],
    num: 5,
  },
  cloud_provider_updates: {
    label: 'Cloud Provider News',
    queries: [
      'site:linkedin.com AWS OR Azure OR "Google Cloud" OR OCI new feature pricing',
      'site:linkedin.com "cloud pricing" OR "cloud update" OR "new cloud service"',
    ],
    num: 5,
  },
};

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  query: string;
  response_time: number;
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
  isLinkedIn: boolean;
}

export async function GET() {
  try {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Tavily API key is required. Set TAVILY_API_KEY in .env.local (get free key at tavily.com)' },
        { status: 500 }
      );
    }

    const allPosts: TrendingPost[] = [];
    const seenUrls = new Set<string>();

    // Pick 1 random query per category
    const selectedQueries: { category: string; label: string; query: string; num: number }[] = [];

    for (const [categoryKey, category] of Object.entries(FEED_CATEGORIES)) {
      const randomIndex = Math.floor(Math.random() * category.queries.length);
      selectedQueries.push({
        category: categoryKey,
        label: category.label,
        query: category.queries[randomIndex],
        num: category.num,
      });
    }

    // Fetch all categories in parallel using Tavily
    const fetchPromises = selectedQueries.map(async ({ category, label, query, num }) => {
      try {
        const response = await fetch(TAVILY_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            max_results: num,
            include_raw_content: false,
            search_depth: 'basic',
            days: 30, // last month for broader results
          }),
        });

        if (!response.ok) {
          console.error(`Tavily error for "${category}":`, response.status);
          return [];
        }

        const data: TavilyResponse = await response.json();
        if (!data.results) return [];

        return data.results
          .filter((item) => {
            if (seenUrls.has(item.url)) return false;
            seenUrls.add(item.url);
            return true;
          })
          .map((item): TrendingPost => {
            let author: string | undefined;
            const isLinkedIn = item.url.includes('linkedin.com');

            const linkedinMatch = item.url.match(/linkedin\.com\/(?:posts|pulse|in)\/([^_/]+)/);
            if (linkedinMatch) {
              author = linkedinMatch[1].replace(/-/g, ' ');
            }

            // Try to extract author from LinkedIn title format
            if (isLinkedIn && !author) {
              const titleMatch = item.title.match(/^(.+?)(?:\s+on\s+LinkedIn|\s+-\s+)/);
              if (titleMatch) {
                author = titleMatch[1].trim();
              }
            }

            let source: string;
            try {
              source = new URL(item.url).hostname.replace('www.', '');
            } catch {
              source = 'web';
            }

            return {
              id: uuidv4(),
              category,
              categoryLabel: label,
              title: item.title,
              snippet: item.content,
              url: item.url,
              source,
              author,
              publishedDate: item.published_date,
              isLinkedIn,
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
