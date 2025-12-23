/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Box, Text} from '@primer/react';
import React, {useEffect} from 'react';
import AppHeader from 'reviewstack/src/AppHeader';

/**
 * GitHubOAuthCallback - Handles the OAuth callback and redirects to home with token
 */
export default function GitHubOAuthCallback(): React.ReactElement {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('GitHub OAuth error:', error);
      // Redirect to home with error
      window.location.href = `/?error=${encodeURIComponent(error)}`;
      return;
    }
    
    if (code) {
      console.log('Processing OAuth callback with code...');
      handleOAuthCallback(code);
    } else {
      // No code, redirect to home
      window.location.href = '/';
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('/.netlify/functions/github-oauth', {
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
        
        // Store token in localStorage
        localStorage.setItem('github_token', tokenData.access_token);
        localStorage.setItem('github_hostname', 'github.com');
        
        // Redirect to home page
        window.location.href = '/';
      } else {
        throw new Error('No access token in response');
      }
      
    } catch (err) {
      console.error('OAuth callback error:', err);
      const message = err instanceof Error ? err.message : 'Authentication failed';
      // Redirect to home with error
      window.location.href = `/?error=${encodeURIComponent(message)}`;
    }
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box flex="0 0 auto">
        <AppHeader orgAndRepo={null} />
      </Box>
      <Box flex="1 1 auto" display="flex" alignItems="center" justifyContent="center">
        <Box textAlign="center">
          <Text fontSize={2} mb={2}>Processing GitHub authentication...</Text>
          <Text color="fg.muted">Please wait while we complete your login.</Text>
        </Box>
      </Box>
    </Box>
  );
}