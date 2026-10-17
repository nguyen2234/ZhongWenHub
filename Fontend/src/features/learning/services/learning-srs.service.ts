import type {
  StudentLearningState,
  DailyActivityRecord,
} from '../types/learning-state.types';
import type { SRSRating, SRSState, UserVocabularyState } from '../../vocabulary/types';
import { calculateNextSRSState } from '../../vocabulary/srsEngine';
import { getLocalDateString } from './learning-storage.service';
import { awardIdempotentXp } from './learning-activity.service';
import { findLessonMetadata } from '../data/curriculumData';

/**
 * Record a single word rating during an SRS review session.
 * Uses the existing calculateNextSRSState engine without replacing it.
 */
export function recordWordReview(
  state: StudentLearningState,
  vocabId: string,
  rating: SRSRating
): StudentLearningState {
  const currentSrsState: SRSState = state.userSrsStates[vocabId] || {
    vocabularyId: vocabId,
    stability: 1.0,
    difficulty: 4.0,
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
  };

  const currentVocabState: UserVocabularyState = state.userVocabStates[vocabId] || {
    vocabularyId: vocabId,
    status: 'learning',
    firstLearnedAt: getLocalDateString(),
    lastReviewedAt: getLocalDateString(),
    nextReviewAt: getLocalDateString(),
    reviewCount: 0,
    correctCount: 0,
    isDueToday: true,
  };

  // Run decoupled calculation engine
  const calculation = calculateNextSRSState(currentSrsState, rating);
  const nextDueDateStr = getLocalDateString(calculation.nextReviewDate);
  const isCorrect = rating !== 'again';

  const updatedSrsState: SRSState = calculation.nextState;

  // Determine updated mastery status
  let newStatus: UserVocabularyState['status'] = currentVocabState.status;
  if (updatedSrsState.repetitions >= 5 && updatedSrsState.interval >= 14) {
    newStatus = 'mastered';
  } else if (updatedSrsState.repetitions >= 2) {
    newStatus = 'reviewing';
  } else {
    newStatus = 'learning';
  }

  const todayStr = getLocalDateString();
  const isStillDueToday = nextDueDateStr <= todayStr;

  const updatedVocabState: UserVocabularyState = {
    ...currentVocabState,
    status: newStatus,
    lastReviewedAt: todayStr,
    nextReviewAt: nextDueDateStr,
    reviewCount: currentVocabState.reviewCount + 1,
    correctCount: currentVocabState.correctCount + (isCorrect ? 1 : 0),
    isDueToday: isStillDueToday,
  };

  return {
    ...state,
    userSrsStates: {
      ...state.userSrsStates,
      [vocabId]: updatedSrsState,
    },
    userVocabStates: {
      ...state.userVocabStates,
      [vocabId]: updatedVocabState,
    },
  };
}

/**
 * Finalize an entire SRS session, awarding session XP and updating daily metrics
 */
export function completeSrsSession(
  state: StudentLearningState,
  sessionXp: number = 30,
  wordsReviewedCount: number = 0
): StudentLearningState {
  const todayStr = getLocalDateString();
  const eventId = `srs_session_${todayStr}_${Date.now()}`;

  // Award XP idempotently
  const { updatedState } = awardIdempotentXp(state, eventId, sessionXp);

  const existingDaily = updatedState.dailyActivityHistory[todayStr] || {
    date: todayStr,
    minutes: 0,
    xpEarned: 0,
    completedLessons: [],
    exercisesCompleted: 0,
    reviewsCompleted: 0,
  };

  const updatedDaily: DailyActivityRecord = {
    ...existingDaily,
    reviewsCompleted: existingDaily.reviewsCompleted + wordsReviewedCount,
    minutes: existingDaily.minutes + Math.max(3, Math.round(wordsReviewedCount * 0.5)),
  };

  return {
    ...updatedState,
    dailyActivityHistory: {
      ...updatedState.dailyActivityHistory,
      [todayStr]: updatedDaily,
    },
  };
}

/**
 * When a lesson is completed, introduce its vocabulary to the SRS queue
 */
export function introduceLessonVocabulary(
  state: StudentLearningState,
  lessonId: string
): StudentLearningState {
  const lessonMeta = findLessonMetadata(lessonId);
  if (!lessonMeta || !lessonMeta.vocabularyIds || lessonMeta.vocabularyIds.length === 0) {
    return state;
  }

  const todayStr = getLocalDateString();
  const newUserVocabStates = { ...state.userVocabStates };
  const newUserSrsStates = { ...state.userSrsStates };

  lessonMeta.vocabularyIds.forEach((vId) => {
    if (!newUserVocabStates[vId]) {
      newUserVocabStates[vId] = {
        vocabularyId: vId,
        status: 'learning',
        firstLearnedAt: todayStr,
        lastReviewedAt: todayStr,
        nextReviewAt: todayStr,
        reviewCount: 0,
        correctCount: 0,
        isDueToday: true, // eligible for review immediately or next cycle
      };
    }
    if (!newUserSrsStates[vId]) {
      newUserSrsStates[vId] = {
        vocabularyId: vId,
        stability: 1.0,
        difficulty: 4.0,
        interval: 1,
        repetitions: 1,
        easeFactor: 2.5,
      };
    }
  });

  return {
    ...state,
    userVocabStates: newUserVocabStates,
    userSrsStates: newUserSrsStates,
  };
}

export interface AddVocabularyPayload {
  vocabularyId?: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel?: number;
  source?: string;
}

export interface AddVocabularyResult {
  updatedState: StudentLearningState;
  isNew: boolean;
  vocabularyId: string;
}

/**
 * Add a new vocabulary item into the student's learned/SRS state without fake reviews.
 * Safely guards against duplicates (by ID or matching custom Hanzi).
 */
export function addVocabularyToSrs(
  state: StudentLearningState,
  payload: AddVocabularyPayload
): AddVocabularyResult {
  const vId = payload.vocabularyId || `vocab-custom-${encodeURIComponent(payload.hanzi.trim())}`;

  // Check duplicate: check exact ID or existing custom ID for the same Hanzi
  const isAlreadySaved = Boolean(
    state.userVocabStates[vId] ||
    state.userVocabStates[`vocab-custom-${encodeURIComponent(payload.hanzi.trim())}`]
  );

  if (isAlreadySaved) {
    return {
      updatedState: state,
      isNew: false,
      vocabularyId: vId,
    };
  }

  const todayStr = getLocalDateString();
  const newVocabState: UserVocabularyState = {
    vocabularyId: vId,
    status: 'learning',
    firstLearnedAt: todayStr,
    lastReviewedAt: todayStr,
    nextReviewAt: todayStr,
    reviewCount: 0,
    correctCount: 0,
    isDueToday: true,
  };

  const newSrsState: SRSState = {
    vocabularyId: vId,
    stability: 1.0,
    difficulty: 4.0,
    interval: 1,
    repetitions: 0, // 0 repetitions: fresh word waiting for first review
    easeFactor: 2.5,
  };

  const updatedState: StudentLearningState = {
    ...state,
    userVocabStates: {
      ...state.userVocabStates,
      [vId]: newVocabState,
    },
    userSrsStates: {
      ...state.userSrsStates,
      [vId]: newSrsState,
    },
  };

  return {
    updatedState,
    isNew: true,
    vocabularyId: vId,
  };
}
