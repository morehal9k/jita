import { describe, it, expect } from 'vitest';
import { parseGitHubIssueOrPR } from '@/lib/github/client';

describe('parseGitHubIssueOrPR', () => {
  it('correctly parses repository name and PR attributes', () => {
    const raw = {
      id: 101,
      number: 42,
      title: 'Fix issue with billing',
      html_url: 'https://github.com/ATB-Ventures/apps/atbv-invoicing/pull/42',
      repository_url: 'https://api.github.com/repos/ATB-Ventures/atbv-invoicing',
      user: { login: 'momelod' },
      draft: false,
      state: 'open',
      created_at: '2026-09-10T12:00:00Z',
      updated_at: '2026-09-11T12:00:00Z',
      pull_request: {},
    };

    const parsed = parseGitHubIssueOrPR(raw);
    expect(parsed.repo).toBe('ATB-Ventures/atbv-invoicing');
    expect(parsed.number).toBe(42);
    expect(parsed.title).toBe('Fix issue with billing');
  });
});
