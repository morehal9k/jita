import React from 'react';
import { Box, Text } from 'ink';
import { GitHubPullRequest } from '@/types/github';

export function GitHubItem({
  pr,
  isSelected,
  category,
}: {
  pr: GitHubPullRequest;
  isSelected: boolean;
  category?: 'review' | 'authored';
}) {
  return (
    <Box>
      <Text color={isSelected ? 'magenta' : undefined} bold={isSelected}>
        {isSelected ? '❯ ' : '  '}
      </Text>
      <Box width={24}>
        <Text bold color="magenta" wrap="truncate">
          {pr.repo.split('/')[1] || pr.repo}
        </Text>
      </Box>
      <Box width={8}>
        <Text color="gray">#{pr.number}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text color={isSelected ? 'white' : 'gray'} wrap="truncate">
          {category === 'review' ? '👀 ' : ''}
          {pr.title}
        </Text>
      </Box>
    </Box>
  );
}
