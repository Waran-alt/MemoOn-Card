import {
  DEFAULT_MANAGEMENT_CONFIG,
  RETRIEVABILITY_MULTIPLIERS,
  RISK_CALCULATION,
  STABILITY_MULTIPLIERS,
  TIME_MULTIPLIERS,
} from '@/constants/management.constants';

export interface FsrsStateLike {
  stability: number;
  difficulty: number;
  lastReview: Date | null;
  nextReview: Date;
}

export interface ManagementConfigLike {
  minRevealSeconds: number;
  fuzzingHoursMin: number;
  fuzzingHoursMax: number;
  adaptiveFuzzing: boolean;
  warnBeforeManaging: boolean;
}

export interface ManagementRiskLike {
  cardId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskPercent: number;
  retrievability: number;
  stability: number;
  hoursUntilDue: number;
  recommendedAction: 'safe' | 'pre-study' | 'avoid';
}

export interface DeckManagementRiskLike {
  totalCards: number;
  atRiskCards: number;
  riskPercent: number;
  criticalCards: number;
  highRiskCards: number;
  mediumRiskCards: number;
  lowRiskCards: number;
  recommendedPreStudyCount: number;
}

interface Ops {
  now: Date;
  getElapsedDays: (from: Date, to: Date) => number;
  getElapsedHours: (from: Date, to: Date) => number;
  calculateRetrievability: (elapsedDays: number, stability: number) => number;
  addHours: (date: Date, hours: number) => Date;
}

export function calculateManagementRiskForState(
  state: FsrsStateLike,
  ops: Omit<Ops, 'addHours'>
): ManagementRiskLike {
  const elapsedDays = ops.getElapsedDays(state.lastReview ?? state.nextReview, ops.now);
  const retrievability = ops.calculateRetrievability(elapsedDays, state.stability);
  const hoursUntilDue = ops.getElapsedHours(ops.now, state.nextReview);
  const rFactor = 1 - retrievability;
  const timeFactor = Math.max(0, 1 - hoursUntilDue / RISK_CALCULATION.HOURS_PER_DAY);
  const stabilityFactor =
    state.stability < RISK_CALCULATION.STABILITY_THRESHOLD_DAYS
      ? 1
      : Math.min(1, 1 / state.stability);

  const riskPercent = Math.min(
    RISK_CALCULATION.MAX_RISK_PERCENT,
    (rFactor * RISK_CALCULATION.WEIGHTS.RETRIEVABILITY +
      timeFactor * RISK_CALCULATION.WEIGHTS.TIME +
      stabilityFactor * RISK_CALCULATION.WEIGHTS.STABILITY) *
      100
  );

  let riskLevel: ManagementRiskLike['riskLevel'];
  let recommendedAction: ManagementRiskLike['recommendedAction'];
  if (riskPercent >= RISK_CALCULATION.THRESHOLDS.CRITICAL) {
    riskLevel = 'critical';
    recommendedAction = 'avoid';
  } else if (riskPercent >= RISK_CALCULATION.THRESHOLDS.HIGH) {
    riskLevel = 'high';
    recommendedAction = 'pre-study';
  } else if (riskPercent >= RISK_CALCULATION.THRESHOLDS.MEDIUM) {
    riskLevel = 'medium';
    recommendedAction = 'pre-study';
  } else {
    riskLevel = 'low';
    recommendedAction = 'safe';
  }

  return {
    cardId: '',
    riskLevel,
    riskPercent,
    retrievability,
    stability: state.stability,
    hoursUntilDue,
    recommendedAction,
  };
}

export function calculateDeckManagementRiskForCards(
  cards: Array<{ id: string; state: FsrsStateLike }>,
  riskForState: (state: FsrsStateLike) => ManagementRiskLike
): DeckManagementRiskLike {
  const risks = cards.map((card) => ({ ...riskForState(card.state), cardId: card.id }));
  const totalCards = cards.length;
  const criticalCards = risks.filter((r) => r.riskLevel === 'critical').length;
  const highRiskCards = risks.filter((r) => r.riskLevel === 'high').length;
  const mediumRiskCards = risks.filter((r) => r.riskLevel === 'medium').length;
  const lowRiskCards = risks.filter((r) => r.riskLevel === 'low').length;
  const atRiskCards = criticalCards + highRiskCards + mediumRiskCards;
  const riskPercent =
    totalCards === 0 ? 0 : risks.reduce((sum, risk) => sum + risk.riskPercent, 0) / totalCards;

  return {
    totalCards,
    atRiskCards,
    riskPercent,
    criticalCards,
    highRiskCards,
    mediumRiskCards,
    lowRiskCards,
    recommendedPreStudyCount: criticalCards + highRiskCards,
  };
}

