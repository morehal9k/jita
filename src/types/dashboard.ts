import { JiraCategorizedIssues } from './jira';
import { GitHubOverview } from './github';

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
}
