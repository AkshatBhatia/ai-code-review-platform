/**
 * Scenario Management Component
 * Lists and manages GitHub-backed interview scenarios
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Text,
  Label,
  StyledOcticon,
  Dialog,
  TextInput,
  FormControl,
  Select,
  Spinner,
} from '@primer/react';
import {
  PlusIcon,
  LinkExternalIcon,
  TagIcon,
  CheckCircleIcon,
} from '@primer/octicons-react';
import { useRecoilValue } from 'recoil';
import { gitHubUsername, gitHubTokenPersistence } from './github/gitHubCredentials';
import { listScenarios, createScenario, parseGitHubPRURL } from './scenarioAPI';
import type { Scenario, CreateScenarioRequest } from './scenarioTypes';
import { validatePRForScenario, type ValidationResult } from './githubValidation';

export default function ScenarioManagement(): React.ReactElement {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const username = useRecoilValue(gitHubUsername);

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listScenarios({ status: 'active' });
      setScenarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateScenario = async (request: CreateScenarioRequest) => {
    try {
      const newScenario = await createScenario(request);
      setScenarios([newScenario, ...scenarios]);
      setIsCreateModalOpen(false);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <Spinner size="large" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        p={4}
        borderWidth="1px"
        borderStyle="solid"
        borderColor="danger.emphasis"
        borderRadius={6}
        bg="danger.subtle"
      >
        <Text color="danger.fg">Error: {error}</Text>
        <Button onClick={loadScenarios} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Heading as="h2" sx={{ fontSize: 2 }}>
          Scenario Catalog
        </Heading>
        <Button
          variant="primary"
          leadingIcon={PlusIcon}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Scenario
        </Button>
      </Box>

      {scenarios.length === 0 ? (
        <Box
          textAlign="center"
          py={6}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.default"
          borderRadius={6}
        >
          <Text color="fg.muted" mb={3}>
            No scenarios created yet
          </Text>
          <Button
            variant="primary"
            leadingIcon={PlusIcon}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Your First Scenario
          </Button>
        </Box>
      ) : (
        <Box
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border.default"
          borderRadius={6}
        >
          {scenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isLast={index === scenarios.length - 1}
            />
          ))}
        </Box>
      )}

      {isCreateModalOpen && (
        <CreateScenarioModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateScenario}
          currentUsername={username || ''}
        />
      )}
    </Box>
  );
}

function ScenarioCard({
  scenario,
  isLast,
}: {
  scenario: Scenario;
  isLast: boolean;
}): React.ReactElement {
  const prURL = `https://github.com/${scenario.repo}/pull/${scenario.canonical_pr_number}`;

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
          <Button variant="primary" size="small">
            Start Interview
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function getDifficultyVariant(difficulty: string): 'success' | 'attention' | 'danger' {
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
}

function CreateScenarioModal({
  onClose,
  onCreate,
  currentUsername,
}: {
  onClose: () => void;
  onCreate: (request: CreateScenarioRequest) => Promise<void>;
  currentUsername: string;
}): React.ReactElement {
  const [prURL, setPrURL] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [tags, setTags] = useState('');
  const [commitSHA, setCommitSHA] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const githubToken = useRecoilValue(gitHubTokenPersistence);

  const handleValidate = async () => {
    setError(null);
    setValidationResult(null);

    // Parse PR URL
    const parsed = parseGitHubPRURL(prURL);
    if (!parsed) {
      setError('Invalid GitHub PR URL. Example: https://github.com/owner/repo/pull/123');
      return;
    }

    if (!githubToken) {
      setError('GitHub token not found. Please login again.');
      return;
    }

    setIsValidating(true);

    try {
      const result = await validatePRForScenario(parsed.repo, parsed.pr, githubToken);
      setValidationResult(result);

      // Auto-fill commit SHA from validation
      if (result.valid && !commitSHA) {
        // We'll need to fetch this from the PR data
        // For now, leave it for manual entry
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate PR');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Parse PR URL
    const parsed = parseGitHubPRURL(prURL);
    if (!parsed) {
      setError('Invalid GitHub PR URL. Example: https://github.com/owner/repo/pull/123');
      return;
    }

    if (!commitSHA) {
      setError('Commit SHA is required');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const request: CreateScenarioRequest = {
        repo: parsed.repo,
        canonical_pr_number: parsed.pr,
        commit_sha: commitSHA.trim(),
        title: title.trim(),
        difficulty,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        created_by: currentUsername,
        validation_status: 'validated', // Validated on client before creation
      };

      await onCreate(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scenario');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen onDismiss={onClose} aria-labelledby="create-scenario-title">
      <Dialog.Header id="create-scenario-title">Create New Scenario</Dialog.Header>
      <Box p={3}>
        <form onSubmit={handleSubmit}>
          <FormControl required>
            <FormControl.Label>GitHub PR URL</FormControl.Label>
            <Box display="flex" sx={{ gap: 2 }}>
              <TextInput
                value={prURL}
                onChange={(e) => {
                  setPrURL(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="https://github.com/owner/repo/pull/123"
                sx={{ flex: 1 }}
              />
              <Button
                type="button"
                onClick={handleValidate}
                disabled={!prURL || isValidating}
                variant="primary"
                leadingIcon={isValidating ? undefined : CheckCircleIcon}
              >
                {isValidating ? 'Validating...' : 'Validate'}
              </Button>
            </Box>
            <FormControl.Caption>
              Enter a closed PR URL, then click Validate to check requirements
            </FormControl.Caption>
          </FormControl>

          {validationResult && (
            <ValidationResultDisplay result={validationResult} />
          )}

          <FormControl required sx={{ mt: 3 }}>
            <FormControl.Label>Commit SHA</FormControl.Label>
            <TextInput
              value={commitSHA}
              onChange={(e) => setCommitSHA(e.target.value)}
              placeholder="abc123def456..."
              block
            />
            <FormControl.Caption>
              Specific commit to use (ensures immutability)
            </FormControl.Caption>
          </FormControl>

          <FormControl required sx={{ mt: 3 }}>
            <FormControl.Label>Title</FormControl.Label>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="SQL Injection Security Review"
              block
            />
          </FormControl>

          <FormControl required sx={{ mt: 3 }}>
            <FormControl.Label>Difficulty</FormControl.Label>
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              block
            >
              <Select.Option value="easy">Easy</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="hard">Hard</Select.Option>
            </Select>
          </FormControl>

          <FormControl sx={{ mt: 3 }}>
            <FormControl.Label>Tags (comma-separated)</FormControl.Label>
            <TextInput
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="security, backend, sql"
              block
            />
          </FormControl>

          {error && (
            <Box
              p={2}
              mt={3}
              bg="danger.subtle"
              borderRadius={6}
              borderWidth="1px"
              borderStyle="solid"
              borderColor="danger.emphasis"
            >
              <Text color="danger.fg" fontSize={1}>
                {error}
              </Text>
            </Box>
          )}

          <Box display="flex" sx={{ gap: 2, mt: 3 }}>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !validationResult?.valid}
            >
              {isSubmitting ? 'Creating...' : 'Create Scenario'}
            </Button>
            <Button onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </Box>
          {!validationResult && (
            <Text fontSize={1} color="fg.muted" sx={{ mt: 2 }}>
              Please validate the PR before creating a scenario
            </Text>
          )}
        </form>
      </Box>
    </Dialog>
  );
}

function ValidationResultDisplay({ result }: { result: ValidationResult }): React.ReactElement {
  const { valid, errors, warnings, stats } = result;

  return (
    <Box mt={3}>
      {/* Errors - Combined with status */}
      {errors.length > 0 && (
        <Box
          p={3}
          borderRadius={6}
          borderWidth="1px"
          borderStyle="solid"
          borderColor="danger.emphasis"
          bg="danger.subtle"
        >
          <Text fontSize={1} fontWeight="bold" color="danger.fg" mb={2}>
            ✗ Validation Failed
          </Text>
          {errors.map((error, idx) => (
            <Box
              key={idx}
              mt={idx > 0 ? 3 : 0}
              pt={idx > 0 ? 3 : 0}
              sx={{
                borderTop: idx > 0 ? '1px solid' : 'none',
                borderColor: 'danger.muted',
              }}
            >
              <Text fontSize={1} fontWeight="semibold" color="danger.fg">
                {error.message}
              </Text>
              {error.details && (
                <Text fontSize={0} color="fg.muted" sx={{ mt: 1, pl: 2, borderLeft: '2px solid', borderColor: 'border.muted', whiteSpace: 'pre-wrap' }}>
                  {error.details}
                </Text>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Success status */}
      {valid && (
        <Box
          p={3}
          borderRadius={6}
          borderWidth="1px"
          borderStyle="solid"
          borderColor="success.emphasis"
          bg="success.subtle"
        >
          <Text fontWeight="bold" color="success.fg">
            ✓ Validation Passed
          </Text>
        </Box>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Box mt={2}>
          {warnings.map((warning, idx) => (
            <Box
              key={idx}
              p={2}
              mt={idx > 0 ? 2 : 0}
              bg="attention.subtle"
              borderRadius={6}
              borderWidth="1px"
              borderStyle="solid"
              borderColor="attention.muted"
            >
              <Text fontSize={1} color="attention.fg">
                ⚠ {warning.message}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Stats */}
      {valid && (
        <Box mt={2} p={2} bg="canvas.subtle" borderRadius={6}>
          <Text fontSize={1} fontWeight="bold" mb={2}>
            Scenario Statistics
          </Text>
          <Box display="flex" sx={{ gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Text fontSize={0} color="fg.muted">
                Total Issues
              </Text>
              <Text fontSize={2} fontWeight="bold">
                {stats.validComments}
              </Text>
            </Box>
            <Box>
              <Text fontSize={0} color="fg.muted">
                Blockers
              </Text>
              <Text fontSize={2} fontWeight="bold" color="danger.fg">
                {stats.severityCounts.blocker}
              </Text>
            </Box>
            <Box>
              <Text fontSize={0} color="fg.muted">
                Major
              </Text>
              <Text fontSize={2} fontWeight="bold" color="attention.fg">
                {stats.severityCounts.major}
              </Text>
            </Box>
            <Box>
              <Text fontSize={0} color="fg.muted">
                Minor
              </Text>
              <Text fontSize={2} fontWeight="bold" color="success.fg">
                {stats.severityCounts.minor}
              </Text>
            </Box>
          </Box>
          <Box display="flex" sx={{ gap: 2, mt: 2, flexWrap: 'wrap' }}>
            {stats.categoryCounts.security > 0 && (
              <Label>Security: {stats.categoryCounts.security}</Label>
            )}
            {stats.categoryCounts.correctness > 0 && (
              <Label>Correctness: {stats.categoryCounts.correctness}</Label>
            )}
            {stats.categoryCounts.performance > 0 && (
              <Label>Performance: {stats.categoryCounts.performance}</Label>
            )}
            {stats.categoryCounts.architecture > 0 && (
              <Label>Architecture: {stats.categoryCounts.architecture}</Label>
            )}
            {stats.categoryCounts.testing > 0 && (
              <Label>Testing: {stats.categoryCounts.testing}</Label>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
