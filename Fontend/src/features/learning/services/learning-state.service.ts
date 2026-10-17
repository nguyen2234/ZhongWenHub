import type {
  StudentLearningState,
  PracticeAttemptRecord,
  WeakKnowledgeRecord,
  LearningRecommendation,
} from '../types/learning-state.types';
import type {
  UpdateLessonStepProgressPayload,
  CompleteLessonPayload,
  LessonProgressDTO,
} from '../../lesson/types/lesson-progress.types';
import type { PracticeSessionResult } from '../../practice/types';
import type { SRSRating } from '../../vocabulary/types';
import { learningStorageService, getLocalDateString } from './learning-storage.service';
import { analyzeWeakKnowledge } from './weak-knowledge.service';
import { generateRecommendations } from './recommendation.service';
import { awardIdempotentXp, updateLearningStreak, recordStudyTime } from './learning-activity.service';
import {
  recordWordReview,
  completeSrsSession,
  introduceLessonVocabulary,
  addVocabularyToSrs,
  type AddVocabularyPayload,
  type AddVocabularyResult,
} from './learning-srs.service';
import { findLessonMetadata, findNextLessonId } from '../data/curriculumData';

export class LearningStateService {
  private activeState: StudentLearningState;
  private listeners: Set<(state: StudentLearningState) => void> = new Set();

  constructor(initialStudentId: string = 'usr-st-01') {
    this.activeState = learningStorageService.loadLearningState(initialStudentId);
    this.refreshCalculatedFields();

    // Listen for storage events (e.g., other tabs or dev student changes)
    if (typeof window !== 'undefined') {
      window.addEventListener('zwh_learning_state_updated', (e: any) => {
        if (e.detail?.studentId === this.activeState.studentId) {
          this.activeState = e.detail.state;
          this.notifyListeners();
        }
      });
    }
  }

  public getState(): StudentLearningState {
    return { ...this.activeState };
  }

  public getWeakKnowledge(): WeakKnowledgeRecord[] {
    return analyzeWeakKnowledge(this.activeState.exerciseAttempts);
  }

  public getRecommendations(): LearningRecommendation[] {
    const weak = this.getWeakKnowledge();
    return generateRecommendations(this.activeState, weak);
  }

  public subscribe(listener: (state: StudentLearningState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn(this.getState()));
  }

  private commitState(newState: StudentLearningState): void {
    this.activeState = newState;
    learningStorageService.saveLearningState(newState);
    this.notifyListeners();
  }

  private refreshCalculatedFields(): void {
    const weak = analyzeWeakKnowledge(this.activeState.exerciseAttempts);
    this.activeState.weakKnowledgePoints = weak;
  }

  /**
   * Switch the active student identity
   */
  public switchStudent(studentId: string): StudentLearningState {
    this.activeState = learningStorageService.loadLearningState(studentId);
    this.refreshCalculatedFields();
    this.notifyListeners();
    return this.getState();
  }

  /**
   * Select active HSK level
   */
  public selectHskLevel(level: number): StudentLearningState {
    if (level < 1 || level > 9) return this.getState();
    const updated: StudentLearningState = {
      ...this.activeState,
      selectedHskLevel: level,
    };
    this.commitState(updated);
    return updated;
  }

  /**
   * Start or resume a lesson
   */
  public startLesson(lessonId: string): StudentLearningState {
    const existing = this.activeState.lessonProgress[lessonId];
    const lessonMeta = findLessonMetadata(lessonId);

    const progress: LessonProgressDTO = existing || {
      lessonId,
      userId: this.activeState.studentId,
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      maxUnlockedStepIndex: 0,
      quizScore: 0,
      totalQuizQuestions: 5,
      xpEarned: 0,
      updatedAt: new Date().toISOString(),
    };

    let updated = updateLearningStreak(this.activeState);
    updated = {
      ...updated,
      currentLessonId: lessonId,
      selectedHskLevel: lessonMeta?.hskLevel || updated.selectedHskLevel,
      lessonProgress: {
        ...updated.lessonProgress,
        [lessonId]: progress,
      },
    };

    this.commitState(updated);
    return updated;
  }

