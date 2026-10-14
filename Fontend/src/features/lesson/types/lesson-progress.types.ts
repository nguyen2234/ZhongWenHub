/**
 * Normalized Lesson Progress Contracts
 * Represents current user's progress for a single lesson.
 * MUST NOT contain streakDays or global account metrics.
 */

export type LessonProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LessonProgressDTO {
  lessonId: string;
  userId: string;
  status: LessonProgressStatus;
  currentStepIndex: number;
  maxUnlockedStepIndex: number;
  quizScore?: number;
  totalQuizQuestions?: number;
  xpEarned: number;
  completedAt?: string;
  updatedAt: string;
}

export interface UpdateLessonStepProgressPayload {
  lessonId: string;
  currentStepIndex: number;
  maxUnlockedStepIndex?: number;
}

export interface CompleteLessonPayload {
  lessonId: string;
  quizScore: number;
  totalQuizQuestions: number;
  xpEarned: number;
}