export function applyManagementPenaltyToState(
  state: FsrsStateLike,
  revealedForSeconds: number,
  managementConfig: ManagementConfigLike,
  ops: Ops
): FsrsStateLike {
  if (revealedForSeconds < managementConfig.minRevealSeconds) {
    return state;
  }

  const hoursUntilDue = ops.getElapsedHours(ops.now, state.nextReview);
  const elapsedDays = ops.getElapsedDays(state.lastReview ?? state.nextReview, ops.now);
  const retrievability = ops.calculateRetrievability(elapsedDays, state.stability);
  if (hoursUntilDue > TIME_MULTIPLIERS.PENALTY_THRESHOLD_HOURS) {
    return state;
  }

  let fuzzingHours: number;
  if (managementConfig.adaptiveFuzzing) {
    const baseFuzzing = managementConfig.fuzzingHoursMin;
    let stabilityMultiplier = 1;
    if (state.stability < STABILITY_MULTIPLIERS.LOW_THRESHOLD_DAYS) {
      stabilityMultiplier = Math.max(STABILITY_MULTIPLIERS.LOW_STABILITY_MIN, state.stability);
    } else if (state.stability > STABILITY_MULTIPLIERS.HIGH_THRESHOLD_DAYS) {
      stabilityMultiplier = STABILITY_MULTIPLIERS.HIGH_STABILITY;
    }

    let rMultiplier = 1;
    if (retrievability > RETRIEVABILITY_MULTIPLIERS.HIGH_THRESHOLD) {
      rMultiplier = RETRIEVABILITY_MULTIPLIERS.HIGH_R;
    } else if (retrievability < RETRIEVABILITY_MULTIPLIERS.LOW_THRESHOLD) {
      rMultiplier = RETRIEVABILITY_MULTIPLIERS.LOW_R;
    }

    let timeMultiplier = 1;
    if (hoursUntilDue < TIME_MULTIPLIERS.VERY_SOON_HOURS) {
      timeMultiplier = TIME_MULTIPLIERS.VERY_SOON;
    } else if (hoursUntilDue < TIME_MULTIPLIERS.SOON_HOURS) {
      timeMultiplier = TIME_MULTIPLIERS.SOON;
    }

    fuzzingHours = baseFuzzing * stabilityMultiplier * rMultiplier * timeMultiplier;
    fuzzingHours = Math.min(fuzzingHours, managementConfig.fuzzingHoursMax);
    fuzzingHours = Math.max(fuzzingHours, DEFAULT_MANAGEMENT_CONFIG.FUZZING_HOURS_ABSOLUTE_MIN);
  } else {
    const range = managementConfig.fuzzingHoursMax - managementConfig.fuzzingHoursMin;
    fuzzingHours = managementConfig.fuzzingHoursMin + Math.random() * range;
  }

  return {
    ...state,
    nextReview: ops.addHours(state.nextReview, fuzzingHours),
  };
}

export function getPreStudyCardsByRisk(
  cards: Array<{ id: string; state: FsrsStateLike }>,
  targetRetention: number,
  limit: number,
  riskForState: (state: FsrsStateLike) => ManagementRiskLike,
  ops: Omit<Ops, 'addHours'>
): Array<{ id: string; state: FsrsStateLike; risk: ManagementRiskLike }> {
  return cards
    .map((card) => ({
      id: card.id,
      state: card.state,
      risk: { ...riskForState(card.state), cardId: card.id },
    }))
    .filter((item) => {
      const elapsedDays = ops.getElapsedDays(item.state.lastReview ?? item.state.nextReview, ops.now);
      const retrievability = ops.calculateRetrievability(elapsedDays, item.state.stability);
      return item.risk.riskLevel !== 'low' && retrievability < targetRetention;
    })
    .sort((a, b) => b.risk.riskPercent - a.risk.riskPercent)
    .slice(0, limit);
}
