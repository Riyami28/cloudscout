'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import SearchForm from '@/components/search/SearchForm';
import KeywordPresets from '@/components/search/KeywordPresets';
import FilterBar from '@/components/search/FilterBar';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { getRecentSearches, getSavedLeads } from '@/lib/storage';
import { classifySearchInput } from '@/lib/search-classifier';
import { SearchType } from '@/types';

interface TrendingPost {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  author?: string;
  publishedDate?: string;
  imageUrl?: string;
  isLinkedIn?: boolean;
}

interface GroupedFeed {
  [category: string]: {
    label: string;
    posts: TrendingPost[];
  };
}

const LINKEDIN_ICON = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth={2} />
  </svg>
);

const CATEGORY_STYLES: Record<string, { gradient: string; icon: ReactNode; badgeColor: string }> = {
  linkedin_cloud_billing: {
    gradient: 'from-orange-500 to-red-600',
    badgeColor: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  linkedin_finops: {
    gradient: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  linkedin_cloud_engineering: {
    gradient: 'from-blue-500 to-cyan-600',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  linkedin_decision_makers: {
    gradient: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  competitors: {
    gradient: 'from-violet-500 to-purple-600',
    badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  cloud_provider_updates: {
    gradient: 'from-sky-500 to-indigo-600',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
  },
};

// Display order for categories — LinkedIn first
const CATEGORY_ORDER = [
  'linkedin_cloud_billing',
  'linkedin_finops',
  'linkedin_cloud_engineering',
  'linkedin_decision_makers',
  'competitors',
  'cloud_provider_updates',
];

export default function HomePage() {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['CTO', 'CEO', 'VP Engineering']);
  const [dateRange, setDateRange] = useState('30d');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [feedData, setFeedData] = useState<GroupedFeed>({});
  const [feedTotal, setFeedTotal] = useState(0);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    setSavedCount(getSavedLeads().length);

    const fetchFeed = async () => {
      try {
        const res = await fetch('/api/trending');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setFeedData(data.grouped || {});
        setFeedTotal(data.total || 0);
      } catch (err) {
        setFeedError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setFeedLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleSearch = (query: string, searchType?: SearchType) => {
    // If searchType not provided (e.g. from recent searches / presets), classify it
    const classification = searchType ? { type: searchType } : classifySearchInput(query);
    const actualType = classification.type;

    const params = new URLSearchParams({ dateRange });

    if (actualType === 'company') {
      // Strip "company:" prefix if present
      const companyName = query.toLowerCase().startsWith('company:')
        ? query.slice(8).trim()
        : query;
      params.set('q', companyName);
      params.set('searchType', 'company');
    } else if (actualType === 'profile') {
      params.set('q', query);
      params.set('searchType', 'profile');
    } else {
      params.set('q', query);
      params.set('searchType', 'keyword');
      params.set('roles', selectedRoles.join(','));
    }

    router.push(`/results?${params.toString()}`);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: importText }),
      });
      const data = await res.json();
      if (data.leads && data.leads.length > 0) {
        sessionStorage.setItem('importedLeads', JSON.stringify(data.leads));
        router.push('/results?source=import');
      }
    } catch {
      // handled silently
    }
  };

  // Get posts for the active tab
  const getVisiblePosts = (): TrendingPost[] => {
    if (activeTab === 'all') {
      const all: TrendingPost[] = [];
      for (const cat of CATEGORY_ORDER) {
        if (feedData[cat]) {
          all.push(...feedData[cat].posts);
        }
      }
      return all;
    }
    return feedData[activeTab]?.posts || [];
  };

  const visiblePosts = getVisiblePosts();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 sm:p-10 shadow-2xl shadow-emerald-500/20 animate-gradient">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 backdrop-blur-sm mb-4">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold text-white/90">AI-Powered Lead Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Find Your Next<br />
            <span className="text-emerald-100">Cloud Customer</span>
          </h2>
          <p className="mt-3 max-w-lg text-base text-white/80">
            Discover LinkedIn leads posting about cloud billing problems - perfect prospects for ZopNight & ZopDay
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Saved Leads"
          value={savedCount}
          gradient="from-violet-500 to-purple-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          }
          onClick={() => router.push('/saved')}
        />
        <StatCard
          label="Feed Posts"
          value={feedTotal}
          gradient="from-blue-500 to-cyan-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          }
          onClick={() => {
            document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <StatCard
          label="Recent Searches"
          value={recentSearches.length}
          gradient="from-amber-500 to-orange-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Search Section */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <SearchForm onSearch={handleSearch} />

        <div className="mt-5">
          <p className="mb-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Quick searches</p>
          <KeywordPresets onSelect={handleSearch} />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
          <FilterBar
            selectedRoles={selectedRoles}
            onRolesChange={setSelectedRoles}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>

      {/* Import Section */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Import LinkedIn URLs</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Paste post or profile URLs to analyze</p>
            </div>
          </div>
          <button
            onClick={() => setShowImport(!showImport)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              showImport
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20'
            }`}
          >
            {showImport ? 'Hide' : 'Import'}
          </button>
        </div>

        {showImport && (
          <div className="mt-4 space-y-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste LinkedIn URLs here (one per line or comma-separated)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
              rows={4}
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
            >
              Import & Analyze
            </button>
          </div>
        )}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, i) => (
              <button
                key={i}
                onClick={() => handleSearch(search)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-950/30"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Feed - Categorized */}
      <div id="feed-section" className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">LinkedIn Cloud Intelligence Feed</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">LinkedIn posts about cloud billing, FinOps, engineering & decision makers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 dark:bg-orange-950/50">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Live</span>
          </div>
        </div>

        {/* Category Tabs */}
        {!feedLoading && !feedError && feedTotal > 0 && (
          <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-md dark:from-slate-200 dark:to-slate-300 dark:text-slate-900'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400'
              }`}
            >
              All ({feedTotal})
            </button>
            {CATEGORY_ORDER.map((cat) => {
              const group = feedData[cat];
              if (!group || group.posts.length === 0) return null;
              const style = CATEGORY_STYLES[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    activeTab === cat
                      ? `bg-gradient-to-r ${style?.gradient || 'from-slate-500 to-slate-600'} text-white shadow-md`
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400'
                  }`}
                >
                  {group.label} ({group.posts.length})
                </button>
              );
            })}
          </div>
        )}

        {/* Feed Content */}
        {feedLoading ? (
          <LoadingSpinner message="Fetching latest cloud intelligence from across the web..." />
        ) : feedError ? (
          <ErrorBanner message={feedError} onDismiss={() => setFeedError(null)} />
        ) : feedTotal === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No posts found right now</p>
            <p className="mt-1 text-xs text-slate-400">Try a manual search above or check back later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePosts.map((post) => {
              const style = CATEGORY_STYLES[post.category];
              const isLinkedIn = post.isLinkedIn || post.url.includes('linkedin.com');
              return (
                <div
                  key={post.id}
                  className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style?.gradient || 'from-slate-400 to-slate-500'} text-white shadow-sm`}>
                      {style?.icon || (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {isLinkedIn && (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            in
                          </span>
                        )}
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {post.title}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 dark:text-slate-300">{post.snippet}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${style?.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                          {post.categoryLabel}
                        </span>
                        <span className="text-[10px] text-slate-400">{post.source}</span>
                        {post.author && (
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">by {post.author}</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                        >
                          {isLinkedIn ? (
                            <>
                              {LINKEDIN_ICON ? (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              ) : null}
                              View on LinkedIn
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Open Post
                            </>
                          )}
                        </a>
                        {isLinkedIn && post.author && post.author.trim() && (
                          <button
                            onClick={() => {
                              const authorSlug = post.author!.trim().toLowerCase().replace(/\s+/g, '-');
                              handleSearch(`profile:${authorSlug}`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            View Profile Posts
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
