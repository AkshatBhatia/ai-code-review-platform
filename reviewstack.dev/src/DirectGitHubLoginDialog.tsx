/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {CustomLoginDialogProps} from 'reviewstack/src/LoginDialog';

import Footer from './Footer';
import {Box, Button, Heading, Text} from '@primer/react';
import React, {useEffect, useState} from 'react';
import AppHeader from 'reviewstack/src/AppHeader';
import Link from 'reviewstack/src/Link';

/**
 * DirectGitHubLoginDialog - Simple GitHub OAuth without Auth0
 * Handles GitHub OAuth flow directly for cleaner integration
 */
export default function DirectGitHubLoginDialog(props: CustomLoginDialogProps): React.ReactElement {
  const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return <ErrorMessage message="GitHub OAuth not configured. Missing REACT_APP_GITHUB_CLIENT_ID environment variable." {...props} />;
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box flex="0 0 auto">
        <AppHeader orgAndRepo={null} />
      </Box>
      <Box flex="1 1 auto" overflowY="auto">
        <Box
          display="flex"
          flexDirection={["column", "row"]}
          justifyContent="space-between"
          paddingX={3}
          paddingY={2}>
          <Box minWidth={300} maxWidth={800}>
            <GitHubOAuthFlow {...props} clientId={clientId} />
          </Box>
          <Box>
            <img src="/reviewstack-demo.gif" width={800} />
            <Box textAlign="center" width={800}>
              <Text fontStyle="italic" fontSize={1}>
                ReviewStack makes it possible to view code and the timeline side-by-side
                <br />
                in addition to facilitating navigation up and down the stack.
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}

function GitHubOAuthFlow({setTokenAndHostname, clientId}: CustomLoginDialogProps & {clientId: string}): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      setError(`GitHub OAuth error: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (code) {
      console.log('Found OAuth code in URL, exchanging for token...');
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('/api/github-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        console.log('✅ Successfully got GitHub access token');
        // Clean up URL before setting token
        window.history.replaceState({}, document.title, window.location.pathname);
        setTokenAndHostname(tokenData.access_token, 'github.com');
      } else {
        throw new Error('No access token in response');
      }
      
    } catch (err) {
      console.error('OAuth callback error:', err);
      const message = err instanceof Error ? err.message : 'Failed to exchange code for token';
      setError(`Authentication failed: ${message}`);
      // Clean up URL on error
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setIsLoading(false);
    }
  };

  const startGitHubOAuth = () => {
    const scope = 'user:email repo';
    const redirectUri = `${window.location.origin}/auth/callback`;
    const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection
    
    // Store state in sessionStorage for verification (optional)
    sessionStorage.setItem('github_oauth_state', state);
    
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    
    console.log('Redirecting to GitHub OAuth:', authUrl.toString());
    window.location.href = authUrl.toString();
  };

  return (
    <Box>
      <Heading>Welcome to ReviewStack</Heading>
      <Box>
        <Text as="p" pb={2}>
          <Link href="https://sapling-scm.com/docs/addons/reviewstack">ReviewStack</Link> is a novel
          user interface for GitHub pull requests with custom support for{' '}
          <Text fontStyle="italic">stacked changes</Text>. For tools like{' '}
          <Link href="http://sapling-scm.com/">Sapling</Link> or{' '}
          <Link href="https://github.com/ezyang/ghstack">ghstack</Link> that create separate pull
          requests for independent commits in a stack, ReviewStack facilitates navigating the stack
          and ensuring that only the code that was meant to be considered for review is displayed
          for each pull request.
        </Text>
        <Text as="p" pb={2}>
          ReviewStack uses GitHub's official OAuth for secure authentication. You'll be redirected
          to GitHub to authorize ReviewStack, then returned here with full access to your repositories.
        </Text>
      </Box>
      
      {error && (
        <Box pb={2}>
          <Text color="danger.fg">{error}</Text>
        </Box>
      )}

      {isLoading && (
        <Box pb={2}>
          <Text>Processing GitHub authentication...</Text>
        </Box>
      )}

      {!isLoading && (
        <>
          <H3>GitHub OAuth Login</H3>
          <Box pb={4}>
            Securely authenticate with GitHub to access your repositories and review pull requests:
          </Box>
          <Box pb={4}>
            <Button onClick={startGitHubOAuth} size="large">
              Login with GitHub
            </Button>
          </Box>
        </>
      )}

      <H3>Alternative: Manual Token Entry</H3>
      <Box pb={4}>
        If you prefer to use a Personal Access Token, you can create one manually:
      </Box>
      
      <ManualTokenForm setTokenAndHostname={setTokenAndHostname} />
    </Box>
  );
}

function ManualTokenForm({setTokenAndHostname}: CustomLoginDialogProps): React.ReactElement {
  const [hostname, setHostname] = useState('github.com');
  const [token, setToken] = useState('');

  const onChangeHostname = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setHostname(e.target.value),
    [],
  );
  const onChangeToken = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value),
    [],
  );
  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTokenAndHostname(token.trim(), hostname.trim());
      return false;
    },
    [token, hostname, setTokenAndHostname],
  );

  const isInputValid = token.trim() !== '' && hostname.trim() !== '' && hostname.includes('.');

  return (
    <Box>
      <form onSubmit={onSubmit}>
        <Box pb={2}>
          GitHub Hostname: <br />
          <Text
            as="input"
            value={hostname}
            onChange={onChangeHostname}
            sx={{width: '400px', padding: 1}}
            placeholder="github.com"
          />
        </Box>
        <Box pb={2}>
          Personal Access Token: <br />
          <Text
            as="input"
            value={token}
            onChange={onChangeToken}
            type="password"
            sx={{width: '400px', padding: 1}}
            placeholder="github_pat_abcdefg123456789"
          />
        </Box>
        <Box paddingY={2}>
          <Button disabled={!isInputValid} type="submit">
            Use Manual Token
          </Button>
        </Box>
      </form>
    </Box>
  );
}

function H3({children}: {children: React.ReactNode}): React.ReactElement {
  return (
    <Heading as="h3" sx={{fontSize: 3, mb: 2}}>
      {children}
    </Heading>
  );
}

function ErrorMessage({message, setTokenAndHostname}: {message: string} & CustomLoginDialogProps): React.ReactElement {
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box flex="0 0 auto">
        <AppHeader orgAndRepo={null} />
      </Box>
      <Box flex="1 1 auto" padding={3}>
        <Heading>Configuration Error</Heading>
        <Text color="danger.fg">{message}</Text>
        <Box mt={3}>
          <Text>Please use manual token entry instead:</Text>
          <ManualTokenForm setTokenAndHostname={setTokenAndHostname} />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}