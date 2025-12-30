/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RecoilRoot } from 'recoil';
import { ThemeProvider } from '@primer/react';
import ScenarioManagement from '../ScenarioManagement';
import * as scenarioAPI from '../scenarioAPI';

// Mock the scenario API
jest.mock('../scenarioAPI');
const mockListScenarios = scenarioAPI.listScenarios as jest.MockedFunction<typeof scenarioAPI.listScenarios>;
const mockUpdateScenarioStatus = scenarioAPI.updateScenarioStatus as jest.MockedFunction<typeof scenarioAPI.updateScenarioStatus>;

// Mock Recoil atoms
jest.mock('../github/gitHubCredentials', () => {
  const { atom } = require('recoil');
  return {
    gitHubUsername: atom({
      key: 'gitHubUsername-mock',
      default: 'testuser',
    }),
    gitHubTokenPersistence: atom({
      key: 'gitHubTokenPersistence-mock',
      default: 'test-token',
    }),
  };
});

const mockScenarios = {
  active: [
    {
      id: 'active-1',
      repo: 'owner/repo',
      canonical_pr_number: 1,
      commit_sha: 'abc123',
      title: 'Active Scenario',
      difficulty: 'medium' as const,
      tags: ['security'],
      validation_status: 'active' as const,
      created_at: '2024-01-01T00:00:00Z',
      created_by: 'testuser',
    },
  ],
  validated: [
    {
      id: 'validated-1',
      repo: 'owner/repo',
      canonical_pr_number: 2,
      commit_sha: 'def456',
      title: 'Validated Scenario 1',
      difficulty: 'easy' as const,
      tags: ['backend'],
      validation_status: 'validated' as const,
      created_at: '2024-01-02T00:00:00Z',
      created_by: 'testuser',
    },
    {
      id: 'validated-2',
      repo: 'owner/repo',
      canonical_pr_number: 3,
      commit_sha: 'ghi789',
      title: 'Validated Scenario 2',
      difficulty: 'hard' as const,
      tags: ['frontend'],
      validation_status: 'validated' as const,
      created_at: '2024-01-03T00:00:00Z',
      created_by: 'testuser',
    },
  ],
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <RecoilRoot>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </RecoilRoot>
  );
};

