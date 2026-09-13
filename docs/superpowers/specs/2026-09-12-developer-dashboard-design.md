# Architecture Design: Developer Task Dashboard (Jira & GitHub)

**Date**: 2026-09-12  
**Target Path**: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`  
**Status**: Draft for Review  

---

## 1. Executive Summary & Objective

The **Developer Task Dashboard** is a local, lightweight web application built to provide developers with a single unified overview of their active work across Atlassian Jira and GitHub. 

The dashboard operates with **zero-configuration token reuse**, automatically discovering and utilizing the developer's existing authentication credentials without requiring manual copy-pasting of sensitive tokens.

---

## 2. Core Constraints & Decisions

1. **Architecture**: Next.js App Router (TypeScript) with Tailwind CSS, running locally on `http://localhost:3000`.
2. **Credential Security**: All credential discovery and external API calls are executed strictly on the server in Next.js Route Handlers (`src/app/api/...`), completely shielding tokens from the browser runtime.
3. **Resilience & Fault Tolerance**: External queries to Jira and GitHub run independently via `Promise.allSettled`. If one platform experiences rate-limiting, latency, or auth failures, the other platform continues to render uninterrupted with clear diagnostics.
4. **Ergonomics & Ergonomic Controls**: Direct deep-links to Jira issues and GitHub pull requests, keyboard shortcuts (`Cmd+R` / `R` for refresh), and automatic background polling with configurable intervals.

---

## 3. Zero-Config Credential Resolution

### 3.1 Jira Credential Discovery
The server will resolve Jira credentials using a cascade:
1. **Explicit Environment Variables**:
   * `JIRA_URL` (defaulting to `https://atbfinancial.atlassian.net`)
   * `JIRA_USERNAME`
   * `JIRA_API_TOKEN`
2. **MCP Configuration Auto-Discovery**:
   * Inspects `~/.gemini/config/mcp_config.json`.
   * Reads `mcpServers["mcp-atlassian"].env`:
     * Extracts `JIRA_URL`, `JIRA_USERNAME`, and `JIRA_API_TOKEN`.
3. **Local Override**:
   * Reads optional `.env.local` if present in the dashboard project root.
4. **Fallback**: Returns diagnostic state `{ status: 'error', reason: 'Jira credentials not found in environment or MCP config' }`.

### 3.2 GitHub Credential Discovery
The server will resolve GitHub credentials using a cascade:
1. **Explicit Environment Variables**:
   * `GITHUB_PERSONAL_ACCESS_TOKEN` or `GITHUB_TOKEN`
2. **GitHub CLI (`gh`) Keychain Auto-Discovery**:
   * Executes `gh auth token` via `child_process.execFile` in the server process.
   * Leverages the active authenticated token stored in macOS Keychain (`momelod`).
3. **Fallback**: Returns diagnostic state `{ status: 'error', reason: 'GitHub token not found in environment or gh CLI' }`.

---

## 4. System Architecture & Directory Layout

```
developer-dashboard/
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML & theme provider
│   │   ├── page.tsx                # Main Dashboard View
│   │   ├── globals.css             # Tailwind 4 / styles
│   │   └── api/
│   │       ├── health/route.ts     # Health & token status diagnostics
│   │       ├── jira/route.ts       # Jira issues proxy handler
│   │       ├── github/route.ts     # GitHub PRs/issues proxy handler
│   │       └── overview/route.ts   # Aggregated endpoint (Promise.allSettled)
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── jira-auth.ts        # Jira credential discovery
│   │   │   └── github-auth.ts      # GitHub token resolution
│   │   ├── jira/
│   │   │   └── client.ts           # Jira REST v3 client
│   │   └── github/
│   │       └── client.ts           # Octokit / GitHub REST client
│   ├── components/
│   │   ├── Header.tsx              # Connection status, refresh controls, search bar
│   │   ├── NeedsAttention.tsx      # Critical PRs and In Progress Jira tasks
│   │   ├── JiraColumn.tsx          # To Do, In Progress, Done (7d)
│   │   ├── GitHubColumn.tsx        # My PRs, Review Requests, Assigned Issues
│   │   ├── IssueCard.tsx           # Jira issue card with priority, type, direct link
│   │   ├── PullRequestCard.tsx     # GitHub PR card with review/CI status
│   │   └── EmptyState.tsx          # Clean empty and error state display
│   └── types/
│       ├── dashboard.ts            # Aggregated response interfaces
│       ├── jira.ts                 # Jira API typings
│       └── github.ts               # GitHub API typings
└── tests/
    ├── auth.test.ts                # Unit tests for token discovery
    ├── jira-client.test.ts         # Jira client mapping tests
    └── github-client.test.ts       # GitHub client mapping tests
```

