import { LinkedInPost } from '@/types';

const SERPER_API_URL = 'https://google.serper.dev/search';

// ===== IN-MEMORY CACHE (30 min TTL) =====
// Same query from any user serves cached results — saves API calls
interface CacheEntry {
  data: SerperResponse;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(query: string, num: number, tbs?: string): string {
  return `${query}|${num}|${tbs || ''}`;
}

function getFromCache(key: string): SerperResponse | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: SerperResponse): void {
  // Prevent cache from growing unbounded — max 200 entries
  if (searchCache.size > 200) {
    const oldest = searchCache.keys().next().value;
    if (oldest) searchCache.delete(oldest);
  }
  searchCache.set(key, { data, timestamp: Date.now() });
}

// ===== INTERFACES =====
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

// ===== CORE SERPER SEARCH =====
export async function querySerper(
  query: string,
  options: { num?: number; page?: number; tbs?: string } = {}
): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Serper API key is required. Set SERPER_API_KEY in .env.local (get key at serper.dev)'
    );
  }

  const num = options.num || 10;
  const cacheKey = getCacheKey(query, num, options.tbs);

  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] ${query.slice(0, 50)}...`);
    return cached;
  }

  console.log(`[Cache MISS] ${query.slice(0, 50)}... → calling Serper`);

  const body: Record<string, unknown> = {
    q: query,
    num,
  };

  if (options.page && options.page > 1) {
    body.page = options.page;
  }

  if (options.tbs) {
    body.tbs = `qdr:${options.tbs}`;
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

  const data: SerperResponse = await response.json();

  // Cache the result
  setCache(cacheKey, data);

  return data;
}

// ===== TIME FILTER =====
export function getTimeFilter(dateRange: string): string | undefined {
  switch (dateRange) {
    case '7d':
      return 'd7'; // Serper uses qdr:d7 format
    case '30d':
      return 'm';  // qdr:m = past month
    case '90d':
      return 'm3'; // qdr:m3 = past 3 months
    default:
      return undefined;
  }
}

// ===== PARSE RESULT =====
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

// ===== SEARCH LINKEDIN POSTS =====
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

  const data = await querySerper(query, { num: 10, tbs, page });

  const posts = (data.organic || [])
    .filter((r) => r.link.includes('linkedin.com'))
    .map((r) => parseResult(r));

  return {
    posts,
    totalResults: posts.length,
  };
}
