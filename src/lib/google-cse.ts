import { LinkedInPost } from '@/types';

const SERPER_API_URL = 'https://google.serper.dev/search';

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

// Shared Serper fetch utility - reused by search and profile APIs
export async function querySerper(
  query: string,
  options: { num?: number; page?: number; tbs?: string } = {}
): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error('Serper API key is required. Set SERPER_API_KEY in .env.local (get free key at serper.dev)');
  }

  const body: Record<string, unknown> = {
    q: query,
    num: options.num || 10,
    page: options.page || 1,
  };

  if (options.tbs) {
    body.tbs = options.tbs;
  }

  const response = await fetch(SERPER_API_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Serper API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export function getTimeFilter(dateRange: string): string | undefined {
  switch (dateRange) {
    case '7d':
      return 'qdr:w';
    case '30d':
      return 'qdr:m';
    case '90d':
      return 'qdr:m3';
    default:
      return undefined;
  }
}

export function parseResult(item: SerperResult): LinkedInPost {
  let author: string | undefined;
  const urlMatch = item.link.match(/linkedin\.com\/(?:posts|pulse|in)\/([^_/]+)/);
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
  const tbs = getTimeFilter(dateRange);

  const data = await querySerper(query, { num: 10, page, tbs });

  return {
    posts: (data.organic || []).map(parseResult),
    totalResults: data.organic?.length || 0,
  };
}
