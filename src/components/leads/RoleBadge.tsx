const ROLE_COLORS: Record<string, string> = {
  CTO: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
  CEO: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400',
  CFO: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-400',
  VP: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400',
  Director: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400',
  Head: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400',
};

function getRoleColor(role: string): string {
  for (const [key, color] of Object.entries(ROLE_COLORS)) {
    if (role.includes(key)) return color;
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
}

export default function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${getRoleColor(role)}`}>
      {role}
    </span>
  );
}
