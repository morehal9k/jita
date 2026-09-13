import React from 'react';
import { GitHubPullRequest } from '@/types/github';
import { GitPullRequest, ExternalLink } from 'lucide-react';

export function PullRequestCard({ pr }: { pr: GitHubPullRequest }) {
  return (
    <div className="group border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-900 shadow-sm hover:border-purple-500 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
          {pr.repo}
        </span>
        <span className="text-xs font-medium text-neutral-400">#{pr.number}</span>
      </div>
      <a
        href={pr.url}
        target="_blank"
        rel="noreferrer"
        className="block font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:text-purple-600 dark:hover:text-purple-400 mb-2 line-clamp-2"
      >
        {pr.title}
      </a>
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1">
          <GitPullRequest className="w-3.5 h-3.5 text-purple-500" />
          {pr.author}
        </span>
        <span className="flex items-center gap-1">
          {new Date(pr.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
        </span>
      </div>
    </div>
  );
}
