'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardOverview } from '@/types/dashboard';
import { Header } from '@/components/Header';
import { NeedsAttention } from '@/components/NeedsAttention';
import { IssueCard } from '@/components/IssueCard';
import { PullRequestCard } from '@/components/PullRequestCard';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchOverview = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/overview');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load overview', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchOverview, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  // Keyboard shortcut: 'r' to refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        fetchOverview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchOverview]);

  const filteredJira = useMemo(() => {
    if (!data?.jira) return { inProgress: [], toDo: [], recentlyCompleted: [] };
    const q = search.toLowerCase();
    const filterFn = (item: any) =>
      item.key.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);

    return {
      inProgress: (data.jira.inProgress || []).filter(filterFn),
      toDo: (data.jira.toDo || []).filter(filterFn),
      recentlyCompleted: (data.jira.recentlyCompleted || []).filter(filterFn),
    };
  }, [data?.jira, search]);

  const filteredGitHub = useMemo(() => {
    if (!data?.github) return { myPullRequests: [], reviewRequests: [], assignedIssues: [], recentlyMerged: [] };
    const q = search.toLowerCase();
    const filterFn = (item: any) =>
      item.title.toLowerCase().includes(q) || item.repo.toLowerCase().includes(q);

    return {
      myPullRequests: (data.github.myPullRequests || []).filter(filterFn),
      reviewRequests: (data.github.reviewRequests || []).filter(filterFn),
      assignedIssues: (data.github.assignedIssues || []).filter(filterFn),
      recentlyMerged: (data.github.recentlyMerged || []).filter(filterFn),
    };
  }, [data?.github, search]);

  return (
    <div>
      <Header
        lastRefreshedAt={data?.lastRefreshedAt || ''}
        isRefreshing={refreshing}
        onRefresh={fetchOverview}
        searchQuery={search}
        onSearchChange={setSearch}
        jiraConnected={data?.jira?.status === 'connected'}
        githubConnected={data?.github?.status === 'connected'}
      />

      <main className="max-w-7xl mx-auto p-6">
        <NeedsAttention
          reviewRequests={filteredGitHub.reviewRequests}
          inProgressJira={filteredJira.inProgress}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Jira Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                Jira Tasks
              </h2>
              <span className="text-xs text-neutral-500">
                {filteredJira.inProgress.length} In Progress • {filteredJira.toDo.length} To Do
              </span>
            </div>

            {data?.jira?.status === 'error' && (
              <div className="p-3 mb-4 text-xs rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900">
                Jira error: {data.jira.error}
              </div>
            )}

            <div className="space-y-6">
              {filteredJira.inProgress.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    In Progress ({filteredJira.inProgress.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredJira.inProgress.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  To Do ({filteredJira.toDo.length})
                </h3>
                <div className="space-y-2.5">
                  {filteredJira.toDo.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>

              {filteredJira.recentlyCompleted.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Completed This Week ({filteredJira.recentlyCompleted.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredJira.recentlyCompleted.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* GitHub Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                GitHub Activity
              </h2>
              <span className="text-xs text-neutral-500">
                {filteredGitHub.myPullRequests.length} My PRs • {filteredGitHub.reviewRequests.length} Reviews
              </span>
            </div>

            {data?.github?.status === 'error' && (
              <div className="p-3 mb-4 text-xs rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900">
                GitHub error: {data.github.error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  My Pull Requests ({filteredGitHub.myPullRequests.length})
                </h3>
                <div className="space-y-2.5">
                  {filteredGitHub.myPullRequests.map((pr) => (
                    <PullRequestCard key={pr.id} pr={pr} />
                  ))}
                </div>
              </div>

              {filteredGitHub.reviewRequests.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Review Requests ({filteredGitHub.reviewRequests.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredGitHub.reviewRequests.map((pr) => (
                      <PullRequestCard key={pr.id} pr={pr} />
                    ))}
                  </div>
                </div>
              )}

              {filteredGitHub.assignedIssues.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Assigned Issues ({filteredGitHub.assignedIssues.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredGitHub.assignedIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-900"
                      >
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:text-blue-600 block mb-1"
                        >
                          {issue.title}
                        </a>
                        <span className="text-xs text-neutral-500">{issue.repo} #{issue.number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
