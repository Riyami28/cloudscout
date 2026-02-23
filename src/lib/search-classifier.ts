import { SearchClassification } from '@/types';

export const CLOUD_TOPIC_TERMS =
  'cloud OR cost OR billing OR FinOps OR "cloud cost" OR AWS OR Azure OR GCP OR "cloud spend"';

// Common cloud/finops keywords that should NOT be treated as usernames
const COMMON_KEYWORDS = new Set([
  'cloud', 'aws', 'azure', 'gcp', 'finops', 'billing', 'cost', 'costs',
  'kubernetes', 'k8s', 'docker', 'devops', 'sre', 'infrastructure',
  'optimization', 'savings', 'spend', 'budget', 'pricing', 'compute',
  'storage', 'networking', 'serverless', 'lambda', 'ec2', 's3',
  'oci', 'oracle', 'ibm', 'cloudflare', 'datadog', 'terraform',
  'kubecost', 'vantage', 'infracost', 'cloudhealth', 'cloudzero',
  'zopnight', 'zopday', 'zopdev',
]);

const LINKEDIN_URL_REGEX = /linkedin\.com\/(?:in|posts)\/([a-zA-Z0-9-]+)/;
const USERNAME_SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;

export function classifySearchInput(input: string): SearchClassification {
  const trimmed = input.trim();

  if (!trimmed) {
    return { type: 'keyword', originalInput: trimmed, query: trimmed };
  }

  // 1. LinkedIn URL detection
  const urlMatch = trimmed.match(LINKEDIN_URL_REGEX);
  if (urlMatch) {
    return {
      type: 'profile',
      originalInput: trimmed,
      username: urlMatch[1],
    };
  }

  // 2. Company prefix detection (company:Netflix)
  if (trimmed.toLowerCase().startsWith('company:')) {
    const companyName = trimmed.slice(8).trim();
    if (companyName) {
      return {
        type: 'company',
        originalInput: trimmed,
        companyName,
      };
    }
  }

  // 2b. Profile prefix detection (profile:johndoe)
  if (trimmed.toLowerCase().startsWith('profile:')) {
    const username = trimmed.slice(8).trim().replace(/^@/, '');
    if (username) {
      return {
        type: 'profile',
        originalInput: trimmed,
        username,
      };
    }
  }

  // 3. Username detection - starts with @
  if (trimmed.startsWith('@')) {
    const username = trimmed.slice(1).trim();
    if (username && USERNAME_SLUG_REGEX.test(username)) {
      return {
        type: 'profile',
        originalInput: trimmed,
        username,
      };
    }
  }

  // 4. Username detection - single slug word (no spaces, 3+ chars, not a common keyword)
  if (
    !trimmed.includes(' ') &&
    USERNAME_SLUG_REGEX.test(trimmed) &&
    trimmed.length >= 3 &&
    !COMMON_KEYWORDS.has(trimmed.toLowerCase())
  ) {
    return {
      type: 'profile',
      originalInput: trimmed,
      username: trimmed,
    };
  }

  // 5. Default: keyword search
  return {
    type: 'keyword',
    originalInput: trimmed,
    query: trimmed,
  };
}
