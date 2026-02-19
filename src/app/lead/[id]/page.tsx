'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types';
import ScoreBadge from '@/components/leads/ScoreBadge';
import RoleBadge from '@/components/leads/RoleBadge';
import SaveLeadButton from '@/components/leads/SaveLeadButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { SCORING_WEIGHTS } from '@/lib/constants';

export default function LeadDetailPage() {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('leadDetail');
      if (stored) {
        setLead(JSON.parse(stored));
      }
    } catch {
      // handled silently
    }
  }, []);

  const handleEnrich = async () => {
    if (!lead) return;
    setEnriching(true);
    setError(null);

    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl: lead.post.url }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLead((prev) => prev ? { ...prev, profile: data.profile, status: 'enriched' } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrichment failed');
    } finally {
      setEnriching(false);
    }
  };

  if (!lead) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner message="Loading lead details..." />
      </div>
    );
  }

  const scoreBreakdown = lead.score?.breakdown;
  const breakdownItems = scoreBreakdown
    ? [
        { label: 'Pain Point Alignment', value: scoreBreakdown.painPointAlignment, max: SCORING_WEIGHTS.painPointAlignment },
        { label: 'Decision Maker Role', value: scoreBreakdown.decisionMakerRole, max: SCORING_WEIGHTS.decisionMakerRole },
        { label: 'Company Fit', value: scoreBreakdown.companyFit, max: SCORING_WEIGHTS.companyFit },
        { label: 'Recency', value: scoreBreakdown.recency, max: SCORING_WEIGHTS.recency },
        { label: 'Engagement Signal', value: scoreBreakdown.engagementSignal, max: SCORING_WEIGHTS.engagementSignal },
      ]
    : [];

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to results
      </button>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start gap-4">
              {lead.profile?.profileImageUrl && (
                <img
                  src={lead.profile.profileImageUrl}
                  alt={lead.profile.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {lead.profile?.name || lead.post.author || 'Unknown Author'}
                </h2>
                {lead.profile?.headline && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{lead.profile.headline}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {lead.profile?.title && <RoleBadge role={lead.profile.title} />}
                  {lead.profile?.company && (
                    <span className="text-sm text-gray-600 dark:text-gray-300">{lead.profile.company}</span>
                  )}
                  {lead.profile?.location && (
                    <span className="text-xs text-gray-400">{lead.profile.location}</span>
                  )}
                </div>
              </div>
              {lead.score && <ScoreBadge score={lead.score.overall} />}
            </div>

            <div className="mt-4 flex gap-2">
              <SaveLeadButton lead={lead} />
              <a
                href={lead.post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on LinkedIn
              </a>
              {!lead.profile?.enrichedAt && (
                <button
                  onClick={handleEnrich}
                  disabled={enriching}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {enriching ? 'Enriching...' : 'Enrich Profile'}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Post Content</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{lead.post.snippet}</p>
            <p className="mt-2 text-xs text-gray-400">{lead.post.title}</p>
          </div>

          {lead.score?.suggestedOutreach && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
              <h3 className="mb-2 text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                Suggested Outreach Angle
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{lead.score.suggestedOutreach}</p>
              <button
                onClick={() => navigator.clipboard.writeText(lead.score!.suggestedOutreach)}
                className="mt-3 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900"
              >
                Copy to clipboard
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {lead.score && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">AI Score Breakdown</h3>
              <div className="space-y-4">
                {breakdownItems.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.value}/{item.max}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {lead.score.reasoning && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">AI Reasoning</p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{lead.score.reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
