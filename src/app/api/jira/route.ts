import { NextResponse } from 'next/server';
import { resolveJiraCredentials } from '@/lib/auth/jira-auth';
import { fetchJiraOverview } from '@/lib/jira/client';

export async function GET() {
  const creds = await resolveJiraCredentials();
  if (!creds) {
    return NextResponse.json(
      { error: 'Jira credentials not found in env or ~/.gemini/config/mcp_config.json' },
      { status: 401 }
    );
  }

  try {
    const issues = await fetchJiraOverview(creds);
    return NextResponse.json({ status: 'connected', ...issues });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
