import { JiraCategorizedIssues } from './jira';
import { GitHubOverview } from './github';
import { GitOverview } from './git';

export interface DashboardOverview {
  lastRefreshedAt: string;
  jira: {
    status: 'connected' | 'error';
    error?: string;
    source?: string;
  } & Partial<JiraCategorizedIssues>;
  github: {
    status: 'connected' | 'error';
    error?: string;
    source?: string;
  } & Partial<GitHubOverview>;
  git?: {
    status: 'connected' | 'error' | 'not_configured';
    error?: string;
    configuredRepoDir?: string;
  } & Partial<GitOverview>;
}
