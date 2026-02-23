'use client';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSaveSelected: () => void;
  onExportSelected: () => void;
  onAnalyzeSelected: () => void;
  onClearSelection: () => void;
  analyzing: boolean;
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  onSaveSelected,
  onExportSelected,
  onAnalyzeSelected,
  onClearSelection,
  analyzing,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40">
      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
        {selectedCount} of {totalCount} lead{totalCount !== 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveSelected}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Save Selected
        </button>
        <button
          onClick={onExportSelected}
          className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900"
        >
          Export CSV
        </button>
        <button
          onClick={onAnalyzeSelected}
          disabled={analyzing}
          className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900"
        >
          {analyzing ? 'Analyzing...' : 'Analyze Selected'}
        </button>
        <button
          onClick={onClearSelection}
          className="ml-2 text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
