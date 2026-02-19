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

export interface SearchParams {
  keywords: string[];
  roles: string[];
  dateRange: '7d' | '30d' | '90d' | 'all';
  page?: number;
}

export interface SearchResult {
  leads: Lead[];
  totalResults: number;
  query: string;
  searchedAt: string;
}
