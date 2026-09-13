import { NextResponse } from 'next/server';
import { resolveJiraCredentials } from '@/lib/auth/jira-auth';
import { resolveGitHubToken } from '@/lib/auth/github-auth';

export async function GET() {
  const [jira, github] = await Promise.all([
    resolveJiraCredentials(),
    resolveGitHubToken(),
  ]);

  return NextResponse.json({
    jira: jira ? { connected: true, source: jira.source, url: jira.url, user: jira.username } : { connected: false },
    github: github ? { connected: true, source: github.source } : { connected: false },
    timestamp: new Date().toISOString(),
  });
}
