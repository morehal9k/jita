import React from 'react';
import { JiraIssue } from '@/types/jira';
import { GitHubPullRequest } from '@/types/github';
import { LocalRepoStatus } from '@/types/git';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

export function NeedsAttention({
  reviewRequests,
  inProgressJira,
  dirtyRepos = [],
}: {
  reviewRequests: GitHubPullRequest[];
  inProgressJira: JiraIssue[];
  dirtyRepos?: LocalRepoStatus[];
}) {
  const totalCount = reviewRequests.length + inProgressJira.length + dirtyRepos.length;
  if (totalCount === 0) return null;

  return (
    <section className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <h2 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
          Action Items & Focus ({totalCount})
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reviewRequests.map((pr) => (
          <a
            key={pr.id}
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 text-xs font-medium"
          >
            <div className="truncate pr-2">
              <span className="text-amber-700 dark:text-amber-400 mr-1.5 font-semibold">Review Request:</span>
              <span className="text-neutral-800 dark:text-neutral-200">{pr.title}</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </a>
        ))}
        {inProgressJira.map((issue) => (
          <a
            key={issue.id}
            href={issue.browseUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 text-xs font-medium"
          >
            <div className="truncate pr-2">
              <span className="text-blue-600 dark:text-blue-400 mr-1.5 font-semibold">{issue.key}:</span>
              <span className="text-neutral-800 dark:text-neutral-200">{issue.summary}</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </a>
        ))}
        {dirtyRepos.map((repo) => (
          <div
            key={repo.path}
            className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 text-xs font-medium"
          >
            <div className="truncate pr-2">
              <span className="text-amber-700 dark:text-amber-400 mr-1.5 font-semibold">Local Repo ({repo.branch}):</span>
              <span className="text-neutral-800 dark:text-neutral-200">{repo.name}</span>
            </div>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 shrink-0 font-semibold">
              {[
                repo.staged && '+',
                repo.unstaged && '*',
                repo.untracked && '?',
                repo.stashed && `$(${repo.stashCount})`,
                repo.ahead > 0 && `↑${repo.ahead}`,
                repo.behind > 0 && `↓${repo.behind}`,
              ].filter(Boolean).join('')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
