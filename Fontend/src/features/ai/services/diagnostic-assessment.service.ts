import { httpClient } from '../../../core/api/client/http-client';

export interface DiagnosticQuestion {
  id: string;
  hskLevel: number;
  skillCategory: string;
  topicTitle: string;
  promptZh: string;
  promptPinyin?: string | null;
  promptVi?: string | null;
  options: string[];
}

export interface DiagnosticSessionStart {
  sessionId: string;
  assessmentType: string;
  totalQuestions: number;
  maxDurationMinutes: number;
  questions: DiagnosticQuestion[];
  startedAt: string;
}

export interface DiagnosticAnswerSubmission {
  questionId: string;
  selectedIndex: number;
  userAnswer?: string;
}

export interface DiagnosticSubmission {
  sessionId: string;
  answers: DiagnosticAnswerSubmission[];
  timeSpentSeconds: number;
}

export interface DiagnosticQuestionResult {
  questionId: string;
  hskLevel: number;
  skillCategory: string;
  topicTitle: string;
  promptZh: string;
  options: string[];
  userSelectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanationVi: string;
}

export interface DiagnosticResult {
  sessionId: string;
  assessmentType: string;
  estimatedHskLevel: number;
  confidenceScore: number;
  totalQuestions: number;
  correctCount: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  assessmentSummaryVi: string;
  assessmentLimitationsVi: string;
  skillAccuracyPercent: Record<string, number>;
  hskLevelAccuracyPercent: Record<string, number>;
  detailedQuestions: DiagnosticQuestionResult[];
  completedAt: string;
}

export const diagnosticAssessmentService = {
  startSession: () => httpClient.post<DiagnosticSessionStart>('/ai/diagnostic/start', {}),

  submitSession: (payload: DiagnosticSubmission) =>
    httpClient.post<DiagnosticResult>('/ai/diagnostic/submit', payload),

  getLatestResult: () => httpClient.get<DiagnosticResult | null>('/ai/diagnostic/latest'),

  confirmTargetHsk: (targetHskLevel: number) =>
    httpClient.post<{ success: boolean; targetHskLevel: number }>('/ai/diagnostic/confirm-target', {
      targetHskLevel,
    }),
};
