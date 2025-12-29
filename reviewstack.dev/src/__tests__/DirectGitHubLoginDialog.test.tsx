/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DirectGitHubLoginDialog from '../DirectGitHubLoginDialog';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock ReviewStack components
jest.mock('reviewstack/src/AppHeader', () => {
  return function MockAppHeader() {
    return <div data-testid="app-header">App Header</div>;
  };
});

jest.mock('reviewstack/src/Link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href} data-testid="link">{children}</a>;
  };
});

jest.mock('../Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

describe('DirectGitHubLoginDialog', () => {
  const mockSetTokenAndHostname = jest.fn();
  const defaultProps = {
    setTokenAndHostname: mockSetTokenAndHostname,
  };

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
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
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
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
      },
      writable: true,
    });
    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Environment Variable Configuration', () => {
    beforeEach(() => {
      delete process.env.REACT_APP_GITHUB_CLIENT_ID;
    });

    it('should render error message when GitHub client ID is missing', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Configuration Error')).toBeInTheDocument();
      expect(screen.getByText(/GitHub OAuth not configured/)).toBeInTheDocument();
      expect(screen.getByText(/Missing REACT_APP_GITHUB_CLIENT_ID environment variable/)).toBeInTheDocument();
    });

    it('should render normally when GitHub client ID is present', () => {
      process.env.REACT_APP_GITHUB_CLIENT_ID = 'test-client-id';
      
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument();
      expect(screen.getByText('Welcome to ReviewStack')).toBeInTheDocument();
      expect(screen.getByText('Login with GitHub')).toBeInTheDocument();
    });
  });

  describe('GitHub OAuth Initiation', () => {
    beforeEach(() => {
      process.env.REACT_APP_GITHUB_CLIENT_ID = 'test-client-id';
    });

    it('should render login button and instructions', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      expect(screen.getByText('GitHub OAuth Login')).toBeInTheDocument();
      expect(screen.getByText('Login with GitHub')).toBeInTheDocument();
      expect(screen.getByText(/Securely authenticate with GitHub to access your repositories/)).toBeInTheDocument();
    });

    it('should initiate OAuth flow when login button is clicked', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      const loginButton = screen.getByText('Login with GitHub');
      fireEvent.click(loginButton);

      expect(window.location.href).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize/);
      expect(window.location.href).toMatch(/client_id=test-client-id/);
      expect(window.location.href).toMatch(/redirect_uri=.*\/auth\/callback/);
      expect(window.location.href).toMatch(/scope=user%3Aemail%20repo/);
      expect(window.location.href).toMatch(/state=/);

      window.location = originalLocation;
    });

    it('should store OAuth state in sessionStorage', () => {
      const mockSetItem = jest.fn();
      window.sessionStorage.setItem = mockSetItem;

      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      const loginButton = screen.getByText('Login with GitHub');
      fireEvent.click(loginButton);

      expect(mockSetItem).toHaveBeenCalledWith('github_oauth_state', expect.any(String));
    });
  });

  describe('OAuth Callback Handling', () => {
    beforeEach(() => {
      process.env.REACT_APP_GITHUB_CLIENT_ID = 'test-client-id';
    });

    it('should handle OAuth success callback', async () => {
      // Mock successful OAuth callback
      window.location.search = '?code=test_auth_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'gho_test_access_token' }),
      } as Response);

      render(<DirectGitHubLoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/github-oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'test_auth_code' }),
        });
      });

      await waitFor(() => {
        expect(mockSetTokenAndHostname).toHaveBeenCalledWith('gho_test_access_token', 'github.com');
      });

      expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, '/');
    });

    it('should handle OAuth error callback', async () => {
      window.location.search = '?error=access_denied';

      render(<DirectGitHubLoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('GitHub OAuth error: access_denied')).toBeInTheDocument();
      });

      expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, '/');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockSetTokenAndHostname).not.toHaveBeenCalled();
    });

    it('should handle token exchange failure', async () => {
      window.location.search = '?code=test_auth_code';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      render(<DirectGitHubLoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed: Token exchange failed: 400/)).toBeInTheDocument();
      });

      expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, '/');
      expect(mockSetTokenAndHostname).not.toHaveBeenCalled();
    });

    it('should handle missing access token in response', async () => {
      window.location.search = '?code=test_auth_code';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      } as Response);

      render(<DirectGitHubLoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed: No access token in response/)).toBeInTheDocument();
      });

      expect(mockSetTokenAndHostname).not.toHaveBeenCalled();
    });

    it('should handle network errors during token exchange', async () => {
      window.location.search = '?code=test_auth_code';

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<DirectGitHubLoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed: Network error/)).toBeInTheDocument();
      });

      expect(mockSetTokenAndHostname).not.toHaveBeenCalled();
    });

    it('should show loading state during token exchange', async () => {
      window.location.search = '?code=test_auth_code';

      // Mock a slow response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              ok: true,
              json: () => Promise.resolve({ access_token: 'gho_test_token' }),
            } as Response), 100)
        )
      );

      render(<DirectGitHubLoginDialog {...defaultProps} />);

      expect(screen.getByText('Processing GitHub authentication...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockSetTokenAndHostname).toHaveBeenCalledWith('gho_test_token', 'github.com');
      });
    });

    it('should redirect to home when no code or error in URL', () => {
      window.location.search = '';

      render(<DirectGitHubLoginDialog {...defaultProps} />);

      // Should render normally without processing callback
      expect(screen.getByText('Login with GitHub')).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Manual Token Form', () => {
    beforeEach(() => {
      process.env.REACT_APP_GITHUB_CLIENT_ID = 'test-client-id';
    });

    it('should render manual token form', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Alternative: Manual Token Entry')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('github.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('github_pat_abcdefg123456789')).toBeInTheDocument();
    });

    it('should enable submit button when form is valid', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      const hostnameInput = screen.getByPlaceholderText('github.com');
      const tokenInput = screen.getByPlaceholderText('github_pat_abcdefg123456789');
      const submitButton = screen.getByText('Use Manual Token');

      expect(submitButton).toBeDisabled();

      fireEvent.change(hostnameInput, { target: { value: 'github.com' } });
      fireEvent.change(tokenInput, { target: { value: 'github_pat_test123' } });

      expect(submitButton).not.toBeDisabled();
    });

    it('should call setTokenAndHostname when form is submitted', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      const hostnameInput = screen.getByPlaceholderText('github.com');
      const tokenInput = screen.getByPlaceholderText('github_pat_abcdefg123456789');
      const submitButton = screen.getByText('Use Manual Token');

      fireEvent.change(hostnameInput, { target: { value: '  enterprise.github.com  ' } });
      fireEvent.change(tokenInput, { target: { value: '  github_pat_test123  ' } });
      fireEvent.click(submitButton);

      expect(mockSetTokenAndHostname).toHaveBeenCalledWith('github_pat_test123', 'enterprise.github.com');
    });

    it('should disable submit button with invalid hostname', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      const hostnameInput = screen.getByPlaceholderText('github.com');
      const tokenInput = screen.getByPlaceholderText('github_pat_abcdefg123456789');
      const submitButton = screen.getByText('Use Manual Token');

      fireEvent.change(hostnameInput, { target: { value: 'invalid-hostname-no-dot' } });
      fireEvent.change(tokenInput, { target: { value: 'github_pat_test123' } });

      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button with empty inputs', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      const submitButton = screen.getByText('Use Manual Token');
      
      expect(submitButton).toBeDisabled();
    });

    it('should prevent default form submission', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      const form = screen.getByText('Use Manual Token').closest('form')!;
      const mockPreventDefault = jest.fn();

      fireEvent.submit(form, { preventDefault: mockPreventDefault });

      expect(mockPreventDefault).toHaveBeenCalled();
    });
  });

  describe('Error Fallback', () => {
    it('should show manual token form in error configuration', () => {
      render(<DirectGitHubLoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Configuration Error')).toBeInTheDocument();
      expect(screen.getByText('Please use manual token entry instead:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('github.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('github_pat_abcdefg123456789')).toBeInTheDocument();
    });
  });
});