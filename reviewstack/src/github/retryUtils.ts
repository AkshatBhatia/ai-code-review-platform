/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableStatusCodes: Set<number>;
}

/**
 * Default retry configuration for GitHub API requests
 */
export const DEFAULT_GITHUB_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
};

/**
 * Determines if an error/response should be retried
 */
function shouldRetry(error: unknown, attempt: number, config: RetryConfig): boolean {
  if (attempt >= config.maxAttempts) {
    return false;
  }

  // Network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return true;
  }
  
  // Network errors (net::ERR_FAILED, etc.)
  if (error instanceof Error && error.message.includes('ERR_FAILED')) {
    return true;
  }

  // Response with retryable status code
  if (error instanceof Response) {
    return config.retryableStatusCodes.has(error.status);
  }

  // HTTP errors with status codes
  if (error instanceof Error && error.message.includes('HTTP request error:')) {
    const statusMatch = error.message.match(/HTTP request error: (\d+):/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      return config.retryableStatusCodes.has(status);
    }
  }

  return false;
}

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.baseDelayMs * Math.pow(config.backoffFactor, attempt - 1),
    config.maxDelayMs
  );
  
  // Add jitter (±25% of the delay)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, exponentialDelay + jitter);
}

/**
 * Sleep for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a promise-returning function with exponential backoff
 * 
 * @param fn Function that returns a Promise
 * @param config Retry configuration
 * @returns Promise that resolves with the result or rejects with the final error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_GITHUB_RETRY_CONFIG
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < config.maxAttempts) {
    attempt++;
    
    try {
      const result = await fn();
      
      // If we got a successful result, return it
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (!shouldRetry(error, attempt, config)) {
        throw error;
      }
      
      // If this was the last attempt, don't wait
      if (attempt >= config.maxAttempts) {
        break;
      }
      
      // Calculate delay and wait before retry
      const delay = calculateDelay(attempt, config);
      console.warn(
        `GitHub API request failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${Math.round(delay)}ms...`,
        error instanceof Error ? error.message : error
      );
      
      await sleep(delay);
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Retry specifically for fetch requests with enhanced error handling
 */
export async function withFetchRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_GITHUB_RETRY_CONFIG
): Promise<Response> {
  return withRetry(async () => {
    try {
      const response = await fetch(url, options);
      
      // If the response has a retryable status code, treat it as an error
      if (config.retryableStatusCodes.has(response.status)) {
        throw response;
      }
      
      return response;
    } catch (error) {
      // Re-throw to be handled by withRetry
      throw error;
    }
  }, config);
}