import React from 'react';
import { RefreshCw, Search } from 'lucide-react';

export function Header({
  lastRefreshedAt,
  isRefreshing,
  onRefresh,
  searchQuery,
  onSearchChange,
  jiraConnected,
  githubConnected,
}: {
  lastRefreshedAt: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  jiraConnected: boolean;
  githubConnected: boolean;
}) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            DD
          </div>
          <div>
            <h1 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 leading-tight">
              Developer Dashboard
            </h1>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${jiraConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                Jira
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${githubConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                GitHub
              </span>
              {lastRefreshedAt && (
                <>
                  <span>•</span>
                  <span>Updated {new Date(lastRefreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter tasks / PRs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
