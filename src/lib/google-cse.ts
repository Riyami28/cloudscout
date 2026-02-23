import { LinkedInPost } from '@/types';

const TAVILY_API_URL = 'https://api.tavily.com/search';

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface TavilyResponse {
  results: TavilyResult[];
  query: string;
  response_time: number;
}

// Keep old interfaces for backward compatibility with trending route
export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

export interface SerperResponse {
  organic?: SerperResult[];
  searchParameters?: { q: string; totalResults?: number };
}

// Core Tavily search utility — replaces Serper
async function queryTavily(
  query: string,
  options: { maxResults?: number; days?: number } = {}
): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Tavily API key is required. Set TAVILY_API_KEY in .env.local (get free key at tavily.com)'
    );
  }

  const body: Record<string, unknown> = {
    api_key: apiKey,
    query,
    max_results: options.maxResults || 10,
    include_raw_content: false,
    search_depth: 'basic',
  };

  if (options.days) {
    body.days = options.days;
  }

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tavily API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Convert date range to days for Tavily
function getDaysFromDateRange(dateRange: string): number | undefined {
  switch (dateRange) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    default:
      return undefined;
  }
}

// Keep getTimeFilter exported (used by search-profile route) — now maps to days
export function getTimeFilter(dateRange: string): string | undefined {
  switch (dateRange) {
    case '7d':
      return '7';
    case '30d':
      return '30';
    case '90d':
      return '90';
    default:
      return undefined;
  }
}

// Shared query function — same signature as old querySerper so other routes still work
// Returns data in the old SerperResponse shape for backward compatibility
export async function querySerper(
  query: string,
  options: { num?: number; page?: number; tbs?: string } = {}
): Promise<SerperResponse> {
  const days = options.tbs ? parseInt(options.tbs, 10) || undefined : undefined;

  const data = await queryTavily(query, {
    maxResults: options.num || 10,
    days,
  });

  // Map Tavily results to SerperResult shape
  const organic: SerperResult[] = data.results.map((r) => ({
    title: r.title,
    link: r.url,
    snippet: r.content,
    date: r.published_date,
  }));

  return {
    organic,
    searchParameters: { q: query, totalResults: organic.length },
  };
}

export function parseResult(item: SerperResult): LinkedInPost {
  let author: string | undefined;
  const urlMatch = item.link.match(
    /linkedin\.com\/(?:posts|pulse|in)\/([^_/]+)/
  );
  if (urlMatch) {
    author = urlMatch[1].replace(/-/g, ' ');
  }

  return {
    url: item.link,
    title: item.title,
    snippet: item.snippet,
    author,
    publishedDate: item.date,
  };
}

function buildSearchQuery(keywords: string[], roles: string[]): string {
  const siteFilter = 'site:linkedin.com/posts OR site:linkedin.com/pulse';

  const keywordPart =
    keywords.length > 0
      ? `(${keywords.map((k) => `"${k}"`).join(' OR ')})`
      : '"cloud cost" OR "cloud bill"';

  const rolePart =
    roles.length > 0 ? `(${roles.map((r) => `"${r}"`).join(' OR ')})` : '';

  return [siteFilter, keywordPart, rolePart].filter(Boolean).join(' ');
}

export async function searchLinkedInPosts(
  keywords: string[],
  roles: string[],
  dateRange: string = 'all',
  page: number = 1
): Promise<{ posts: LinkedInPost[]; totalResults: number }> {
  const query = buildSearchQuery(keywords, roles);
  const days = getDaysFromDateRange(dateRange);

  const data = await queryTavily(query, { maxResults: 10, days });

  const posts = data.results
    .filter((r) => r.url.includes('linkedin.com'))
    .map((r) => {
      let author: string | undefined;
      const urlMatch = r.url.match(
        /linkedin\.com\/(?:posts|pulse|in)\/([^_/]+)/
      );
      if (urlMatch) {
        author = urlMatch[1].replace(/-/g, ' ');
      }

      return {
        url: r.url,
        title: r.title,
        snippet: r.content,
        author,
        publishedDate: r.published_date,
      } as LinkedInPost;
    });

  return {
    posts,
    totalResults: posts.length,
  };
}
