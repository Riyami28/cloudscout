'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LeadList from '@/components/leads/LeadList';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import { Lead, ProfileInfo, SearchType } from '@/types';
import { addRecentSearch } from '@/lib/storage';
import { classifySearchInput } from '@/lib/search-classifier';

function ProfileHeader({ profileInfo }: { profileInfo: ProfileInfo }) {
  return (
    <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm dark:border-blue-800/60 dark:from-blue-950/30 dark:to-indigo-950/30">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {profileInfo.name}
          </h3>
          {profileInfo.headline && (
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {profileInfo.headline}
            </p>
          )}
          <a
            href={profileInfo.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View LinkedIn Profile
          </a>
        </div>
      </div>
    </div>
  );
}

function CompanyHeader({ companyName }: { companyName: string }) {
  return (
    <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-r from-violet-50 to-purple-50 p-6 shadow-sm dark:border-violet-800/60 dark:from-violet-950/30 dark:to-purple-950/30">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {companyName}
          </h3>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Cloud cost discussions and posts from {companyName}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [searched, setSearched] = useState(false);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);

  const query = searchParams.get('q') || '';
  const roles = searchParams.get('roles')?.split(',').filter(Boolean) || [];
  const dateRange = searchParams.get('dateRange') || 'all';
  const source = searchParams.get('source');
  const searchTypeParam = searchParams.get('searchType') as SearchType | null;

  // Determine the actual search type
  const searchType: SearchType = searchTypeParam || classifySearchInput(query).type;

  const performProfileSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      addRecentSearch(query);

      // Extract username from query
      const classification = classifySearchInput(query);
      const username = classification.username || query.replace(/^@/, '').trim();

      const res = await fetch('/api/search-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, dateRange }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setProfileInfo(data.profileInfo || null);
      setLeads(data.leads || []);
      setTotalResults(data.totalResults || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile search failed');
    } finally {
      setLoading(false);
    }
  }, [query, dateRange]);

  const performCompanySearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      addRecentSearch(query);

      // Build company-specific query
      const companyName = query.toLowerCase().startsWith('company:')
        ? query.slice(8).trim()
        : query;
      const companyQuery = `"${companyName}" cloud cost billing FinOps`;

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: [companyQuery],
          roles,
          dateRange,
          page: 1,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLeads(data.leads || []);
      setTotalResults(data.totalResults || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Company search failed');
    } finally {
      setLoading(false);
    }
  }, [query, roles, dateRange]);

  const performKeywordSearch = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      addRecentSearch(query);
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: query.split(/\s+OR\s+/).map((k) => k.replace(/"/g, '').trim()),
          roles,
          dateRange,
          page: 1,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLeads(data.leads || []);
      setTotalResults(data.totalResults || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dateRange]);

  useEffect(() => {
    if (source === 'import') {
      try {
        const imported = sessionStorage.getItem('importedLeads');
        if (imported) {
          setLeads(JSON.parse(imported));
          setSearched(true);
          sessionStorage.removeItem('importedLeads');
        }
      } catch {
        // handled silently
      }
    } else if (query) {
      if (searchType === 'profile') {
        performProfileSearch();
      } else if (searchType === 'company') {
        performCompanySearch();
      } else {
        performKeywordSearch();
      }
    }
  }, [source, query, searchType, performProfileSearch, performCompanySearch, performKeywordSearch]);

  const analyzeLeads = async () => {
    if (leads.length === 0) return;
    setAnalyzing(true);
    setError(null);

    try {
      const batch = leads.slice(0, 10);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: batch }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLeads((prev) => {
        const analyzed = data.leads || [];
        return prev.map((lead) => {
          const match = analyzed.find((a: Lead) => a.id === lead.id);
          return match || lead;
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewDetail = (lead: Lead) => {
    sessionStorage.setItem('leadDetail', JSON.stringify(lead));
    router.push(`/lead/${lead.id}`);
  };

  const hasUnscored = leads.some((l) => !l.score);

  // Get display name for the search
  const getSearchLabel = () => {
    if (searchType === 'profile') {
      const classification = classifySearchInput(query);
      return `@${classification.username || query}`;
    }
    if (searchType === 'company') {
      const name = query.toLowerCase().startsWith('company:') ? query.slice(8).trim() : query;
      return name;
    }
    return query;
  };

  // Get loading message based on search type
  const getLoadingMessage = () => {
    if (searchType === 'profile') return 'Searching for cloud-related posts by this profile...';
    if (searchType === 'company') return `Searching for cloud discussions about ${getSearchLabel()}...`;
    return 'Searching LinkedIn posts...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {searchType === 'profile' ? 'Profile Results' : searchType === 'company' ? 'Company Results' : 'Search Results'}
          </h2>
          {query && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchType === 'profile' && (
                <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </span>
              )}
              {searchType === 'company' && (
                <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company
                </span>
              )}
              Showing results for &quot;{getSearchLabel()}&quot; &middot; {totalResults} total
            </p>
          )}
        </div>

        {leads.length > 0 && hasUnscored && (
          <button
            onClick={analyzeLeads}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analyzing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyze with AI
              </>
            )}
          </button>
        )}
      </div>

      {/* Profile Header */}
      {searchType === 'profile' && profileInfo && !loading && (
        <ProfileHeader profileInfo={profileInfo} />
      )}

      {/* Company Header */}
      {searchType === 'company' && !loading && searched && (
        <CompanyHeader companyName={getSearchLabel()} />
      )}

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner message={getLoadingMessage()} />
      ) : analyzing ? (
        <div>
          <LoadingSpinner message="AI is scoring leads for ZopNight & ZopDay relevance..." />
          <LeadList leads={leads} onViewDetail={handleViewDetail} />
        </div>
      ) : leads.length > 0 ? (
        <LeadList leads={leads} onViewDetail={handleViewDetail} />
      ) : searched ? (
        <EmptyState
          title="No leads found"
          description={
            searchType === 'profile'
              ? 'No cloud-related posts found for this profile. They may not have posted about cloud topics recently.'
              : searchType === 'company'
              ? 'No cloud-related discussions found for this company. Try a different company or keyword search.'
              : 'Try different keywords or broaden your role filters.'
          }
          action={
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              New Search
            </button>
          }
        />
      ) : (
        <EmptyState
          title="Start a search"
          description="Go back to the search page to find leads."
          action={
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Search
            </button>
          }
        />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading results..." />}>
      <ResultsContent />
    </Suspense>
  );
}
