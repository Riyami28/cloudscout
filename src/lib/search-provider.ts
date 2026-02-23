import { LinkedInPost } from '@/types';
import {
  searchLinkedInPosts as searchWithSerper,
  querySerper,
  parseResult as parseSerperResult,
  getTimeFilter,
} from './google-cse';
import {
  searchLinkedInPostsTavily as searchWithTavily,
  queryTavily,
  parseTavilyResult,
  getDaysFromDateRange,
} from './tavily';

export type SearchProvider = 'serper' | 'tavily';

// Determine which provider to use based on env config
// Set SEARCH_PROVIDER=tavily in .env.local to use Tavily
// Defaults to serper if not set
export function getSearchProvider(): SearchProvider {
  const provider = process.env.SEARCH_PROVIDER?.toLowerCase();
  if (provider === 'tavily') return 'tavily';
  return 'serper';
}

// Unified LinkedIn post search
export async function searchLinkedInPosts(
  keywords: string[],
  roles: string[],
  dateRange: string = 'all',
  page: number = 1
): Promise<{ posts: LinkedInPost[]; totalResults: number }> {
  const provider = getSearchProvider();

  if (provider === 'tavily') {
    return searchWithTavily(keywords, roles, dateRange, page);
  }
  return searchWithSerper(keywords, roles, dateRange, page);
}

// Unified raw query (for profile search, trending, etc.)
export async function rawSearch(
  query: string,
  options: { num?: number; dateRange?: string }
): Promise<{ results: Array<{ title: string; link: string; snippet: string; date?: string }> }> {
  const provider = getSearchProvider();

  if (provider === 'tavily') {
    const days = options.dateRange ? getDaysFromDateRange(options.dateRange) : undefined;
    const data = await queryTavily(query, {
      maxResults: options.num || 10,
      days,
    });
    return {
      results: data.results.map((r) => ({
        title: r.title,
        link: r.url,
        snippet: r.content,
        date: r.published_date,
      })),
    };
  }

  // Serper
  const tbs = options.dateRange ? getTimeFilter(options.dateRange) : undefined;
  const data = await querySerper(query, { num: options.num || 10, tbs });
  return {
    results: (data.organic || []).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      date: r.date,
    })),
  };
}
