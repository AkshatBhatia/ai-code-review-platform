/**
 * Scenario Types for GitHub-backed Interview Platform
 *
 * Scenarios are backed by closed GitHub PRs (canonical PR)
 * Interview sessions create new PRs (candidate PR) with identical code
 */

/**
 * Scenario - backed by a closed canonical GitHub PR
 * Stored in Supabase, fetched via Netlify Functions
 */
export interface Scenario {
  id: string;
  repo: string;  // e.g., "owner/repo-name"
  canonical_pr_number: number;
  commit_sha: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];  // e.g., ['security', 'backend', 'performance']
  validation_status: 'draft' | 'validated' | 'active' | 'archived';
  created_at: string;  // ISO date string
  created_by: string;
  company_id?: string;
}

/**
 * Request body for creating a new scenario
 */
export interface CreateScenarioRequest {
  repo: string;
  canonical_pr_number: number;
  commit_sha: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  created_by: string;
  company_id?: string;
  validation_status?: 'draft' | 'validated' | 'active' | 'archived';
}

/**
 * Query parameters for listing scenarios
 */
export interface ListScenariosParams {
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'draft' | 'validated' | 'active' | 'archived';
  tags?: string;  // comma-separated
  company_id?: string;
}

/**
 * API Response types
 */
export interface ListScenariosResponse {
  scenarios: Scenario[];
}

export interface CreateScenarioResponse {
  scenario: Scenario;
}

export interface APIError {
  error: string;
}
