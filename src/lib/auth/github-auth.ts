import { execFileSync } from 'child_process';

export interface GitHubAuthResult {
  token: string;
  source: 'env' | 'gh_cli';
}

export async function resolveGitHubToken(): Promise<GitHubAuthResult | null> {
  // 1. First priority: active gh CLI session (Keychain)
  try {
    const stdout = execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const token = stdout ? stdout.trim() : '';
    if (token) {
      return { token, source: 'gh_cli' };
    }
  } catch {
    // gh CLI not installed or unauthenticated, fall back to env
  }

  // 2. Environment variables fallback
  const envToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
  if (envToken) {
    return { token: envToken.trim(), source: 'env' };
  }

  return null;
}
