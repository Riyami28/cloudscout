'use client';

import { useState } from 'react';
import { Lead } from '@/types';
import LeadCard from './LeadCard';

type SortOption = 'score' | 'date' | 'name';

interface LeadListProps {
  leads: Lead[];
  onViewDetail?: (lead: Lead) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (leadId: string) => void;
  onToggleSelectAll?: () => void;
}

export default function LeadList({ leads, onViewDetail, selectedIds, onToggleSelect, onToggleSelectAll }: LeadListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('score');

  const sortedLeads = [...leads].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.score?.overall || 0) - (a.score?.overall || 0);
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'name':
        return (a.post.author || '').localeCompare(b.post.author || '');
      default:
        return 0;
    }
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleSelectAll && (
            <input
              type="checkbox"
              checked={selectedIds ? selectedIds.size === leads.length && leads.length > 0 : false}
              onChange={onToggleSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 cursor-pointer dark:border-slate-600"
              ref={(el) => {
                if (el) el.indeterminate = (selectedIds?.size || 0) > 0 && (selectedIds?.size || 0) < leads.length;
              }}
            />
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
          {(['score', 'date', 'name'] as SortOption[]).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
                sortBy === option
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sortedLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onViewDetail={onViewDetail}
            isSelected={selectedIds?.has(lead.id) || false}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
