import React from 'react';
import { Box, Text } from 'ink';
import { LocalRepoStatus } from '@/types/git';

export function GitItem({
  repo,
  isSelected,
}: {
  repo: LocalRepoStatus;
  isSelected: boolean;
}) {
  const flags: string[] = [];
  if (repo.staged) flags.push('+');
  if (repo.unstaged) flags.push('*');
  if (repo.untracked) flags.push('?');
  if (repo.stashed) flags.push(`$(${repo.stashCount})`);

  let syncStr = '';
  if (repo.ahead > 0 && repo.behind > 0) {
    syncStr = `↑${repo.ahead}↓${repo.behind}`;
  } else if (repo.ahead > 0) {
    syncStr = `↑${repo.ahead}`;
  } else if (repo.behind > 0) {
    syncStr = `↓${repo.behind}`;
  }

  const isDirty = !repo.isClean || Boolean(syncStr);

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle={isSelected ? 'single' : undefined}
      borderColor={isSelected ? 'cyan' : undefined}
    >
      <Box gap={1}>
        <Text bold color={isSelected ? 'cyan' : 'white'}>
          {isSelected ? '› ' : '  '}{repo.name}
        </Text>
        <Text color="gray">({repo.branch})</Text>
      </Box>

      <Box gap={1}>
        {flags.length > 0 && (
          <Text color="yellow" bold>
            [{flags.join('')}]
          </Text>
        )}
        {syncStr && (
          <Text color="magenta" bold>
            {syncStr}
          </Text>
        )}
        {!isDirty && (
          <Text color="green">✓ clean</Text>
        )}
      </Box>
    </Box>
  );
}
