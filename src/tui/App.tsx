import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { resolveJiraCredentials } from '../lib/auth/jira-auth';
import { resolveGitHubToken } from '../lib/auth/github-auth';
import { fetchJiraOverview } from '../lib/jira/client';
import { fetchGitHubOverview } from '../lib/github/client';
import { JiraCategorizedIssues, JiraIssue } from '../types/jira';
import { GitHubOverview, GitHubPullRequest } from '../types/github';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NeedsAttention } from './components/NeedsAttention';
import { Panel } from './components/Panel';
import { JiraItem } from './components/JiraItem';
import { GitHubItem } from './components/GitHubItem';
import { openInBrowser } from './utils/browser';
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

  const [activePanel, setActivePanel] = useState<'jira' | 'github'>('jira');
  const [jiraIndex, setJiraIndex] = useState(0);
  const [githubIndex, setGithubIndex] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setToastMessage('Refreshing...');

    try {
      const [jiraCreds, ghAuth] = await Promise.all([
        resolveJiraCredentials(),
        resolveGitHubToken(),
      ]);

      if (jiraCreds) {
        setJiraUser(jiraCreds.username);
        try {
          const issues = await fetchJiraOverview(jiraCreds);
          setJiraData(issues);
          setJiraError(null);
        } catch (err: any) {
          setJiraError(err.message);
        }
      } else {
        setJiraError('Jira credentials not found in env or MCP');
      }

      if (ghAuth) {
        try {
          const overview = await fetchGitHubOverview(ghAuth.token);
          setGithubData(overview);
          setGithubError(null);
        } catch (err: any) {
          setGithubError(err.message);
        }
      } else {
        setGithubError('GitHub token not found');
      }

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

    if (key.tab || key.leftArrow || key.rightArrow) {
      setActivePanel((curr) => (curr === 'jira' ? 'github' : 'jira'));
      return;
    }

    if (key.upArrow || input === 'k') {
      if (activePanel === 'jira') {
        setJiraIndex((curr) => Math.max(0, curr - 1));
      } else {
        setGithubIndex((curr) => Math.max(0, curr - 1));
      }
      return;
    }

    if (key.downArrow || input === 'j') {
      if (activePanel === 'jira') {
        setJiraIndex((curr) => Math.min(allJiraItems.length - 1, curr + 1));
      } else {
        setGithubIndex((curr) => Math.min(allGithubItems.length - 1, curr + 1));
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
      }
      return;
    }
  }, { isActive: Boolean(process.stdin.isTTY) });

  if (loading && !jiraData && !githubData) {
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
      </Box>

      <Footer />
    </Box>
  );
}
