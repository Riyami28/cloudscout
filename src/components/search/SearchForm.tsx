'use client';

import { useState } from 'react';

interface SearchFormProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  loading?: boolean;
}

export default function SearchForm({ onSearch, initialQuery = '', loading = false }: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
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
          placeholder="Search for LinkedIn posts about cloud costs, FinOps, billing..."
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
    </form>
  );
}
