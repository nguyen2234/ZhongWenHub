/**
 * AI Validation Utilities
 * Validates task payload integrity and structured AI responses before propagating to UI.
 */

import type { AITaskRequest, AIError } from '../types/ai-task.types';

export function validateTaskRequest<TPayload = unknown>(
  request: AITaskRequest<TPayload>
): { valid: boolean; error?: AIError } {
  if (!request.taskId) {
    return {
      valid: false,
      error: { code: 'INVALID_INPUT', message: 'Task ID is required.', retryable: false },
    };
  }
  if (!request.taskType) {
    return {
      valid: false,
      error: { code: 'INVALID_INPUT', message: 'Task type is required.', retryable: false },
    };
  }
  if (!request.actorId || !request.actorRole) {
    return {
      valid: false,
      error: { code: 'UNAUTHORIZED', message: 'Actor credentials must be provided.', retryable: false },
    };
  }
  return { valid: true };
}

export function validateStructuredAIResponse<T>(
  data: unknown,
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: string[] } {
  if (!data || typeof data !== 'object') {
    return { valid: false, missingFields: ['data is not an object'] };
  }
  const obj = data as Record<string, unknown>;
  const missing = (requiredFields as string[]).filter((f) => obj[f] === undefined || obj[f] === null);
  return {
    valid: missing.length === 0,
    missingFields: missing,
  };
}
