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
import { useAuth0 } from '@auth0/auth0-react';
import Auth0LoginDialog from '../Auth0LoginDialog';

// Mock the Auth0 hook
jest.mock('@auth0/auth0-react');
const mockUseAuth0 = useAuth0 as jest.MockedFunction<typeof useAuth0>;

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

describe('Auth0LoginDialog', () => {
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
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Environment Variable Configuration', () => {
    beforeEach(() => {
      // Reset process.env before each test
      delete process.env.REACT_APP_AUTH0_DOMAIN;
      delete process.env.REACT_APP_AUTH0_CLIENT_ID;
      delete process.env.AUTH0_DOMAIN;
      delete process.env.AUTH0_CLIENT_ID;
    });

    it('should render error message when Auth0 domain is missing', () => {
      process.env.REACT_APP_AUTH0_CLIENT_ID = 'test-client-id';
      
      render(<Auth0LoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Configuration Error')).toBeInTheDocument();
      expect(screen.getByText(/Auth0 configuration missing/)).toBeInTheDocument();
    });

    it('should render error message when Auth0 client ID is missing', () => {
      process.env.REACT_APP_AUTH0_DOMAIN = 'test-domain.auth0.com';
      
      render(<Auth0LoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Configuration Error')).toBeInTheDocument();
      expect(screen.getByText(/Auth0 configuration missing/)).toBeInTheDocument();
    });

    it('should prefer REACT_APP_ prefixed environment variables', () => {
      process.env.REACT_APP_AUTH0_DOMAIN = 'react-app-domain.auth0.com';
      process.env.AUTH0_DOMAIN = 'fallback-domain.auth0.com';
      process.env.REACT_APP_AUTH0_CLIENT_ID = 'react-app-client-id';
      process.env.AUTH0_CLIENT_ID = 'fallback-client-id';

      // Mock Auth0 hook for successful configuration
      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: false,
        isLoading: false,
        error: undefined,
        user: undefined,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);
      
      expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument();
    });

    it('should fall back to non-prefixed environment variables', () => {
      process.env.AUTH0_DOMAIN = 'fallback-domain.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'fallback-client-id';

      // Mock Auth0 hook for successful configuration
      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: false,
        isLoading: false,
        error: undefined,
        user: undefined,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);
      
      expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument();
    });
  });

  describe('Auth0 Authentication Flow', () => {
    beforeEach(() => {
      process.env.REACT_APP_AUTH0_DOMAIN = 'test-domain.auth0.com';
      process.env.REACT_APP_AUTH0_CLIENT_ID = 'test-client-id';
    });

    it('should display login button when not authenticated', () => {
      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: false,
        isLoading: false,
        error: undefined,
        user: undefined,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Login with GitHub via Auth0')).toBeInTheDocument();
      expect(screen.getByText('GitHub Authentication via Auth0')).toBeInTheDocument();
    });

    it('should show loading state during authentication', () => {
      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: false,
        isLoading: true,
        error: undefined,
        user: undefined,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Loading authentication...')).toBeInTheDocument();
    });

    it('should display Auth0 error when present', () => {
      const mockError = { message: 'Auth0 authentication failed' };
      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: false,
        isLoading: false,
        error: mockError,
        user: undefined,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Auth0 Error: Auth0 authentication failed')).toBeInTheDocument();
    });

    it('should call loginWithPopup when login button is clicked', async () => {
      const mockLoginWithPopup = jest.fn().mockResolvedValue(undefined);
      mockUseAuth0.mockReturnValue({
        loginWithPopup: mockLoginWithPopup,
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: false,
        isLoading: false,
        error: undefined,
        user: undefined,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);
      
      const loginButton = screen.getByText('Login with GitHub via Auth0');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLoginWithPopup).toHaveBeenCalledWith({
          authorizationParams: {
            connection: 'github'
          }
        });
      });
    });

    it('should handle loginWithPopup errors', async () => {
      const mockLoginWithPopup = jest.fn().mockRejectedValue(new Error('Login failed'));
      mockUseAuth0.mockReturnValue({
        loginWithPopup: mockLoginWithPopup,
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: false,
        isLoading: false,
        error: undefined,
        user: undefined,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);
      
      const loginButton = screen.getByText('Login with GitHub via Auth0');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });
  });

  describe('GitHub Token Extraction', () => {
    beforeEach(() => {
      process.env.REACT_APP_AUTH0_DOMAIN = 'test-domain.auth0.com';
      process.env.REACT_APP_AUTH0_CLIENT_ID = 'test-client-id';
    });

    it('should extract GitHub token from user identities', async () => {
      const mockUser = {
        identities: [
          {
            provider: 'github',
            access_token: 'gho_test_token_from_identities'
          }
        ]
      };

      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: true,
        isLoading: false,
        error: undefined,
        user: mockUser,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockSetTokenAndHostname).toHaveBeenCalledWith('gho_test_token_from_identities', 'github.com');
      });
    });

    it('should extract GitHub token from custom claims', async () => {
      const mockUser = {
        identities: [],
        github_access_token: 'gho_test_token_from_custom_claim'
      };

      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: true,
        isLoading: false,
        error: undefined,
        user: mockUser,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockSetTokenAndHostname).toHaveBeenCalledWith('gho_test_token_from_custom_claim', 'github.com');
      });
    });

    it('should prefer token from identities over custom claims', async () => {
      const mockUser = {
        identities: [
          {
            provider: 'github',
            access_token: 'gho_token_from_identities'
          }
        ],
        github_access_token: 'gho_token_from_custom_claim'
      };

      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: true,
        isLoading: false,
        error: undefined,
        user: mockUser,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockSetTokenAndHostname).toHaveBeenCalledWith('gho_token_from_identities', 'github.com');
      });
    });

    it('should handle missing user.identities gracefully', async () => {
      const mockUser = {
        github_access_token: 'gho_test_token_from_custom_claim'
      };

      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: true,
        isLoading: false,
        error: undefined,
        user: mockUser,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockSetTokenAndHostname).toHaveBeenCalledWith('gho_test_token_from_custom_claim', 'github.com');
      });
    });

    it('should reject JWT tokens and show error message', async () => {
      const mockUser = {
        identities: [
          {
            provider: 'github',
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
          }
        ]
      };

      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: true,
        isLoading: false,
        error: undefined,
        user: mockUser,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Got JWT token instead of GitHub token/)).toBeInTheDocument();
      });
      
      expect(mockSetTokenAndHostname).not.toHaveBeenCalled();
    });

    it('should show error when no GitHub token is found', async () => {
      const mockUser = {
        identities: [
          {
            provider: 'google',
            access_token: 'some_google_token'
          }
        ]
      };

      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: true,
        isLoading: false,
        error: undefined,
        user: mockUser,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/GitHub token not found in Auth0 response/)).toBeInTheDocument();
      });
      
      expect(mockSetTokenAndHostname).not.toHaveBeenCalled();
    });

    it('should handle token extraction errors', async () => {
      const mockUser = null; // This will cause an error in token extraction

      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: true,
        isLoading: false,
        error: undefined,
        user: mockUser,
      } as any);

      render(<Auth0LoginDialog {...defaultProps} />);

      // Wait for the error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Failed to extract GitHub token from Auth0/)).toBeInTheDocument();
      });
      
      expect(mockSetTokenAndHostname).not.toHaveBeenCalled();
    });
  });

  describe('Manual Token Form', () => {
    beforeEach(() => {
      process.env.REACT_APP_AUTH0_DOMAIN = 'test-domain.auth0.com';
      process.env.REACT_APP_AUTH0_CLIENT_ID = 'test-client-id';

      mockUseAuth0.mockReturnValue({
        loginWithPopup: jest.fn(),
        getAccessTokenSilently: jest.fn(),
        isAuthenticated: false,
        isLoading: false,
        error: undefined,
        user: undefined,
      } as any);
    });

    it('should render manual token form', () => {
      render(<Auth0LoginDialog {...defaultProps} />);
      
      expect(screen.getByText('Alternative: Manual Token Entry')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('github.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('github_pat_abcdefg123456789')).toBeInTheDocument();
    });

    it('should enable submit button when form is valid', () => {
      render(<Auth0LoginDialog {...defaultProps} />);
      
      const hostnameInput = screen.getByPlaceholderText('github.com');
      const tokenInput = screen.getByPlaceholderText('github_pat_abcdefg123456789');
      const submitButton = screen.getByText('Use Manual Token');

      expect(submitButton).toBeDisabled();

      fireEvent.change(hostnameInput, { target: { value: 'github.com' } });
      fireEvent.change(tokenInput, { target: { value: 'github_pat_test123' } });

      expect(submitButton).not.toBeDisabled();
    });

    it('should call setTokenAndHostname when form is submitted', () => {
      render(<Auth0LoginDialog {...defaultProps} />);
      
      const hostnameInput = screen.getByPlaceholderText('github.com');
      const tokenInput = screen.getByPlaceholderText('github_pat_abcdefg123456789');
      const submitButton = screen.getByText('Use Manual Token');

      fireEvent.change(hostnameInput, { target: { value: 'enterprise.github.com' } });
      fireEvent.change(tokenInput, { target: { value: '  github_pat_test123  ' } });
      fireEvent.click(submitButton);

      expect(mockSetTokenAndHostname).toHaveBeenCalledWith('github_pat_test123', 'enterprise.github.com');
    });

    it('should prevent form submission with invalid inputs', () => {
      render(<Auth0LoginDialog {...defaultProps} />);
      
      const submitButton = screen.getByText('Use Manual Token');
      
      // Empty inputs should disable button
      expect(submitButton).toBeDisabled();
      
      // Only hostname without dot should disable button
      const hostnameInput = screen.getByPlaceholderText('github.com');
      fireEvent.change(hostnameInput, { target: { value: 'invalid-hostname' } });
      expect(submitButton).toBeDisabled();
    });
  });
});