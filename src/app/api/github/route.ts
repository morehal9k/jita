import { NextResponse } from 'next/server';
import { resolveGitHubToken } from '@/lib/auth/github-auth';
import { fetchGitHubOverview } from '@/lib/github/client';

export async function GET() {
  const auth = await resolveGitHubToken();
  if (!auth) {
    return NextResponse.json(
      { error: 'GitHub token not found in env or gh CLI' },
      { status: 401 }
    );
  }

  try {
    const overview = await fetchGitHubOverview(auth.token);
    return NextResponse.json({ status: 'connected', ...overview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
