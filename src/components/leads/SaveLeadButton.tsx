'use client';

import { useState, useEffect } from 'react';
import { Lead } from '@/types';
import { saveLead, removeSavedLead, isLeadSaved } from '@/lib/storage';

export default function SaveLeadButton({ lead }: { lead: Lead }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isLeadSaved(lead.id));
  }, [lead.id]);

  const toggle = () => {
    if (saved) {
      removeSavedLead(lead.id);
      setSaved(false);
    } else {
      saveLead(lead);
      setSaved(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        saved
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
          : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      <svg className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
