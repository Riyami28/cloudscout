'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types';
import { getSavedLeads, removeSavedLead, exportLeadsToCSV } from '@/lib/storage';
import ScoreBadge from '@/components/leads/ScoreBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function SavedLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    setLeads(getSavedLeads());
  }, []);

  const handleRemove = (id: string) => {
    removeSavedLead(id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const handleExportCSV = () => {
    const csv = exportLeadsToCSV(leads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleViewDetail = (lead: Lead) => {
    sessionStorage.setItem('leadDetail', JSON.stringify(lead));
    router.push(`/lead/${lead.id}`);
  };

  if (leads.length === 0) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Saved Leads</h2>
        <EmptyState
          title="No saved leads yet"
          description="Search for leads and save the best ones here for tracking."
          action={
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Start Searching
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Leads</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{leads.length} leads saved</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Title</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Company</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Score</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Saved</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {leads.map((lead) => (
              <tr key={lead.id} className="bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900">
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleViewDetail(lead)}
                    className="font-medium text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                  >
                    {lead.profile?.name || lead.post.author || 'Unknown'}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {lead.profile?.title || '-'}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {lead.profile?.company || '-'}
                </td>
                <td className="px-4 py-3">
                  {lead.score ? <ScoreBadge score={lead.score.overall} /> : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {lead.savedAt ? new Date(lead.savedAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a
                      href={lead.post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      LinkedIn
                    </a>
                    <button
                      onClick={() => handleRemove(lead.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
