/**
 * GitHub API client for PR validation
 * Fetches PR data to validate it meets scenario requirements
 */

export interface GitHubPRData {
  number: number;
  state: 'open' | 'closed';
  title: string;
  head: {
    sha: string;
  };
  base: {
    ref: string;
  };
  merged: boolean;
  comments: number;
}

export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  path?: string;
  line?: number;
}

/**
 * Fetch PR data from GitHub API
 */
export async function fetchPRData(
  repo: string,
  prNumber: number,
  token: string
): Promise<GitHubPRData> {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch PR: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all review comments on a PR
 */
export async function fetchPRComments(
  repo: string,
  prNumber: number,
  token: string
): Promise<GitHubComment[]> {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}/comments`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch PR comments: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Validation result types
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  type: 'pr_open' | 'no_comments' | 'invalid_comments' | 'insufficient_coverage';
  message: string;
  details?: string;
}

export interface ValidationWarning {
  type: 'severity_mix' | 'category_coverage';
  message: string;
}

export interface ValidationStats {
  totalComments: number;
  validComments: number;
  severityCounts: {
    blocker: number;
    major: number;
    minor: number;
  };
  categoryCounts: {
    security: number;
    correctness: number;
    performance: number;
    architecture: number;
    testing: number;
    other: number;
  };
}

/**
 * Severity tags that must appear in comments
 */
const SEVERITY_REGEX = /\[(BLOCKER|MAJOR|MINOR)\]/i;
const SEVERITY_TAGS = ['BLOCKER', 'MAJOR', 'MINOR'] as const;

/**
 * Category tags that should appear in comments
 */
const CATEGORY_REGEX = /\[(SECURITY|CORRECTNESS|PERFORMANCE|ARCHITECTURE|TESTING)\]/i;
const CATEGORY_TAGS = ['SECURITY', 'CORRECTNESS', 'PERFORMANCE', 'ARCHITECTURE', 'TESTING'] as const;

/**
 * Parse comment to extract severity and category tags
 */
export function parseCommentTags(commentBody: string): {
  severity: string | null;
  categories: string[];
} {
  const severityMatch = commentBody.match(SEVERITY_REGEX);
  const severity = severityMatch ? severityMatch[1].toUpperCase() : null;

  const categories: string[] = [];
  for (const tag of CATEGORY_TAGS) {
    if (new RegExp(`\\[${tag}\\]`, 'i').test(commentBody)) {
      categories.push(tag);
    }
  }

  return { severity, categories };
}

/**
 * Validate a PR for use as an interview scenario
 */
export async function validatePRForScenario(
  repo: string,
  prNumber: number,
  token: string,
  minIssues: number = 5
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const stats: ValidationStats = {
    totalComments: 0,
    validComments: 0,
    severityCounts: { blocker: 0, major: 0, minor: 0 },
    categoryCounts: {
      security: 0,
      correctness: 0,
      performance: 0,
      architecture: 0,
      testing: 0,
      other: 0,
    },
  };

  try {
    // Fetch PR data
    const prData = await fetchPRData(repo, prNumber, token);

    // Validate PR is closed
    if (prData.state !== 'closed') {
      errors.push({
        type: 'pr_open',
        message: 'PR must be closed to be used as a scenario',
        details: 'Please close the PR first',
      });
    }

    // Fetch comments
    const comments = await fetchPRComments(repo, prNumber, token);
    stats.totalComments = comments.length;

    if (comments.length === 0) {
      errors.push({
        type: 'no_comments',
        message: 'PR has no review comments',
        details: 'Add at least 5 review comments to the PR',
      });
    } else {
      // Just count all comments as valid - no tag requirements for now
      stats.validComments = comments.length;
      stats.totalComments = comments.length;

      // Optional: Parse tags if present for statistics, but don't fail validation
      for (const comment of comments) {
        const { severity, categories } = parseCommentTags(comment.body);

        // Count severity if present
        if (severity === 'BLOCKER') stats.severityCounts.blocker++;
        else if (severity === 'MAJOR') stats.severityCounts.major++;
        else if (severity === 'MINOR') stats.severityCounts.minor++;

        // Count categories if present
        for (const category of categories) {
          const key = category.toLowerCase() as keyof typeof stats.categoryCounts;
          if (key in stats.categoryCounts) {
            stats.categoryCounts[key]++;
          }
        }
      }

      // Check minimum coverage (at least minIssues comments)
      if (stats.validComments < minIssues) {
        errors.push({
          type: 'insufficient_coverage',
          message: `Only ${stats.validComments} review comment(s) found, minimum is ${minIssues}`,
          details: 'Add more review comments to the PR',
        });
      }
    }
  } catch (error) {
    errors.push({
      type: 'pr_open',
      message: error instanceof Error ? error.message : 'Failed to validate PR',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}
