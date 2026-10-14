/**
 * Mock AI Provider Adapter
 * Development simulation adapter for Phase AI-0.
 * Strictly avoids calling external LLM APIs or storing API secrets in client code.
 */

import type { AIProviderAdapter, AIModelMetadata } from '../types/ai-provider.types';
import type { AITaskRequest, AITaskResponse } from '../types/ai-task.types';

export const MOCK_AI_MODELS: AIModelMetadata[] = [
  {
    id: 'zhongwenhub-edu-v1',
    name: 'ZhongWenHub Chinese Tutor Core (Preview)',
    provider: 'MOCK',
    version: '1.0.0-preview',
    capabilities: {
      supportsStreaming: true,
      supportsJsonSchema: true,
      supportsMultimodal: false,
      contextWindowTokens: 8192,
      maxOutputTokens: 2048,
    },
    costPer1kPromptTokensUsd: 0.0015,
    costPer1kCompletionTokensUsd: 0.002,
    deprecated: false,
  },
  {
    id: 'zhongwenhub-grading-v1',
    name: 'ZhongWenHub Objective & Pre-Grading Engine',
    provider: 'MOCK',
    version: '1.0.0-preview',
    capabilities: {
      supportsStreaming: false,
      supportsJsonSchema: true,
      supportsMultimodal: false,
      contextWindowTokens: 16384,
      maxOutputTokens: 4096,
    },
    costPer1kPromptTokensUsd: 0.002,
    costPer1kCompletionTokensUsd: 0.004,
    deprecated: false,
  },
];

export class MockAIProviderAdapter implements AIProviderAdapter {
  providerName = 'ZhongWenHub-Mock-Provider';

  async getAvailableModels(): Promise<AIModelMetadata[]> {
    return [...MOCK_AI_MODELS];
  }

  async executeTask<TPayload, TResult>(
    request: AITaskRequest<TPayload>
  ): Promise<AITaskResponse<TResult>> {
    // Artificial latency for simulation
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      taskId: request.taskId,
      taskType: request.taskType,
      status: 'SUCCESS',
      modelUsed: request.modelPreference || 'zhongwenhub-edu-v1',
      promptVersion: '1.0.0-foundation',
      tokensConsumed: {
        promptTokens: 120,
        completionTokens: 85,
        totalTokens: 205,
      },
      durationMs: 310,
      createdAt: new Date().toISOString(),
    };
  }
}

export const mockAIProviderAdapter = new MockAIProviderAdapter();
