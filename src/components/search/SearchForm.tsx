'use client';

import { useState, useMemo } from 'react';
import { classifySearchInput } from '@/lib/search-classifier';
import { SearchType } from '@/types';

interface SearchFormProps {
  onSearch: (query: string, searchType?: SearchType) => void;
  initialQuery?: string;
  loading?: boolean;
}

export default function SearchForm({ onSearch, initialQuery = '', loading = false }: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  const classification = useMemo(() => {
    if (!query.trim()) return null;
    return classifySearchInput(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), classification?.type);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative rounded-2xl transition-all duration-300 ${focused ? 'ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10' : ''}`}>
        <svg
          className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search keywords, @username, or paste a LinkedIn URL..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-14 pr-36 text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-[calc(50%+1px)] disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-[-50%]"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Searching...
            </div>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Smart detection indicator */}
      {classification && classification.type !== 'keyword' && query.trim() && (
        <div className="mt-2 flex items-center gap-2 transition-all duration-200">
          {classification.type === 'profile' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile: {classification.username}
            </span>
          )}
          {classification.type === 'company' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company: {classification.companyName}
            </span>
          )}
          <span className="text-[10px] text-slate-400">auto-detected</span>
        </div>
      )}
    </form>
  );
}
