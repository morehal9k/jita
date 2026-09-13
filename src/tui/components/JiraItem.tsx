import React from 'react';
import { Box, Text } from 'ink';
import { JiraIssue } from '@/types/jira';

export function JiraItem({
  issue,
  isSelected,
}: {
  issue: JiraIssue;
  isSelected: boolean;
}) {
  const statusColor =
    issue.status.category === 'Done'
      ? 'green'
      : issue.status.category === 'In Progress'
      ? 'yellow'
      : 'blue';

  return (
    <Box>
      <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
        {isSelected ? '❯ ' : '  '}
      </Text>
      <Box width={12}>
        <Text bold color="cyan">
          {issue.key}
        </Text>
      </Box>
      <Box width={14}>
        <Text color={statusColor}>[{issue.status.name.slice(0, 11)}]</Text>
      </Box>
      <Box flexGrow={1}>
        <Text color={isSelected ? 'white' : 'gray'} wrap="truncate">
          {issue.summary}
        </Text>
      </Box>
    </Box>
  );
}
