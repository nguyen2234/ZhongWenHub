import type {
  StudentLearningState,
  PracticeAttemptRecord,
  DailyActivityRecord,
} from '../types/learning-state.types';
import {
  INITIAL_USER_VOCAB_STATES,
  INITIAL_SRS_STATES,
} from '../../vocabulary/data/vocabularyBank';
import { isProductionEnvironment } from '../../../core/api/client/api-config';

export const LEARNING_STORAGE_KEY_PREFIX = 'zwh_learning_state_v1_';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Format local Date to 'YYYY-MM-DD' without UTC shift
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the previous day string 'YYYY-MM-DD'
 */
export function getYesterdayDateString(d: Date = new Date()): string {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  return getLocalDateString(prev);
}

/**
 * Builds clean unauthenticated empty state for a guest or unauthenticated session.
 * Guarantees zero demo leaks, 0 XP, 0 streak, and empty lesson progress.
 */
export function createEmptyStudentLearningState(studentId: string = ''): StudentLearningState {
  const todayStr = getLocalDateString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    studentId: studentId || '',
    selectedHskLevel: 1,
    currentLessonId: 'les-1',
    completedLessonIds: [],
    lessonProgress: {},
    exerciseAttempts: [],
    userVocabStates: {},
    userSrsStates: {},
    weakKnowledgePoints: [],
    xpTotal: 0,
    rewardedEventIds: [],
    streakDays: 0,
    lastActivityDate: todayStr,
    dailyGoal: {
      targetMinutes: 30,
      targetXp: 50,
    },
    dailyActivityHistory: {},
  };
}

/**
 * Builds clean default initial state for a student.
 * If studentId is null, empty or unauthenticated, returns clean empty state.
 */
export function createInitialStudentLearningState(studentId: string = ''): StudentLearningState {
  if (!studentId || !studentId.trim()) {
    return createEmptyStudentLearningState('');
  }

  const cleanId = studentId.trim();
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  const isDemoFixtureUser = !isProductionEnvironment() && (cleanId === 'usr-st-01' || cleanId === 'usr-test-01');

  if (!isDemoFixtureUser) {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      studentId: cleanId,
      selectedHskLevel: 1,
      currentLessonId: 'les-1',
      completedLessonIds: [],
      lessonProgress: {
        'les-1': {
          lessonId: 'les-1',
          userId: cleanId,
          status: 'NOT_STARTED',
          currentStepIndex: 0,
          maxUnlockedStepIndex: 0,
          quizScore: 0,
          totalQuizQuestions: 5,
          xpEarned: 0,
          updatedAt: new Date().toISOString(),
        },
      },
      exerciseAttempts: [],
      userVocabStates: {},
      userSrsStates: {},
      weakKnowledgePoints: [],
      xpTotal: 0,
      rewardedEventIds: [],
      streakDays: 0,
      lastActivityDate: todayStr,
      dailyGoal: {
        targetMinutes: 30,
        targetXp: 50,
      },
      dailyActivityHistory: {},
    };
  }

  // Initial 7-day demo study history
  const initialHistory: Record<string, DailyActivityRecord> = {
    [todayStr]: {
      date: todayStr,
      minutes: 18,
      xpEarned: 65,
      completedLessons: [],
      exercisesCompleted: 4,
      reviewsCompleted: 0,
    },
    [yesterdayStr]: {
      date: yesterdayStr,
      minutes: 45,
      xpEarned: 110,
      completedLessons: ['les-7'],
      exercisesCompleted: 12,
      reviewsCompleted: 18,
    },
  };

  // Pre-seeded practice attempts for realistic adaptive analysis
  const initialAttempts: PracticeAttemptRecord[] = [
    {
      id: 'att-seed-1',
      studentId,
      exerciseId: 'ex-p1',
      knowledgePointId: 'gp-xiang',
      topicTitle: 'Cấu trúc 想 + Động từ',
      category: 'grammar',
      hskLevel: 2,
      userAnswer: '想',
      isCorrect: true,
      attemptedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'att-seed-2',
      studentId,
      exerciseId: 'ex-p1',
      knowledgePointId: 'gp-xiang',
      topicTitle: 'Cấu trúc 想 + Động từ',
      category: 'grammar',
      hskLevel: 2,
      userAnswer: '要',
      isCorrect: false,
      attemptedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'att-seed-3',
      studentId,
      exerciseId: 'ex-p2',
      knowledgePointId: 'gp-xiang',
      topicTitle: 'Cấu trúc 想 + Động từ',
      category: 'grammar',
      hskLevel: 2,
      userAnswer: '没想',
      isCorrect: false,
      attemptedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'att-seed-4',
      studentId,
      exerciseId: 'ex-p4',
      knowledgePointId: 'gp-bei',
      topicTitle: 'Lượng từ 杯 (bēi)',
      category: 'grammar',
      hskLevel: 2,
      userAnswer: '杯',
      isCorrect: true,
      attemptedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    studentId,
    selectedHskLevel: 2,
    currentLessonId: 'les-8',
    completedLessonIds: ['les-1', 'les-2', 'les-3', 'les-4', 'les-5', 'les-6', 'les-7'],
    lessonProgress: {
      'les-8': {
        lessonId: 'les-8',
        userId: studentId,
        status: 'IN_PROGRESS',
        currentStepIndex: 3,
        maxUnlockedStepIndex: 4,
        quizScore: 0,
        totalQuizQuestions: 5,
        xpEarned: 0,
        updatedAt: new Date().toISOString(),
      },
    },
    exerciseAttempts: initialAttempts,
    userVocabStates: { ...INITIAL_USER_VOCAB_STATES },
    userSrsStates: { ...INITIAL_SRS_STATES },
    weakKnowledgePoints: [],
    xpTotal: 2180,
    rewardedEventIds: [
      'seed_welcome_xp',
      'lesson_complete_les-1',
      'lesson_complete_les-2',
      'lesson_complete_les-3',
      'lesson_complete_les-4',
      'lesson_complete_les-5',
      'lesson_complete_les-6',
      'lesson_complete_les-7',
    ],
    streakDays: 8,
    lastActivityDate: todayStr,
    dailyGoal: {
      targetMinutes: 30,
      targetXp: 100,
    },
    dailyActivityHistory: initialHistory,
  };
}