  /**
   * Update step progress within a lesson
   */
  public updateLessonStep(payload: UpdateLessonStepProgressPayload): StudentLearningState {
    const current = this.activeState.lessonProgress[payload.lessonId] || {
      lessonId: payload.lessonId,
      userId: this.activeState.studentId,
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      maxUnlockedStepIndex: 0,
      quizScore: 0,
      totalQuizQuestions: 5,
      xpEarned: 0,
      updatedAt: new Date().toISOString(),
    };

    const maxUnlocked = Math.max(
      current.maxUnlockedStepIndex,
      payload.maxUnlockedStepIndex ?? payload.currentStepIndex
    );

    const updatedProgress: LessonProgressDTO = {
      ...current,
      status: current.status === 'NOT_STARTED' ? 'IN_PROGRESS' : current.status,
      currentStepIndex: payload.currentStepIndex,
      maxUnlockedStepIndex: maxUnlocked,
      updatedAt: new Date().toISOString(),
    };

    let updated = updateLearningStreak(this.activeState);
    updated = recordStudyTime(updated, 1);

    updated = {
      ...updated,
      currentLessonId: payload.lessonId,
      lessonProgress: {
        ...updated.lessonProgress,
        [payload.lessonId]: updatedProgress,
      },
    };

    this.commitState(updated);
    return updated;
  }

  /**
   * Complete a lesson with quiz score & award XP once
   */
  public completeLesson(payload: CompleteLessonPayload): StudentLearningState {
    const lessonMeta = findLessonMetadata(payload.lessonId);
    const xpReward = payload.xpEarned || lessonMeta?.xpReward || 30;
    const nowIso = new Date().toISOString();
    const todayStr = getLocalDateString();

    const current = this.activeState.lessonProgress[payload.lessonId] || {
      lessonId: payload.lessonId,
      userId: this.activeState.studentId,
      status: 'IN_PROGRESS',
      currentStepIndex: 5,
      maxUnlockedStepIndex: 5,
      quizScore: 0,
      totalQuizQuestions: payload.totalQuizQuestions,
      xpEarned: 0,
      updatedAt: nowIso,
    };

    const updatedProgress: LessonProgressDTO = {
      ...current,
      status: 'COMPLETED',
      currentStepIndex: 5,
      maxUnlockedStepIndex: 5,
      quizScore: payload.quizScore,
      totalQuizQuestions: payload.totalQuizQuestions,
      xpEarned: xpReward,
      completedAt: nowIso,
      updatedAt: nowIso,
    };

    // Prevent duplicate completion ID in completedLessonIds
    const completedSet = new Set(this.activeState.completedLessonIds);
    completedSet.add(payload.lessonId);

    // Award XP idempotently using stable event ID
    const eventId = `lesson_complete_${payload.lessonId}`;
    const { updatedState: stateWithXp } = awardIdempotentXp(
      this.activeState,
      eventId,
      xpReward
    );

    // Introduce vocabulary into SRS
    let updated = introduceLessonVocabulary(stateWithXp, payload.lessonId);

    // Streak update
    updated = updateLearningStreak(updated);
    updated = recordStudyTime(updated, lessonMeta?.durationMinutes || 15);

    // Unlock next lesson
    const nextLessonId = findNextLessonId(payload.lessonId);

    // Update today's daily record with completed lesson
    const daily = updated.dailyActivityHistory[todayStr] || {
      date: todayStr,
      minutes: 0,
      xpEarned: 0,
      completedLessons: [],
      exercisesCompleted: 0,
      reviewsCompleted: 0,
    };

    const completedToday = new Set(daily.completedLessons);
    completedToday.add(payload.lessonId);

    updated = {
      ...updated,
      completedLessonIds: Array.from(completedSet),
      currentLessonId: nextLessonId || payload.lessonId,
      lessonProgress: {
        ...updated.lessonProgress,
        [payload.lessonId]: updatedProgress,
      },
      dailyActivityHistory: {
        ...updated.dailyActivityHistory,
        [todayStr]: {
          ...daily,
          completedLessons: Array.from(completedToday),
        },
      },
    };

    this.commitState(updated);
    return updated;
  }

