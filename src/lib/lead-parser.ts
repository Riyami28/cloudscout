import { LinkedInPost } from '@/types';

export function isValidLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'www.linkedin.com' || parsed.hostname === 'linkedin.com';
  } catch {
    return false;
  }
}

export function parseLinkedInUrl(url: string): LinkedInPost | null {
  if (!isValidLinkedInUrl(url)) return null;

  let author: string | undefined;
  const patterns = [
    /linkedin\.com\/posts\/([^_/]+)/,
    /linkedin\.com\/in\/([^/?]+)/,
    /linkedin\.com\/pulse\/[^/]*?-([a-zA-Z0-9-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      author = match[1].replace(/-/g, ' ');
      break;
    }
  }

  return {
    url,
    title: author ? `Post by ${author}` : 'LinkedIn Post',
    snippet: 'Manually imported - click to view on LinkedIn',
    author,
  };
}

export function parseMultipleUrls(text: string): LinkedInPost[] {
  const urlRegex = /https?:\/\/(?:www\.)?linkedin\.com\/[^\s,]+/g;
  const urls = text.match(urlRegex) || [];

  return urls
    .map((url) => parseLinkedInUrl(url.trim()))
    .filter((post): post is LinkedInPost => post !== null);
}
