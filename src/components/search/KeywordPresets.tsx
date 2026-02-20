'use client';

import { CATEGORIZED_PRESETS } from '@/lib/constants';

const categoryColors: Record<string, { bg: string; text: string; hover: string }> = {
  billing: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    hover: 'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400',
  },
  finops: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    hover: 'hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400',
  },
  company: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-400',
    hover: 'hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-600 dark:hover:bg-violet-950/50 dark:hover:text-violet-400',
  },
  multicloud: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    hover: 'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:border-amber-600 dark:hover:bg-amber-950/50 dark:hover:text-amber-400',
  },
};

const categoryIcons: Record<string, React.ReactNode> = {
  billing: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  finops: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  company: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  multicloud: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
};

export default function KeywordPresets({
  onSelect,
}: {
  onSelect: (query: string) => void;
}) {
  return (
    <div className="space-y-4">
      {CATEGORIZED_PRESETS.map((category) => {
        const colors = categoryColors[category.icon] || categoryColors.billing;
        const icon = categoryIcons[category.icon];
        return (
          <div key={category.label}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`${colors.text}`}>{icon}</span>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${colors.text}`}>
                {category.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onSelect(preset.query)}
                  className={`rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 ${colors.hover}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
