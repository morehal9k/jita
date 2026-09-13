import { JiraCredentials } from '../auth/jira-auth';
import { JiraCategorizedIssues, JiraIssue } from '../../types/jira';

export function categorizeJiraIssues(rawIssues: any[], baseUrl: string): JiraCategorizedIssues {
  const inProgress: JiraIssue[] = [];
  const toDo: JiraIssue[] = [];
  const recentlyCompleted: JiraIssue[] = [];

  for (const issue of rawIssues) {
    const fields = issue.fields || {};
    const catKey = fields.status?.statusCategory?.key;

    const mapped: JiraIssue = {
      id: issue.id,
      key: issue.key,
      summary: fields.summary || '',
      issueType: fields.issuetype?.name || 'Task',
      priority: fields.priority?.name || 'Medium',
      status: {
        name: fields.status?.name || 'Unknown',
        category: catKey === 'done' ? 'Done' : catKey === 'indeterminate' ? 'In Progress' : 'To Do',
        color: fields.status?.statusCategory?.colorName || 'blue-gray',
      },
      browseUrl: `${baseUrl}/browse/${issue.key}`,
      updated: fields.updated || '',
      created: fields.created || '',
    };

    if (catKey === 'done') {
      recentlyCompleted.push(mapped);
    } else if (catKey === 'indeterminate') {
      inProgress.push(mapped);
    } else {
      toDo.push(mapped);
    }
  }

  return { inProgress, toDo, recentlyCompleted };
}

export async function fetchJiraOverview(creds: JiraCredentials): Promise<JiraCategorizedIssues> {
  const authHeader = 'Basic ' + Buffer.from(`${creds.username}:${creds.token}`).toString('base64');
  const jql = 'assignee = currentUser() AND (statusCategory != Done OR updated >= -7d) ORDER BY updated DESC';
  const url = `${creds.url}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,status,priority,issuetype,updated,created`;

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Jira API returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return categorizeJiraIssues(data.issues || [], creds.url);
}
