# Developer Task Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-config, local Next.js developer dashboard in `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard` that aggregates Jira tickets and GitHub PRs/issues by reusing existing local credentials (`~/.gemini/config/mcp_config.json` and `gh auth token`).

**Architecture:** A unified Next.js App Router application running on `http://localhost:3000`. Server-side Route Handlers securely auto-detect local credentials, execute parallel queries against Jira REST API v3 and GitHub REST API, and expose clean typed responses to a reactive React dashboard.

**Tech Stack:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Vitest for testing.

**Spec:** [docs/superpowers/specs/2026-09-12-developer-dashboard-design.md](file:///Users/E94919/REPOS/github.com/ATB-Ventures/apps/atbv-invoicing/docs/superpowers/specs/2026-09-12-developer-dashboard-design.md)

## Global Constraints

- App location: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`
- Never hardcode or commit tokens or secrets.
- Server-side token resolution only (`src/lib/auth/*`), never exposed in client components.
- Zero-config auto-discovery: Jira credentials from `~/.gemini/config/mcp_config.json` and GitHub token from `gh auth token` / `GITHUB_PERSONAL_ACCESS_TOKEN`.
- Parallel, non-blocking fetching using `Promise.allSettled`.
- No git side-effects (`git commit`/`git push`) without human instruction.

---

## File Structure

```
developer-dashboard/
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── vitest.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── jira/route.ts
│   │       ├── github/route.ts
│   │       └── overview/route.ts
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── jira-auth.ts
│   │   │   └── github-auth.ts
│   │   ├── jira/
│   │   │   └── client.ts
│   │   └── github/
│   │       └── client.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── NeedsAttention.tsx
│   │   ├── JiraColumn.tsx
│   │   ├── GitHubColumn.tsx
│   │   ├── IssueCard.tsx
│   │   ├── PullRequestCard.tsx
│   │   └── StatusBadge.tsx
│   └── types/
│       ├── dashboard.ts
│       ├── jira.ts
│       └── github.ts
└── tests/
    ├── jira-auth.test.ts
    ├── github-auth.test.ts
    ├── jira-client.test.ts
    └── github-client.test.ts
```

---

### Task 1: Scaffolding and Project Configuration

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/package.json`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tsconfig.json`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/next.config.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/postcss.config.mjs`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tailwind.config.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/vitest.config.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/.gitignore`

**Interfaces:**
- Produces: Runnable npm environment with `next dev`, `next build`, and `vitest run`.

- [ ] **Step 1: Create project directory and package.json**

```bash
mkdir -p /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app
mkdir -p /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/auth
mkdir -p /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/jira
mkdir -p /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/github
mkdir -p /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components
mkdir -p /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/types
mkdir -p /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests
```

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/package.json`:
```json
{
  "name": "developer-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "next": "15.2.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create TypeScript, Tailwind, PostCSS, and Vitest configuration**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `postcss.config.mjs`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Create `.gitignore`:
```
node_modules
.next
dist
.env.local
.DS_Store
```

- [ ] **Step 3: Run npm install**

Run: `npm install --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`  
Expected: Clean package installation.

---

### Task 2: Credential Auto-Discovery Modules

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/auth/jira-auth.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/auth/github-auth.ts`
- Test: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/jira-auth.test.ts`
- Test: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/github-auth.test.ts`

**Interfaces:**
- Produces:
  * `resolveJiraCredentials(): Promise<JiraCredentials | null>`
  * `resolveGitHubToken(): Promise<string | null>`

- [ ] **Step 1: Write failing tests for credential auto-discovery**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/jira-auth.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveJiraCredentials } from '@/lib/auth/jira-auth';
import fs from 'fs';

vi.mock('fs');

describe('resolveJiraCredentials', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.JIRA_API_TOKEN;
    delete process.env.JIRA_URL;
    delete process.env.JIRA_USERNAME;
  });

  it('reads from environment variables if present', async () => {
    process.env.JIRA_URL = 'https://custom.atlassian.net';
    process.env.JIRA_USERNAME = 'user@example.com';
    process.env.JIRA_API_TOKEN = 'secret-token';

    const creds = await resolveJiraCredentials();
    expect(creds).toEqual({
      url: 'https://custom.atlassian.net',
      username: 'user@example.com',
      token: 'secret-token',
      source: 'env',
    });
  });

  it('falls back to mcp_config.json if env vars are missing', async () => {
    const fakeMcpConfig = JSON.stringify({
      mcpServers: {
        'mcp-atlassian': {
          env: {
            JIRA_URL: 'https://atbfinancial.atlassian.net',
            JIRA_USERNAME: 'smelo@atb.com',
            JIRA_API_TOKEN: 'mcp-token',
          },
        },
      },
    });

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(fakeMcpConfig);

    const creds = await resolveJiraCredentials();
    expect(creds).toEqual({
      url: 'https://atbfinancial.atlassian.net',
      username: 'smelo@atb.com',
      token: 'mcp-token',
      source: 'mcp_config',
    });
  });
});
```

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/github-auth.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveGitHubToken } from '@/lib/auth/github-auth';

describe('resolveGitHubToken', () => {
  beforeEach(() => {
    delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    delete process.env.GITHUB_TOKEN;
  });

  it('reads from GITHUB_PERSONAL_ACCESS_TOKEN if set', async () => {
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'token-from-env';
    const token = await resolveGitHubToken();
    expect(token).toEqual({ token: 'token-from-env', source: 'env' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`  
Expected: FAIL with "Cannot find module '@/lib/auth/jira-auth'".

- [ ] **Step 3: Implement `jira-auth.ts` and `github-auth.ts`**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/auth/jira-auth.ts`:
```typescript
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface JiraCredentials {
  url: string;
  username: string;
  token: string;
  source: 'env' | 'mcp_config';
}

export async function resolveJiraCredentials(): Promise<JiraCredentials | null> {
  // 1. Direct environment variables
  if (process.env.JIRA_API_TOKEN && process.env.JIRA_USERNAME) {
    return {
      url: process.env.JIRA_URL || 'https://atbfinancial.atlassian.net',
      username: process.env.JIRA_USERNAME,
      token: process.env.JIRA_API_TOKEN,
      source: 'env',
    };
  }

  // 2. ~/.gemini/config/mcp_config.json
  const homeDir = os.homedir();
  const mcpConfigPath = path.join(homeDir, '.gemini/config/mcp_config.json');

  if (fs.existsSync(mcpConfigPath)) {
    try {
      const content = fs.readFileSync(mcpConfigPath, 'utf-8');
      const parsed = JSON.parse(content);
      const mcpEnv = parsed?.mcpServers?.['mcp-atlassian']?.env;
      if (mcpEnv?.JIRA_API_TOKEN && mcpEnv?.JIRA_USERNAME) {
        return {
          url: mcpEnv.JIRA_URL || 'https://atbfinancial.atlassian.net',
          username: mcpEnv.JIRA_USERNAME,
          token: mcpEnv.JIRA_API_TOKEN,
          source: 'mcp_config',
        };
      }
    } catch {
      // ignore parse failure
    }
  }

  return null;
}
```

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/auth/github-auth.ts`:
```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GitHubAuthResult {
  token: string;
  source: 'env' | 'gh_cli';
}

export async function resolveGitHubToken(): Promise<GitHubAuthResult | null> {
  // 1. Environment variables
  const envToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
  if (envToken) {
    return { token: envToken.trim(), source: 'env' };
  }

  // 2. gh CLI token
  try {
    const { stdout } = await execFileAsync('gh', ['auth', 'token']);
    const token = stdout.trim();
    if (token) {
      return { token, source: 'gh_cli' };
    }
  } catch {
    // gh CLI not installed or unauthenticated
  }

  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`  
Expected: PASS.

---

### Task 3: Jira Client & Route Handler

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/types/jira.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/jira/client.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/api/jira/route.ts`
- Test: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/jira-client.test.ts`

**Interfaces:**
- Produces: `fetchJiraOverview(creds: JiraCredentials): Promise<JiraCategorizedIssues>`

- [ ] **Step 1: Define Jira typings**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/types/jira.ts`:
```typescript
export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  issueType: string;
  priority: string;
  status: {
    name: string;
    category: 'To Do' | 'In Progress' | 'Done';
    color: string;
  };
  browseUrl: string;
  updated: string;
  created: string;
}

export interface JiraCategorizedIssues {
  inProgress: JiraIssue[];
  toDo: JiraIssue[];
  recentlyCompleted: JiraIssue[];
}
```

- [ ] **Step 2: Write test for Jira response categorization**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/jira-client.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { categorizeJiraIssues } from '@/lib/jira/client';

describe('categorizeJiraIssues', () => {
  it('correctly sorts issues into inProgress, toDo, and recentlyCompleted', () => {
    const rawIssues = [
      {
        id: '1',
        key: 'ATB-1',
        fields: {
          summary: 'In Progress Task',
          issuetype: { name: 'Story' },
          priority: { name: 'High' },
          status: {
            name: 'In Progress',
            statusCategory: { name: 'In Progress', key: 'indeterminate', colorName: 'yellow' },
          },
          updated: '2026-09-12T10:00:00.000Z',
          created: '2026-09-10T10:00:00.000Z',
        },
      },
      {
        id: '2',
        key: 'ATB-2',
        fields: {
          summary: 'To Do Task',
          issuetype: { name: 'Task' },
          priority: { name: 'Medium' },
          status: {
            name: 'To Do',
            statusCategory: { name: 'To Do', key: 'new', colorName: 'blue-gray' },
          },
          updated: '2026-09-11T10:00:00.000Z',
          created: '2026-09-10T10:00:00.000Z',
        },
      },
      {
        id: '3',
        key: 'ATB-3',
        fields: {
          summary: 'Done Task',
          issuetype: { name: 'Story' },
          priority: { name: 'Medium' },
          status: {
            name: 'Done',
            statusCategory: { name: 'Done', key: 'done', colorName: 'green' },
          },
          updated: '2026-09-10T10:00:00.000Z',
          created: '2026-09-09T10:00:00.000Z',
        },
      },
    ];

    const result = categorizeJiraIssues(rawIssues, 'https://atbfinancial.atlassian.net');
    expect(result.inProgress).toHaveLength(1);
    expect(result.inProgress[0].key).toBe('ATB-1');
    expect(result.toDo).toHaveLength(1);
    expect(result.toDo[0].key).toBe('ATB-2');
    expect(result.recentlyCompleted).toHaveLength(1);
    expect(result.recentlyCompleted[0].key).toBe('ATB-3');
  });
});
```

- [ ] **Step 3: Implement Jira client and Route Handler**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/jira/client.ts`:
```typescript
import { JiraCredentials } from '../auth/jira-auth';
import { JiraCategorizedIssues, JiraIssue } from '../../types/jira';

export function categorizeJiraIssues(rawIssues: any[], baseUrl: string): JiraCategorizedIssues {
  const inProgress: JiraIssue[] = [];
  const toDo: JiraIssue[] = [];
  const recentlyCompleted: JiraIssue[] = [];

  for (const issue of rawIssues) {
    const fields = issue.fields || {};
    const catKey = fields.status?.statusCategory?.key;
    const catName = fields.status?.statusCategory?.name || fields.status?.name;

    const mapped: JiraIssue = {
      id: issue.id,
      key: issue.key,
      summary: fields.summary || '',
      issueType: fields.issuetype?.name || 'Task',
      priority: fields.priority?.name || 'Medium',
      status: {
        name: fields.status?.name || 'Unknown',
        category: catKey === 'done' ? 'Done' : catKey === 'indeterminate' ? 'In Progress' : 'To Do',
        color: fields.status?.statusCategory?.colorName || 'blue-gray',
      },
      browseUrl: `${baseUrl}/browse/${issue.key}`,
      updated: fields.updated || '',
      created: fields.created || '',
    };

    if (catKey === 'done') {
      recentlyCompleted.push(mapped);
    } else if (catKey === 'indeterminate') {
      inProgress.push(mapped);
    } else {
      toDo.push(mapped);
    }
  }

  return { inProgress, toDo, recentlyCompleted };
}

export async function fetchJiraOverview(creds: JiraCredentials): Promise<JiraCategorizedIssues> {
  const authHeader = 'Basic ' + Buffer.from(`${creds.username}:${creds.token}`).toString('base64');
  const jql = 'assignee = currentUser() AND (statusCategory != Done OR updated >= -7d) ORDER BY updated DESC';
  const url = `${creds.url}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,status,priority,issuetype,updated,created`;

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Jira API returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return categorizeJiraIssues(data.issues || [], creds.url);
}
```

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/api/jira/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { resolveJiraCredentials } from '@/lib/auth/jira-auth';
import { fetchJiraOverview } from '@/lib/jira/client';

export async function GET() {
  const creds = await resolveJiraCredentials();
  if (!creds) {
    return NextResponse.json(
      { error: 'Jira credentials not found in env or ~/.gemini/config/mcp_config.json' },
      { status: 401 }
    );
  }

  try {
    const issues = await fetchJiraOverview(creds);
    return NextResponse.json({ status: 'connected', ...issues });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify test passes**

Run: `npm test --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard tests/jira-client.test.ts`  
Expected: PASS.

---

### Task 4: GitHub Client & Route Handler

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/types/github.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/github/client.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/api/github/route.ts`
- Test: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/github-client.test.ts`

**Interfaces:**
- Produces: `fetchGitHubOverview(token: string): Promise<GitHubOverview>`

- [ ] **Step 1: Define GitHub typings**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/types/github.ts`:
```typescript
export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  repo: string;
  url: string;
  author: string;
  isDraft: boolean;
  state: 'open' | 'closed' | 'merged';
  createdAt: string;
  updatedAt: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  repo: string;
  url: string;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface GitHubOverview {
  myPullRequests: GitHubPullRequest[];
  reviewRequests: GitHubPullRequest[];
  assignedIssues: GitHubIssue[];
  recentlyMerged: GitHubPullRequest[];
}
```

- [ ] **Step 2: Implement GitHub search helpers & tests**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/github-client.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { parseGitHubIssueOrPR } from '@/lib/github/client';

describe('parseGitHubIssueOrPR', () => {
  it('correctly parses repository name and PR attributes', () => {
    const raw = {
      id: 101,
      number: 42,
      title: 'Fix issue with billing',
      html_url: 'https://github.com/ATB-Ventures/apps/atbv-invoicing/pull/42',
      repository_url: 'https://api.github.com/repos/ATB-Ventures/atbv-invoicing',
      user: { login: 'momelod' },
      draft: false,
      state: 'open',
      created_at: '2026-09-10T12:00:00Z',
      updated_at: '2026-09-11T12:00:00Z',
      pull_request: {},
    };

    const parsed = parseGitHubIssueOrPR(raw);
    expect(parsed.repo).toBe('ATB-Ventures/atbv-invoicing');
    expect(parsed.number).toBe(42);
    expect(parsed.title).toBe('Fix issue with billing');
  });
});
```

- [ ] **Step 3: Implement GitHub client and Route Handler**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/lib/github/client.ts`:
```typescript
import { GitHubIssue, GitHubOverview, GitHubPullRequest } from '../../types/github';

export function parseGitHubIssueOrPR(item: any): any {
  const repo = item.repository_url ? item.repository_url.replace('https://api.github.com/repos/', '') : '';
  return {
    id: item.id,
    number: item.number,
    title: item.title,
    repo,
    url: item.html_url,
    author: item.user?.login || '',
    isDraft: Boolean(item.draft),
    state: item.state,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

async function searchGitHub(query: string, token: string): Promise<any[]> {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'developer-dashboard-app',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function fetchGitHubOverview(token: string): Promise<GitHubOverview> {
  const [authoredPRs, reviewReqs, assignedIssues, mergedPRs] = await Promise.all([
    searchGitHub('is:pr author:@me archived:false is:open', token),
    searchGitHub('is:pr review-requested:@me archived:false is:open', token),
    searchGitHub('is:issue assignee:@me archived:false is:open', token),
    searchGitHub('is:pr author:@me is:merged closed:>=2026-09-05', token),
  ]);

  return {
    myPullRequests: authoredPRs.map(parseGitHubIssueOrPR),
    reviewRequests: reviewReqs.map(parseGitHubIssueOrPR),
    assignedIssues: assignedIssues.map(parseGitHubIssueOrPR),
    recentlyMerged: mergedPRs.map(parseGitHubIssueOrPR),
  };
}
```

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/api/github/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { resolveGitHubToken } from '@/lib/auth/github-auth';
import { fetchGitHubOverview } from '@/lib/github/client';

export async function GET() {
  const auth = await resolveGitHubToken();
  if (!auth) {
    return NextResponse.json(
      { error: 'GitHub token not found in env or gh CLI' },
      { status: 401 }
    );
  }

  try {
    const overview = await fetchGitHubOverview(auth.token);
    return NextResponse.json({ status: 'connected', ...overview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify test passes**

Run: `npm test --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard tests/github-client.test.ts`  
Expected: PASS.

---

### Task 5: Aggregated Overview & Health Diagnostics Endpoints

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/types/dashboard.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/api/health/route.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/api/overview/route.ts`

**Interfaces:**
- Produces: `DashboardOverview` JSON response for `/api/overview`.

- [ ] **Step 1: Create Dashboard type definition**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/types/dashboard.ts`:
```typescript
import { JiraCategorizedIssues } from './jira';
import { GitHubOverview } from './github';

export interface DashboardOverview {
  lastRefreshedAt: string;
  jira: {
    status: 'connected' | 'error';
    error?: string;
    source?: string;
  } & Partial<JiraCategorizedIssues>;
  github: {
    status: 'connected' | 'error';
    error?: string;
    source?: string;
  } & Partial<GitHubOverview>;
}
```

- [ ] **Step 2: Implement `/api/health` diagnostics**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { resolveJiraCredentials } from '@/lib/auth/jira-auth';
import { resolveGitHubToken } from '@/lib/auth/github-auth';

export async function GET() {
  const [jira, github] = await Promise.all([
    resolveJiraCredentials(),
    resolveGitHubToken(),
  ]);

  return NextResponse.json({
    jira: jira ? { connected: true, source: jira.source, url: jira.url, user: jira.username } : { connected: false },
    github: github ? { connected: true, source: github.source } : { connected: false },
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 3: Implement `/api/overview` route handler**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/api/overview/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { resolveJiraCredentials } from '@/lib/auth/jira-auth';
import { resolveGitHubToken } from '@/lib/auth/github-auth';
import { fetchJiraOverview } from '@/lib/jira/client';
import { fetchGitHubOverview } from '@/lib/github/client';
import { DashboardOverview } from '@/types/dashboard';

export async function GET() {
  const [jiraCreds, ghAuth] = await Promise.all([
    resolveJiraCredentials(),
    resolveGitHubToken(),
  ]);

  const [jiraResult, githubResult] = await Promise.allSettled([
    jiraCreds ? fetchJiraOverview(jiraCreds) : Promise.reject(new Error('Jira credentials not found')),
    ghAuth ? fetchGitHubOverview(ghAuth.token) : Promise.reject(new Error('GitHub token not found')),
  ]);

  const overview: DashboardOverview = {
    lastRefreshedAt: new Date().toISOString(),
    jira: jiraResult.status === 'fulfilled'
      ? { status: 'connected', source: jiraCreds?.source, ...jiraResult.value }
      : { status: 'error', error: jiraResult.reason?.message },
    github: githubResult.status === 'fulfilled'
      ? { status: 'connected', source: ghAuth?.source, ...githubResult.value }
      : { status: 'error', error: githubResult.reason?.message },
  };

  return NextResponse.json(overview);
}
```

---

### Task 6: UI Components & Visual Design

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/Header.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/NeedsAttention.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/IssueCard.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/PullRequestCard.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/JiraColumn.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/GitHubColumn.tsx`

- [ ] **Step 1: Create IssueCard component**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/IssueCard.tsx`:
```tsx
import React, { useState } from 'react';
import { JiraIssue } from '@/types/jira';
import { ExternalLink, Copy, Check } from 'lucide-react';

export function IssueCard({ issue }: { issue: JiraIssue }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(issue.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-900 shadow-sm hover:border-blue-500 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">{issue.key}</span>
          <button
            onClick={handleCopy}
            title="Copy ticket key"
            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
          {issue.issueType}
        </span>
      </div>
      <a
        href={issue.browseUrl}
        target="_blank"
        rel="noreferrer"
        className="block font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 mb-2 line-clamp-2"
      >
        {issue.summary}
      </a>
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>{issue.priority}</span>
        <span className="flex items-center gap-1">
          {new Date(issue.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create PullRequestCard component**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/PullRequestCard.tsx`:
```tsx
import React from 'react';
import { GitHubPullRequest } from '@/types/github';
import { GitPullRequest, ExternalLink } from 'lucide-react';

export function PullRequestCard({ pr }: { pr: GitHubPullRequest }) {
  return (
    <div className="group border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-900 shadow-sm hover:border-purple-500 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
          {pr.repo}
        </span>
        <span className="text-xs font-medium text-neutral-400">#{pr.number}</span>
      </div>
      <a
        href={pr.url}
        target="_blank"
        rel="noreferrer"
        className="block font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:text-purple-600 dark:hover:text-purple-400 mb-2 line-clamp-2"
      >
        {pr.title}
      </a>
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1">
          <GitPullRequest className="w-3.5 h-3.5 text-purple-500" />
          {pr.author}
        </span>
        <span className="flex items-center gap-1">
          {new Date(pr.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create NeedsAttention Banner component**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/NeedsAttention.tsx`:
```tsx
import React from 'react';
import { JiraIssue } from '@/types/jira';
import { GitHubPullRequest } from '@/types/github';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

export function NeedsAttention({
  reviewRequests,
  inProgressJira,
}: {
  reviewRequests: GitHubPullRequest[];
  inProgressJira: JiraIssue[];
}) {
  const totalCount = reviewRequests.length + inProgressJira.length;
  if (totalCount === 0) return null;

  return (
    <section className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <h2 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
          Action Items & Focus ({totalCount})
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reviewRequests.map((pr) => (
          <a
            key={pr.id}
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 text-xs font-medium"
          >
            <div className="truncate pr-2">
              <span className="text-amber-700 dark:text-amber-400 mr-1.5 font-semibold">Review Request:</span>
              <span className="text-neutral-800 dark:text-neutral-200">{pr.title}</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </a>
        ))}
        {inProgressJira.map((issue) => (
          <a
            key={issue.id}
            href={issue.browseUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 text-xs font-medium"
          >
            <div className="truncate pr-2">
              <span className="text-blue-600 dark:text-blue-400 mr-1.5 font-semibold">{issue.key}:</span>
              <span className="text-neutral-800 dark:text-neutral-200">{issue.summary}</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </a>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create Header component**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/components/Header.tsx`:
```tsx
import React from 'react';
import { RefreshCw, Search } from 'lucide-react';

export function Header({
  lastRefreshedAt,
  isRefreshing,
  onRefresh,
  searchQuery,
  onSearchChange,
  jiraConnected,
  githubConnected,
}: {
  lastRefreshedAt: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  jiraConnected: boolean;
  githubConnected: boolean;
}) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            DD
          </div>
          <div>
            <h1 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 leading-tight">
              Developer Dashboard
            </h1>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${jiraConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                Jira
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${githubConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                GitHub
              </span>
              {lastRefreshedAt && (
                <>
                  <span>•</span>
                  <span>Updated {new Date(lastRefreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter tasks / PRs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

### Task 7: Main Dashboard Page & Layout

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/globals.css`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/layout.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/page.tsx`

- [ ] **Step 1: Create layout and styles**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #09090b;
    --foreground: #f8fafc;
  }
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/layout.tsx`:
```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Task Dashboard',
  description: 'Unified overview of your Jira and GitHub active tasks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-50 dark:bg-neutral-950">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Implement reactive main dashboard page (`src/app/page.tsx`)**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/app/page.tsx`:
```tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardOverview } from '@/types/dashboard';
import { Header } from '@/components/Header';
import { NeedsAttention } from '@/components/NeedsAttention';
import { IssueCard } from '@/components/IssueCard';
import { PullRequestCard } from '@/components/PullRequestCard';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchOverview = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/overview');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load overview', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchOverview, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  // Keyboard shortcut: 'r' to refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        fetchOverview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchOverview]);

  const filteredJira = useMemo(() => {
    if (!data?.jira) return { inProgress: [], toDo: [], recentlyCompleted: [] };
    const q = search.toLowerCase();
    const filterFn = (item: any) =>
      item.key.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);

    return {
      inProgress: (data.jira.inProgress || []).filter(filterFn),
      toDo: (data.jira.toDo || []).filter(filterFn),
      recentlyCompleted: (data.jira.recentlyCompleted || []).filter(filterFn),
    };
  }, [data?.jira, search]);

  const filteredGitHub = useMemo(() => {
    if (!data?.github) return { myPullRequests: [], reviewRequests: [], assignedIssues: [], recentlyMerged: [] };
    const q = search.toLowerCase();
    const filterFn = (item: any) =>
      item.title.toLowerCase().includes(q) || item.repo.toLowerCase().includes(q);

    return {
      myPullRequests: (data.github.myPullRequests || []).filter(filterFn),
      reviewRequests: (data.github.reviewRequests || []).filter(filterFn),
      assignedIssues: (data.github.assignedIssues || []).filter(filterFn),
      recentlyMerged: (data.github.recentlyMerged || []).filter(filterFn),
    };
  }, [data?.github, search]);

  return (
    <div>
      <Header
        lastRefreshedAt={data?.lastRefreshedAt || ''}
        isRefreshing={refreshing}
        onRefresh={fetchOverview}
        searchQuery={search}
        onSearchChange={setSearch}
        jiraConnected={data?.jira?.status === 'connected'}
        githubConnected={data?.github?.status === 'connected'}
      />

      <main className="max-w-7xl mx-auto p-6">
        <NeedsAttention
          reviewRequests={filteredGitHub.reviewRequests}
          inProgressJira={filteredJira.inProgress}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Jira Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                Jira Tasks
              </h2>
              <span className="text-xs text-neutral-500">
                {filteredJira.inProgress.length} In Progress • {filteredJira.toDo.length} To Do
              </span>
            </div>

            {data?.jira?.status === 'error' && (
              <div className="p-3 mb-4 text-xs rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900">
                Jira error: {data.jira.error}
              </div>
            )}

            <div className="space-y-6">
              {filteredJira.inProgress.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    In Progress ({filteredJira.inProgress.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredJira.inProgress.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  To Do ({filteredJira.toDo.length})
                </h3>
                <div className="space-y-2.5">
                  {filteredJira.toDo.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>

              {filteredJira.recentlyCompleted.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Completed This Week ({filteredJira.recentlyCompleted.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredJira.recentlyCompleted.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* GitHub Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                GitHub Activity
              </h2>
              <span className="text-xs text-neutral-500">
                {filteredGitHub.myPullRequests.length} My PRs • {filteredGitHub.reviewRequests.length} Reviews
              </span>
            </div>

            {data?.github?.status === 'error' && (
              <div className="p-3 mb-4 text-xs rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900">
                GitHub error: {data.github.error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  My Pull Requests ({filteredGitHub.myPullRequests.length})
                </h3>
                <div className="space-y-2.5">
                  {filteredGitHub.myPullRequests.map((pr) => (
                    <PullRequestCard key={pr.id} pr={pr} />
                  ))}
                </div>
              </div>

              {filteredGitHub.reviewRequests.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Review Requests ({filteredGitHub.reviewRequests.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredGitHub.reviewRequests.map((pr) => (
                      <PullRequestCard key={pr.id} pr={pr} />
                    ))}
                  </div>
                </div>
              )}

              {filteredGitHub.assignedIssues.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Assigned Issues ({filteredGitHub.assignedIssues.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredGitHub.assignedIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-900"
                      >
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:text-blue-600 block mb-1"
                        >
                          {issue.title}
                        </a>
                        <span className="text-xs text-neutral-500">{issue.repo} #{issue.number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
```

---

### Task 8: Verification & Launch Script

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/scripts/start.sh`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/README.md`

- [ ] **Step 1: Create launcher script that opens browser**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/scripts/start.sh`:
```bash
#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "🚀 Starting Developer Dashboard on http://localhost:3000 ..."

# Open browser after 2 seconds
(sleep 2 && open http://localhost:3000) &

npm run dev
```
Make executable: `chmod +x /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/scripts/start.sh`

- [ ] **Step 2: Create README with instructions**

Create `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/README.md`:
```markdown
# Developer Task Dashboard

A zero-config local web dashboard for consolidating Atlassian Jira tasks and GitHub pull requests/issues.

## Features
- **Zero-Config Token Discovery**: Automatically sources Jira credentials from `~/.gemini/config/mcp_config.json` and GitHub tokens from `gh auth token` / environment.
- **Action Items Banner**: Surfaces PR review requests and in-progress Jira tasks immediately.
- **Fast Keyboard Navigation**: Press `R` to refresh anytime. Live search filter across tickets and repos.
- **Resilient & Offline-Tolerant**: Non-blocking queries via `Promise.allSettled`.

## Quick Start
```bash
./scripts/start.sh
```
Or:
```bash
npm install
npm run dev
```
Then visit [http://localhost:3000](http://localhost:3000).
```

- [ ] **Step 3: Run Vitest test suite**

Run: `npm test --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`  
Expected: All unit tests pass.

- [ ] **Step 4: Build test**

Run: `npm run build --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`  
Expected: Successful Next.js production build.
