import { httpClient } from '../../../core/api/client/http-client';
import { ApiClientError } from '../../../core/api/client/api-error';

export interface GenerateLetterRequest {
  topic: string;
  recipientType?: string;
  hskLevel?: number;
  tone?: string;
  length?: string;
  keyPoints?: string;
  userDraftText?: string;
}

export interface LetterVocabularyHighlight {
  wordZh: string;
  pinyin: string;
  meaningVi: string;
  usageNoteVi: string;
}

export interface LetterGrammarPattern {
  patternZh: string;
  pinyin: string;
  meaningVi: string;
  exampleSentence: string;
}

export interface LetterCorrection {
  originalText: string;
  correctedText: string;
  reasonVi: string;
}

export interface GeneratedLetterResponse {
  sessionId: string;
  titleZh: string;
  salutationZh: string;
  bodyZh: string;
  closingZh: string;
  signOffZh: string;
  fullLetterZh: string;
  fullLetterPinyin: string;
  fullLetterVi: string;
  keyVocabulary: LetterVocabularyHighlight[];
  keyPatterns: LetterGrammarPattern[];
  userDraftCorrections: LetterCorrection[];
  pedagogicalAdviceVi: string;
  estimatedHskLevel: number;
  totalTokensUsed: number;
  modelUsed: string;
  createdAt: string;
}

export interface LetterSummary {
  sessionId: string;
  titleZh: string;
  scenarioCode: string;
  hskLevel: number;
  snippetZh: string;
  createdAt: string;
}

export class LetterWritingService {
  static async generateLetter(
    request: GenerateLetterRequest,
    options?: { signal?: AbortSignal }
  ): Promise<GeneratedLetterResponse> {
    const response = await httpClient.post<GeneratedLetterResponse>(
      '/ai/letters/generate',
      {
        topic: request.topic,
        recipientType: request.recipientType || 'friend',
        hskLevel: request.hskLevel ?? 3,
        tone: request.tone || 'polite',
        length: request.length || 'medium',
        keyPoints: request.keyPoints || null,
        userDraftText: request.userDraftText || null,
      },
      {
        timeoutMs: 45000,
        signal: options?.signal,
      }
    );
    return response;
  }

  static async getHistory(limit = 20): Promise<LetterSummary[]> {
    try {
      const response = await httpClient.get<LetterSummary[]>('/ai/letters/history', {
        params: { limit },
        timeoutMs: 15000,
      });
      return response || [];
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 401 || error.status === 404)) {
        return [];
      }
      return [];
    }
  }

  static async getDetail(sessionId: string): Promise<GeneratedLetterResponse> {
    return await httpClient.get<GeneratedLetterResponse>(`/ai/letters/${sessionId}`, {
      timeoutMs: 15000,
    });
  }

  static getErrorMessage(error: unknown): string {
    if (error instanceof ApiClientError) {
      if (error.status === 401) {
        return 'Vui lòng đăng nhập để sử dụng tính năng viết thư bằng AI.';
      }
      if (error.status === 429) {
        return 'Hạn mức tạo thư hôm nay đã đạt giới hạn hoặc dịch vụ AI đang bận. Vui lòng thử lại sau.';
      }
      if (error.status === 503 || error.status === 502) {
        return 'Dịch vụ AI chưa sẵn sàng hoặc kết nối bị gián đoạn. Vui lòng liên hệ quản trị viên.';
      }
      return error.message || 'Không thể tạo thư lúc này.';
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Đã xảy ra lỗi không xác định.';
  }
}
