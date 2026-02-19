function getScoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400';
  if (score >= 25) return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
}

function getScoreLabel(score: number): string {
  if (score >= 75) return 'Hot';
  if (score >= 50) return 'Warm';
  if (score >= 25) return 'Cool';
  return 'Cold';
}

export default function ScoreBadge({ score }: { score: number }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getScoreColor(score)}`}>
      <span className="text-base font-bold">{score}</span>
      <span>/100</span>
      <span className="ml-1 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
        {getScoreLabel(score)}
      </span>
    </div>
  );
}
