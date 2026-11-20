import { httpClient } from '../../../core/api/client/http-client';
import { ApiClientError } from '../../../core/api/client/api-error';
import type {
  AITutorContext,
  AITutorHistoryTurn,
  AITutorMessage,
  AITutorMode,
  AIResponseBlock,
  StructuredAIResponse,
} from '../types';

export interface ChatRequest {
  conversationId: string;
  message: string;
  mode: AITutorMode;
  context: AITutorContext;
  history?: AITutorHistoryTurn[];
}

export interface ChatStreamChunk {
  deltaText?: string;
  isCompleted?: boolean;
  structuredResponse?: StructuredAIResponse;
}

export interface ChatSendOptions {
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidBlock(block: unknown): block is AIResponseBlock {
  if (!isRecord(block) || typeof block.type !== 'string') {
    return false;
  }

  switch (block.type) {
    case 'explanation':
      return typeof block.content === 'string' && block.content.trim().length > 0;
    case 'chinese_example':
      return (
        typeof block.hanzi === 'string' &&
        typeof block.pinyin === 'string' &&
        typeof block.vietnamese === 'string'
      );
    case 'correction':
      return (
        typeof block.correctedSentence === 'string' &&
        typeof block.explanation === 'string' &&
        Array.isArray(block.diffItems)
      );
    case 'practice':
      return (
        typeof block.instruction === 'string' &&
        isRecord(block.exercise) &&
        Array.isArray(block.exercise.options) &&
        typeof block.exercise.correctOptionIndex === 'number'
      );
    default:
      return false;
  }
}

export class AITutorService {
  /**
   * Sends a contextual learner question to the ASP.NET Core AI Tutor endpoint (`POST /api/v1/ai-tutor/chat`).
   * Reuses HttpClient (with JWT Bearer token) and never fabricates mock answers on failure.
   */
  static async sendChatMessage(
    request: ChatRequest,
    onChunk?: ((chunk: ChatStreamChunk) => void) | ChatSendOptions,
    options?: ChatSendOptions
  ): Promise<StructuredAIResponse> {
    const resolvedOptions = typeof onChunk === 'function' ? options : onChunk;
    const chunkCallback = typeof onChunk === 'function' ? onChunk : undefined;

    const rawResponse = await httpClient.post<unknown>(
      '/ai-tutor/chat',
      {
        conversationId: request.conversationId,
        message: request.message,
        mode: request.mode,
        context: request.context,
        history: request.history && request.history.length > 0 ? request.history : undefined,
      },
      {
        timeoutMs: 35000,
        signal: resolvedOptions?.signal,
      }
    );

    const normalized = AITutorService.normalizeResponse(rawResponse);

    if (chunkCallback) {
      chunkCallback({ isCompleted: true, structuredResponse: normalized });
    }

    return normalized;
  }

  /**
   * Safely validates and normalizes backend/AI output so malformed payloads fall back to markdown
   * without breaking the UI or StructuredAIResponse contract.
   */
  static normalizeResponse(raw: unknown): StructuredAIResponse {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      return {
        type: 'markdown',
        summary: 'Phản hồi từ Trợ giảng AI',
        markdownFallback: trimmed || 'Trợ giảng AI chưa trả về nội dung hợp lệ.',
        blocks: [],
        suggestedActions: [],
      };
    }

    if (!isRecord(raw)) {
      return {
        type: 'markdown',
        summary: 'Phản hồi từ Trợ giảng AI',
        markdownFallback: 'Định dạng phản hồi từ Trợ giảng AI không hợp lệ. Vui lòng thử lại.',
        blocks: [],
        suggestedActions: [],
      };
    }

    const summary = typeof raw.summary === 'string' ? raw.summary : undefined;
    const markdownFallback =
      typeof raw.markdownFallback === 'string' && raw.markdownFallback.trim().length > 0
        ? raw.markdownFallback.trim()
        : undefined;

    const suggestedActions = Array.isArray(raw.suggestedActions)
      ? raw.suggestedActions.filter((a): a is string => typeof a === 'string' && a.trim().length > 0).slice(0, 3)
      : [];

    const validBlocks = Array.isArray(raw.blocks) ? raw.blocks.filter(isValidBlock) : [];

    if (validBlocks.length > 0 && raw.type !== 'markdown') {
      return {
        type: 'structured',
        summary,
        markdownFallback,
        blocks: validBlocks,
        suggestedActions,
      };
    }

    return {
      type: 'markdown',
      summary: summary || 'Phản hồi từ Trợ giảng AI',
      markdownFallback:
        markdownFallback ||
        summary ||
        'Trợ giảng AI trả về dữ liệu chưa chuẩn cấu trúc. Vui lòng thử đặt câu hỏi lại.',
      blocks: [],
      suggestedActions,
    };
  }

  static buildHistoryFromMessages(messages: AITutorMessage[], maxTurns = 8): AITutorHistoryTurn[] {
    const turns: AITutorHistoryTurn[] = [];
    for (const msg of messages) {
      if (msg.id.startsWith('m-init-') || msg.id === 'msg-welcome') {
        continue;
      }

      if (msg.role !== 'user' && msg.role !== 'assistant') {
        continue;
      }

      let text = (msg.content || '').trim();
      if (!text && msg.structuredResponse) {
        const sr = msg.structuredResponse;
        const parts: string[] = [];
        if (sr.summary) parts.push(sr.summary.trim());
        for (const block of sr.blocks || []) {
          if (block.type === 'explanation' && block.content) {
            parts.push(block.content.trim());
          } else if (block.type === 'chinese_example' && block.hanzi) {
            parts.push(`${block.hanzi} (${block.pinyin}) - ${block.vietnamese}`);
          } else if (block.type === 'correction' && block.correctedSentence) {
            parts.push(`Sửa: ${block.correctedSentence} (${block.explanation})`);
          }
        }
        if (parts.length === 0 && sr.markdownFallback) {
          parts.push(sr.markdownFallback.trim());
        }
        text = parts.join('\n').trim();
      }

      if (!text) continue;

      turns.push({
        role: msg.role,
        content: text.length > 800 ? text.slice(0, 800) : text,
      });
    }

    return turns.slice(-Math.max(1, maxTurns));
  }

  static getErrorMessage(error: unknown): string {
    if (error instanceof ApiClientError) {
      if (error.status === 401) {
        return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại để sử dụng Trợ giảng AI.';
      }
      if (error.status === 429) {
        return 'Hệ thống AI đang quá tải hoặc bạn gửi quá nhanh (429). Vui lòng đợi ít phút rồi thử lại.';
      }
      if (error.status === 503) {
        return 'Trợ giảng AI hiện chưa được cấu hình hoặc tạm thời bảo trì (503).';
      }
      if (error.status === 408 || error.status === 504) {
        return 'Trợ giảng AI phản hồi quá thời gian. Vui lòng thử lại.';
      }
      if (error.isNetworkError && error.status === 0) {
        return 'Không thể kết nối đến máy chủ Trợ giảng AI. Vui lòng kiểm tra mạng và thử lại.';
      }
      return error.message || 'Không thể gửi câu hỏi tới Trợ giảng AI lúc này.';
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Đã xảy ra lỗi không xác định khi gọi Trợ giảng AI. Vui lòng thử lại.';
  }
}
