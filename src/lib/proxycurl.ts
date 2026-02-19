import { LeadProfile } from '@/types';

const PROXYCURL_API_URL = 'https://nubela.co/proxycurl/api/v2/linkedin';

interface ProxycurlResponse {
  public_identifier: string;
  first_name: string;
  last_name: string;
  full_name: string;
  headline: string;
  occupation: string;
  summary: string;
  city: string;
  state: string;
  country_full_name: string;
  profile_pic_url: string;
  experiences: Array<{
    title: string;
    company: string;
    starts_at: { year: number; month: number };
    ends_at: { year: number; month: number } | null;
  }>;
  industry: string;
}

export function extractProfileUrl(postUrl: string): string | null {
  const patterns = [
    /linkedin\.com\/in\/([^/?]+)/,
    /linkedin\.com\/posts\/([^_]+)/,
    /linkedin\.com\/pulse\/[^/]+.*?-([a-zA-Z0-9-]+)/,
  ];

  for (const pattern of patterns) {
    const match = postUrl.match(pattern);
    if (match) {
      return `https://www.linkedin.com/in/${match[1]}`;
    }
  }
  return null;
}

export async function enrichProfile(linkedinUrl: string): Promise<LeadProfile> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) {
    throw new Error('Proxycurl API key is required. Set PROXYCURL_API_KEY in .env.local');
  }

  const params = new URLSearchParams({
    url: linkedinUrl,
    use_cache: 'if-present',
  });

  const response = await fetch(`${PROXYCURL_API_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Proxycurl API error: ${response.status} - ${error}`);
  }

  const data: ProxycurlResponse = await response.json();

  const currentJob = data.experiences?.find((exp) => !exp.ends_at);

  return {
    linkedinUrl,
    name: data.full_name || `${data.first_name} ${data.last_name}`,
    headline: data.headline,
    title: currentJob?.title || data.occupation,
    company: currentJob?.company,
    location: [data.city, data.state, data.country_full_name].filter(Boolean).join(', '),
    industry: data.industry,
    profileImageUrl: data.profile_pic_url,
    enrichedAt: new Date().toISOString(),
  };
}
