import type { LessonProgressDTO } from '../../lesson/types/lesson-progress.types';
import type { UserVocabularyState, SRSState, SRSRating } from '../../vocabulary/types';

export type WeakKnowledgeCategory = 'grammar' | 'vocabulary' | 'listening' | 'reading' | 'sentence';
export type WeakKnowledgeTrend = 'improving' | 'declining' | 'stagnant';
export type MasteryLevel = 'WEAK' | 'RECOVERING' | 'MASTERED' | 'INSUFFICIENT_DATA';

export interface PracticeAttemptRecord {
  id: string;
  studentId: string;
  exerciseId: string;
  questionId?: string;
  knowledgePointId: string;
  topicTitle: string;
  category: WeakKnowledgeCategory;
  hskLevel: number;
  userAnswer: string;
  isCorrect: boolean;
  attemptedAt: string;
}

export interface WeakKnowledgeRecord {
  id: string;
  knowledgePointId: string;
  topicTitle: string;
  category: WeakKnowledgeCategory;
  hskLevel: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number; // 0 - 100
  masteryLevel: MasteryLevel;
  trend: WeakKnowledgeTrend;
  evidence: string;
  suggestedPractice: {
    title: string;
    route: string;
    exerciseIds: string[];
  };
  lastEvaluatedAt: string;
}

export interface DailyActivityRecord {
  date: string; // YYYY-MM-DD
  minutes: number;
  xpEarned: number;
  completedLessons: string[];
  exercisesCompleted: number;
  reviewsCompleted: number;
}

export interface LearningRecommendation {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  category: 'srs-due' | 'weak-knowledge' | 'resume-lesson' | 'next-lesson' | 'skill-practice';
  title: string;
  reason: string;
  actionLabel: string;
  destinationRoute: string;
  badge?: string;
  badgeVariant?: 'primary' | 'streak' | 'xp' | 'success';
}

export interface StudentLearningState {
  schemaVersion: number;
  studentId: string;
  selectedHskLevel: number; // 1 to 9
  currentLessonId: string;
  completedLessonIds: string[];
  lessonProgress: Record<string, LessonProgressDTO>;
  exerciseAttempts: PracticeAttemptRecord[];
  userVocabStates: Record<string, UserVocabularyState>;
  userSrsStates: Record<string, SRSState>;
  weakKnowledgePoints: WeakKnowledgeRecord[];
  xpTotal: number;
  rewardedEventIds: string[]; // Idempotent event IDs
  streakDays: number;
  lastActivityDate: string; // YYYY-MM-DD
  dailyGoal: {
    targetMinutes: number;
    targetXp: number;
  };
  dailyActivityHistory: Record<string, DailyActivityRecord>;
}

export interface SrsReviewResultPayload {
  vocabularyId: string;
  rating: SRSRating;
  srsState: SRSState;
  userState: UserVocabularyState;
}
