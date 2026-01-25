/**
 * FSRS Optimizer Integration Constants
 */

export const OPTIMIZER_CONFIG = {
  /** Minimum number of reviews required for optimization */
  MIN_REVIEW_COUNT: 100,
  
  /** Maximum buffer size for optimizer output (10MB) */
  MAX_BUFFER_BYTES: 10 * 1024 * 1024,
  
  /** Timeout for optimizer execution (5 minutes) */
  EXECUTION_TIMEOUT_MS: 300000,
  
  /** Timeout for checking optimizer availability (5 seconds) */
  CHECK_TIMEOUT_MS: 5000,
  
  /** Maximum length of error output to log (500 characters) */
  ERROR_OUTPUT_MAX_LENGTH: 500,
  
  /** Default timezone if not specified */
  DEFAULT_TIMEZONE: 'UTC',
  
  /** Default day start hour (4 AM) */
  DEFAULT_DAY_START: 4,
} as const;
