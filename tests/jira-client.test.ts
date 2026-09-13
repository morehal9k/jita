import { describe, it, expect } from 'vitest';
import { categorizeJiraIssues } from '@/lib/jira/client';

describe('categorizeJiraIssues', () => {
  it('correctly sorts issues into inProgress, toDo, and recentlyCompleted', () => {
    const rawIssues = [
      {
        id: '1',
        key: 'ATB-1',
        fields: {
          summary: 'In Progress Task',
          issuetype: { name: 'Story' },
          priority: { name: 'High' },
          status: {
            name: 'In Progress',
            statusCategory: { name: 'In Progress', key: 'indeterminate', colorName: 'yellow' },
          },
          updated: '2026-09-12T10:00:00.000Z',
          created: '2026-09-10T10:00:00.000Z',
        },
      },
      {
        id: '2',
        key: 'ATB-2',
        fields: {
          summary: 'To Do Task',
          issuetype: { name: 'Task' },
          priority: { name: 'Medium' },
          status: {
            name: 'To Do',
            statusCategory: { name: 'To Do', key: 'new', colorName: 'blue-gray' },
          },
          updated: '2026-09-11T10:00:00.000Z',
          created: '2026-09-10T10:00:00.000Z',
        },
      },
      {
        id: '3',
        key: 'ATB-3',
        fields: {
          summary: 'Done Task',
          issuetype: { name: 'Story' },
          priority: { name: 'Medium' },
          status: {
            name: 'Done',
            statusCategory: { name: 'Done', key: 'done', colorName: 'green' },
          },
          updated: '2026-09-10T10:00:00.000Z',
          created: '2026-09-09T10:00:00.000Z',
        },
      },
    ];

    const result = categorizeJiraIssues(rawIssues, 'https://atbfinancial.atlassian.net');
    expect(result.inProgress).toHaveLength(1);
    expect(result.inProgress[0].key).toBe('ATB-1');
    expect(result.toDo).toHaveLength(1);
    expect(result.toDo[0].key).toBe('ATB-2');
    expect(result.recentlyCompleted).toHaveLength(1);
    expect(result.recentlyCompleted[0].key).toBe('ATB-3');
  });
});
