import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { resolveJiraCredentials } from '../lib/auth/jira-auth';
import { resolveGitHubToken } from '../lib/auth/github-auth';
import { fetchJiraOverview } from '../lib/jira/client';
import { fetchGitHubOverview } from '../lib/github/client';
import { fetchLocalReposOverview } from '../lib/git/status';
import { JiraCategorizedIssues, JiraIssue } from '../types/jira';
import { GitHubOverview, GitHubPullRequest } from '../types/github';
import { GitOverview, LocalRepoStatus } from '../types/git';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NeedsAttention } from './components/NeedsAttention';
import { Panel } from './components/Panel';
import { JiraItem } from './components/JiraItem';
import { GitHubItem } from './components/GitHubItem';
import { GitItem } from './components/GitItem';
import { openInBrowser, openInEditor } from './utils/browser';
import { copyToClipboard } from './utils/clipboard';

export function App() {
  const { exit } = useApp();
  const [loading, setLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const [jiraData, setJiraData] = useState<JiraCategorizedIssues | null>(null);
  const [jiraUser, setJiraUser] = useState<string>('');
  const [jiraError, setJiraError] = useState<string | null>(null);

  const [githubData, setGithubData] = useState<GitHubOverview | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [gitData, setGitData] = useState<GitOverview | null>(null);
  const [gitError, setGitError] = useState<string | null>(null);

  const [activePanel, setActivePanel] = useState<'jira' | 'github' | 'git'>('jira');
  const [jiraIndex, setJiraIndex] = useState(0);
  const [githubIndex, setGithubIndex] = useState(0);
  const [gitIndex, setGitIndex] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setToastMessage('Refreshing...');

    try {
      const [jiraCreds, ghAuth] = await Promise.all([
        resolveJiraCredentials(),
        resolveGitHubToken(),
      ]);

      const tasks: Promise<void>[] = [];

      if (jiraCreds) {
        setJiraUser(jiraCreds.username);
        tasks.push(
          fetchJiraOverview(jiraCreds)
            .then((issues) => {
              setJiraData(issues);
              setJiraError(null);
            })
            .catch((err: any) => {
              setJiraError(err.message);
            })
        );
      } else {
        setJiraError('Jira credentials not found in env or MCP');
      }

      if (ghAuth) {
        tasks.push(
          fetchGitHubOverview(ghAuth.token)
            .then((overview) => {
              setGithubData(overview);
              setGithubError(null);
            })
            .catch((err: any) => {
              setGithubError(err.message);
            })
        );
      } else {
        setGithubError('GitHub token not found');
      }

      tasks.push(
        fetchLocalReposOverview()
          .then((overview) => {
            setGitData(overview);
            setGitError(overview.error || null);
          })
          .catch((err: any) => {
            setGitError(err.message);
          })
      );

      await Promise.allSettled(tasks);
      setLastRefreshedAt(new Date().toISOString());
      setToastMessage('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Combined Jira items list
  const allJiraItems: JiraIssue[] = useMemo(() => {
    if (!jiraData) return [];
    return [
      ...jiraData.inProgress,
      ...jiraData.toDo,
      ...jiraData.recentlyCompleted,
    ];
  }, [jiraData]);

  // Combined GitHub items list
  const allGithubItems: { pr: GitHubPullRequest; category: 'review' | 'authored' }[] = useMemo(() => {
    if (!githubData) return [];
    return [
      ...githubData.reviewRequests.map((pr) => ({ pr, category: 'review' as const })),
      ...githubData.myPullRequests.map((pr) => ({ pr, category: 'authored' as const })),
    ];
  }, [githubData]);

  // Local Git repositories list
  const allGitItems: LocalRepoStatus[] = useMemo(() => {
    if (!gitData) return [];
    return gitData.repositories;
  }, [gitData]);

  const dirtyRepos = useMemo(() => {
    return allGitItems.filter((r) => !r.isClean || r.ahead > 0 || r.behind > 0);
  }, [allGitItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    if (input === 'r') {
      loadData();
      return;
    }

    if (key.tab || key.rightArrow) {
      setActivePanel((curr) => {
        if (curr === 'jira') return 'github';
        if (curr === 'github') return 'git';
        return 'jira';
      });
      return;
    }

    if (key.leftArrow) {
      setActivePanel((curr) => {
        if (curr === 'git') return 'github';
        if (curr === 'github') return 'jira';
        return 'git';
      });
      return;
    }

    if (key.upArrow || input === 'k') {
      if (activePanel === 'jira') {
        setJiraIndex((curr) => Math.max(0, curr - 1));
      } else if (activePanel === 'github') {
        setGithubIndex((curr) => Math.max(0, curr - 1));
      } else {
        setGitIndex((curr) => Math.max(0, curr - 1));
      }
      return;
    }

    if (key.downArrow || input === 'j') {
      if (activePanel === 'jira') {
        setJiraIndex((curr) => Math.min(allJiraItems.length - 1, curr + 1));
      } else if (activePanel === 'github') {
        setGithubIndex((curr) => Math.min(allGithubItems.length - 1, curr + 1));
      } else {
        setGitIndex((curr) => Math.min(allGitItems.length - 1, curr + 1));
      }
      return;
    }

    if (key.return) {
      if (activePanel === 'jira' && allJiraItems[jiraIndex]) {
        openInBrowser(allJiraItems[jiraIndex].browseUrl);
        showToast(`Opened ${allJiraItems[jiraIndex].key} in browser`);
      } else if (activePanel === 'github' && allGithubItems[githubIndex]) {
        openInBrowser(allGithubItems[githubIndex].pr.url);
        showToast(`Opened PR #${allGithubItems[githubIndex].pr.number} in browser`);
      } else if (activePanel === 'git' && allGitItems[gitIndex]) {
        openInEditor(allGitItems[gitIndex].path);
        showToast(`Opened ${allGitItems[gitIndex].name} in $EDITOR`);
      }
      return;
    }

    if (input === 'c') {
      if (activePanel === 'jira' && allJiraItems[jiraIndex]) {
        copyToClipboard(allJiraItems[jiraIndex].key);
        showToast(`Copied ${allJiraItems[jiraIndex].key} to clipboard!`);
      } else if (activePanel === 'github' && allGithubItems[githubIndex]) {
        copyToClipboard(allGithubItems[githubIndex].pr.url);
        showToast(`Copied PR #${allGithubItems[githubIndex].pr.number} URL!`);
      } else if (activePanel === 'git' && allGitItems[gitIndex]) {
        copyToClipboard(allGitItems[gitIndex].path);
        showToast(`Copied ${allGitItems[gitIndex].path} to clipboard!`);
      }
      return;
    }
  }, { isActive: Boolean(process.stdin.isTTY) });

  if (loading && !jiraData && !githubData && !gitData) {
    return (
      <Box padding={2}>
        <Text color="cyan">
          <Spinner type="dots" /> Loading Developer Dashboard tasks...
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        jiraConnected={!jiraError}
        githubConnected={!githubError}
        jiraUser={jiraUser}
        lastRefreshedAt={lastRefreshedAt}
        toastMessage={toastMessage}
      />

      <NeedsAttention
        reviewRequests={githubData?.reviewRequests || []}
        inProgressJira={jiraData?.inProgress || []}
        dirtyRepos={dirtyRepos}
      />

      <Box flexDirection="row" gap={1}>
        {/* Jira Column */}
        <Panel
          title="Jira Issues"
          count={allJiraItems.length}
          isActive={activePanel === 'jira'}
        >
          {jiraError ? (
            <Text color="red">Error: {jiraError}</Text>
          ) : allJiraItems.length === 0 ? (
            <Text color="gray">No assigned Jira issues found.</Text>
          ) : (
            allJiraItems.slice(0, 15).map((issue, idx) => (
              <JiraItem
                key={issue.id}
                issue={issue}
                isSelected={activePanel === 'jira' && idx === jiraIndex}
              />
            ))
          )}
        </Panel>

        {/* GitHub Column */}
        <Panel
          title="GitHub PRs & Reviews"
          count={allGithubItems.length}
          isActive={activePanel === 'github'}
        >
          {githubError ? (
            <Text color="red">Error: {githubError}</Text>
          ) : allGithubItems.length === 0 ? (
            <Text color="gray">No GitHub pull requests found.</Text>
          ) : (
            allGithubItems.slice(0, 15).map(({ pr, category }, idx) => (
              <GitHubItem
                key={pr.id}
                pr={pr}
                category={category}
                isSelected={activePanel === 'github' && idx === githubIndex}
              />
            ))
          )}
        </Panel>

        {/* Local Git Repos Column */}
        <Panel
          title="Local Repos ($REPO_DIR)"
          count={allGitItems.length}
          isActive={activePanel === 'git'}
        >
          {gitError ? (
            <Text color="red">Error: {gitError}</Text>
          ) : !gitData?.configuredRepoDir && allGitItems.length === 0 ? (
            <Text color="gray">$REPO_DIR not set (e.g. export REPO_DIR=~/projects)</Text>
          ) : allGitItems.length === 0 ? (
            <Text color="gray">No git repositories found under {gitData?.configuredRepoDir}</Text>
          ) : (
            allGitItems.slice(0, 15).map((repo, idx) => (
              <GitItem
                key={repo.path}
                repo={repo}
                isSelected={activePanel === 'git' && idx === gitIndex}
              />
            ))
          )}
        </Panel>
      </Box>

      <Footer />
    </Box>
  );
}
