# Specification: Developer Task Dashboard Terminal UI (TUI)

**Date**: 2026-09-12  
**Target Path**: `/Users/E94919/REPOS/github.com/ATB-Ventures/apps/developer-dashboard`  
**Status**: Approved for Implementation  

---

## 1. Summary & Objective

Provide a rich, modern Terminal User Interface (TUI) for the Developer Task Dashboard using **Ink** (React for CLI). The TUI allows developers to browse, filter, inspect, and open active Jira tickets and GitHub pull requests directly from the terminal without opening a web browser, while reusing existing zero-config credentials and API clients.

---

## 2. Technical Stack & Dependencies

* **Framework**: `ink` (v5+), `ink-spinner` for loading state.
* **Execution**: `npm run tui` or `./scripts/tui.sh` executed via `tsx`.
* **Platform Integrations**:
  * macOS `open <url>` to launch links in default browser.
  * macOS `pbcopy` for 1-click clipboard copy of ticket keys and PR URLs.

---

## 3. Architecture & File Structure

```
developer-dashboard/
├── package.json               # adds ink, ink-spinner, "tui" script
├── scripts/
│   ├── start.sh              # Web app launcher
│   └── tui.sh                # TUI launcher
└── src/
    └── tui/
        ├── index.tsx          # CLI entry point, renders <App />
        ├── App.tsx            # State coordinator, keyboard listeners, fetch loops
        ├── components/
        │   ├── Header.tsx     # Connection badges, updated timestamp, error banner
        │   ├── NeedsAttention.tsx # Action items box (reviews requested, in-progress tasks)
        │   ├── Panel.tsx      # Generic bordered scrollable list panel
        │   ├── JiraItem.tsx   # Formatted Jira issue row
        │   ├── GitHubItem.tsx # Formatted GitHub PR/Issue row
        │   └── Footer.tsx     # Keyboard shortcut help legend
        └── utils/
            ├── clipboard.ts   # pbcopy utility
            └── browser.ts     # open URL utility
```

---

## 4. Keyboard Navigation & Interaction Model

* `Tab` or `Left/Right`: Switch active focus between **Jira Tasks** and **GitHub Activity**.
* `Up/Down` or `j/k`: Navigate item cursor within active panel.
* `Enter`: Open highlighted item's URL in the system's default browser.
* `c`: Copy ticket key (`ATB-123`) or PR branch/URL to system clipboard (`pbcopy`).
* `r`: Trigger immediate refresh of both Jira and GitHub data.
* `q` or `Esc`: Gracefully exit the TUI application.

---

## 5. Visual Layout & Color Contract

* **Header**:
  * Jira Status: `● Jira (smelo@atb.com)` [Green if connected, Red if error]
  * GitHub Status: `● GitHub (momelod)` [Green if connected, Red if error]
  * Last refreshed timestamp.
* **Needs Attention Banner**:
  * Highlighted amber box listing review requests waiting on the user and in-progress tasks.
* **Split Dual Columns**:
  * **Jira Column**: Cyan ticket keys (`[ATBVE-947]`), issue summaries, status pills (`In Progress`, `To Do`, `Done`).
  * **GitHub Column**: Purple repo names (`[atbv-invoicing]`), PR titles, review/draft status.
* **Footer**:
  * `[Tab] Switch Panel  [↑/↓] Navigate  [Enter] Open  [c] Copy  [r] Refresh  [q] Quit`
