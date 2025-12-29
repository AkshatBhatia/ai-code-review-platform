/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GitHubOAuthCallback from '../GitHubOAuthCallback';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock ReviewStack components
jest.mock('reviewstack/src/AppHeader', () => {
  return function MockAppHeader() {
    return <div data-testid="app-header">App Header</div>;
  };
});

describe('GitHubOAuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        search: '',
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render loading state', () => {
    render(<GitHubOAuthCallback />);
    
    expect(screen.getByText('Processing GitHub authentication...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we complete your login.')).toBeInTheDocument();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  describe('OAuth Success Flow', () => {
    it('should handle successful OAuth callback', async () => {
      window.location.search = '?code=test_authorization_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'gho_test_access_token' }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/.netlify/functions/github-oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'test_authorization_code' }),
        });
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('github.token', 'gho_test_access_token');
        expect(localStorage.setItem).toHaveBeenCalledWith('github.hostname', 'github.com');
      });

      await waitFor(() => {
        expect(window.location.href).toBe('/');
      });
    });

    it('should log successful token retrieval', async () => {
      window.location.search = '?code=test_code';
      const consoleSpy = jest.spyOn(console, 'log');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'gho_test_token' }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Processing OAuth callback with code...');
        expect(consoleSpy).toHaveBeenCalledWith('Exchanging authorization code for access token...');
        expect(consoleSpy).toHaveBeenCalledWith('✅ Successfully got GitHub access token');
      });
    });
  });

  describe('OAuth Error Handling', () => {
    it('should handle OAuth error from GitHub', async () => {
      window.location.search = '?error=access_denied';

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toBe('/?error=access_denied');
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle OAuth error with error description', async () => {
      window.location.search = '?error=access_denied&error_description=User%20denied%20access';

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toBe('/?error=access_denied');
      });
    });

    it('should handle missing authorization code', async () => {
      window.location.search = '';

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toBe('/');
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle token exchange failure', async () => {
      window.location.search = '?code=invalid_code';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toMatch(/\?error=/);
        expect(decodeURIComponent(window.location.href)).toContain('Token exchange failed: 400');
      });

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle missing access token in response', async () => {
      window.location.search = '?code=test_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 'invalid_request' }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toMatch(/\?error=/);
        expect(decodeURIComponent(window.location.href)).toContain('No access token in response');
      });

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      window.location.search = '?code=test_code';

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toMatch(/\?error=/);
        expect(decodeURIComponent(window.location.href)).toContain('Network error');
      });

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle JSON parsing errors', async () => {
      window.location.search = '?code=test_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toMatch(/\?error=/);
        expect(decodeURIComponent(window.location.href)).toContain('Invalid JSON');
      });

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log OAuth errors', async () => {
      window.location.search = '?error=access_denied';
      const consoleErrorSpy = jest.spyOn(console, 'error');

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub OAuth error:', 'access_denied');
      });
    });

    it('should log callback processing errors', async () => {
      window.location.search = '?code=test_code';
      const consoleErrorSpy = jest.spyOn(console, 'error');

      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('OAuth callback error:', expect.any(Error));
      });
    });
  });

  describe('localStorage Integration', () => {
    it('should store token and hostname with correct keys', async () => {
      window.location.search = '?code=test_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'gho_12345678' }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('github.token', 'gho_12345678');
        expect(localStorage.setItem).toHaveBeenCalledWith('github.hostname', 'github.com');
      });
    });

    it('should use ReviewStack expected localStorage keys', async () => {
      window.location.search = '?code=test_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'gho_token_123' }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        // Verify exact localStorage keys that ReviewStack expects
        expect(localStorage.setItem).toHaveBeenCalledWith('github.token', 'gho_token_123');
        expect(localStorage.setItem).toHaveBeenCalledWith('github.hostname', 'github.com');
        expect(localStorage.setItem).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('URL Handling', () => {
    it('should handle URL with multiple query parameters', async () => {
      window.location.search = '?code=test_code&state=random_state&other_param=value';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'gho_test_token' }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/.netlify/functions/github-oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'test_code' }),
        });
      });
    });

    it('should handle encoded URL parameters', async () => {
      window.location.search = '?code=test%20code%20with%20spaces';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'gho_test_token' }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/.netlify/functions/github-oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'test code with spaces' }),
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty access token string', async () => {
      window.location.search = '?code=test_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: '' }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toMatch(/\?error=/);
        expect(decodeURIComponent(window.location.href)).toContain('No access token in response');
      });

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle null access token', async () => {
      window.location.search = '?code=test_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: null }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(window.location.href).toMatch(/\?error=/);
      });
    });

    it('should handle response with other token types', async () => {
      window.location.search = '?code=test_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          access_token: 'gho_valid_token',
          token_type: 'bearer',
          scope: 'user:email repo'
        }),
      } as Response);

      render(<GitHubOAuthCallback />);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('github.token', 'gho_valid_token');
      });
    });
  });
});