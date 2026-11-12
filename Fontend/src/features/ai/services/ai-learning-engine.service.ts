import { httpClient } from '../../../core/api/client/http-client';

export interface ConversationScenario {
  code: string;
  minHskLevel: number;
  titleVi: string;
  titleZh: string;
  descriptionVi: string;
}

export interface ConversationCorrection {
  hasError: boolean;
  errorCategory?: string | null;
  explanationVi?: string | null;
  naturalSuggestionZh?: string | null;
  naturalSuggestionPinyin?: string | null;
  naturalSuggestionVi?: string | null;
}

export interface AiConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  contentZh: string;
  pinyin?: string | null;
  contentVi?: string | null;
  correction?: ConversationCorrection | null;
  suggestedReplies: string[];
  createdAt: string;
}

export interface AiConversationSession {
  id: string;
  hskLevel: number;
  scenarioCode: string;
  scenarioTitle: string;
  status: 'ACTIVE' | 'COMPLETED' | string;
  showPinyin: boolean;
  showVietnamese: boolean;
  messageCount: number;
  startedAt: string;
  endedAt?: string | null;
  summaryVi?: string | null;
  pronunciationEvaluationSupported: boolean;
  speechCapabilityNote: string;
  messages: AiConversationMessage[];
}

export interface AiGeneratedExercise {
  id: string;
  hskLevel: number;
  lessonId?: string | null;
  sourceType: 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'WEAKNESS' | string;
  exerciseType: 'multiple-choice' | 'fill-blank' | 'sentence-order' | 'meaning-match' | 'pinyin-match' | 'error-correction' | string;
  originTag: string;
  academicStatus: string;
  sourceReviewNote?: string | null;
  promptZh: string;
  promptPinyin?: string | null;
  promptVi?: string | null;
  options: string[];
  correctIndex?: number | null;
  correctAnswer?: string | null;
  explanationVi: string;
  createdAt: string;
}

export interface AiExerciseAttemptResult {
  attemptId: string;
  aiExerciseId: string;
  isCorrect: boolean;
  correctIndex?: number | null;
  correctAnswer?: string | null;
  explanationVi: string;
  skillCategory: string;
  attemptedAt: string;
}

export interface SkillStatistic {
  skillCategory: string;
  labelVi: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracyPercent: number;
  hasData: boolean;
  weakTopics: string[];
}

export interface ErrorAnalysisWeakPoint {
  topicTitle: string;
  skillCategory: string;
  hskLevel: number;
  totalAttempts: number;
  incorrectAttempts: number;
  accuracyPercent: number;
  evidenceVi: string;
  suggestedActionRoute: string;
}

export interface ErrorAnalysisReport {
  totalAttemptsAnalyzed: number;
  overallAccuracyPercent: number;
  hasAudioEvaluation: boolean;
  audioEvaluationNote: string;
  skills: SkillStatistic[];
  weakPoints: ErrorAnalysisWeakPoint[];
  generatedAt: string;
}

export interface LearningRecommendationItem {
  id: string;
  priority: number;
  category: string;
  title: string;
  reason: string;
  actionLabel: string;
  destinationRoute: string;
  badge: string;
}

export interface PersonalizedLearningPlan {
  currentHskLevel: number;
  dailyGoalMinutes: number;
  streakDays: number;
  dueSrsWordsCount: number;
  masteredWordsCount: number;
  completedLessonsCount: number;
  totalStudyMinutesLast7Days: number;
  activeDaysLast7Days: number;
  overallAccuracyPercent: number;
  recommendations: LearningRecommendationItem[];
  aiCoachingExplanationVi?: string | null;
  aiFocusTipVi?: string | null;
  usedLlmExplanation: boolean;
  generatedAt: string;
}

export const aiLearningEngineService = {
  getScenarios: () => httpClient.get<ConversationScenario[]>('/ai/conversations/scenarios'),

  listConversations: () => httpClient.get<AiConversationSession[]>('/ai/conversations'),

  getConversation: (sessionId: string) =>
    httpClient.get<AiConversationSession>(`/ai/conversations/${sessionId}`),

  startConversation: (payload: {
    hskLevel: number;
    scenarioCode: string;
    showPinyin: boolean;
    showVietnamese: boolean;
  }) => httpClient.post<AiConversationSession>('/ai/conversations/start', payload, { timeoutMs: 35000 }),

  sendConversationMessage: (
    sessionId: string,
    payload: { message: string; requestVietnamese?: boolean }
  ) =>
    httpClient.post<AiConversationSession>(`/ai/conversations/${sessionId}/messages`, payload, {
      timeoutMs: 35000,
    }),

  updateConversationPreferences: (
    sessionId: string,
    payload: { showPinyin: boolean; showVietnamese: boolean }
  ) =>
    httpClient.put<AiConversationSession>(
      `/ai/conversations/${sessionId}/preferences`,
      payload
    ),

  endConversation: (sessionId: string) =>
    httpClient.post<AiConversationSession>(`/ai/conversations/${sessionId}/end`, {}),

  listAiExercises: (hskLevel?: number, lessonId?: string) => {
    const params = new URLSearchParams();
    if (hskLevel) params.set('hskLevel', String(hskLevel));
    if (lessonId) params.set('lessonId', lessonId);
    const qs = params.toString();
    return httpClient.get<AiGeneratedExercise[]>(`/ai/exercises${qs ? `?${qs}` : ''}`);
  },

  generateAiExercises: (payload: {
    hskLevel: number;
    lessonId?: string;
    sourceType: string;
    exerciseType: string;
    count: number;
  }) => httpClient.post<AiGeneratedExercise[]>('/ai/exercises/generate', payload, { timeoutMs: 35000 }),

  submitAiExerciseAttempt: (
    exerciseId: string,
    payload: { selectedIndex?: number; userAnswer?: string }
  ) => httpClient.post<AiExerciseAttemptResult>(`/ai/exercises/${exerciseId}/attempts`, payload),

  getErrorAnalysis: () => httpClient.get<ErrorAnalysisReport>('/ai/error-analysis'),

  getPersonalizedPlan: (explain = false) =>
    httpClient.get<PersonalizedLearningPlan>(`/ai/recommendations?explain=${explain ? 'true' : 'false'}`, {
      timeoutMs: 35000,
    }),
};
