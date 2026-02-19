export default function StatCard({
  label,
  value,
  icon,
  gradient = 'from-emerald-500 to-teal-600',
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 dark:border-slate-800/60 dark:bg-slate-900/50">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl transition-all duration-300 group-hover:opacity-20`} />
      <div className="relative flex items-center gap-4">
        {icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
