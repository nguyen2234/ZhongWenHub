/**
 * AI Core Service
 * Central gateway for dispatching validated AI task requests across ZhongWenHub.
 */

import type { AIProviderAdapter } from '../types/ai-provider.types';
import type { AITaskRequest, AITaskResponse } from '../types/ai-task.types';
import type { AIAuditRecord } from '../types/ai-metadata.types';
import { validateTaskRequest } from '../utils/ai-validation.utils';

class AICoreService {
  private provider: AIProviderAdapter | null = null;
  private auditLogs: AIAuditRecord[] = [];

  setProvider(provider: AIProviderAdapter | null): void {
    this.provider = provider;
  }

  async dispatchTask<TPayload, TResult>(
    request: AITaskRequest<TPayload>
  ): Promise<AITaskResponse<TResult>> {
    const validation = validateTaskRequest(request);
    if (!validation.valid && validation.error) {
      return {
        taskId: request.taskId,
        taskType: request.taskType,
        status: 'ERROR',
        error: validation.error,
        modelUsed: 'none',
        promptVersion: 'none',
        tokensConsumed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        durationMs: 0,
        createdAt: new Date().toISOString(),
      };
    }

    if (!this.provider) {
      return {
        taskId: request.taskId,
        taskType: request.taskType,
        status: 'ERROR',
        error: {
          code: 'MODEL_UNAVAILABLE',
          message: 'Dịch vụ AI hiện không khả dụng. Vui lòng kiểm tra cấu hình kết nối AI Provider.',
          retryable: false,
        },
        modelUsed: 'none',
        promptVersion: 'none',
        tokensConsumed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        durationMs: 0,
        createdAt: new Date().toISOString(),
      };
    }

    const start = Date.now();
    try {
      const response = await this.provider.executeTask<TPayload, TResult>(request);
      const duration = Date.now() - start;

      // Log audit entry
      this.recordAudit({
        auditId: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        taskId: request.taskId,
        taskType: request.taskType,
        actorId: request.actorId,
        actorRole: request.actorRole,
        modelId: response.modelUsed,
        promptVersion: response.promptVersion,
        executionStatus: response.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
        tokensUsed: response.tokensConsumed.totalTokens,
        durationMs: duration,
        anonymizedInputSummary: `Task: ${request.taskType}`,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (err: unknown) {
      const duration = Date.now() - start;
      const message = err instanceof Error ? err.message : 'Unknown AI Core dispatch error';

      return {
        taskId: request.taskId,
        taskType: request.taskType,
        status: 'ERROR',
        error: { code: 'INTERNAL_ERROR', message, retryable: true },
        modelUsed: 'none',
        promptVersion: 'none',
        tokensConsumed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        durationMs: duration,
        createdAt: new Date().toISOString(),
      };
    }
  }

  private recordAudit(record: AIAuditRecord): void {
    this.auditLogs.push(record);
    // Keep max 200 in memory
    if (this.auditLogs.length > 200) {
      this.auditLogs.shift();
    }
  }

  getAuditLogs(): AIAuditRecord[] {
    return [...this.auditLogs];
  }
}

export const aiCoreService = new AICoreService();
