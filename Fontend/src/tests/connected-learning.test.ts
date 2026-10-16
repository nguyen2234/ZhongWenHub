// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';

// Polyfill window, localStorage, and CustomEvent for the test environment
const mockStorage: Record<string, string> = {};

if (typeof globalThis.localStorage === 'undefined') {
  const localStorageMock = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) {
        delete mockStorage[k];
      }
    },
  };

  // @ts-expect-error polyfilling in test environment
  globalThis.localStorage = localStorageMock;
}

if (typeof globalThis.window === 'undefined') {
  // @ts-expect-error polyfilling in test environment
  globalThis.window = {
    localStorage: globalThis.localStorage,
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

if (typeof globalThis.CustomEvent === 'undefined') {
  // @ts-expect-error polyfilling in test environment
  globalThis.CustomEvent = class CustomEvent {
    type: string;
    detail: unknown;
    constructor(type: string, params?: { detail?: unknown }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

import {
  createInitialStudentLearningState,
  learningStorageService,
  LEARNING_STORAGE_KEY_PREFIX,
  getLocalDateString,
  getYesterdayDateString,
} from '../features/learning/services/learning-storage.service';
import { learningStateService } from '../features/learning/services/learning-state.service';
import { analyzeWeakKnowledge } from '../features/learning/services/weak-knowledge.service';
import { generateRecommendations } from '../features/learning/services/recommendation.service';
import { awardIdempotentXp, updateLearningStreak } from '../features/learning/services/learning-activity.service';
import { recordWordReview, completeSrsSession } from '../features/learning/services/learning-srs.service';
import { findLessonMetadata, findNextLessonId } from '../features/learning/data/curriculumData';
import type { PracticeAttemptRecord } from '../features/learning/types/learning-state.types';

describe('Phase FE-3: Connected Learning Experience', () => {
  const testStudentId = 'usr-test-01';

  beforeEach(() => {
    // Clear storage before each test
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
    learningStateService.switchStudent(testStudentId);
  });

  // -------------------------------------------------------------
  // 1. First-time state initialization & Hydration
  // -------------------------------------------------------------
  describe('1. State Initialization & Persistence', () => {
    it('initializes a valid default student state with HSK curriculum data', () => {
      const state = createInitialStudentLearningState(testStudentId);
      expect(state.studentId).toBe(testStudentId);
      expect(state.schemaVersion).toBe(1);
      expect(state.selectedHskLevel).toBe(2);
      expect(state.completedLessonIds.length).toBeGreaterThan(0);
      expect(state.xpTotal).toBeGreaterThan(0);
      expect(state.streakDays).toBeGreaterThan(0);
    });

    it('persists and loads state correctly from localStorage', () => {
      const state = createInitialStudentLearningState(testStudentId);
      state.xpTotal = 9999;
      state.selectedHskLevel = 3;

      const saved = learningStorageService.saveLearningState(state);
      expect(saved).toBe(true);

      const loaded = learningStorageService.loadLearningState(testStudentId);
      expect(loaded.xpTotal).toBe(9999);
      expect(loaded.selectedHskLevel).toBe(3);
    });

    it('gracefully recovers from corrupted or invalid JSON in storage', () => {
      const key = `${LEARNING_STORAGE_KEY_PREFIX}${testStudentId}`;
      mockStorage[key] = 'INVALID_JSON_CORRUPTED{{{';

      const recovered = learningStorageService.loadLearningState(testStudentId);
      expect(recovered.studentId).toBe(testStudentId);
      expect(recovered.schemaVersion).toBe(1);
      expect(recovered.xpTotal).toBeGreaterThan(0);
    });

    it('recovers from state with missing required fields', () => {
      const key = `${LEARNING_STORAGE_KEY_PREFIX}${testStudentId}`;
      mockStorage[key] = JSON.stringify({
        schemaVersion: 1,
        studentId: testStudentId,
      });

      const recovered = learningStorageService.loadLearningState(testStudentId);
      expect(recovered.completedLessonIds).toBeDefined();
      expect(recovered.xpTotal).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 2. Lesson Flow: Start, Resume, Complete & Unlocking
  // -------------------------------------------------------------
  describe('2. Connected Lesson Flow & Unlocking', () => {
    it('starts a lesson and initializes step progress', () => {
      learningStateService.startLesson('les-8');
      const state = learningStateService.getState();
      expect(state.currentLessonId).toBe('les-8');
      expect(state.lessonProgress['les-8']).toBeDefined();
      expect(state.lessonProgress['les-8'].status).toBe('IN_PROGRESS');
    });

    it('updates lesson step progress', () => {
      learningStateService.startLesson('les-8');
      learningStateService.updateLessonStep({
        lessonId: 'les-8',
        currentStepIndex: 3,
        maxUnlockedStepIndex: 3,
      });

      const state = learningStateService.getState();
      expect(state.lessonProgress['les-8'].currentStepIndex).toBe(3);
    });

    it('completes a lesson, marks status completed and unlocks next lesson', () => {
      const initialCompleted = learningStateService.getState().completedLessonIds;
      const initialXP = learningStateService.getState().xpTotal;

      learningStateService.completeLesson({
        lessonId: 'les-8',
        quizScore: 90,
        totalQuizQuestions: 5,
        xpEarned: 50,
      });

      const updated = learningStateService.getState();
      expect(updated.completedLessonIds).toContain('les-8');
      expect(updated.lessonProgress['les-8'].status).toBe('COMPLETED');
      expect(updated.completedLessonIds.length).toBe(initialCompleted.length + 1);
      expect(updated.xpTotal).toBe(initialXP + 50);

      // Verify next lesson is unlocked (les-9 is next after les-8)
      const nextId = findNextLessonId('les-8');
      expect(nextId).toBe('les-9');
      expect(updated.currentLessonId).toBe('les-9');
    });

    it('allows restarting a lesson by resetting its progress', () => {
      learningStateService.resetLessonProgress('les-8');
      const state = learningStateService.getState();
      expect(state.lessonProgress['les-8'].currentStepIndex).toBe(0);
      expect(state.lessonProgress['les-8'].status).toBe('IN_PROGRESS');
    });
  });

  // -------------------------------------------------------------
  // 3. XP Idempotency & Duplicate Completion Prevention
  // -------------------------------------------------------------
  describe('3. XP Idempotency & Reward Safety', () => {
    it('awards XP only once per unique event ID', () => {
      let state = createInitialStudentLearningState(testStudentId);
      const initialXP = state.xpTotal;

      // First award
      const res1 = awardIdempotentXp(state, 'test_event_unique_01', 50);
      expect(res1.alreadyRewarded).toBe(false);
      expect(res1.xpAwarded).toBe(50);
      expect(res1.updatedState.xpTotal).toBe(initialXP + 50);
      expect(res1.updatedState.rewardedEventIds).toContain('test_event_unique_01');

      state = res1.updatedState;

      // Duplicate award attempt with same event ID
      const res2 = awardIdempotentXp(state, 'test_event_unique_01', 50);
      expect(res2.alreadyRewarded).toBe(true);
      expect(res2.xpAwarded).toBe(0);
      expect(res2.updatedState.xpTotal).toBe(initialXP + 50); // XP remains unchanged
    });

    it('does not re-award XP when completing an already completed lesson', () => {
      // les-1 is already in initial completed lessons and rewardedEventIds
      const stateBefore = learningStateService.getState();
      const xpBefore = stateBefore.xpTotal;

      learningStateService.completeLesson({
        lessonId: 'les-1',
        quizScore: 100,
        totalQuizQuestions: 5,
        xpEarned: 50,
      });

      const stateAfter = learningStateService.getState();
      expect(stateAfter.xpTotal).toBe(xpBefore);
    });
  });

  // -------------------------------------------------------------
  // 4. Streak Calculation & Date Boundaries
  // -------------------------------------------------------------
  describe('4. Streak Date Boundaries', () => {
    it('maintains streak when activity occurs on the same day', () => {
      const state = createInitialStudentLearningState(testStudentId);
      const today = getLocalDateString();
      state.lastActivityDate = today;
      state.streakDays = 5;

      const updated = updateLearningStreak(state);
      expect(updated.streakDays).toBe(5);
    });

    it('increments streak when activity occurs on the consecutive next day', () => {
      const state = createInitialStudentLearningState(testStudentId);
      const yesterday = getYesterdayDateString();
      state.lastActivityDate = yesterday;
      state.streakDays = 5;

      const updated = updateLearningStreak(state);
      expect(updated.streakDays).toBe(6);
      expect(updated.lastActivityDate).toBe(getLocalDateString());
    });

    it('resets streak to 1 when activity occurs after a gap of more than 1 day', () => {
      const state = createInitialStudentLearningState(testStudentId);
      state.lastActivityDate = '2026-01-01'; // old date
      state.streakDays = 12;

      const updated = updateLearningStreak(state);
      expect(updated.streakDays).toBe(1);
      expect(updated.lastActivityDate).toBe(getLocalDateString());
    });
  });

  // -------------------------------------------------------------
  // 5. Practice Attempts & Weak Knowledge Analysis
  // -------------------------------------------------------------
  describe('5. Practice Attempts & Weak Knowledge Analysis', () => {
    it('records practice attempts into state', () => {
      const attempt: PracticeAttemptRecord = {
        id: 'att-1',
        studentId: testStudentId,
        exerciseId: 'ex-tone-01',
        questionId: 'q-1',
        knowledgePointId: 'kp-tone-3',
        topicTitle: 'Biến điệu thanh 3 (Tone 3 Sandhi)',
        category: 'grammar',
        hskLevel: 1,
        userAnswer: 'thanh 1',
        isCorrect: false,
        attemptedAt: new Date().toISOString(),
      };

      learningStateService.recordPracticeAttempt(attempt);
      const state = learningStateService.getState();
      const found = state.exerciseAttempts.find((a) => a.questionId === 'q-1');
      expect(found).toBeDefined();
      expect(found?.isCorrect).toBe(false);
    });

    it('identifies WEAK knowledge candidate when accuracy is low and attempts are sufficient', () => {
      const attempts: PracticeAttemptRecord[] = [
        {
          id: 'att-1',
          studentId: testStudentId,
          exerciseId: 'ex-1',
          questionId: 'q-1',
          knowledgePointId: 'kp-grammar-le',
          topicTitle: 'Trợ từ 了 (biểu thị hoàn thành)',
          category: 'grammar',
          hskLevel: 2,
          userAnswer: 'A',
          isCorrect: false,
          attemptedAt: '2026-10-15T10:00:00Z',
        },
        {
          id: 'att-2',
          studentId: testStudentId,
          exerciseId: 'ex-1',
          questionId: 'q-2',
          knowledgePointId: 'kp-grammar-le',
          topicTitle: 'Trợ từ 了 (biểu thị hoàn thành)',
          category: 'grammar',
          hskLevel: 2,
          userAnswer: 'B',
          isCorrect: false,
          attemptedAt: '2026-10-15T10:05:00Z',
        },
        {
          id: 'att-3',
          studentId: testStudentId,
          exerciseId: 'ex-1',
          questionId: 'q-3',
          knowledgePointId: 'kp-grammar-le',
          topicTitle: 'Trợ từ 了 (biểu thị hoàn thành)',
          category: 'grammar',
          hskLevel: 2,
          userAnswer: 'C',
          isCorrect: true,
          attemptedAt: '2026-10-15T10:10:00Z',
        },
      ];

      const records = analyzeWeakKnowledge(attempts);
      const lePoint = records.find((r) => r.knowledgePointId === 'kp-grammar-le');
      expect(lePoint).toBeDefined();
      expect(lePoint?.masteryLevel).toBe('WEAK');
      expect(lePoint?.accuracy).toBe(33); // 1/3 correct
      expect(lePoint?.evidence).toContain('2/3');
    });

    it('excludes topics with insufficient data from active weak knowledge focus', () => {
      const attempts: PracticeAttemptRecord[] = [
        {
          id: 'att-single',
          studentId: testStudentId,
          exerciseId: 'ex-1',
          questionId: 'q-single',
          knowledgePointId: 'kp-rare',
          topicTitle: 'Chữ Hán hiếm',
          category: 'vocabulary',
          hskLevel: 2,
          userAnswer: 'A',
          isCorrect: false,
          attemptedAt: '2026-10-15T10:00:00Z',
        },
      ];

      const records = analyzeWeakKnowledge(attempts);
      // Only 1 attempt (< minAttemptsForEvidence: 2), so not surfaced as WEAK
      const rarePoint = records.find((r) => r.knowledgePointId === 'kp-rare');
      expect(rarePoint).toBeUndefined();
    });
  });

  // -------------------------------------------------------------
  // 6. SRS Spaced Repetition Integration
  // -------------------------------------------------------------
  describe('6. Spaced Repetition System (SRS) Integration', () => {
    it('updates vocabulary SRS rating and interval safely', () => {
      const state = createInitialStudentLearningState(testStudentId);
      const wordId = 'w-1'; // '喝'

      const updated = recordWordReview(state, wordId, 'good');
      const vocab = updated.userVocabStates[wordId];
      const srs = updated.userSrsStates[wordId];

      expect(vocab).toBeDefined();
      expect(srs).toBeDefined();
      expect(vocab.reviewCount).toBeGreaterThanOrEqual(1);
      expect(srs.interval).toBeGreaterThan(0);
    });

    it('awards XP idempotently for SRS session completion', () => {
      const state = createInitialStudentLearningState(testStudentId);
      const initialXP = state.xpTotal;

      const updated = completeSrsSession(state, 30, 10);
      expect(updated.xpTotal).toBe(initialXP + 30);
    });
  });

  // -------------------------------------------------------------
  // 7. Personalized Recommendations Priority
  // -------------------------------------------------------------
  describe('7. Explainable Recommendation Engine', () => {
    it('prioritizes overdue SRS review when due words exist', () => {
      const state = createInitialStudentLearningState(testStudentId);
      const recs = generateRecommendations(state);
      expect(recs.length).toBeGreaterThan(0);
      // Top recommendation should be SRS review or weak knowledge
      const srsRec = recs.find((r) => r.category === 'srs-due');
      if (srsRec) {
        expect(srsRec.priority).toBe(1);
        expect(srsRec.destinationRoute).toBe('/srs-review');
      }
    });

    it('provides explainable title, reason and valid route for every recommendation', () => {
      const state = createInitialStudentLearningState(testStudentId);
      const recs = generateRecommendations(state);

      recs.forEach((rec) => {
        expect(rec.title).toBeTruthy();
        expect(rec.reason).toBeTruthy();
        expect(rec.actionLabel).toBeTruthy();
        expect(rec.destinationRoute.startsWith('/')).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------
  // 8. Demo Progress Reset
  // -------------------------------------------------------------
  describe('8. Demo Progress Reset', () => {
    it('resets progress back to default state cleanly', () => {
      // Complete lesson 8 first
      learningStateService.completeLesson({
        lessonId: 'les-8',
        quizScore: 100,
        totalQuizQuestions: 5,
        xpEarned: 50,
      });
      expect(learningStateService.getState().completedLessonIds).toContain('les-8');

      // Reset
      learningStateService.resetDemoProgress();
      const resetState = learningStateService.getState();
      expect(resetState.completedLessonIds).not.toContain('les-8');
      expect(resetState.completedLessonIds).toContain('les-7');
    });
  });

  // -------------------------------------------------------------
  // 9. Curriculum Data & Prerequisite Navigation
  // -------------------------------------------------------------
  describe('9. Curriculum Data & Prerequisite Navigation', () => {
    it('finds lesson metadata across HSK 1 to HSK 7-9', () => {
      const hsk1Lesson = findLessonMetadata('les-hsk1-1');
      expect(hsk1Lesson).toBeDefined();
      expect(hsk1Lesson?.hskLevel).toBe(1);

      const hsk2Lesson = findLessonMetadata('les-1');
      expect(hsk2Lesson).toBeDefined();
      expect(hsk2Lesson?.hskLevel).toBe(2);

      const hsk7Lesson = findLessonMetadata('les-hsk7-1');
      expect(hsk7Lesson).toBeDefined();
      expect(hsk7Lesson?.hskLevel).toBe(7);
    });

    it('identifies sequential next lesson id', () => {
      expect(findNextLessonId('les-1')).toBe('les-2');
      expect(findNextLessonId('les-7')).toBe('les-8');
      expect(findNextLessonId('les-14')).toBe('les-hsk3-1');
    });
  });
});