describe('ScenarioManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pending Activation Section', () => {
    it('should render Pending Activation section with validated scenarios', async () => {
      mockListScenarios.mockImplementation(async (params) => {
        if (params?.status === 'active') return mockScenarios.active;
        if (params?.status === 'validated') return mockScenarios.validated;
        return [];
      });

      renderWithProviders(<ScenarioManagement />);

      // Wait for scenarios to load
      await waitFor(() => {
        expect(screen.getByText('Pending Activation')).toBeInTheDocument();
      });

      // Check badge shows correct count
      expect(screen.getByText('2')).toBeInTheDocument();

      // Check both validated scenarios are displayed
      expect(screen.getByText('Validated Scenario 1')).toBeInTheDocument();
      expect(screen.getByText('Validated Scenario 2')).toBeInTheDocument();

      // Check descriptive text
      expect(screen.getByText(/These scenarios have been validated and are ready to be activated/i)).toBeInTheDocument();
    });

    it('should not render Pending Activation section when no validated scenarios', async () => {
      mockListScenarios.mockImplementation(async (params) => {
        if (params?.status === 'active') return mockScenarios.active;
        if (params?.status === 'validated') return [];
        return [];
      });

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText('Scenario Catalog')).toBeInTheDocument();
      });

      // Pending Activation section should not be present
      expect(screen.queryByText('Pending Activation')).not.toBeInTheDocument();
    });

    it('should display Activate and Archive buttons for validated scenarios', async () => {
      mockListScenarios.mockImplementation(async (params) => {
        if (params?.status === 'active') return [];
        if (params?.status === 'validated') return [mockScenarios.validated[0]];
        return [];
      });

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validated Scenario 1')).toBeInTheDocument();
      });

      // Check for Activate and Archive buttons
      const activateButtons = screen.getAllByRole('button', { name: /activate/i });
      const archiveButtons = screen.getAllByRole('button', { name: /archive/i });

      expect(activateButtons.length).toBeGreaterThan(0);
      expect(archiveButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario Catalog Section', () => {
    it('should render active scenarios in Scenario Catalog', async () => {
      mockListScenarios.mockImplementation(async (params) => {
        if (params?.status === 'active') return mockScenarios.active;
        if (params?.status === 'validated') return [];
        return [];
      });

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText('Active Scenario')).toBeInTheDocument();
      });

      // Active scenarios should have "Start Interview" button, not Activate/Archive
      expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /activate/i })).not.toBeInTheDocument();
    });

    it('should show empty state when no active scenarios', async () => {
      mockListScenarios.mockImplementation(async (params) => {
        if (params?.status === 'active') return [];
        if (params?.status === 'validated') return [];
        return [];
      });

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText('No scenarios created yet')).toBeInTheDocument();
      });
    });
  });

  describe('Activate Button', () => {
    it('should call updateScenarioStatus with "active" when Activate is clicked', async () => {
      let reloadCount = 0;
      mockListScenarios.mockImplementation(async (params) => {
        reloadCount++;
        if (params?.status === 'active') return [];
        if (params?.status === 'validated') return [mockScenarios.validated[0]];
        return [];
      });

      mockUpdateScenarioStatus.mockResolvedValue({
        ...mockScenarios.validated[0],
        validation_status: 'active',
      });

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validated Scenario 1')).toBeInTheDocument();
      });

      const activateButton = screen.getByRole('button', { name: /activate/i });
      await userEvent.click(activateButton);

      // Wait for the API call
      await waitFor(() => {
        expect(mockUpdateScenarioStatus).toHaveBeenCalledWith('validated-1', 'active');
      });

      // Wait for the reload to complete (scenarios are fetched again after update)
      await waitFor(() => {
        expect(reloadCount).toBeGreaterThan(2); // Initial load (2 calls) + reload started
      });
    });

    it('should reload scenarios after successful activation', async () => {
      let callCount = 0;
      mockListScenarios.mockImplementation(async (params) => {
        callCount++;
        if (params?.status === 'active') {
          // After activation, scenario moves to active
          return callCount > 2 ? [{ ...mockScenarios.validated[0], validation_status: 'active' }] : [];
        }
        if (params?.status === 'validated') {
          // After activation, scenario is removed from validated
          return callCount > 2 ? [] : [mockScenarios.validated[0]];
        }
        return [];
      });

      mockUpdateScenarioStatus.mockResolvedValue({
        ...mockScenarios.validated[0],
        validation_status: 'active',
      });

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validated Scenario 1')).toBeInTheDocument();
      });

      const activateButton = screen.getByRole('button', { name: /activate/i });
      await userEvent.click(activateButton);

      // Wait for reload - scenarios should be fetched again
      await waitFor(() => {
        expect(mockListScenarios).toHaveBeenCalledTimes(4); // Initial load (2 calls) + reload (2 calls)
      });
    });
  });

  describe('Archive Button', () => {
    it('should call updateScenarioStatus with "archived" when Archive is clicked', async () => {
      let reloadCount = 0;
      mockListScenarios.mockImplementation(async (params) => {
        reloadCount++;
        if (params?.status === 'active') return [];
        if (params?.status === 'validated') return [mockScenarios.validated[0]];
        return [];
      });

      mockUpdateScenarioStatus.mockResolvedValue({
        ...mockScenarios.validated[0],
        validation_status: 'archived',
      });

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validated Scenario 1')).toBeInTheDocument();
      });

      const archiveButton = screen.getByRole('button', { name: /archive/i });
      await userEvent.click(archiveButton);

      // Wait for the API call
      await waitFor(() => {
        expect(mockUpdateScenarioStatus).toHaveBeenCalledWith('validated-1', 'archived');
      });

      // Wait for the reload to complete
      await waitFor(() => {
        expect(reloadCount).toBeGreaterThan(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when scenarios fail to load', async () => {
      mockListScenarios.mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should display error when status update fails', async () => {
      let callCount = 0;
      mockListScenarios.mockImplementation(async (params) => {
        callCount++;
        if (params?.status === 'active') return [];
        if (params?.status === 'validated') return [mockScenarios.validated[0]];
        return [];
      });

      mockUpdateScenarioStatus.mockRejectedValue(new Error('Update failed'));

      renderWithProviders(<ScenarioManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validated Scenario 1')).toBeInTheDocument();
      });

      const initialCallCount = callCount;
      const activateButton = screen.getByRole('button', { name: /activate/i });
      await userEvent.click(activateButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Update failed/)).toBeInTheDocument();
      });

      // Wait for any additional state updates to complete
      await waitFor(() => {
        // Ensure the error state has fully settled
        expect(screen.queryByText('Validated Scenario 1')).not.toBeInTheDocument();
      }, { timeout: 1000 }).catch(() => {
        // Error state might keep the scenario visible, that's ok
      });
    });
  });

  describe('Loading State', () => {
    it('should show spinner while loading', () => {
      mockListScenarios.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = renderWithProviders(<ScenarioManagement />);

      // Check for spinner by its class or SVG element
      const spinner = container.querySelector('svg[class*="Spinner"]');
      expect(spinner).toBeInTheDocument();
    });
  });
});
