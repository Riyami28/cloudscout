import { LinkedInPost } from '@/types';

const GOOGLE_CSE_API_URL = 'https://www.googleapis.com/customsearch/v1';

interface GoogleCSEResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    metatags?: Array<{ [key: string]: string }>;
  };
}

interface GoogleCSEResponse {
  searchInformation: {
    totalResults: string;
  };
  items?: GoogleCSEResult[];
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

function getDateRestrict(dateRange: string): string | undefined {
  switch (dateRange) {
    case '7d':
      return 'd7';
    case '30d':
      return 'm1';
    case '90d':
      return 'm3';
    default:
      return undefined;
  }
}

function parseResult(item: GoogleCSEResult): LinkedInPost {
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
    publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
  };
}

export async function searchLinkedInPosts(
  keywords: string[],
  roles: string[],
  dateRange: string = 'all',
  page: number = 1
): Promise<{ posts: LinkedInPost[]; totalResults: number }> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    throw new Error('Google CSE API key and CSE ID are required. Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .env.local');
  }

  const query = buildSearchQuery(keywords, roles);
  const startIndex = (page - 1) * 10 + 1;

  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: query,
    start: startIndex.toString(),
    num: '10',
  });

  const dateRestrict = getDateRestrict(dateRange);
  if (dateRestrict) {
    params.set('dateRestrict', dateRestrict);
  }

  const response = await fetch(`${GOOGLE_CSE_API_URL}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google CSE API error: ${response.status} - ${error}`);
  }

  const data: GoogleCSEResponse = await response.json();

  return {
    posts: (data.items || []).map(parseResult),
    totalResults: parseInt(data.searchInformation.totalResults, 10) || 0,
  };
}
