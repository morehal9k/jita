import React from 'react';
import { Box, Text } from 'ink';

export function Footer() {
  return (
    <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      <Box gap={2}>
        <Text>
          <Text bold color="yellow">[Tab / ← →]</Text> Switch Panel
        </Text>
        <Text>
          <Text bold color="yellow">[↑ / ↓]</Text> Select
        </Text>
        <Text>
          <Text bold color="yellow">[Enter]</Text> Open URL / $EDITOR
        </Text>
        <Text>
          <Text bold color="yellow">[c]</Text> Copy Key/URL/Path
        </Text>
        <Text>
          <Text bold color="yellow">[r]</Text> Refresh
        </Text>
      </Box>
      <Box>
        <Text>
          <Text bold color="yellow">[q]</Text> Quit
        </Text>
      </Box>
    </Box>
  );
}
