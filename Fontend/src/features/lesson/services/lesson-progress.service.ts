import type {
  LessonProgressDTO,
  UpdateLessonStepProgressPayload,
  CompleteLessonPayload,
} from '../types/lesson-progress.types';

/**
 * Service for managing user lesson progress (LessonProgressDTO).
 * Simulates future Spring Boot REST API: /api/v1/user/lesson-progress
 *
 * NOTE: Does NOT track streakDays, SRS, or global XP.
 */
class LessonProgressService {
  // In-memory mock storage keyed by lessonId
  private progressStore: Map<string, LessonProgressDTO> = new Map();

  constructor() {
    // Seed initial progress for Lesson 8
    this.progressStore.set('les-8', {
      lessonId: 'les-8',
      userId: 'user-default',
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      maxUnlockedStepIndex: 0,
      quizScore: 0,
      totalQuizQuestions: 5,
      xpEarned: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get progress of current user for a specific lesson
   */
  async getLessonProgress(
    lessonId: string = 'les-8',
    userId: string = 'user-default'
  ): Promise<LessonProgressDTO> {
    const existing = this.progressStore.get(lessonId);
    if (existing) {
      return { ...existing };
    }

    const initial: LessonProgressDTO = {
      lessonId,
      userId,
      status: 'NOT_STARTED',
      currentStepIndex: 0,
      maxUnlockedStepIndex: 0,
      quizScore: 0,
      totalQuizQuestions: 5,
      xpEarned: 0,
      updatedAt: new Date().toISOString(),
    };
    this.progressStore.set(lessonId, initial);
    return { ...initial };
  }

  /**
   * Update step progress as the student advances
   */
  async updateStepProgress(
    payload: UpdateLessonStepProgressPayload
  ): Promise<LessonProgressDTO> {
    const current = await this.getLessonProgress(payload.lessonId);
    const maxUnlocked = Math.max(
      current.maxUnlockedStepIndex,
      payload.maxUnlockedStepIndex ?? payload.currentStepIndex
    );

    const updated: LessonProgressDTO = {
      ...current,
      status: current.status === 'NOT_STARTED' ? 'IN_PROGRESS' : current.status,
      currentStepIndex: payload.currentStepIndex,
      maxUnlockedStepIndex: maxUnlocked,
      updatedAt: new Date().toISOString(),
    };

    this.progressStore.set(payload.lessonId, updated);
    return { ...updated };
  }

  /**
   * Mark lesson as completed with quiz results and earned XP
   */
  async completeLesson(
    payload: CompleteLessonPayload
  ): Promise<LessonProgressDTO> {
    const current = await this.getLessonProgress(payload.lessonId);
    const updated: LessonProgressDTO = {
      ...current,
      status: 'COMPLETED',
      quizScore: payload.quizScore,
      totalQuizQuestions: payload.totalQuizQuestions,
      xpEarned: payload.xpEarned,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.progressStore.set(payload.lessonId, updated);
    return { ...updated };
  }

  /**
   * Reset progress for restarting lesson
   */
  async resetLessonProgress(
    lessonId: string = 'les-8'
  ): Promise<LessonProgressDTO> {
    const current = await this.getLessonProgress(lessonId);
    const reset: LessonProgressDTO = {
      ...current,
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      updatedAt: new Date().toISOString(),
    };
    this.progressStore.set(lessonId, reset);
    return { ...reset };
  }
}

export const lessonProgressService = new LessonProgressService();
