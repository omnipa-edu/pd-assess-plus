/**
 * Retry utility for API calls
 * Provides configurable retry logic with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryable: () => true, // Retry all errors by default
};

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 && status < 600;
  }

  // Timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    return true;
  }

  // Supabase connection errors
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  }

  return false;
}

/**
 * Calculates delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Retries a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 * 
 * @example
 * ```ts
 * const result = await retry(
 *   () => fetchData(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const shouldRetry = config.retryable || isRetryableError;

  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't wait after the last attempt
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Creates a retry wrapper for a function
 * 
 * @example
 * ```ts
 * const fetchDataWithRetry = withRetry(fetchData, { maxRetries: 3 });
 * const result = await fetchDataWithRetry();
 * ```
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return retry(() => fn(...args), options);
  }) as T;
}





