import { GitHubIssue, GitHubOverview, GitHubPullRequest } from '../../types/github';

export function parseGitHubIssueOrPR(item: any): any {
  const repo = item.repository_url ? item.repository_url.replace('https://api.github.com/repos/', '') : '';
  return {
    id: item.id,
    number: item.number,
    title: item.title,
    repo,
    url: item.html_url,
    author: item.user?.login || '',
    isDraft: Boolean(item.draft),
    state: item.state,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

async function searchGitHub(query: string, token: string): Promise<any[]> {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'developer-dashboard-app',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function fetchGitHubOverview(token: string): Promise<GitHubOverview> {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const sevenDaysAgo = d.toISOString().split('T')[0];

  const [authoredPRs, reviewReqs, assignedIssues, mergedPRs] = await Promise.all([
    searchGitHub('is:pr author:@me archived:false is:open', token),
    searchGitHub('is:pr review-requested:@me archived:false is:open', token),
    searchGitHub('is:issue assignee:@me archived:false is:open', token),
    searchGitHub(`is:pr author:@me is:merged closed:>=${sevenDaysAgo}`, token),
  ]);

  return {
    myPullRequests: authoredPRs.map(parseGitHubIssueOrPR),
    reviewRequests: reviewReqs.map(parseGitHubIssueOrPR),
    assignedIssues: assignedIssues.map(parseGitHubIssueOrPR),
    recentlyMerged: mergedPRs.map(parseGitHubIssueOrPR),
  };
}
