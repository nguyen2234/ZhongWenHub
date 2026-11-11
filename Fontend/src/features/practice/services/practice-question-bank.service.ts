import { httpClient } from '../../../core/api/client/http-client';
import {
  normalizeBackendExerciseType,
  normalizeSkillCategory,
  parseBracketedTokens,
  type SharedExerciseItem,
} from '../../exercise-engine';

export interface AdaptiveWeakArea {
  key: string;
  category: string;
  title: string;
  hskLevel: number;
  recommendedSkill?: string;
  accuracy: number;
  totalAttempts: number;
  wrongCount: number;
  weaknessScore: number;
  reason: string;
}

export interface AdaptiveRecommendationsResponse {
  totalPublishedQuestions: number;
  publishedByHsk: Record<number, number>;
  publishedBySkill: Record<string, number>;
  publishedByDifficulty: Record<string, number>;
  mistakeReviewCount: number;
  weakAreas: AdaptiveWeakArea[];
}

export interface StudentPracticeQuestionPayload {
  id: string;
  type: string;
  skill: string;
  hskLevel: number;
  difficulty: string;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  audioUrl?: string;
  options: string[];
  optionsJson?: string;
  xpReward: number;
  lessonId?: string;
  grammarPointId?: string;
  knowledgePointId?: string;
  selectionReasonCode?: string;
  selectionReasonLabel?: string;
}

export interface PracticeQuestionItem extends SharedExerciseItem {
  selectionReasonCode?: string;
  selectionReasonLabel?: string;
  knowledgePointId?: string;
}

function normalizeDifficultyToUi(raw?: string): 'easy' | 'medium' | 'hard' {
  const v = (raw || '').toUpperCase();
  if (v === 'EASY') return 'easy';
  if (v === 'HARD') return 'hard';
  return 'medium';
}

export interface BackendPracticeSession {
  sessionId: string;
  hskLevel?: number;
  skill?: string;
  difficulty?: string;
  mode: string;
  status: string;
  totalQuestions: number;
  correctCount: number;
  xpAwarded: number;
  accuracy: number;
  timeSpentSeconds: number;
  startedAt: string;
  completedAt?: string;
  questions: StudentPracticeQuestionPayload[];
}

export interface SubmitPracticeAnswerPayload {
  questionId: string;
  selectedOption?: number | null;
  orderedTokens?: string[];
  matchedPairs?: string[];
  textAnswer?: string;
}

export interface BackendQuestionResultItem {
  questionId: string;
  title: string;
  skill: string;
  hskLevel: number;
  difficulty: string;
  isCorrect: boolean;
  givenAnswer: string;
  correctAnswer?: string;
  correctOptionIndex?: number;
  explanation?: string;
}

export interface BackendPracticeSubmitResult {
  sessionId: string;
  status: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  xpAwarded: number;
  alreadyCompleted: boolean;
  timeSpentSeconds: number;
  completedAt: string;
  questionResults: BackendQuestionResultItem[];
  updatedWeakAreas: AdaptiveWeakArea[];
}

export interface PracticeSessionHistoryItem {
  sessionId: string;
  hskLevel?: number;
  skill?: string;
  difficulty?: string;
  mode: string;
  status: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  xpAwarded: number;
  timeSpentSeconds: number;
  startedAt: string;
  completedAt?: string;
}

export function adaptPracticeQuestionToShared(q: StudentPracticeQuestionPayload): PracticeQuestionItem {
  const normalizedType = normalizeBackendExerciseType(q.type);
  const options = Array.isArray(q.options) ? q.options.map(String) : [];
  let sentenceTokens: string[] | undefined;
  if (normalizedType === 'sentence-order' && options.length === 0) {
    const tokens = parseBracketedTokens(q.promptHanzi);
    if (tokens.length > 0) sentenceTokens = tokens;
  }

  return {
    id: q.id,
    type: normalizedType,
    skill: normalizeSkillCategory(q.skill),
    hskLevel: q.hskLevel || 1,
    difficulty: normalizeDifficultyToUi(q.difficulty),
    title: q.title,
    instruction: q.instruction,
    promptHanzi: q.promptHanzi,
    promptPinyin: q.promptPinyin,
    promptVietnamese: q.promptVietnamese,
    audioUrl: q.audioUrl,
    options: options.length > 0 ? options : undefined,
    sentenceTokens,
    // Intentionally omit correctOptionIndex / correctSentence / explanation before submission
    explanation: '',
    xpReward: q.xpReward || 10,
    grammarPoint: q.grammarPointId,
    knowledgePointId: q.knowledgePointId,
    selectionReasonCode: q.selectionReasonCode,
    selectionReasonLabel: q.selectionReasonLabel,
  };
}

class PracticeQuestionBankService {
  private readonly baseEndpoint = '/question-bank';

  async getRecommendations(): Promise<AdaptiveRecommendationsResponse> {
    return httpClient.get<AdaptiveRecommendationsResponse>(`${this.baseEndpoint}/recommendations`);
  }

  async createPracticeSession(params: {
    hskLevel?: number;
    skill?: string;
    difficulty?: string;
    questionCount?: number;
    mode?: string;
    prioritizeWeakness?: boolean;
  }): Promise<BackendPracticeSession> {
    return httpClient.post<BackendPracticeSession>(`${this.baseEndpoint}/practice-sessions`, {
      hskLevel: params.hskLevel ?? null,
      skill: params.skill ?? null,
      difficulty: params.difficulty ?? null,
      questionCount: params.questionCount ?? 10,
      mode: params.mode ?? 'random',
      prioritizeWeakness: Boolean(params.prioritizeWeakness),
    });
  }

  async submitPracticeSession(
    sessionId: string,
    answers: SubmitPracticeAnswerPayload[],
    timeSpentSeconds: number
  ): Promise<BackendPracticeSubmitResult> {
    return httpClient.post<BackendPracticeSubmitResult>(
      `${this.baseEndpoint}/practice-sessions/${sessionId}/submit`,
      { answers, timeSpentSeconds }
    );
  }

  async getPracticeHistory(limit = 10): Promise<PracticeSessionHistoryItem[]> {
    return httpClient.get<PracticeSessionHistoryItem[]>(`${this.baseEndpoint}/practice-history`, {
      params: { limit },
    });
  }
}

export const practiceQuestionBankService = new PracticeQuestionBankService();
