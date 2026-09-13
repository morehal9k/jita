#!/usr/bin/env node

// src/tui/index.tsx
import React8 from "react";
import { render } from "ink";

// src/tui/App.tsx
import React7, { useState, useEffect, useCallback, useMemo } from "react";
import { Box as Box7, Text as Text7, useInput, useApp } from "ink";
import Spinner from "ink-spinner";

// src/lib/auth/jira-auth.ts
import fs from "fs";
import path from "path";
import os from "os";
async function resolveJiraCredentials() {
  if (process.env.JIRA_API_TOKEN && process.env.JIRA_USERNAME) {
    return {
      url: process.env.JIRA_URL || "https://atbfinancial.atlassian.net",
      username: process.env.JIRA_USERNAME,
      token: process.env.JIRA_API_TOKEN,
      source: "env"
    };
  }
  const homeDir = os.homedir();
  const mcpConfigPath = path.join(homeDir, ".gemini/config/mcp_config.json");
  if (fs.existsSync(mcpConfigPath)) {
    try {
      const content = fs.readFileSync(mcpConfigPath, "utf-8");
      const parsed = JSON.parse(content);
      const mcpEnv = parsed?.mcpServers?.["mcp-atlassian"]?.env;
      if (mcpEnv?.JIRA_API_TOKEN && mcpEnv?.JIRA_USERNAME) {
        return {
          url: mcpEnv.JIRA_URL || "https://atbfinancial.atlassian.net",
          username: mcpEnv.JIRA_USERNAME,
          token: mcpEnv.JIRA_API_TOKEN,
          source: "mcp_config"
        };
      }
    } catch {
    }
  }
  return null;
}

// src/lib/auth/github-auth.ts
import { execFileSync } from "child_process";
async function resolveGitHubToken() {
  try {
    const stdout = execFileSync("gh", ["auth", "token"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"]
    });
    const token = stdout ? stdout.trim() : "";
    if (token) {
      return { token, source: "gh_cli" };
    }
  } catch {
  }
  const envToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
  if (envToken) {
    return { token: envToken.trim(), source: "env" };
  }
  return null;
}

// src/lib/jira/client.ts
function categorizeJiraIssues(rawIssues, baseUrl) {
  const inProgress = [];
  const toDo = [];
  const recentlyCompleted = [];
  for (const issue of rawIssues) {
    const fields = issue.fields || {};
    const catKey = fields.status?.statusCategory?.key;
    const mapped = {
      id: issue.id,
      key: issue.key,
      summary: fields.summary || "",
      issueType: fields.issuetype?.name || "Task",
      priority: fields.priority?.name || "Medium",
      status: {
        name: fields.status?.name || "Unknown",
        category: catKey === "done" ? "Done" : catKey === "indeterminate" ? "In Progress" : "To Do",
        color: fields.status?.statusCategory?.colorName || "blue-gray"
      },
      browseUrl: `${baseUrl}/browse/${issue.key}`,
      updated: fields.updated || "",
      created: fields.created || ""
    };
    if (catKey === "done") {
      recentlyCompleted.push(mapped);
    } else if (catKey === "indeterminate") {
      inProgress.push(mapped);
    } else {
      toDo.push(mapped);
    }
  }
  return { inProgress, toDo, recentlyCompleted };
}
async function fetchJiraOverview(creds) {
  const authHeader = "Basic " + Buffer.from(`${creds.username}:${creds.token}`).toString("base64");
  const jql = "assignee = currentUser() AND (statusCategory != Done OR updated >= -7d) ORDER BY updated DESC";
  const url = `${creds.url}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,status,priority,issuetype,updated,created`;
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      Accept: "application/json"
    }
  });
  if (!res.ok) {
    throw new Error(`Jira API returned ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  return categorizeJiraIssues(data.issues || [], creds.url);
}

// src/lib/github/client.ts
function parseGitHubIssueOrPR(item) {
  const repo = item.repository_url ? item.repository_url.replace("https://api.github.com/repos/", "") : "";
  return {
    id: item.id,
    number: item.number,
    title: item.title,
    repo,
    url: item.html_url,
    author: item.user?.login || "",
    isDraft: Boolean(item.draft),
    state: item.state,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}
async function searchGitHub(query, token) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "developer-dashboard-app"
    }
  });
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${res.statusText}`);
  }
  const data = await res.json();
  return data.items || [];
}
async function fetchGitHubOverview(token) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - 7);
  const sevenDaysAgo = d.toISOString().split("T")[0];
  const [authoredPRs, reviewReqs, assignedIssues, mergedPRs] = await Promise.all([
    searchGitHub("is:pr author:@me archived:false is:open", token),
    searchGitHub("is:pr review-requested:@me archived:false is:open", token),
    searchGitHub("is:issue assignee:@me archived:false is:open", token),
    searchGitHub(`is:pr author:@me is:merged closed:>=${sevenDaysAgo}`, token)
  ]);
  return {
    myPullRequests: authoredPRs.map(parseGitHubIssueOrPR),
    reviewRequests: reviewReqs.map(parseGitHubIssueOrPR),
    assignedIssues: assignedIssues.map(parseGitHubIssueOrPR),
    recentlyMerged: mergedPRs.map(parseGitHubIssueOrPR)
  };
}

