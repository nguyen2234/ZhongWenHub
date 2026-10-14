/**
 * Teacher AI Pre-Grading & Review Contracts
 * Enforces the Teacher-in-the-Loop paradigm: AI generates provisional suggestions,
 * but only the authoritative teacher approves or modifies the final evaluation.
 */

export type AIGradingJobStatus = 'QUEUED' | 'ANALYZING' | 'SUGGESTIONS_READY' | 'TEACHER_REVIEWED' | 'FAILED';

export interface AIGradingSuggestion {
  suggestionId: string;
  questionId: string;
  exerciseType: string;
  studentAnswer: string | number | string[] | Record<string, string>;
  proposedScore: number;
  maxPoints: number;
  grammarFeedbackVi: string;
  vocabularyFeedbackVi: string;
  confidenceScore: number; // 0.0 - 1.0
  reasoningNotes: string;
  generatedAt: string;
}

export interface TeacherGradingReview {
  reviewId: string;
  attemptId: string;
  assignmentId: string;
  teacherId: string;
  status: 'ACCEPTED_AS_IS' | 'MODIFIED_BY_TEACHER' | 'RE_EVALUATION_REQUESTED';
  adjustedScore: number;
  teacherFinalComment: string;
  reviewedAt: string;
  originalSuggestion: AIGradingSuggestion;
}

export interface AIGradingJob {
  jobId: string;
  assignmentId: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: AIGradingJobStatus;
  suggestions: AIGradingSuggestion[];
  teacherReview?: TeacherGradingReview;
  totalSuggestedScore: number;
  maxScore: number;
  requiresManualReview: boolean;
  reviewedByTeacher: boolean;
}

export interface GradingAuditEvent {
  eventId: string;
  attemptId: string;
  actorId: string;
  actorRole: 'AI_SYSTEM' | 'TEACHER';
  action: 'PROPOSED_SCORE' | 'OVERRODE_SCORE' | 'APPROVED_FEEDBACK' | 'PUBLISHED_RESULT';
  previousScore?: number;
  newScore: number;
  justificationNotes?: string;
  timestamp: string;
}