  /**
   * Reset progress for a lesson (restart)
   */
  public resetLessonProgress(lessonId: string): StudentLearningState {
    const current = this.activeState.lessonProgress[lessonId];
    if (!current) return this.getState();

    const reset: LessonProgressDTO = {
      ...current,
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      updatedAt: new Date().toISOString(),
    };

    const updated: StudentLearningState = {
      ...this.activeState,
      currentLessonId: lessonId,
      lessonProgress: {
        ...this.activeState.lessonProgress,
        [lessonId]: reset,
      },
    };

    this.commitState(updated);
    return updated;
  }

  /**
   * Record a single exercise attempt from practice or lesson quiz
   */
  public recordPracticeAttempt(attempt: PracticeAttemptRecord): StudentLearningState {
    const todayStr = getLocalDateString();
    const updatedAttempts = [...this.activeState.exerciseAttempts, attempt];

    let updated = updateLearningStreak(this.activeState);

    const daily = updated.dailyActivityHistory[todayStr] || {
      date: todayStr,
      minutes: 0,
      xpEarned: 0,
      completedLessons: [],
      exercisesCompleted: 0,
      reviewsCompleted: 0,
    };

    updated = {
      ...updated,
      exerciseAttempts: updatedAttempts,
      dailyActivityHistory: {
        ...updated.dailyActivityHistory,
        [todayStr]: {
          ...daily,
          exercisesCompleted: daily.exercisesCompleted + 1,
        },
      },
    };

    // Re-evaluate weak points
    updated.weakKnowledgePoints = analyzeWeakKnowledge(updated.exerciseAttempts);

    this.commitState(updated);
    return updated;
  }

  /**
   * Record a completed practice session
   */
  public recordPracticeSession(result: PracticeSessionResult): StudentLearningState {
    const todayStr = getLocalDateString();
    const eventId = `practice_session_${result.sessionId}`;

    const { updatedState: withXp } = awardIdempotentXp(
      this.activeState,
      eventId,
      result.xpEarned || 20
    );

    let updated = updateLearningStreak(withXp);
    updated = recordStudyTime(updated, Math.max(2, Math.round(result.timeSpentSeconds / 60)));

    const daily = updated.dailyActivityHistory[todayStr] || {
      date: todayStr,
      minutes: 0,
      xpEarned: 0,
      completedLessons: [],
      exercisesCompleted: 0,
      reviewsCompleted: 0,
    };

    updated = {
      ...updated,
      dailyActivityHistory: {
        ...updated.dailyActivityHistory,
        [todayStr]: {
          ...daily,
          exercisesCompleted: daily.exercisesCompleted + result.totalQuestions,
        },
      },
    };

    this.commitState(updated);
    return updated;
  }

  /**
   * Record a single flashcard rating in SRS
   */
  public recordSrsReview(vocabId: string, rating: SRSRating): StudentLearningState {
    const updated = recordWordReview(this.activeState, vocabId, rating);
    this.commitState(updated);
    return updated;
  }

  /**
   * Complete an SRS session
   */
  public completeSrsSession(sessionXp: number = 30, count: number = 0): StudentLearningState {
    let updated = updateLearningStreak(this.activeState);
    updated = completeSrsSession(updated, sessionXp, count);
    this.commitState(updated);
    return updated;
  }

  /**
   * Add a new vocabulary item into the student's learned/SRS state without fake reviews.
   * Persists to storage and prevents duplicates.
   */
  public addVocabularyWord(payload: AddVocabularyPayload): AddVocabularyResult {
    const result = addVocabularyToSrs(this.activeState, payload);
    if (result.isNew) {
      this.commitState(result.updatedState);
    }
    return result;
  }

  /**
   * Reset all demo progress
   */
  public resetDemoProgress(): StudentLearningState {
    const reset = learningStorageService.resetDemoProgress(this.activeState.studentId);
    this.activeState = reset;
    this.refreshCalculatedFields();
    this.notifyListeners();
    return reset;
  }
}

export const learningStateService = new LearningStateService();
