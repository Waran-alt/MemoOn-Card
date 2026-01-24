/**
 * Management View Constants
 * 
 * Configuration for handling management views (editing, filtering, etc.)
 * that may passively expose card content and affect active recall.
 */

/**
 * Default Management Penalty Configuration
 */
export const DEFAULT_MANAGEMENT_CONFIG = {
  /** Minimum seconds of content reveal to trigger penalty */
  MIN_REVEAL_SECONDS: 5,
  
  /** Minimum fuzzing hours (pushes next_review forward) */
  FUZZING_HOURS_MIN: 4,
  
  /** Maximum fuzzing hours */
  FUZZING_HOURS_MAX: 8,
  
  /** Minimum fuzzing hours (absolute minimum) */
  FUZZING_HOURS_ABSOLUTE_MIN: 0.5, // 30 minutes
  
  /** Enable adaptive fuzzing based on card state */
  ADAPTIVE_FUZZING: true,
  
  /** Show risk warning before managing cards */
  WARN_BEFORE_MANAGING: true,
} as const;

/**
 * Stability-based Multipliers for Adaptive Fuzzing
 */
export const STABILITY_MULTIPLIERS = {
  /** Low stability threshold (days) - cards below this get proportional fuzzing */
  LOW_THRESHOLD_DAYS: 1,
  
  /** High stability threshold (days) - cards above this get reduced fuzzing */
  HIGH_THRESHOLD_DAYS: 7,
  
  /** Minimum multiplier for low stability cards */
  LOW_STABILITY_MIN: 0.3,
  
  /** Multiplier for high stability cards */
  HIGH_STABILITY: 0.5,
} as const;

/**
 * Retrievability-based Multipliers for Adaptive Fuzzing
 */
export const RETRIEVABILITY_MULTIPLIERS = {
  /** High R threshold - cards above this get reduced fuzzing */
  HIGH_THRESHOLD: 0.9,
  
  /** Low R threshold - cards below this get increased fuzzing */
  LOW_THRESHOLD: 0.7,
  
  /** Multiplier for high R (fresh cards) */
  HIGH_R: 0.7,
  
  /** Multiplier for low R (at-risk cards) */
  LOW_R: 1.2,
} as const;

/**
 * Time-based Multipliers for Adaptive Fuzzing
 */
export const TIME_MULTIPLIERS = {
  /** Very soon threshold (hours until due) */
  VERY_SOON_HOURS: 2,
  
  /** Soon threshold (hours until due) */
  SOON_HOURS: 6,
  
  /** Multiplier for cards due very soon */
  VERY_SOON: 1.5,
  
  /** Multiplier for cards due soon */
  SOON: 1.2,
  
  /** Hours until due threshold for applying penalty */
  PENALTY_THRESHOLD_HOURS: 24,
} as const;

/**
 * Risk Calculation Constants
 */
export const RISK_CALCULATION = {
  /** Hours per day for time factor calculation */
  HOURS_PER_DAY: 24,
  
  /** Risk weight percentages */
  WEIGHTS: {
    /** Retrievability factor weight (50%) */
    RETRIEVABILITY: 50,
    /** Time until due factor weight (30%) */
    TIME: 30,
    /** Stability factor weight (20%) */
    STABILITY: 20,
  },
  
  /** Risk level thresholds (percentage) */
  THRESHOLDS: {
    /** Critical risk threshold */
    CRITICAL: 70,
    /** High risk threshold */
    HIGH: 50,
    /** Medium risk threshold */
    MEDIUM: 30,
    /** Low risk threshold */
    LOW: 10,
  },
  
  /** Stability threshold for risk calculation (days) */
  STABILITY_THRESHOLD_DAYS: 1,
  
  /** Maximum risk percentage */
  MAX_RISK_PERCENT: 100,
} as const;
