'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LeadList from '@/components/leads/LeadList';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import { Lead } from '@/types';
import { addRecentSearch } from '@/lib/storage';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [searched, setSearched] = useState(false);

  const query = searchParams.get('q') || '';
  const roles = searchParams.get('roles')?.split(',').filter(Boolean) || [];
  const dateRange = searchParams.get('dateRange') || 'all';
  const source = searchParams.get('source');

  const performSearch = useCallback(async () => {
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
      performSearch();
    }
  }, [source, query, performSearch]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Results</h2>
          {query && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing results for &quot;{query}&quot; &middot; {totalResults} total
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

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner message="Searching LinkedIn posts..." />
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
          description="Try different keywords or broaden your role filters."
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