// src/tui/components/Header.tsx
import React from "react";
import { Box, Text } from "ink";
function Header({
  jiraConnected,
  githubConnected,
  jiraUser,
  lastRefreshedAt,
  toastMessage
}) {
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Box, { justifyContent: "space-between", borderStyle: "single", borderColor: "cyan", paddingX: 1 }, /* @__PURE__ */ React.createElement(Box, { gap: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true, color: "cyan" }, "\u25C6 DEVELOPER DASHBOARD"), /* @__PURE__ */ React.createElement(Text, { color: "gray" }, "|"), /* @__PURE__ */ React.createElement(Text, { color: jiraConnected ? "green" : "red" }, "\u25CF Jira (", jiraUser || "Connected", ")"), /* @__PURE__ */ React.createElement(Text, { color: "gray" }, "\u2022"), /* @__PURE__ */ React.createElement(Text, { color: githubConnected ? "green" : "red" }, "\u25CF GitHub (momelod)")), /* @__PURE__ */ React.createElement(Box, { gap: 1 }, toastMessage ? /* @__PURE__ */ React.createElement(Text, { bold: true, color: "green" }, toastMessage) : lastRefreshedAt ? /* @__PURE__ */ React.createElement(Text, { color: "gray" }, "Updated ", new Date(lastRefreshedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })) : null)));
}

// src/tui/components/Footer.tsx
import React2 from "react";
import { Box as Box2, Text as Text2 } from "ink";
function Footer() {
  return /* @__PURE__ */ React2.createElement(Box2, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1, justifyContent: "space-between" }, /* @__PURE__ */ React2.createElement(Box2, { gap: 2 }, /* @__PURE__ */ React2.createElement(Text2, null, /* @__PURE__ */ React2.createElement(Text2, { bold: true, color: "yellow" }, "[Tab / \u2190 \u2192]"), " Switch Panel"), /* @__PURE__ */ React2.createElement(Text2, null, /* @__PURE__ */ React2.createElement(Text2, { bold: true, color: "yellow" }, "[\u2191 / \u2193]"), " Select"), /* @__PURE__ */ React2.createElement(Text2, null, /* @__PURE__ */ React2.createElement(Text2, { bold: true, color: "yellow" }, "[Enter]"), " Open URL"), /* @__PURE__ */ React2.createElement(Text2, null, /* @__PURE__ */ React2.createElement(Text2, { bold: true, color: "yellow" }, "[c]"), " Copy Key/URL"), /* @__PURE__ */ React2.createElement(Text2, null, /* @__PURE__ */ React2.createElement(Text2, { bold: true, color: "yellow" }, "[r]"), " Refresh")), /* @__PURE__ */ React2.createElement(Box2, null, /* @__PURE__ */ React2.createElement(Text2, null, /* @__PURE__ */ React2.createElement(Text2, { bold: true, color: "yellow" }, "[q]"), " Quit")));
}