---

## 5. API Routes & Data Contracts

### 5.1 Jira Queries
* **Query**: `assignee = currentUser() AND (statusCategory != Done OR updated >= -7d) ORDER BY updated DESC`
* **Categories**:
  * `inProgress`: Issues with `status.statusCategory.key == "indeterminate"`
  * `toDo`: Issues with `status.statusCategory.key == "new"`
  * `recentlyCompleted`: Issues with `status.statusCategory.key == "done"` and updated in last 7 days.

### 5.2 GitHub Queries
Using GitHub REST Search & Pulls API:
1. **My Open PRs**: `is:pr author:@me archived:false is:open` (enriched with review decision: `APPROVED`, `CHANGES_REQUESTED`, `REVIEW_REQUIRED`, and check-run status: `SUCCESS`, `FAILURE`, `PENDING`).
2. **Review Requests**: `is:pr review-requested:@me archived:false is:open`.
3. **Assigned Issues**: `is:issue assignee:@me archived:false is:open`.
4. **Recently Merged**: `is:pr author:@me is:merged closed:>=[7_DAYS_AGO]`.

### 5.3 Unified Data Contract (`DashboardOverview`)
```typescript
export interface DashboardOverview {
  lastRefreshedAt: string;
  jira: {
    status: 'connected' | 'error';
    error?: string;
    inProgress: JiraIssue[];
    toDo: JiraIssue[];
    recentlyCompleted: JiraIssue[];
  };
  github: {
    status: 'connected' | 'error';
    error?: string;
    myPullRequests: GitHubPullRequest[];
    reviewRequests: GitHubPullRequest[];
    assignedIssues: GitHubIssue[];
    recentlyMerged: GitHubPullRequest[];
  };
}
```

---

## 6. User Interface & Experience

1. **Header & Global Controls**:
   * Service health badges showing connection targets (`atbfinancial.atlassian.net` and `@momelod`).
   * "Refresh Now" button with spinner, keyboard shortcut (`Cmd+R` / `R`), and auto-refresh selector (Off, 2m, 5m, 10m).
   * Search / Filter input with live client-side filtering across tickets, repos, and PR titles.
2. **Needs Attention Banner**:
   * Immediate callout for:
     * PRs waiting on user review.
     * User's open PRs with failing checks or requested changes.
     * Active In-Progress Jira tickets.
3. **Split Workspaces**:
   * **Jira Board View**: 3 columns (`In Progress`, `To Do`, `Completed This Week`).
   * **GitHub Workspace**: 4 groups (`My Pull Requests`, `Review Requests`, `Assigned Issues`, `Recently Merged`).
4. **Card Ergonomics**:
   * Clickable title opening ticket/PR in browser.
   * 1-click clipboard copy for branch name or ticket key.
   * Visual status pill badges (Green for approved/done, Amber for review required/in progress, Red for failing checks).

---

## 7. Error Handling & Edge Cases

* **Expired / Invalid Tokens**: Clear inline banner explaining which provider failed without crashing the app.
* **Network Offline**: Displays cached data with an offline warning and retry button.
* **Rate Limiting**: Handles GitHub 403 / 429 rate limit responses gracefully, displaying reset time.
* **Large Repositories**: Filters out noisy bot notifications and focuses strictly on direct review requests and assigned work.

---

## 8. Verification & Testing Strategy

1. **Unit Tests (Jest / Vitest)**:
   * Test `jira-auth.ts` correctly reads MCP config and env fallbacks.
   * Test `github-auth.ts` correctly executes `gh auth token` and handles failure when CLI is unavailable.
   * Test response parsing and grouping into `inProgress`, `toDo`, `myPullRequests`, `reviewRequests`.
2. **Integration Verification**:
   * Run dev server (`npm run dev`) and query `/api/health` and `/api/overview`.
   * Verify real data loads from `atbfinancial.atlassian.net` and `github.com`.
   * Verify deep-links and copy actions in browser.
