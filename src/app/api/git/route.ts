import { NextResponse } from 'next/server';
import { fetchLocalReposOverview } from '@/lib/git/status';

export async function GET() {
  try {
    const gitOverview = await fetchLocalReposOverview();
    return NextResponse.json(gitOverview);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to inspect local repositories' }, { status: 500 });
  }
}
