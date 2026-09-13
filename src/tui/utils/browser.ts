import { execFile } from 'child_process';

export function openInBrowser(url: string): void {
  try {
    execFile('open', [url], () => {});
  } catch {
    // ignore
  }
}
