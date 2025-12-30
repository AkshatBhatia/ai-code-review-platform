/**
 * API Client for Scenario Management
 * Calls Netlify Functions that interact with Supabase
 */

import type {
  Scenario,
  CreateScenarioRequest,
  ListScenariosParams,
  ListScenariosResponse,
  CreateScenarioResponse,
  APIError,
} from './scenarioTypes';

/**
 * Base URL for API endpoints
 * In development: http://localhost:8888/.netlify/functions
 * In production: /.netlify/functions
 */
const getAPIBaseURL = (): string => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8888/.netlify/functions';
  }
  return '/.netlify/functions';
};

/**
 * Fetch scenarios with optional filtering
 */
export async function listScenarios(
  params?: ListScenariosParams
): Promise<Scenario[]> {
  const queryParams = new URLSearchParams();

  if (params?.difficulty) {
    queryParams.append('difficulty', params.difficulty);
  }
  if (params?.status) {
    queryParams.append('status', params.status);
  }
  if (params?.tags) {
    queryParams.append('tags', params.tags);
  }
  if (params?.company_id) {
    queryParams.append('company_id', params.company_id);
  }

  const url = `${getAPIBaseURL()}/list-scenarios${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url);

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to fetch scenarios');
  }

  const data: ListScenariosResponse = await response.json();
  return data.scenarios;
}

/**
 * Create a new scenario
 */
export async function createScenario(
  request: CreateScenarioRequest
): Promise<Scenario> {
  const url = `${getAPIBaseURL()}/create-scenario`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to create scenario');
  }

  const data: CreateScenarioResponse = await response.json();
  return data.scenario;
}

/**
 * Update scenario validation status
 */
export async function updateScenarioStatus(
  scenarioId: string,
  validationStatus: 'draft' | 'validated' | 'active' | 'archived'
): Promise<Scenario> {
  const url = `${getAPIBaseURL()}/update-scenario-status`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scenario_id: scenarioId,
      validation_status: validationStatus,
    }),
  });

  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.error || 'Failed to update scenario status');
  }

  const data: { scenario: Scenario } = await response.json();
  return data.scenario;
}

/**
 * Helper: Parse GitHub PR URL to extract repo and PR number
 * Example: https://github.com/owner/repo/pull/123 -> { repo: "owner/repo", pr: 123 }
 */
export function parseGitHubPRURL(url: string): { repo: string; pr: number } | null {
  const match = url.match(/github\.com\/([^\/]+\/[^\/]+)\/pull\/(\d+)/);
  if (!match) {
    return null;
  }
  return {
    repo: match[1],
    pr: parseInt(match[2], 10),
  };
}
