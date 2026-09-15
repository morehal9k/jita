import { NextResponse } from 'next/server';
import { resolveJiraCredentials } from '@/lib/auth/jira-auth';
import { resolveGitHubToken } from '@/lib/auth/github-auth';
import { fetchJiraOverview } from '@/lib/jira/client';
import { fetchGitHubOverview } from '@/lib/github/client';
import { fetchLocalReposOverview } from '@/lib/git/status';
import { DashboardOverview } from '@/types/dashboard';

export async function GET() {
  const [jiraCreds, ghAuth] = await Promise.all([
    resolveJiraCredentials(),
    resolveGitHubToken(),
  ]);

  const [jiraResult, githubResult, gitResult] = await Promise.allSettled([
    jiraCreds ? fetchJiraOverview(jiraCreds) : Promise.reject(new Error('Jira credentials not found')),
    ghAuth ? fetchGitHubOverview(ghAuth.token) : Promise.reject(new Error('GitHub token not found')),
    fetchLocalReposOverview(),
  ]);

  const overview: DashboardOverview = {
    lastRefreshedAt: new Date().toISOString(),
    jira: jiraResult.status === 'fulfilled'
      ? { status: 'connected', source: jiraCreds?.source, ...jiraResult.value }
      : { status: 'error', error: jiraResult.reason?.message },
    github: githubResult.status === 'fulfilled'
      ? { status: 'connected', source: ghAuth?.source, ...githubResult.value }
      : { status: 'error', error: githubResult.reason?.message },
    git: gitResult.status === 'fulfilled'
      ? {
          status: gitResult.value.repositories.length > 0 || gitResult.value.configuredRepoDir ? 'connected' : 'not_configured',
          ...gitResult.value,
        }
      : { status: 'error', error: gitResult.reason?.message },
  };

  return NextResponse.json(overview);
}