// src/tui/components/NeedsAttention.tsx
import React3 from "react";
import { Box as Box3, Text as Text3 } from "ink";
function NeedsAttention({
  reviewRequests,
  inProgressJira
}) {
  const totalCount = reviewRequests.length + inProgressJira.length;
  if (totalCount === 0) return null;
  return /* @__PURE__ */ React3.createElement(
    Box3,
    {
      flexDirection: "column",
      borderStyle: "round",
      borderColor: "yellow",
      paddingX: 1,
      marginBottom: 1
    },
    /* @__PURE__ */ React3.createElement(Box3, { marginBottom: 0 }, /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "yellow" }, "\u26A0 ACTION ITEMS & FOCUS (", totalCount, ")")),
    /* @__PURE__ */ React3.createElement(Box3, { flexDirection: "column" }, reviewRequests.slice(0, 3).map((pr) => /* @__PURE__ */ React3.createElement(Box3, { key: pr.id, gap: 1 }, /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "magenta" }, "[Review Request]"), /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "white" }, pr.repo, "#", pr.number, ":"), /* @__PURE__ */ React3.createElement(Text3, { color: "gray", wrap: "truncate" }, pr.title))), inProgressJira.slice(0, 3).map((issue) => /* @__PURE__ */ React3.createElement(Box3, { key: issue.id, gap: 1 }, /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "cyan" }, "[", issue.key, "]"), /* @__PURE__ */ React3.createElement(Text3, { bold: true, color: "yellow" }, "(In Progress):"), /* @__PURE__ */ React3.createElement(Text3, { color: "white", wrap: "truncate" }, issue.summary))), totalCount > 6 && /* @__PURE__ */ React3.createElement(Text3, { color: "gray", italic: true }, "+ ", totalCount - 6, " more action items..."))
  );
}

// src/tui/components/Panel.tsx
import React4 from "react";
import { Box as Box4, Text as Text4 } from "ink";
function Panel({
  title,
  count,
  isActive,
  children
}) {
  return /* @__PURE__ */ React4.createElement(
    Box4,
    {
      flexDirection: "column",
      flexGrow: 1,
      flexBasis: "50%",
      borderStyle: isActive ? "double" : "round",
      borderColor: isActive ? "blue" : "gray",
      paddingX: 1,
      minHeight: 15
    },
    /* @__PURE__ */ React4.createElement(Box4, { justifyContent: "space-between", marginBottom: 1 }, /* @__PURE__ */ React4.createElement(Text4, { bold: true, color: isActive ? "blue" : "white" }, isActive ? "\u25B6 " : "  ", title, " (", count, ")"), /* @__PURE__ */ React4.createElement(Text4, { color: "gray" }, isActive ? "[FOCUSED]" : "[Tab to focus]")),
    /* @__PURE__ */ React4.createElement(Box4, { flexDirection: "column", flexGrow: 1 }, children)
  );
}

// src/tui/components/JiraItem.tsx
import React5 from "react";
import { Box as Box5, Text as Text5 } from "ink";
function JiraItem({
  issue,
  isSelected
}) {
  const statusColor = issue.status.category === "Done" ? "green" : issue.status.category === "In Progress" ? "yellow" : "blue";
  return /* @__PURE__ */ React5.createElement(Box5, null, /* @__PURE__ */ React5.createElement(Text5, { color: isSelected ? "cyan" : void 0, bold: isSelected }, isSelected ? "\u276F " : "  "), /* @__PURE__ */ React5.createElement(Box5, { width: 12 }, /* @__PURE__ */ React5.createElement(Text5, { bold: true, color: "cyan" }, issue.key)), /* @__PURE__ */ React5.createElement(Box5, { width: 14 }, /* @__PURE__ */ React5.createElement(Text5, { color: statusColor }, "[", issue.status.name.slice(0, 11), "]")), /* @__PURE__ */ React5.createElement(Box5, { flexGrow: 1 }, /* @__PURE__ */ React5.createElement(Text5, { color: isSelected ? "white" : "gray", wrap: "truncate" }, issue.summary)));
}

