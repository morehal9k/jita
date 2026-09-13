import React from 'react';
import { Box, Text } from 'ink';

export function Header({
  jiraConnected,
  githubConnected,
  jiraUser,
  lastRefreshedAt,
  toastMessage,
}: {
  jiraConnected: boolean;
  githubConnected: boolean;
  jiraUser?: string;
  lastRefreshedAt?: string;
  toastMessage?: string;
}) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box justifyContent="space-between" borderStyle="single" borderColor="cyan" paddingX={1}>
        <Box gap={1}>
          <Text bold color="cyan">
            ◆ DEVELOPER DASHBOARD
          </Text>
          <Text color="gray">|</Text>
          <Text color={jiraConnected ? 'green' : 'red'}>
            ● Jira ({jiraUser || 'Connected'})
          </Text>
          <Text color="gray">•</Text>
          <Text color={githubConnected ? 'green' : 'red'}>
            ● GitHub (momelod)
          </Text>
        </Box>
        <Box gap={1}>
          {toastMessage ? (
            <Text bold color="green">
              {toastMessage}
            </Text>
          ) : lastRefreshedAt ? (
            <Text color="gray">
              Updated {new Date(lastRefreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
