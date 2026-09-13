export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  issueType: string;
  priority: string;
  status: {
    name: string;
    category: 'To Do' | 'In Progress' | 'Done';
    color: string;
  };
  browseUrl: string;
  updated: string;
  created: string;
}

export interface JiraCategorizedIssues {
  inProgress: JiraIssue[];
  toDo: JiraIssue[];
  recentlyCompleted: JiraIssue[];
}
