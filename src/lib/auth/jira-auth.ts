import fs from 'fs';
import path from 'path';
import os from 'os';

export interface JiraCredentials {
  url: string;
  username: string;
  token: string;
  source: 'env' | 'mcp_config';
}

export async function resolveJiraCredentials(): Promise<JiraCredentials | null> {
  // 1. Direct environment variables
  if (process.env.JIRA_API_TOKEN && process.env.JIRA_USERNAME) {
    return {
      url: process.env.JIRA_URL || 'https://atbfinancial.atlassian.net',
      username: process.env.JIRA_USERNAME,
      token: process.env.JIRA_API_TOKEN,
      source: 'env',
    };
  }

  // 2. ~/.gemini/config/mcp_config.json
  const homeDir = os.homedir();
  const mcpConfigPath = path.join(homeDir, '.gemini/config/mcp_config.json');

  if (fs.existsSync(mcpConfigPath)) {
    try {
      const content = fs.readFileSync(mcpConfigPath, 'utf-8');
      const parsed = JSON.parse(content);
      const mcpEnv = parsed?.mcpServers?.['mcp-atlassian']?.env;
      if (mcpEnv?.JIRA_API_TOKEN && mcpEnv?.JIRA_USERNAME) {
        return {
          url: mcpEnv.JIRA_URL || 'https://atbfinancial.atlassian.net',
          username: mcpEnv.JIRA_USERNAME,
          token: mcpEnv.JIRA_API_TOKEN,
          source: 'mcp_config',
        };
      }
    } catch {
      // ignore parse failure
    }
  }

  return null;
}
