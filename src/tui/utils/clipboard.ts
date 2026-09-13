import { execSync } from 'child_process';

export function copyToClipboard(text: string): boolean {
  try {
    execSync('pbcopy', { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}
