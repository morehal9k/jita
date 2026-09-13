export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  repo: string;
  url: string;
  author: string;
  isDraft: boolean;
  state: 'open' | 'closed' | 'merged';
  createdAt: string;
  updatedAt: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  repo: string;
  url: string;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface GitHubOverview {
  myPullRequests: GitHubPullRequest[];
  reviewRequests: GitHubPullRequest[];
  assignedIssues: GitHubIssue[];
  recentlyMerged: GitHubPullRequest[];
}
