import { type SRSRating, type SRSState } from './types';

/**
 * Decoupled Spaced Repetition System (SRS) Calculation Engine
 * Designed to emulate SM-2 / FSRS principles without binding UI to fixed day values.
 * Allows replacing with an API endpoint or advanced FSRS library without touching the UI.
 */

export interface SRSCalculationResult {
  nextState: SRSState;
  nextReviewDate: Date;
  predictedIntervalLabel: string;
}

/**
 * Predict interval labels for all 4 ratings to display on buttons
 */
export function predictIntervalLabels(currentState: SRSState): Record<SRSRating, string> {
  return {
    again: formatIntervalLabel(calculateIntervalForRating(currentState, 'again')),
    hard: formatIntervalLabel(calculateIntervalForRating(currentState, 'hard')),
    good: formatIntervalLabel(calculateIntervalForRating(currentState, 'good')),
    easy: formatIntervalLabel(calculateIntervalForRating(currentState, 'easy')),
  };
}

/**
 * Calculate next SRS interval (in fractional days) based on rating
 */
function calculateIntervalForRating(state: SRSState, rating: SRSRating): number {
  const currentInterval = Math.max(1, state.interval || 1);
  const currentReps = state.repetitions || 0;
  const ease = state.easeFactor || 2.5;

  switch (rating) {
    case 'again':
      // Reset or lapse to short interval (~10 mins / 0.01 day)
      return 0.01;
    case 'hard':
      // Progress slightly or repeat at ~1.2x interval
      if (currentReps === 0) return 1;
      return Math.round(currentInterval * 1.2);
    case 'good':
      // Normal progression based on ease factor
      if (currentReps === 0) return 1;
      if (currentReps === 1) return 3;
      return Math.round(currentInterval * ease);
    case 'easy':
      // Accelerated progression
      if (currentReps === 0) return 4;
      return Math.round(currentInterval * ease * 1.4);
  }
}

/**
 * Human-readable interval string (e.g., "<10 phút", "1 ngày", "3 ngày", "2 tuần")
 */
export function formatIntervalLabel(days: number): string {
  if (days < 0.05) return '< 10 phút';
  if (days < 1) return `${Math.round(days * 24)} giờ`;
  if (days === 1) return '1 ngày';
  if (days < 7) return `${Math.round(days)} ngày`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} tuần`;
  }
  const months = Math.round(days / 30);
  return `${months} tháng`;
}

/**
 * Compute the next SRS state and next review timestamp
 */
export function calculateNextSRSState(
  currentState: SRSState,
  rating: SRSRating
): SRSCalculationResult {
  const nextInterval = calculateIntervalForRating(currentState, rating);
  const isLapsed = rating === 'again';

  // Adjust ease factor
  let newEase = currentState.easeFactor || 2.5;
  if (rating === 'again') newEase = Math.max(1.3, newEase - 0.2);
  else if (rating === 'hard') newEase = Math.max(1.3, newEase - 0.15);
  else if (rating === 'easy') newEase = Math.min(3.0, newEase + 0.15);

  const nextReps = isLapsed ? 0 : (currentState.repetitions || 0) + 1;

  const nextState: SRSState = {
    ...currentState,
    interval: nextInterval,
    repetitions: nextReps,
    easeFactor: Number(newEase.toFixed(2)),
    stability: Number((nextInterval * 1.1).toFixed(2)),
  };

  const nextReviewDate = new Date();
  nextReviewDate.setTime(nextReviewDate.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    nextState,
    nextReviewDate,
    predictedIntervalLabel: formatIntervalLabel(nextInterval),
  };
}
