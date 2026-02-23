import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { querySerper } from '@/lib/google-cse';

// All available categories
const FEED_CATEGORIES: Record<string, { label: string; queries: string[]; num: number }> = {
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

// Default 3 categories for initial load — rest lazy loaded
const DEFAULT_CATEGORIES = ['linkedin_cloud_billing', 'linkedin_finops', 'linkedin_decision_makers'];

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

export async function GET(request: NextRequest) {
  try {
    // Support ?categories=all or ?categories=cat1,cat2 for lazy loading
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');

    let categoryKeys: string[];
    if (categoriesParam === 'all') {
      categoryKeys = Object.keys(FEED_CATEGORIES);
    } else if (categoriesParam) {
      categoryKeys = categoriesParam.split(',').filter((k) => k in FEED_CATEGORIES);
    } else {
      // Default: only load 3 categories (saves 50% API calls)
      categoryKeys = DEFAULT_CATEGORIES;
    }

    const allPosts: TrendingPost[] = [];
    const seenUrls = new Set<string>();

    // Pick 1 random query per selected category
    const selectedQueries = categoryKeys.map((categoryKey) => {
      const category = FEED_CATEGORIES[categoryKey];
      const randomIndex = Math.floor(Math.random() * category.queries.length);
      return {
        category: categoryKey,
        label: category.label,
        query: category.queries[randomIndex],
        num: category.num,
      };
    });

    // Fetch all categories in parallel using cached querySerper
    const fetchPromises = selectedQueries.map(async ({ category, label, query, num }) => {
      try {
        // querySerper has built-in 30-min cache — same query won't hit API again
        const data = await querySerper(query, { num, tbs: 'm' }); // past month

        if (!data.organic) return [];

        return data.organic
          .filter((item) => {
            if (seenUrls.has(item.link)) return false;
            seenUrls.add(item.link);
            return true;
          })
          .map((item): TrendingPost => {
            let author: string | undefined;
            const isLinkedIn = item.link.includes('linkedin.com');

            const linkedinMatch = item.link.match(/linkedin\.com\/(?:posts|pulse|in)\/([^_/]+)/);
            if (linkedinMatch) {
              author = linkedinMatch[1].replace(/-/g, ' ');
            }

            if (isLinkedIn && !author) {
              const titleMatch = item.title.match(/^(.+?)(?:\s+on\s+LinkedIn|\s+-\s+)/);
              if (titleMatch) {
                author = titleMatch[1].trim();
              }
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

    // Also return available categories for lazy-load UI
    const availableCategories = Object.entries(FEED_CATEGORIES).map(([key, val]) => ({
      key,
      label: val.label,
      loaded: categoryKeys.includes(key),
    }));

    return NextResponse.json(
      {
        grouped,
        total: allPosts.length,
        availableCategories,
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
