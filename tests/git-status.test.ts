import { describe, it, expect } from 'vitest';
import { parseRepoDirs, parseGitPorcelainV2, parseGitStashCount } from '../src/lib/git/status';

describe('parseRepoDirs', () => {
  it('parses colon-separated directories and expands home directory', () => {
    const parsed = parseRepoDirs('~/projects:/tmp/repos');
    expect(parsed.length).toBe(2);
    expect(parsed[0].startsWith('~')).toBe(false);
    expect(parsed[1]).toBe('/tmp/repos');
  });

  it('handles empty or unset variable cleanly', () => {
    expect(parseRepoDirs(undefined)).toEqual([]);
    expect(parseRepoDirs('')).toEqual([]);
    expect(parseRepoDirs('   ')).toEqual([]);
  });
});

describe('parseGitPorcelainV2', () => {
  it('parses clean state on main with upstream in sync', () => {
    const raw = [
      '# branch.oid 1234567890abcdef',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +0 -0',
    ].join('\n');

    const result = parseGitPorcelainV2(raw);
    expect(result.branch).toBe('main');
    expect(result.isClean).toBe(true);
    expect(result.staged).toBe(false);
    expect(result.unstaged).toBe(false);
    expect(result.untracked).toBe(false);
    expect(result.ahead).toBe(0);
    expect(result.behind).toBe(0);
  });

  it('parses dirty state with staged, unstaged, untracked changes and ahead/behind', () => {
    const raw = [
      '# branch.oid 1234567890abcdef',
      '# branch.head feature/test',
      '# branch.upstream origin/feature/test',
      '# branch.ab +3 -1',
      '1 M. N... 100644 100644 100644 abc def src/index.ts', // staged
      '1 .M N... 100644 100644 100644 abc def src/other.ts', // unstaged
      '? untracked.txt', // untracked
    ].join('\n');

    const result = parseGitPorcelainV2(raw);
    expect(result.branch).toBe('feature/test');
    expect(result.isClean).toBe(false);
    expect(result.staged).toBe(true);
    expect(result.unstaged).toBe(true);
    expect(result.untracked).toBe(true);
    expect(result.ahead).toBe(3);
    expect(result.behind).toBe(1);
  });

  it('handles detached HEAD', () => {
    const raw = [
      '# branch.oid 1234567890abcdef',
      '# branch.head (detached)',
    ].join('\n');

    const result = parseGitPorcelainV2(raw);
    expect(result.branch).toBe('(detached)');
    expect(result.isClean).toBe(true);
    expect(result.ahead).toBe(0);
    expect(result.behind).toBe(0);
  });
});

describe('parseGitStashCount', () => {
  it('counts stash lines correctly', () => {
    expect(parseGitStashCount('')).toBe(0);
    expect(parseGitStashCount('stash@{0}: WIP on main\nstash@{1}: WIP on dev\n')).toBe(2);
  });
});
