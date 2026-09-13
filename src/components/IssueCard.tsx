import React, { useState } from 'react';
import { JiraIssue } from '@/types/jira';
import { ExternalLink, Copy, Check } from 'lucide-react';

export function IssueCard({ issue }: { issue: JiraIssue }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(issue.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-900 shadow-sm hover:border-blue-500 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">{issue.key}</span>
          <button
            onClick={handleCopy}
            title="Copy ticket key"
            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
          {issue.issueType}
        </span>
      </div>
      <a
        href={issue.browseUrl}
        target="_blank"
        rel="noreferrer"
        className="block font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 mb-2 line-clamp-2"
      >
        {issue.summary}
      </a>
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>{issue.priority}</span>
        <span className="flex items-center gap-1">
          {new Date(issue.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
        </span>
      </div>
    </div>
  );
}
