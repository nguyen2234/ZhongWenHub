/**
 * Prompt & Audit Metadata Contracts
 * Preserves audit trails, prompt versioning, and evaluation tracking.
 */

import type { AITaskType } from './ai-task.types';

export interface PromptTemplateMeta {
  templateId: string;
  taskType: AITaskType;
  version: string;
  hash: string;
  systemInstruction: string;
  schemaVersion: string;
  createdAt: string;
}

export interface AIAuditRecord {
  auditId: string;
  taskId: string;
  taskType: AITaskType;
  actorId: string;
  actorRole: 'STUDENT' | 'TEACHER' | 'ADMIN';
  modelId: string;
  promptVersion: string;
  executionStatus: 'SUCCESS' | 'ERROR';
  tokensUsed: number;
  durationMs: number;
  anonymizedInputSummary: string;
  timestamp: string;
}
