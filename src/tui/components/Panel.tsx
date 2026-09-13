import React from 'react';
import { Box, Text } from 'ink';

export function Panel({
  title,
  count,
  isActive,
  children,
}: {
  title: string;
  count: number;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      flexBasis="50%"
      borderStyle={isActive ? 'double' : 'round'}
      borderColor={isActive ? 'blue' : 'gray'}
      paddingX={1}
      minHeight={15}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color={isActive ? 'blue' : 'white'}>
          {isActive ? '▶ ' : '  '}
          {title} ({count})
        </Text>
        <Text color="gray">{isActive ? '[FOCUSED]' : '[Tab to focus]'}</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
  );
}
