'use client';

import { useState } from 'react';
import { Lead } from '@/types';
import LeadCard from './LeadCard';

type SortOption = 'score' | 'date' | 'name';

interface LeadListProps {
  leads: Lead[];
  onViewDetail?: (lead: Lead) => void;
}

export default function LeadList({ leads, onViewDetail }: LeadListProps) {
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {leads.length} lead{leads.length !== 1 ? 's' : ''} found
        </p>
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
          <LeadCard key={lead.id} lead={lead} onViewDetail={onViewDetail} />
        ))}
      </div>
    </div>
  );
}
