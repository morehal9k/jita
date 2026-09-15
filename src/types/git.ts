export interface LocalRepoStatus {
  name: string;
  path: string;
  branch: string;
  isClean: boolean;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  stashed: boolean;
  stashCount: number;
  ahead: number;
  behind: number;
  error?: string;
}

export interface GitOverview {
  configuredRepoDir?: string;
  repositories: LocalRepoStatus[];
  error?: string;
}
