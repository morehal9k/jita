import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as childProcess from 'child_process';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

import { resolveGitHubToken } from '@/lib/auth/github-auth';

describe('resolveGitHubToken', () => {
  beforeEach(() => {
    delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    delete process.env.GITHUB_TOKEN;
    vi.resetAllMocks();
  });

  it('reads from gh CLI first if available', async () => {
    vi.mocked(childProcess.execFileSync).mockReturnValue('gh-cli-token\n');

    const result = await resolveGitHubToken();
    expect(result).toEqual({ token: 'gh-cli-token', source: 'gh_cli' });
  });

  it('falls back to environment variable if gh CLI fails', async () => {
    vi.mocked(childProcess.execFileSync).mockImplementation(() => {
      throw new Error('command not found');
    });

    process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'token-from-env';
    const result = await resolveGitHubToken();
    expect(result).toEqual({ token: 'token-from-env', source: 'env' });
  });
});