// src/tui/components/GitHubItem.tsx
import React6 from "react";
import { Box as Box6, Text as Text6 } from "ink";
function GitHubItem({
  pr,
  isSelected,
  category
}) {
  return /* @__PURE__ */ React6.createElement(Box6, null, /* @__PURE__ */ React6.createElement(Text6, { color: isSelected ? "magenta" : void 0, bold: isSelected }, isSelected ? "\u276F " : "  "), /* @__PURE__ */ React6.createElement(Box6, { width: 24 }, /* @__PURE__ */ React6.createElement(Text6, { bold: true, color: "magenta", wrap: "truncate" }, pr.repo.split("/")[1] || pr.repo)), /* @__PURE__ */ React6.createElement(Box6, { width: 8 }, /* @__PURE__ */ React6.createElement(Text6, { color: "gray" }, "#", pr.number)), /* @__PURE__ */ React6.createElement(Box6, { flexGrow: 1 }, /* @__PURE__ */ React6.createElement(Text6, { color: isSelected ? "white" : "gray", wrap: "truncate" }, category === "review" ? "\u{1F440} " : "", pr.title)));
}

// src/tui/utils/browser.ts
import { execFile } from "child_process";
function openInBrowser(url) {
  try {
    execFile("open", [url], () => {
    });
  } catch {
  }
}