export class LearningStorageService {
  /**
   * Safe localStorage get with schema validation and fallback.
   * If studentId is null/empty, strictly returns clean empty unauthenticated state.
   */
  loadLearningState(studentId: string): StudentLearningState {
    if (!studentId || !studentId.trim()) {
      return createEmptyStudentLearningState('');
    }

    const cleanId = studentId.trim();
    const key = `${LEARNING_STORAGE_KEY_PREFIX}${cleanId}`;
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return createInitialStudentLearningState(cleanId);
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        const initial = createInitialStudentLearningState(cleanId);
        this.saveLearningState(initial);
        return initial;
      }

      const parsed = JSON.parse(raw);
      if (!this.isValidState(parsed, cleanId)) {
        console.warn(`[LearningStorageService] Invalid storage state for ${cleanId}, recovering...`);
        const fallback = createInitialStudentLearningState(cleanId);
        this.saveLearningState(fallback);
        return fallback;
      }

      // Check migration if schemaVersion is older
      if (parsed.schemaVersion < CURRENT_SCHEMA_VERSION) {
        const migrated = this.migrateState(parsed);
        this.saveLearningState(migrated);
        return migrated;
      }

      return parsed as StudentLearningState;
    } catch (err) {
      console.error(`[LearningStorageService] Error loading learning state for ${cleanId}:`, err);
      return createInitialStudentLearningState(cleanId);
    }
  }

  /**
   * Save learning state safely to localStorage.
   * Never persists unauthenticated empty state.
   */
  saveLearningState(state: StudentLearningState): boolean {
    if (!state.studentId || !state.studentId.trim()) {
      return false;
    }

    const key = `${LEARNING_STORAGE_KEY_PREFIX}${state.studentId.trim()}`;
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      const serialized = JSON.stringify(state);
      window.localStorage.setItem(key, serialized);

      // Dispatch event to keep tabs/components in sync
      window.dispatchEvent(
        new CustomEvent('zwh_learning_state_updated', {
          detail: { studentId: state.studentId, state },
        })
      );
      return true;
    } catch (err) {
      console.error(`[LearningStorageService] Failed to save state for ${state.studentId}:`, err);
      return false;
    }
  }

  /**
   * Reset progress back to initial demo state
   */
  resetDemoProgress(studentId: string): StudentLearningState {
    const fresh = createInitialStudentLearningState(studentId);
    this.saveLearningState(fresh);
    return fresh;
  }

  /**
   * Validate state structure
   */
  private isValidState(obj: any, expectedStudentId: string): boolean {
    if (!obj || typeof obj !== 'object') return false;
    if (obj.studentId !== expectedStudentId) return false;
    if (typeof obj.schemaVersion !== 'number') return false;
    if (!Array.isArray(obj.completedLessonIds)) return false;
    if (typeof obj.xpTotal !== 'number') return false;
    if (typeof obj.streakDays !== 'number') return false;
    if (!obj.lessonProgress || typeof obj.lessonProgress !== 'object') return false;
    return true;
  }

  /**
   * Schema migration handler for future upgrades
   */
  private migrateState(oldState: any): StudentLearningState {
    return {
      ...createInitialStudentLearningState(oldState.studentId),
      ...oldState,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };
  }
}

export const learningStorageService = new LearningStorageService();
