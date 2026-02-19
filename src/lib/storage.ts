import { Lead } from '@/types';

const LEADS_KEY = 'linkedin-lead-finder-leads';
const SEARCHES_KEY = 'linkedin-lead-finder-searches';

export function getSavedLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LEADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLead(lead: Lead): void {
  const leads = getSavedLeads();
  const existing = leads.findIndex((l) => l.id === lead.id);
  if (existing >= 0) {
    leads[existing] = { ...lead, savedAt: new Date().toISOString(), status: 'saved' };
  } else {
    leads.push({ ...lead, savedAt: new Date().toISOString(), status: 'saved' });
  }
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function removeSavedLead(leadId: string): void {
  const leads = getSavedLeads().filter((l) => l.id !== leadId);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function isLeadSaved(leadId: string): boolean {
  return getSavedLeads().some((l) => l.id === leadId);
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  const searches = getRecentSearches().filter((s) => s !== query);
  searches.unshift(query);
  localStorage.setItem(SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)));
}

export function exportLeadsToCSV(leads: Lead[]): string {
  const headers = ['Name', 'Title', 'Company', 'Score', 'LinkedIn URL', 'Post Snippet', 'Reasoning', 'Outreach Suggestion', 'Saved At'];
  const rows = leads.map((lead) => [
    lead.profile?.name || lead.post.author || 'Unknown',
    lead.profile?.title || '',
    lead.profile?.company || '',
    lead.score?.overall?.toString() || '',
    lead.post.url,
    lead.post.snippet.replace(/"/g, '""'),
    lead.score?.reasoning?.replace(/"/g, '""') || '',
    lead.score?.suggestedOutreach?.replace(/"/g, '""') || '',
    lead.savedAt || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}
