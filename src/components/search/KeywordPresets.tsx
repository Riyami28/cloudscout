'use client';

import { KEYWORD_PRESETS } from '@/lib/constants';

const presetColors = [
  'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400',
  'hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400',
  'hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:hover:border-violet-600 dark:hover:bg-violet-950/50 dark:hover:text-violet-400',
  'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:border-amber-600 dark:hover:bg-amber-950/50 dark:hover:text-amber-400',
  'hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400',
  'hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/50 dark:hover:text-cyan-400',
];

export default function KeywordPresets({
  onSelect,
}: {
  onSelect: (query: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {KEYWORD_PRESETS.map((preset, i) => (
        <button
          key={preset.label}
          onClick={() => onSelect(preset.query)}
          className={`rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 ${presetColors[i % presetColors.length]}`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
