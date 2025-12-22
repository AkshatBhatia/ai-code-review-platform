/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {CustomLoginDialogProps} from 'reviewstack/src/LoginDialog';

import Footer from './Footer';
import {Box, Button, Heading, Text} from '@primer/react';
import {Auth0Provider, useAuth0} from '@auth0/auth0-react';
import React, {useEffect} from 'react';
import AppHeader from 'reviewstack/src/AppHeader';
import Link from 'reviewstack/src/Link';

/**
 * Auth0LoginDialog - Modern replacement for deprecated NetlifyLoginDialog
 * Uses Auth0 for authentication instead of deprecated Netlify Identity
 */
export default function Auth0LoginDialog(props: CustomLoginDialogProps): React.ReactElement {
  const domain = process.env.REACT_APP_AUTH0_DOMAIN || process.env.AUTH0_DOMAIN;
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
  
  // Debug: log available env vars (remove in production)
  console.log('Auth0 Env Vars:', {
    domain,
    clientId,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('AUTH0'))
  });
  
  if (!domain || !clientId) {
    const message = `Auth0 configuration missing. Available AUTH0 env vars: ${Object.keys(process.env).filter(key => key.includes('AUTH0')).join(', ') || 'none'}`;
    return <ErrorMessage message={message} {...props} />;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirectUri: window.location.origin,
        scope: 'openid profile email'
      }}
    >
      <Auth0LoginDialogContent {...props} />
    </Auth0Provider>
  );
}

function Auth0LoginDialogContent(props: CustomLoginDialogProps): React.ReactElement {
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
            <EndUserInstructions {...props} />
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

function EndUserInstructions(props: CustomLoginDialogProps): React.ReactElement {
  const {setTokenAndHostname} = props;
  const {loginWithPopup, getAccessTokenSilently, isAuthenticated, isLoading, error, user} = useAuth0();
  const [isButtonDisabled, setButtonDisabled] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const onClick = async () => {
    setButtonDisabled(true);
    setErrorMessage(null);
    
    try {
      await loginWithPopup({
        authorizationParams: {
          connection: 'github'
        }
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Auth0 login failed';
      setErrorMessage(message);
      setButtonDisabled(false);
    }
  };

  // Extract GitHub token when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      extractGitHubToken();
    }
  }, [isAuthenticated, user]);

  const extractGitHubToken = async () => {
    try {
      // Debug: log user object to console
      console.log('Auth0 User Object:', user);
      console.log('User identities:', user?.identities);
      
      // Try to get GitHub token from user identities
      const githubIdentity = user?.identities?.find((identity: any) => identity.provider === 'github');
      console.log('GitHub identity:', githubIdentity);
      
      const githubToken = githubIdentity?.access_token;
      
      if (githubToken) {
        // Success! We got the GitHub token
        console.log('Found GitHub token from identity');
        setTokenAndHostname(githubToken, 'github.com');
        return;
      }
      
      // Try to get access token without specific audience first
      try {
        const token = await getAccessTokenSilently();
        console.log('Got general access token:', token ? 'yes' : 'no');
        
        if (token) {
          // This is likely an Auth0 token, not a GitHub token, but let's see what we get
          console.log('General token (first 20 chars):', token.substring(0, 20));
        }
      } catch (generalError) {
        console.log('Failed to get general token:', generalError);
      }

      // Try to get access token with GitHub audience (after creating API in Auth0)
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://api.github.com',
            scope: 'user:email repo'
          }
        });
        console.log('Got token with GitHub audience:', token ? 'yes' : 'no');
        
        if (token) {
          setTokenAndHostname(token, 'github.com');
          return;
        }
      } catch (audienceError) {
        console.log('Failed to get token with GitHub audience:', audienceError);
      }
      
      // If no token found, show manual entry message
      setErrorMessage('GitHub token not found in Auth0 response. Check browser console for details. Please use manual token entry below.');
      
    } catch (e) {
      console.error('Error extracting GitHub token:', e);
      const message = e instanceof Error ? e.message : 'Failed to extract GitHub token from Auth0';
      setErrorMessage(`${message}. Please use manual token entry below.`);
    }
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
        <Text as="p">
          ReviewStack is powered by Auth0 for secure authentication. You'll need to authorize
          ReviewStack to access your GitHub data through Auth0's secure authentication flow.
          Your authentication data is managed by Auth0 and your GitHub access is handled securely.
        </Text>
      </Box>
      
      {error && (
        <Box pb={2}>
          <Text color="danger.fg">Auth0 Error: {error.message}</Text>
        </Box>
      )}
      
      {errorMessage && (
        <Box pb={2}>
          <Text color="danger.fg">{errorMessage}</Text>
        </Box>
      )}

      {isLoading && (
        <Box pb={2}>
          <Text>Loading authentication...</Text>
        </Box>
      )}

      {!isAuthenticated && (
        <>
          <H3>GitHub Authentication via Auth0</H3>
          <Box pb={4}>
            To view code hosted on GitHub using ReviewStack, authenticate with your GitHub account
            through Auth0's secure authentication service:
          </Box>
          <Box pb={4}>
            <Button onClick={onClick} disabled={isButtonDisabled || isLoading}>
              {isLoading ? 'Authenticating...' : 'Login with GitHub via Auth0'}
            </Button>
          </Box>
        </>
      )}

      <H3>Alternative: Manual Token Entry</H3>
      <Box pb={4}>
        If you prefer to use a Personal Access Token instead of Auth0 authentication, you can create a{' '}
        <Link href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token">
          GitHub Personal Access Token
        </Link>{' '}
        and use the manual entry option below.
      </Box>
      
      <ManualTokenForm {...props} />
    </Box>
  );
}

function ManualTokenForm({setTokenAndHostname}: CustomLoginDialogProps): React.ReactElement {
  const [hostname, setHostname] = React.useState('github.com');
  const [token, setToken] = React.useState('');

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