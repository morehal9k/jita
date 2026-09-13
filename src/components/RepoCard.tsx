import React from 'react';
import { LocalRepoStatus } from '@/types/git';
import { GitBranch, Folder, ArrowUp, ArrowDown, Check, AlertTriangle } from 'lucide-react';

export function RepoCard({ repo }: { repo: LocalRepoStatus }) {
  const flags = [];
  if (repo.staged) flags.push({ label: '+staged', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' });
  if (repo.unstaged) flags.push({ label: '*unstaged', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' });
  if (repo.untracked) flags.push({ label: '?untracked', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400' });
  if (repo.stashed) flags.push({ label: `$stash(${repo.stashCount})`, color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400' });

  const hasAhead = repo.ahead > 0;
  const hasBehind = repo.behind > 0;
  const isDirty = !repo.isClean || hasAhead || hasBehind;

  return (
    <div
      className={`p-3.5 rounded-xl border bg-white dark:bg-neutral-900 transition-shadow hover:shadow-sm ${
        isDirty
          ? 'border-neutral-300 dark:border-neutral-700'
          : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Folder className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {repo.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasAhead && (
            <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
              <ArrowUp className="w-3 h-3 mr-0.5" />
              {repo.ahead}
            </span>
          )}
          {hasBehind && (
            <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
              <ArrowDown className="w-3 h-3 mr-0.5" />
              {repo.behind}
            </span>
          )}
          {!isDirty && (
            <span className="flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Check className="w-3 h-3 mr-0.5" />
              Clean
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <GitBranch className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="font-mono text-neutral-700 dark:text-neutral-300 truncate">
            {repo.branch}
          </span>
          <span className="text-neutral-400 truncate max-w-[200px]" title={repo.path}>
            • {repo.path}
          </span>
        </div>

        {flags.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {flags.map((f) => (
              <span
                key={f.label}
                className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${f.color}`}
              >
                {f.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {repo.error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{repo.error}</span>
        </div>
      )}
    </div>
  );
}
