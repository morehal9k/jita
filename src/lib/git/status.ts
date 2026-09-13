import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { LocalRepoStatus, GitOverview } from '../../types/git';

const execFileAsync = promisify(execFile);

/**
 * Parses REPO_DIR value, handling colon separation and tilde expansion.
 */
export function parseRepoDirs(repoDirEnv?: string): string[] {
  if (!repoDirEnv || !repoDirEnv.trim()) {
    return [];
  }

  const rawPaths = repoDirEnv.split(':').map((p) => p.trim()).filter(Boolean);
  const home = os.homedir();

  return rawPaths.map((p) => {
    if (p === '~') return home;
    if (p.startsWith('~/')) return path.join(home, p.slice(2));
    return path.resolve(p);
  });
}

/**
 * Parses output of `git status --porcelain=v2 --branch`
 */
export function parseGitPorcelainV2(output: string): {
  branch: string;
  isClean: boolean;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  ahead: number;
  behind: number;
} {
  let branch = 'HEAD';
  let ahead = 0;
  let behind = 0;
  let staged = false;
  let unstaged = false;
  let untracked = false;

  const lines = output.split('\n');
  for (const line of lines) {
    if (!line) continue;

    if (line.startsWith('# branch.head ')) {
      branch = line.slice('# branch.head '.length).trim();
    } else if (line.startsWith('# branch.ab ')) {
      // Format: # branch.ab +A -B
      const match = line.match(/\+(\d+)\s+-(\d+)/);
      if (match) {
        ahead = parseInt(match[1], 10);
        behind = parseInt(match[2], 10);
      }
    } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
      // Ordinary changed entry or renamed/copied entry
      // Format: 1 <XY> ... where X is staged, Y is unstaged
      const parts = line.split(' ');
      const xy = parts[1];
      if (xy) {
        if (xy[0] !== '.') staged = true;
        if (xy[1] !== '.') unstaged = true;
      }
    } else if (line.startsWith('u ')) {
      // Unmerged entry
      staged = true;
      unstaged = true;
    } else if (line.startsWith('? ')) {
      // Untracked entry
      untracked = true;
    }
  }

  const isClean = !staged && !unstaged && !untracked;

  return {
    branch,
    isClean,
    staged,
    unstaged,
    untracked,
    ahead,
    behind,
  };
}

/**
 * Parses output of `git stash list`
 */
export function parseGitStashCount(output: string): number {
  if (!output || !output.trim()) return 0;
  return output.trim().split('\n').filter(Boolean).length;
}

/**
 * Finds all git repositories directly in or immediate subdirectories of given directories.
 */
export async function discoverGitRepositories(dirs: string[]): Promise<string[]> {
  const repoPaths: Set<string> = new Set();

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const stat = await fs.promises.stat(dir);
      if (!stat.isDirectory()) continue;

      // Check if dir itself is a git repo
      if (fs.existsSync(path.join(dir, '.git'))) {
        repoPaths.add(dir);
        continue;
      }

      // Check immediate subdirectories
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = path.join(dir, entry.name);
          if (fs.existsSync(path.join(subDir, '.git'))) {
            repoPaths.add(subDir);
          }
        }
      }
    } catch {
      // Ignore unreadable directories
    }
  }

  return Array.from(repoPaths);
}

/**
 * Inspects a single git repository.
 */
export async function inspectGitRepo(repoPath: string): Promise<LocalRepoStatus> {
  const name = path.basename(repoPath);

  try {
    const [statusResult, stashResult] = await Promise.all([
      execFileAsync('git', ['status', '--porcelain=v2', '--branch'], {
        cwd: repoPath,
        timeout: 5000,
      }),
      execFileAsync('git', ['stash', 'list'], {
        cwd: repoPath,
        timeout: 5000,
      }).catch(() => ({ stdout: '' })),
    ]);

    const parsedStatus = parseGitPorcelainV2(statusResult.stdout);
    const stashCount = parseGitStashCount(stashResult.stdout);

    return {
      name,
      path: repoPath,
      ...parsedStatus,
      stashed: stashCount > 0,
      stashCount,
    };
  } catch (err: any) {
    return {
      name,
      path: repoPath,
      branch: 'unknown',
      isClean: false,
      staged: false,
      unstaged: false,
      untracked: false,
      stashed: false,
      stashCount: 0,
      ahead: 0,
      behind: 0,
      error: err.message || 'Failed to inspect git repository',
    };
  }
}

/**
 * Resolves all repositories from REPO_DIR.
 */
export async function fetchLocalReposOverview(repoDirEnv?: string): Promise<GitOverview> {
  const rawEnv = repoDirEnv ?? process.env.REPO_DIR;
  const dirs = parseRepoDirs(rawEnv);

  if (dirs.length === 0) {
    return {
      configuredRepoDir: rawEnv,
      repositories: [],
    };
  }

  try {
    const repoPaths = await discoverGitRepositories(dirs);
    const repositories = await Promise.all(repoPaths.map((p) => inspectGitRepo(p)));

    // Sort: dirty or out-of-sync repos first, then alphabetically by name
    repositories.sort((a, b) => {
      const aNeedsAttention = !a.isClean || a.ahead > 0 || a.behind > 0;
      const bNeedsAttention = !b.isClean || b.ahead > 0 || b.behind > 0;
      if (aNeedsAttention && !bNeedsAttention) return -1;
      if (!aNeedsAttention && bNeedsAttention) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      configuredRepoDir: rawEnv,
      repositories,
    };
  } catch (err: any) {
    return {
      configuredRepoDir: rawEnv,
      repositories: [],
      error: err.message,
    };
  }
}
