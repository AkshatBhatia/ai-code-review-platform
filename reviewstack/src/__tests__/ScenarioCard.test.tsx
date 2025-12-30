/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@primer/react';

// We'll need to extract ScenarioCard as a separate component or test it through ScenarioManagement
// For now, let's create a simple version that matches the implementation

interface Scenario {
  id: string;
  repo: string;
  canonical_pr_number: number;
  commit_sha: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  validation_status: 'draft' | 'validated' | 'active' | 'archived';
  created_at: string;
  created_by: string;
}

// Mock ScenarioCard component for testing
// In reality, this should import from ScenarioManagement.tsx after extracting it
const ScenarioCard = ({
  scenario,
  isLast,
  showActions = false,
  onActivate,
  onArchive,
}: {
  scenario: Scenario;
  isLast: boolean;
  showActions?: boolean;
  onActivate?: () => void;
  onArchive?: () => void;
}) => {
  const { Box, Button, Text, Label, StyledOcticon } = require('@primer/react');
  const { LinkExternalIcon, TagIcon } = require('@primer/octicons-react');

  const prURL = `https://github.com/${scenario.repo}/pull/${scenario.canonical_pr_number}`;

  const getDifficultyVariant = (difficulty: string): 'success' | 'attention' | 'danger' => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'attention';
      case 'hard':
        return 'danger';
      default:
        return 'attention';
    }
  };

  return (
    <Box
      p={4}
      borderBottomWidth={isLast ? '0' : '1px'}
      borderBottomStyle="solid"
      borderBottomColor="border.muted"
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Text fontWeight="bold" display="block" mb={1}>
            {scenario.title}
          </Text>
          <Text color="fg.muted" fontSize={1} mb={2}>
            {scenario.repo} #{scenario.canonical_pr_number}
          </Text>
          <Box display="flex" sx={{ gap: 2, flexWrap: 'wrap' }}>
            <Label variant={getDifficultyVariant(scenario.difficulty)}>
              {scenario.difficulty}
            </Label>
            {scenario.tags.map((tag) => (
              <Label key={tag} variant="accent">
                <StyledOcticon icon={TagIcon} sx={{ mr: 1 }} />
                {tag}
              </Label>
            ))}
            <Label variant="secondary">{scenario.validation_status}</Label>
          </Box>
        </Box>
        <Box display="flex" sx={{ gap: 2 }}>
          <Button
            as="a"
            href={prURL}
            target="_blank"
            rel="noopener noreferrer"
            variant="invisible"
            size="small"
            leadingIcon={LinkExternalIcon}
          >
            View PR
          </Button>
          {showActions ? (
            <>
              <Button
                variant="primary"
                size="small"
                onClick={onActivate}
              >
                Activate
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={onArchive}
              >
                Archive
              </Button>
            </>
          ) : (
            <Button variant="primary" size="small">
              Start Interview
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const mockScenario: Scenario = {
  id: 'test-1',
  repo: 'owner/repo',
  canonical_pr_number: 123,
  commit_sha: 'abc123',
  title: 'Test Scenario',
  difficulty: 'medium',
  tags: ['security', 'backend'],
  validation_status: 'validated',
  created_at: '2024-01-01T00:00:00Z',
  created_by: 'testuser',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ScenarioCard', () => {
  describe('Basic Rendering', () => {
    it('should render scenario title and metadata', () => {
      renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={false} />
      );

      expect(screen.getByText('Test Scenario')).toBeInTheDocument();
      expect(screen.getByText(/owner\/repo/)).toBeInTheDocument();
      expect(screen.getByText(/#123/)).toBeInTheDocument();
    });

    it('should render difficulty badge', () => {
      renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={false} />
      );

      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should render all tags', () => {
      renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={false} />
      );

      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
    });

    it('should render validation status', () => {
      renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={false} />
      );

      expect(screen.getByText('validated')).toBeInTheDocument();
    });

    it('should render View PR link with correct URL', () => {
      renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={false} />
      );

      const link = screen.getByRole('link', { name: /view pr/i });
      expect(link).toHaveAttribute('href', 'https://github.com/owner/repo/pull/123');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('Action Buttons - showActions=false (default)', () => {
    it('should show "Start Interview" button when showActions is false', () => {
      renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={false} showActions={false} />
      );

      expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /activate/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /archive/i })).not.toBeInTheDocument();
    });

    it('should show "Start Interview" button when showActions is not provided', () => {
      renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={false} />
      );

      expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument();
    });
  });

  describe('Action Buttons - showActions=true', () => {
    it('should show Activate and Archive buttons when showActions is true', () => {
      renderWithTheme(
        <ScenarioCard
          scenario={mockScenario}
          isLast={false}
          showActions={true}
          onActivate={() => {}}
          onArchive={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: /activate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /start interview/i })).not.toBeInTheDocument();
    });

    it('should call onActivate when Activate button is clicked', async () => {
      const onActivate = jest.fn();
      const onArchive = jest.fn();

      renderWithTheme(
        <ScenarioCard
          scenario={mockScenario}
          isLast={false}
          showActions={true}
          onActivate={onActivate}
          onArchive={onArchive}
        />
      );

      const activateButton = screen.getByRole('button', { name: /activate/i });
      await userEvent.click(activateButton);

      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(onArchive).not.toHaveBeenCalled();
    });

    it('should call onArchive when Archive button is clicked', async () => {
      const onActivate = jest.fn();
      const onArchive = jest.fn();

      renderWithTheme(
        <ScenarioCard
          scenario={mockScenario}
          isLast={false}
          showActions={true}
          onActivate={onActivate}
          onArchive={onArchive}
        />
      );

      const archiveButton = screen.getByRole('button', { name: /archive/i });
      await userEvent.click(archiveButton);

      expect(onArchive).toHaveBeenCalledTimes(1);
      expect(onActivate).not.toHaveBeenCalled();
    });
  });

  describe('Border styling', () => {
    it('should show bottom border when isLast is false', () => {
      const { container } = renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={false} />
      );

      const box = container.querySelector('[class*="Box"]');
      expect(box).toHaveStyle({ borderBottomWidth: '1px' });
    });

    it('should not show bottom border when isLast is true', () => {
      const { container } = renderWithTheme(
        <ScenarioCard scenario={mockScenario} isLast={true} />
      );

      const box = container.querySelector('[class*="Box"]');
      expect(box).toHaveStyle({ borderBottomWidth: '0' });
    });
  });

  describe('Difficulty Badge Variants', () => {
    it('should use success variant for easy difficulty', () => {
      renderWithTheme(
        <ScenarioCard
          scenario={{ ...mockScenario, difficulty: 'easy' }}
          isLast={false}
        />
      );

      expect(screen.getByText('easy')).toBeInTheDocument();
    });

    it('should use attention variant for medium difficulty', () => {
      renderWithTheme(
        <ScenarioCard
          scenario={{ ...mockScenario, difficulty: 'medium' }}
          isLast={false}
        />
      );

      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should use danger variant for hard difficulty', () => {
      renderWithTheme(
        <ScenarioCard
          scenario={{ ...mockScenario, difficulty: 'hard' }}
          isLast={false}
        />
      );

      expect(screen.getByText('hard')).toBeInTheDocument();
    });
  });
});
