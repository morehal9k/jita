import { describe, it, expect, vi } from 'vitest';
import * as childProcess from 'child_process';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
  execFile: vi.fn(),
}));

import { copyToClipboard } from '@/tui/utils/clipboard';
import { openInBrowser } from '@/tui/utils/browser';

describe('TUI Utils', () => {
  it('calls pbcopy on macOS', () => {
    copyToClipboard('test-content');
    expect(childProcess.execSync).toHaveBeenCalledWith('pbcopy', expect.objectContaining({ input: 'test-content' }));
  });

  it('calls open command to launch URL in browser', () => {
    openInBrowser('https://github.com');
    expect(childProcess.execFile).toHaveBeenCalledWith('open', ['https://github.com'], expect.any(Function));
  });
});
