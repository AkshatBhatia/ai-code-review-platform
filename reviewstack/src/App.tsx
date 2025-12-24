/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import AppHeader from './AppHeader';
import CenteredSpinner from './CenteredSpinner';
import CommitView from './CommitView';
import {ErrorBoundary} from './ErrorBoundary';
import GitHubProjectPage from './GitHubProjectPage';
import {ShortcutCommandContext} from './KeyboardShortcuts';
import LoginDialog from './LoginDialog';
import PrimerStyles from './PrimerStyles';
import PullRequestLayout from './PullRequestLayout';
import PullsView from './PullsView';
import SplitDiffViewPrimerStyles from './SplitDiffViewPrimerStyles';
import UserHomePage from './UserHomePage';
import RoleSelectionDialog from './RoleSelectionDialog';
import InterviewerDashboard from './InterviewerDashboard';
import CandidateInterface from './CandidateInterface';
import {gitHubTokenPersistence} from './github/gitHubCredentials';
import {interviewUserRole, isInterviewUserAuthenticated} from './interviewState';
import {primerColorMode} from './themeState';
import {BaseStyles, Box, Text, useTheme} from '@primer/react';
import React, {useEffect} from 'react';
import {useRecoilValue, useRecoilValueLoadable} from 'recoil';

type Page =
  | {type: 'home'}
  | {
      type: 'project';
      org: string;
      repo: string;
    }
  | {
      type: 'pulls';
      org: string;
      repo: string;
    }
  | {
      type: 'pr';
      org: string;
      repo: string;
      number: number;
    }
  | {
      type: 'commit';
      org: string;
      repo: string;
      oid: string;
    };

/**
 * <App> assumes that <RecoilRoot> from recoil and <ThemeProvider> from
 * @primer/react are ancestor components in the hierarchy.
 */
export default function App({page}: {page: Page}): React.ReactElement {
  return (
    <div>
      <ShortcutCommandContext>
        <ThemeListener />
        <BaseStyles>
          <PrimerStyles />
          <SplitDiffViewPrimerStyles />
          <Box bg="canvas.default" fontFamily="normal" className="reviewstack">
            <ContentOrLoginDialog page={page} />
          </Box>
        </BaseStyles>
      </ShortcutCommandContext>
    </div>
  );
}

function ContentOrLoginDialog({page}: {page: Page}): React.ReactElement {
  const tokenLoadable = useRecoilValueLoadable(gitHubTokenPersistence);
  const userRole = useRecoilValue(interviewUserRole);
  const isAuthenticated = useRecoilValue(isInterviewUserAuthenticated);
  const orgAndRepo = page.type !== 'home' ? {org: page.org, repo: page.repo} : null;
  
  switch (tokenLoadable.state) {
    case 'hasValue': {
      const {contents: token} = tokenLoadable;
      
      // No GitHub token -> show login
      if (token == null) {
        return <LoginDialog />;
      }
      
      // Has GitHub token but no role -> show role selection
      if (userRole == null) {
        return <RoleSelectionDialog />;
      }
      
      // Fully authenticated -> show appropriate interface based on role
      if (isAuthenticated) {
        return (
          <ErrorBoundary>
            <InterviewContent userRole={userRole} page={page} orgAndRepo={orgAndRepo} />
          </ErrorBoundary>
        );
      }
      
      // Fallback to login if something went wrong
      return <LoginDialog />;
    }
    case 'loading': {
      return (
        <Box>
          <CenteredSpinner message="Please wait...deleting local data..." />
        </Box>
      );
    }
    case 'hasError': {
      return (
        <Text>
          Failed to delete data. Please close all other instances of ReviewStack, refresh this page,
          and press Logout again.
        </Text>
      );
    }
  }
}

/**
 * ThemeListener is a component that exists to listen to changes to the user's
 * theme preference (which is defined as a Recoil atom) and updates
 * <ThemeProvider> accordingly, so it must be a descendant of both <RecoilRoot>
 * and <ThemeProvider>. Also, because of its use of hooks, it must be defined
 * as a functional React component.
 *
 * It is included high in the component hierarchy of <App> to reduce the
 * chance of it being considered for re-rendering (which is also why it is
 * wrapped in React.memo()).
 */
// eslint-disable-next-line prefer-arrow-callback
const ThemeListener = React.memo(function ThemeListener(): React.ReactElement {
  const colorMode = useRecoilValue(primerColorMode);
  const {setColorMode} = useTheme();
  useEffect(() => {
    setColorMode(colorMode);
  }, [colorMode, setColorMode]);
  return <></>;
});

/**
 * Routes content based on user role and page type
 */
function InterviewContent({
  userRole,
  page,
  orgAndRepo
}: {
  userRole: 'interviewer' | 'candidate';
  page: Page;
  orgAndRepo: {org: string; repo: string} | null;
}): React.ReactElement {
  // For interviewers, show dashboard by default, but allow access to ReviewStack
  if (userRole === 'interviewer') {
    // If accessing specific GitHub content, show original ReviewStack interface
    if (page.type !== 'home') {
      return (
        <>
          <AppHeader orgAndRepo={orgAndRepo} />
          <AppContent page={page} />
        </>
      );
    }
    // Otherwise show interviewer dashboard
    return <InterviewerDashboard />;
  }
  
  // For candidates, show candidate interface by default
  if (userRole === 'candidate') {
    // If in an active interview session accessing specific GitHub content, show ReviewStack
    if (page.type !== 'home') {
      return (
        <>
          <AppHeader orgAndRepo={orgAndRepo} />
          <AppContent page={page} />
        </>
      );
    }
    // Otherwise show candidate interface
    return <CandidateInterface />;
  }
  
  // Fallback
  return <InterviewerDashboard />;
}

const AppContent = React.memo(({page}: {page: Page}): React.ReactElement => {
  switch (page.type) {
    case 'home':
      return <UserHomePage />;
    case 'project':
      return <GitHubProjectPage {...page} />;
    case 'pulls':
      return <PullsView {...page} />;
    case 'pr':
      return <PullRequestLayout {...page} />;
    case 'commit':
      return <CommitView {...page} />;
  }
});
