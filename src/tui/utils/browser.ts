import { execFile, spawn } from 'child_process';

export function openInBrowser(url: string): void {
  try {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    execFile(opener, [url], () => {});
  } catch {
    // ignore
  }
}

export function openInEditor(filePath: string): void {
  try {
    const editor = process.env.EDITOR || (process.platform === 'darwin' ? 'open' : 'vi');
    // If editor is a command, launch it
    const parts = editor.split(' ');
    const cmd = parts[0];
    const args = [...parts.slice(1), filePath];
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
  } catch {
    // ignore
  }
}
