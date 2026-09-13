# Developer Task Dashboard TUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a modern, interactive Terminal User Interface (TUI) to the Developer Task Dashboard using **Ink** (React for CLI), allowing developers to view and navigate Jira tasks and GitHub PRs in the terminal with keyboard controls.

**Architecture:** An Ink-based React application in `src/tui/` that runs directly via `npm run tui` or `./scripts/tui.sh` (using `tsx`). It reuses the existing auth resolvers and API clients, presenting a split-pane navigable dashboard with hotkeys to open items in the browser or copy them to the clipboard.

**Tech Stack:** Ink 5+, React 19, TypeScript, tsx, Vitest.

**Spec:** [docs/superpowers/specs/2026-09-12-developer-dashboard-tui-design.md](file:///Users/E94919/REPOS/github.com/ATB-Ventures/apps/atbv-invoicing/docs/superpowers/specs/2026-09-12-developer-dashboard-tui-design.md)

## Global Constraints

- App location: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`
- Reuse existing `src/lib/jira/client.ts`, `src/lib/github/client.ts`, and `src/lib/auth/*`.
- Run in terminal without requiring Next.js dev server to be running.
- Support keyboard shortcuts: Tab, arrows/j/k, Enter, c, r, q.
- No git side effects (`git commit`/`git push`) without human approval.

---

### Task 1: TUI Dependencies & Package Configuration

**Files:**
- Modify: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/package.json`

- [ ] **Step 1: Install `ink` and `ink-spinner`**

Run:
```bash
npm install ink ink-spinner --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard
```

- [ ] **Step 2: Add `tui` script to package.json**

Add `"tui": "tsx src/tui/index.tsx"` to `"scripts"`.

---

### Task 2: Terminal Utilities (Clipboard & Browser Opening)

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/utils/clipboard.ts`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/utils/browser.ts`
- Test: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/tests/tui-utils.test.ts`

- [ ] **Step 1: Write tests for clipboard and browser helpers**

Create `tests/tui-utils.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import * as childProcess from 'child_process';
import { copyToClipboard } from '@/tui/utils/clipboard';
import { openInBrowser } from '@/tui/utils/browser';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
  execFile: vi.fn(),
}));

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
```

- [ ] **Step 2: Implement `clipboard.ts` and `browser.ts`**

Create `src/tui/utils/clipboard.ts`:
```typescript
import { execSync } from 'child_process';

export function copyToClipboard(text: string): boolean {
  try {
    execSync('pbcopy', { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}
```

Create `src/tui/utils/browser.ts`:
```typescript
import { execFile } from 'child_process';

export function openInBrowser(url: string): void {
  try {
    execFile('open', [url], () => {});
  } catch {
    // ignore
  }
}
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npm test tests/tui-utils.test.ts --prefix /Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`

---

### Task 3: TUI Presentation Components

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/components/Header.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/components/Footer.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/components/NeedsAttention.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/components/JiraItem.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/components/GitHubItem.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/components/Panel.tsx`

- [ ] **Step 1: Implement Header & Footer**
- [ ] **Step 2: Implement NeedsAttention banner**
- [ ] **Step 3: Implement JiraItem & GitHubItem with selection cursor**
- [ ] **Step 4: Implement scrollable Panel**

---

### Task 4: Main TUI Application & Entry Point

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/App.tsx`
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/src/tui/index.tsx`

- [ ] **Step 1: Implement `App.tsx` with `useInput` navigation, data fetching, and active panel state**
- [ ] **Step 2: Implement `index.tsx` with Ink's `render()`**

---

### Task 5: Launch Script, README Update & Verification

**Files:**
- Create: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/scripts/tui.sh`
- Modify: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard/README.md`

- [ ] **Step 1: Create executable `scripts/tui.sh`**
- [ ] **Step 2: Update README with TUI instructions**
- [ ] **Step 3: Run all unit tests and smoke test TUI execution**
