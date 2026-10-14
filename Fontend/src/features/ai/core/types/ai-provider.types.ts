/**
 * AI Provider Adapter Interfaces & Configuration Contracts
 * Enables provider-agnostic integration (OpenAI, Gemini, Anthropic, or future internal model).
 */

import type { AITaskRequest, AITaskResponse } from './ai-task.types';

export interface AIModelCapability {
  supportsStreaming: boolean;
  supportsJsonSchema: boolean;
  supportsMultimodal: boolean;
  contextWindowTokens: number;
  maxOutputTokens: number;
}

export interface AIModelMetadata {
  id: string;
  name: string;
  provider: 'OPENAI' | 'GOOGLE' | 'ANTHROPIC' | 'LOCAL' | 'MOCK';
  version: string;
  capabilities: AIModelCapability;
  costPer1kPromptTokensUsd: number;
  costPer1kCompletionTokensUsd: number;
  deprecated: boolean;
}

export interface AIProviderConfig {
  providerName: string;
  defaultModelId: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface AIProviderAdapter {
  providerName: string;
  getAvailableModels(): Promise<AIModelMetadata[]>;
  executeTask<TPayload, TResult>(
    request: AITaskRequest<TPayload>
  ): Promise<AITaskResponse<TResult>>;
}
