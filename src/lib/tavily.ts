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

// Core Tavily search utility
export async function queryTavily(
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

export function getDaysFromDateRange(dateRange: string): number | undefined {
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

export function parseTavilyResult(item: TavilyResult): LinkedInPost {
  let author: string | undefined;
  const urlMatch = item.url.match(
    /linkedin\.com\/(?:posts|pulse|in)\/([^_/]+)/
  );
  if (urlMatch) {
    author = urlMatch[1].replace(/-/g, ' ');
  }

  return {
    url: item.url,
    title: item.title,
    snippet: item.content,
    author,
    publishedDate: item.published_date,
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

export async function searchLinkedInPostsTavily(
  keywords: string[],
  roles: string[],
  dateRange: string = 'all',
  page: number = 1
): Promise<{ posts: LinkedInPost[]; totalResults: number }> {
  const query = buildSearchQuery(keywords, roles);
  const days = getDaysFromDateRange(dateRange);

  const data = await queryTavily(query, {
    maxResults: 10,
    days,
  });

  return {
    posts: data.results
      .filter((r) => r.url.includes('linkedin.com'))
      .map(parseTavilyResult),
    totalResults: data.results.length,
  };
}
