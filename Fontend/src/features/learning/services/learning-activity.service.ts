import type {
  StudentLearningState,
  DailyActivityRecord,
} from '../types/learning-state.types';
import { getLocalDateString, getYesterdayDateString } from './learning-storage.service';

/**
 * Awards XP idempotently to student state.
 * Returns { state, xpAwarded, alreadyRewarded: boolean }
 */
export function awardIdempotentXp(
  state: StudentLearningState,
  eventId: string,
  amount: number
): { updatedState: StudentLearningState; xpAwarded: number; alreadyRewarded: boolean } {
  if (state.rewardedEventIds.includes(eventId)) {
    return {
      updatedState: state,
      xpAwarded: 0,
      alreadyRewarded: true,
    };
  }

  const todayStr = getLocalDateString();
  const currentHistory = state.dailyActivityHistory[todayStr] || {
    date: todayStr,
    minutes: 0,
    xpEarned: 0,
    completedLessons: [],
    exercisesCompleted: 0,
    reviewsCompleted: 0,
  };

  const updatedDaily: DailyActivityRecord = {
    ...currentHistory,
    xpEarned: currentHistory.xpEarned + amount,
  };

  const updatedState: StudentLearningState = {
    ...state,
    xpTotal: state.xpTotal + amount,
    rewardedEventIds: [...state.rewardedEventIds, eventId],
    dailyActivityHistory: {
      ...state.dailyActivityHistory,
      [todayStr]: updatedDaily,
    },
  };

  return {
    updatedState,
    xpAwarded: amount,
    alreadyRewarded: false,
  };
}

/**
 * Updates learning streak based on local calendar dates
 */
export function updateLearningStreak(
  state: StudentLearningState,
  actionDate: Date = new Date()
): StudentLearningState {
  const todayStr = getLocalDateString(actionDate);
  const yesterdayStr = getYesterdayDateString(actionDate);
  const lastActive = state.lastActivityDate;

  if (lastActive === todayStr) {
    // Already studied today; streak preserved
    return state;
  }

  let newStreak = state.streakDays;

  if (lastActive === yesterdayStr) {
    // Studied yesterday, increments streak
    newStreak = state.streakDays + 1;
  } else if (!lastActive) {
    // First time studying
    newStreak = 1;
  } else {
    // Missed a day or more, resets streak to 1
    newStreak = 1;
  }

  return {
    ...state,
    streakDays: newStreak,
    lastActivityDate: todayStr,
  };
}

/**
 * Records daily study time in minutes
 */
export function recordStudyTime(
  state: StudentLearningState,
  additionalMinutes: number
): StudentLearningState {
  const todayStr = getLocalDateString();
  const existing = state.dailyActivityHistory[todayStr] || {
    date: todayStr,
    minutes: 0,
    xpEarned: 0,
    completedLessons: [],
    exercisesCompleted: 0,
    reviewsCompleted: 0,
  };

  const updated: DailyActivityRecord = {
    ...existing,
    minutes: existing.minutes + additionalMinutes,
  };

  return {
    ...state,
    dailyActivityHistory: {
      ...state.dailyActivityHistory,
      [todayStr]: updated,
    },
  };
}
