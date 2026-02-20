export interface LinkedInPost {
  url: string;
  title: string;
  snippet: string;
  publishedDate?: string;
  author?: string;
}

export interface LeadProfile {
  linkedinUrl: string;
  name: string;
  headline?: string;
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  profileImageUrl?: string;
  enrichedAt?: string;
}

export interface AIScoreBreakdown {
  painPointAlignment: number;
  decisionMakerRole: number;
  companyFit: number;
  recency: number;
  engagementSignal: number;
}

export interface AIScore {
  overall: number;
  breakdown: AIScoreBreakdown;
  reasoning: string;
  suggestedOutreach: string;
}

export interface Lead {
  id: string;
  post: LinkedInPost;
  profile?: LeadProfile;
  score?: AIScore;
  status: 'new' | 'analyzed' | 'enriched' | 'contacted' | 'saved';
  savedAt?: string;
  searchQuery: string;
  createdAt: string;
}

export type SearchType = 'profile' | 'company' | 'keyword';

export interface SearchClassification {
  type: SearchType;
  originalInput: string;
  username?: string;
  companyName?: string;
  query?: string;
}

export interface ProfileInfo {
  username: string;
  name: string;
  headline?: string;
  linkedinUrl: string;
}

export interface ProfileSearchResult {
  profileInfo: ProfileInfo;
  leads: Lead[];
  totalResults: number;
  searchedAt: string;
}

export interface SearchParams {
  keywords: string[];
  roles: string[];
  dateRange: '7d' | '30d' | '90d' | 'all';
  page?: number;
  searchType?: SearchType;
  username?: string;
  companyName?: string;
}

export interface SearchResult {
  leads: Lead[];
  totalResults: number;
  query: string;
  searchedAt: string;
}

export interface PresetCategory {
  label: string;
  icon: string;
  presets: { label: string; query: string }[];
}
