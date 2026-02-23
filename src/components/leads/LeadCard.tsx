'use client';

import { Lead } from '@/types';
import ScoreBadge from './ScoreBadge';
import RoleBadge from './RoleBadge';
import SaveLeadButton from './SaveLeadButton';

interface LeadCardProps {
  lead: Lead;
  onViewDetail?: (lead: Lead) => void;
  isSelected?: boolean;
  onToggleSelect?: (leadId: string) => void;
}

export default function LeadCard({ lead, onViewDetail, isSelected, onToggleSelect }: LeadCardProps) {
  const { post, profile, score } = lead;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 dark:hover:shadow-emerald-500/10 ${
      isSelected
        ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20'
        : 'border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-900/50'
    }`}>
      <div className="absolute right-0 top-0 h-32 w-32 bg-gradient-to-bl from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-3">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={() => onToggleSelect(lead.id)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 accent-emerald-600 cursor-pointer dark:border-slate-600"
                onClick={(e) => e.stopPropagation()}
              />
            )}

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-bold text-sm dark:from-slate-700 dark:to-slate-800 dark:text-slate-300">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt={profile.name} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                (post.author?.[0] || '?').toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {profile?.name || post.author || 'Unknown Author'}
              </h3>
              {(profile?.title || profile?.company) && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {profile.title}{profile.title && profile.company ? ' at ' : ''}{profile.company}
                </p>
              )}
            </div>
          </div>

          {profile?.title && <RoleBadge role={profile.title} />}

          <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-300">
            {post.snippet}
          </p>

          {score && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-500 italic dark:text-slate-400">
                {score.reasoning}
              </p>
              {score.suggestedOutreach && (
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-3 dark:from-emerald-950/30 dark:to-teal-950/30">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Outreach angle:
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-500">
                    {score.suggestedOutreach}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {score && <ScoreBadge score={score.overall} />}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <SaveLeadButton lead={lead} />
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          LinkedIn
        </a>
        {onViewDetail && (
          <button
            onClick={() => onViewDetail(lead)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
          >
            Details
          </button>
        )}
        {post.publishedDate && (
          <span className="ml-auto text-xs text-slate-400">
            {new Date(post.publishedDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
