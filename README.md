# jita

**jita** is a zero-config developer task dashboard and CLI consolidating **Atlassian Jira** tickets and **GitHub** pull requests & review requests into a unified interface.

Available as both a lightning-fast **Interactive Terminal UI (TUI)** and a modern **Web GUI**.

---

## Features

- **Zero-Config Credential Auto-Discovery**:
  - **Jira**: Auto-detects credentials from `~/.gemini/config/mcp_config.json` (Atlassian MCP server config) or environment variables (`JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
  - **GitHub**: Auto-detects active authentication via `gh auth token` (macOS Keychain) or environment variables (`GITHUB_TOKEN` / `GITHUB_PERSONAL_ACCESS_TOKEN`).
- **Interactive Terminal UI (TUI)**: Fast keyboard-driven CLI dashboard powered by [Ink](https://github.com/vadimdemedes/ink) (React in the terminal).
- **Web GUI**: Clean, dark-mode browser dashboard built with Next.js App Router and Tailwind CSS.
- **Action Items & Focus Banner**: Surfaces pending pull request review requests and in-progress Jira tickets so you know what needs attention immediately.
- **macOS System Integrations**:
  - Press `Enter` to open any ticket or PR directly in your default browser.
  - Press `c` to copy ticket key or PR URL straight to your clipboard (`pbcopy`).
- **Live Auto-Refresh**: Automatically polls for updates every 5 minutes or instantly with `r` / keyboard shortcuts.

---

## Prerequisites

- **Node.js**: `v20.x` or higher
- **GitHub CLI** (optional but recommended): `gh auth login` for zero-config GitHub token discovery.
- **Jira Credentials**: Configured via Gemini CLI MCP config (`~/.gemini/config/mcp_config.json`) or standard environment variables (see below).

---

## Installation & Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/morehal9k/jita.git
cd jita
npm install
```

---

## Running the Terminal UI (TUI)

### Option A: Install `jita` Globally (Recommended)
Build and link the binary so `jita` is executable from anywhere in your shell:

```bash
npm run build:cli
npm link
```

Now run anywhere:
```bash
jita
```

### Option B: Run Directly via Script
```bash
./scripts/tui.sh
# or
npm run tui
```

### Keyboard Shortcuts in the TUI:
| Key | Action |
|---|---|
| `Tab` / `←` `→` | Switch focus between Jira and GitHub panels |
| `↑` `↓` or `j` `k` | Navigate items within focused panel |
| `Enter` | Open selected Jira issue or GitHub PR in browser |
| `c` | Copy ticket key or PR link to clipboard |
| `r` | Refresh Jira & GitHub data immediately |
| `q` / `Esc` | Quit the application |

---

## Running the Web GUI

Start the local web server:

```bash
./scripts/start.sh
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To create an optimized production build of the web app:
```bash
npm run build
npm start
```

---

## Configuration & Environment Variables

If you do not use the auto-discovery mechanisms, you can provide environment variables in a `.env.local` file:

```bash
# Jira (Optional if configured in ~/.gemini/config/mcp_config.json)
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@domain.com
JIRA_API_TOKEN=your_jira_api_token

# GitHub (Optional if logged in with `gh auth login`)
GITHUB_TOKEN=ghp_your_github_personal_access_token
```

---

## Development & Testing

Run unit tests:
```bash
npm test
```

Build the standalone CLI binary:
```bash
npm run build:cli
```

---

## License

MIT
