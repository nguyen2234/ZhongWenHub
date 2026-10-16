import type {
  StudentLearningState,
  PracticeAttemptRecord,
  DailyActivityRecord,
} from '../types/learning-state.types';
import {
  INITIAL_USER_VOCAB_STATES,
  INITIAL_SRS_STATES,
} from '../../vocabulary/data/vocabularyBank';

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
 * Builds clean default initial state for a student
 */
export function createInitialStudentLearningState(studentId: string = 'usr-st-01'): StudentLearningState {
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

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
   * Safe localStorage get with schema validation and fallback
   */
  loadLearningState(studentId: string): StudentLearningState {
    const key = `${LEARNING_STORAGE_KEY_PREFIX}${studentId}`;
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return createInitialStudentLearningState(studentId);
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        const initial = createInitialStudentLearningState(studentId);
        this.saveLearningState(initial);
        return initial;
      }

      const parsed = JSON.parse(raw);
      if (!this.isValidState(parsed, studentId)) {
        console.warn(`[LearningStorageService] Invalid storage state for ${studentId}, recovering...`);
        const fallback = createInitialStudentLearningState(studentId);
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
      console.error(`[LearningStorageService] Error loading learning state for ${studentId}:`, err);
      return createInitialStudentLearningState(studentId);
    }
  }

  /**
   * Save learning state safely to localStorage
   */
  saveLearningState(state: StudentLearningState): boolean {
    const key = `${LEARNING_STORAGE_KEY_PREFIX}${state.studentId}`;
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
