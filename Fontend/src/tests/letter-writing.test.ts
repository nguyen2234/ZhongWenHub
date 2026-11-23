// @ts-ignore
import { describe, it, expect, mock } from 'bun:test';
import { LetterWritingService } from '../features/ai-grading/services/letter-writing.service';
import { ApiClientError } from '../core/api/client/api-error';

describe('LetterWritingService Frontend Contract Tests', () => {
  it('correctly formats error messages for 401, 429, 502/503', () => {
    const err401 = new ApiClientError('Unauthorized', 401, null);
    expect(LetterWritingService.getErrorMessage(err401)).toContain('đăng nhập');

    const err429 = new ApiClientError('Too Many Requests', 429, null);
    expect(LetterWritingService.getErrorMessage(err429)).toContain('giới hạn');

    const err503 = new ApiClientError('Service Unavailable', 503, null);
    expect(LetterWritingService.getErrorMessage(err503)).toContain('chưa sẵn sàng');

    const genericErr = new Error('Lỗi mạng giả lập');
    expect(LetterWritingService.getErrorMessage(genericErr)).toBe('Lỗi mạng giả lập');
  });

  it('exports LetterWritingService with generateLetter, getHistory and getDetail methods', () => {
    expect(typeof LetterWritingService.generateLetter).toBe('function');
    expect(typeof LetterWritingService.getHistory).toBe('function');
    expect(typeof LetterWritingService.getDetail).toBe('function');
  });
});
