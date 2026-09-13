import React from 'react';
import { Box, Text } from 'ink';
import { JiraIssue } from '@/types/jira';
import { GitHubPullRequest } from '@/types/github';

export function NeedsAttention({
  reviewRequests,
  inProgressJira,
}: {
  reviewRequests: GitHubPullRequest[];
  inProgressJira: JiraIssue[];
}) {
  const totalCount = reviewRequests.length + inProgressJira.length;
  if (totalCount === 0) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
      marginBottom={1}
    >
      <Box marginBottom={0}>
        <Text bold color="yellow">
          ⚠ ACTION ITEMS & FOCUS ({totalCount})
        </Text>
      </Box>
      <Box flexDirection="column">
        {reviewRequests.slice(0, 3).map((pr) => (
          <Box key={pr.id} gap={1}>
            <Text bold color="magenta">
              [Review Request]
            </Text>
            <Text bold color="white">
              {pr.repo}#{pr.number}:
            </Text>
            <Text color="gray" wrap="truncate">
              {pr.title}
            </Text>
          </Box>
        ))}
        {inProgressJira.slice(0, 3).map((issue) => (
          <Box key={issue.id} gap={1}>
            <Text bold color="cyan">
              [{issue.key}]
            </Text>
            <Text bold color="yellow">
              (In Progress):
            </Text>
            <Text color="white" wrap="truncate">
              {issue.summary}
            </Text>
          </Box>
        ))}
        {totalCount > 6 && (
          <Text color="gray" italic>
            + {totalCount - 6} more action items...
          </Text>
        )}
      </Box>
    </Box>
  );
}