// src/tui/utils/clipboard.ts
import { execSync } from "child_process";
function copyToClipboard(text) {
  try {
    execSync("pbcopy", { input: text, stdio: ["pipe", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

// src/tui/App.tsx
function App() {
  const { exit } = useApp();
  const [loading, setLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [jiraData, setJiraData] = useState(null);
  const [jiraUser, setJiraUser] = useState("");
  const [jiraError, setJiraError] = useState(null);
  const [githubData, setGithubData] = useState(null);
  const [githubError, setGithubError] = useState(null);
  const [activePanel, setActivePanel] = useState("jira");
  const [jiraIndex, setJiraIndex] = useState(0);
  const [githubIndex, setGithubIndex] = useState(0);
  const loadData = useCallback(async () => {
    setLoading(true);
    setToastMessage("Refreshing...");
    try {
      const [jiraCreds, ghAuth] = await Promise.all([
        resolveJiraCredentials(),
        resolveGitHubToken()
      ]);
      if (jiraCreds) {
        setJiraUser(jiraCreds.username);
        try {
          const issues = await fetchJiraOverview(jiraCreds);
          setJiraData(issues);
          setJiraError(null);
        } catch (err) {
          setJiraError(err.message);
        }
      } else {
        setJiraError("Jira credentials not found in env or MCP");
      }
      if (ghAuth) {
        try {
          const overview = await fetchGitHubOverview(ghAuth.token);
          setGithubData(overview);
          setGithubError(null);
        } catch (err) {
          setGithubError(err.message);
        }
      } else {
        setGithubError("GitHub token not found");
      }
      setLastRefreshedAt((/* @__PURE__ */ new Date()).toISOString());
      setToastMessage("");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5 * 60 * 1e3);
    return () => clearInterval(timer);
  }, [loadData]);
  const allJiraItems = useMemo(() => {
    if (!jiraData) return [];
    return [
      ...jiraData.inProgress,
      ...jiraData.toDo,
      ...jiraData.recentlyCompleted
    ];
  }, [jiraData]);
  const allGithubItems = useMemo(() => {
    if (!githubData) return [];
    return [
      ...githubData.reviewRequests.map((pr) => ({ pr, category: "review" })),
      ...githubData.myPullRequests.map((pr) => ({ pr, category: "authored" }))
    ];
  }, [githubData]);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };
  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
      return;
    }
    if (input === "r") {
      loadData();
      return;
    }
    if (key.tab || key.leftArrow || key.rightArrow) {
      setActivePanel((curr) => curr === "jira" ? "github" : "jira");
      return;
    }
    if (key.upArrow || input === "k") {
      if (activePanel === "jira") {
        setJiraIndex((curr) => Math.max(0, curr - 1));
      } else {
        setGithubIndex((curr) => Math.max(0, curr - 1));
      }
      return;
    }
    if (key.downArrow || input === "j") {
      if (activePanel === "jira") {
        setJiraIndex((curr) => Math.min(allJiraItems.length - 1, curr + 1));
      } else {
        setGithubIndex((curr) => Math.min(allGithubItems.length - 1, curr + 1));
      }
      return;
    }
    if (key.return) {
      if (activePanel === "jira" && allJiraItems[jiraIndex]) {
        openInBrowser(allJiraItems[jiraIndex].browseUrl);
        showToast(`Opened ${allJiraItems[jiraIndex].key} in browser`);
      } else if (activePanel === "github" && allGithubItems[githubIndex]) {
        openInBrowser(allGithubItems[githubIndex].pr.url);
        showToast(`Opened PR #${allGithubItems[githubIndex].pr.number} in browser`);
      }
      return;
    }
    if (input === "c") {
      if (activePanel === "jira" && allJiraItems[jiraIndex]) {
        copyToClipboard(allJiraItems[jiraIndex].key);
        showToast(`Copied ${allJiraItems[jiraIndex].key} to clipboard!`);
      } else if (activePanel === "github" && allGithubItems[githubIndex]) {
        copyToClipboard(allGithubItems[githubIndex].pr.url);
        showToast(`Copied PR #${allGithubItems[githubIndex].pr.number} URL!`);
      }
      return;
    }
  }, { isActive: Boolean(process.stdin.isTTY) });
  if (loading && !jiraData && !githubData) {
    return /* @__PURE__ */ React7.createElement(Box7, { padding: 2 }, /* @__PURE__ */ React7.createElement(Text7, { color: "cyan" }, /* @__PURE__ */ React7.createElement(Spinner, { type: "dots" }), " Loading Developer Dashboard tasks..."));
  }
  return /* @__PURE__ */ React7.createElement(Box7, { flexDirection: "column", padding: 1 }, /* @__PURE__ */ React7.createElement(
    Header,
    {
      jiraConnected: !jiraError,
      githubConnected: !githubError,
      jiraUser,
      lastRefreshedAt,
      toastMessage
    }
  ), /* @__PURE__ */ React7.createElement(
    NeedsAttention,
    {
      reviewRequests: githubData?.reviewRequests || [],
      inProgressJira: jiraData?.inProgress || []
    }
  ), /* @__PURE__ */ React7.createElement(Box7, { flexDirection: "row", gap: 1 }, /* @__PURE__ */ React7.createElement(
    Panel,
    {
      title: "Jira Issues",
      count: allJiraItems.length,
      isActive: activePanel === "jira"
    },
    jiraError ? /* @__PURE__ */ React7.createElement(Text7, { color: "red" }, "Error: ", jiraError) : allJiraItems.length === 0 ? /* @__PURE__ */ React7.createElement(Text7, { color: "gray" }, "No assigned Jira issues found.") : allJiraItems.slice(0, 15).map((issue, idx) => /* @__PURE__ */ React7.createElement(
      JiraItem,
      {
        key: issue.id,
        issue,
        isSelected: activePanel === "jira" && idx === jiraIndex
      }
    ))
  ), /* @__PURE__ */ React7.createElement(
    Panel,
    {
      title: "GitHub PRs & Reviews",
      count: allGithubItems.length,
      isActive: activePanel === "github"
    },
    githubError ? /* @__PURE__ */ React7.createElement(Text7, { color: "red" }, "Error: ", githubError) : allGithubItems.length === 0 ? /* @__PURE__ */ React7.createElement(Text7, { color: "gray" }, "No GitHub pull requests found.") : allGithubItems.slice(0, 15).map(({ pr, category }, idx) => /* @__PURE__ */ React7.createElement(
      GitHubItem,
      {
        key: pr.id,
        pr,
        category,
        isSelected: activePanel === "github" && idx === githubIndex
      }
    ))
  )), /* @__PURE__ */ React7.createElement(Footer, null));
}

// src/tui/index.tsx
render(React8.createElement(App));
