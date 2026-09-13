import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveJiraCredentials } from '@/lib/auth/jira-auth';
import fs from 'fs';

vi.mock('fs');

describe('resolveJiraCredentials', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.JIRA_API_TOKEN;
    delete process.env.JIRA_URL;
    delete process.env.JIRA_USERNAME;
  });

  it('reads from environment variables if present', async () => {
    process.env.JIRA_URL = 'https://custom.atlassian.net';
    process.env.JIRA_USERNAME = 'user@example.com';
    process.env.JIRA_API_TOKEN = 'secret-token';

    const creds = await resolveJiraCredentials();
    expect(creds).toEqual({
      url: 'https://custom.atlassian.net',
      username: 'user@example.com',
      token: 'secret-token',
      source: 'env',
    });
  });

  it('falls back to mcp_config.json if env vars are missing', async () => {
    const fakeMcpConfig = JSON.stringify({
      mcpServers: {
        'mcp-atlassian': {
          env: {
            JIRA_URL: 'https://atbfinancial.atlassian.net',
            JIRA_USERNAME: 'smelo@atb.com',
            JIRA_API_TOKEN: 'mcp-token',
          },
        },
      },
    });

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(fakeMcpConfig);

    const creds = await resolveJiraCredentials();
    expect(creds).toEqual({
      url: 'https://atbfinancial.atlassian.net',
      username: 'smelo@atb.com',
      token: 'mcp-token',
      source: 'mcp_config',
    });
  });
});
