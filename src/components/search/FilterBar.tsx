'use client';

import { TARGET_ROLES, DATE_RANGES } from '@/lib/constants';

interface FilterBarProps {
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

export default function FilterBar({
  selectedRoles,
  onRolesChange,
  dateRange,
  onDateRangeChange,
}: FilterBarProps) {
  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      onRolesChange(selectedRoles.filter((r) => r !== role));
    } else {
      onRolesChange([...selectedRoles, role]);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Target Roles
        </label>
        <div className="flex flex-wrap gap-2">
          {TARGET_ROLES.slice(0, 12).map((role) => (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                selectedRoles.includes(role)
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-violet-600 dark:hover:bg-violet-950/30'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Date Range
        </label>
        <div className="flex gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => onDateRangeChange(range.value)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
                dateRange === range.value
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-blue-600 dark:hover:bg-blue-950/30'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
