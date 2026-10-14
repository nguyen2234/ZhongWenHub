/**
 * AI Core Task & Request/Response Contracts
 * Defines standard task contracts for all AI operations in ZhongWenHub.
 */

export type AITaskType =
  // Student AI Tasks
  | 'STUDENT_TUTOR_CHAT'
  | 'STUDENT_GRADING_ANALYSIS'
  | 'STUDENT_WEAKNESS_DIAGNOSIS'
  | 'STUDENT_PRACTICE_GENERATION'
  | 'STUDENT_ADAPTIVE_RECOMMENDATION'
  // Teacher AI Tasks
  | 'TEACHER_LESSON_PLANNING'
  | 'TEACHER_CONTENT_ASSISTANCE'
  | 'TEACHER_EXERCISE_GENERATION'
  | 'TEACHER_PRE_GRADING'
  | 'TEACHER_CLASS_ANALYTICS'
  | 'TEACHER_TEACHING_RECOMMENDATION';

export type AIRequestStatus = 'IDLE' | 'PENDING' | 'STREAMING' | 'SUCCESS' | 'ERROR';

export type AIErrorCode =
  | 'UNAUTHORIZED'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED'
  | 'INVALID_INPUT'
  | 'MODEL_UNAVAILABLE'
  | 'CONTENT_FILTERED'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_ERROR';

export interface AIError {
  code: AIErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export interface AITaskRequest<TPayload = Record<string, unknown>> {
  taskId: string;
  taskType: AITaskType;
  actorId: string;
  actorRole: 'STUDENT' | 'TEACHER' | 'ADMIN';
  modelPreference?: string;
  temperature?: number;
  maxTokens?: number;
  payload: TPayload;
  timestamp: string;
}

export interface AITaskResponse<TResult = unknown> {
  taskId: string;
  taskType: AITaskType;
  status: AIRequestStatus;
  result?: TResult;
  error?: AIError;
  modelUsed: string;
  promptVersion: string;
  tokensConsumed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  durationMs: number;
  createdAt: string;
}
