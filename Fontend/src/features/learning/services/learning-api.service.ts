import type {
  StudentLearningState,
  PracticeAttemptRecord,
} from '../types/learning-state.types';
import type {
  UpdateLessonStepProgressPayload,
  CompleteLessonPayload,
  LessonProgressDTO,
} from '../../lesson/types/lesson-progress.types';
import type { PracticeSessionResult } from '../../practice/types';
import type { SRSRating } from '../../vocabulary/types';
import type { AddVocabularyPayload } from './learning-srs.service';
import { authTokenService } from '../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

function getAuthHeaders(): HeadersInit {
  const token = authTokenService.getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export class LearningApiService {
  /**
   * Check if a student ID belongs to a real backend user
   */
  public isRealUser(studentId?: string): boolean {
    if (!studentId) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);
  }

  /**
   * Fetch full student learning state from backend
   */
  public async fetchLearningState(): Promise<StudentLearningState | null> {
    try {
      const response = await fetch(getApiUrl('/learning/me'), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data as StudentLearningState;
    } catch (err) {
      console.warn('[LearningApiService] Error fetching learning state from backend:', err);
      return null;
    }
  }

  /**
   * Update student preferences (HSK level, daily goal)
   */
  public async updatePreferences(preferences: {
    selectedHskLevel?: number;
    targetDailyMinutes?: number;
    targetDailyXp?: number;
    currentLessonId?: string;
  }): Promise<StudentLearningState | null> {
    try {
      const response = await fetch(getApiUrl('/learning/me/preferences'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(preferences),
      });

      if (!response.ok) return null;
      return (await response.json()) as StudentLearningState;
    } catch (err) {
      console.warn('[LearningApiService] Error updating preferences:', err);
      return null;
    }
  }

  /**
   * Update step progress within a lesson
   */
  public async updateLessonStep(payload: UpdateLessonStepProgressPayload): Promise<LessonProgressDTO | null> {
    try {
      const response = await fetch(getApiUrl(`/learning/me/lessons/${payload.lessonId}/progress`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentStepIndex: payload.currentStepIndex,
          maxUnlockedStepIndex: payload.maxUnlockedStepIndex,
        }),
      });

      if (!response.ok) return null;
      return (await response.json()) as LessonProgressDTO;
    } catch (err) {
      console.warn('[LearningApiService] Error updating lesson step:', err);
      return null;
    }
  }

  /**
   * Complete lesson with quiz score
   */
  public async completeLesson(payload: CompleteLessonPayload): Promise<StudentLearningState | null> {
    try {
      const response = await fetch(getApiUrl(`/learning/me/lessons/${payload.lessonId}/complete`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quizScore: payload.quizScore,
          totalQuizQuestions: payload.totalQuizQuestions,
          xpEarned: payload.xpEarned,
        }),
      });

      if (!response.ok) return null;
      return (await response.json()) as StudentLearningState;
    } catch (err) {
      console.warn('[LearningApiService] Error completing lesson:', err);
      return null;
    }
  }

  /**
   * Record practice attempt
   */
  public async recordPracticeAttempt(attempt: PracticeAttemptRecord): Promise<StudentLearningState | null> {
    try {
      const response = await fetch(getApiUrl('/learning/me/practice-attempts'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          exerciseId: attempt.exerciseId,
          questionId: attempt.questionId,
          knowledgePointId: attempt.knowledgePointId,
          topicTitle: attempt.topicTitle,
          category: attempt.category,
          hskLevel: attempt.hskLevel,
          userAnswer: attempt.userAnswer,
          isCorrect: attempt.isCorrect,
        }),
      });

      if (!response.ok) return null;
      return (await response.json()) as StudentLearningState;
    } catch (err) {
      console.warn('[LearningApiService] Error recording practice attempt:', err);
      return null;
    }
  }

  /**
   * Record practice session
   */
  public async recordPracticeSession(result: PracticeSessionResult): Promise<StudentLearningState | null> {
    try {
      const response = await fetch(getApiUrl('/learning/me/practice-sessions'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: result.sessionId,
          xpEarned: result.xpEarned,
          totalQuestions: result.totalQuestions,
          correctQuestions: result.correctAnswers,
          timeSpentSeconds: result.timeSpentSeconds,
        }),
      });

      if (!response.ok) return null;
      return (await response.json()) as StudentLearningState;
    } catch (err) {
      console.warn('[LearningApiService] Error recording practice session:', err);
      return null;
    }
  }

  /**
   * Record single SRS review
   */
  public async recordSrsReview(vocabId: string, rating: SRSRating): Promise<StudentLearningState | null> {
    try {
      const response = await fetch(getApiUrl('/learning/me/vocabulary/reviews'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          vocabularyId: vocabId,
          rating,
        }),
      });

      if (!response.ok) return null;
      return (await response.json()) as StudentLearningState;
    } catch (err) {
      console.warn('[LearningApiService] Error recording SRS review:', err);
      return null;
    }
  }

  /**
   * Complete SRS session
   */
  public async completeSrsSession(sessionXp: number = 30, count: number = 0): Promise<StudentLearningState | null> {
    try {
      const response = await fetch(getApiUrl('/learning/me/vocabulary/session-complete'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionXp,
          wordsReviewedCount: count,
        }),
      });

      if (!response.ok) return null;
      return (await response.json()) as StudentLearningState;
    } catch (err) {
      console.warn('[LearningApiService] Error completing SRS session:', err);
      return null;
    }
  }

  /**
   * Add vocabulary word
   */
  public async addVocabularyWord(payload: AddVocabularyPayload): Promise<StudentLearningState | null> {
    try {
      const response = await fetch(getApiUrl('/learning/me/vocabulary'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          vocabularyId: payload.vocabularyId,
          hanzi: payload.hanzi,
          pinyin: payload.pinyin,
          meaning: payload.meaning,
          hskLevel: payload.hskLevel,
        }),
      });

      if (!response.ok) return null;
      return (await response.json()) as StudentLearningState;
    } catch (err) {
      console.warn('[LearningApiService] Error adding vocabulary:', err);
      return null;
    }
  }
}

export const learningApiService = new LearningApiService();
