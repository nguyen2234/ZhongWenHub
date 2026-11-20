import { describe, expect, test, afterEach } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AITutorService } from '../features/ai-tutor/services/AITutorService';
import { authTokenService } from '../core/api/client/auth-token.service';
import { ApiClientError } from '../core/api/client/api-error';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  authTokenService.clearTokens();
});

describe('Phase 1 Real AI Chatbot - Frontend Integration Contracts', () => {
  test('sendChatMessage calls POST /api/v1/ai-tutor/chat with Bearer token and returns structured Vietnamese/Hanzi/Pinyin data', async () => {
    let capturedUrl = '';
    let capturedAuthHeader = '';

    authTokenService.setSession({ accessToken: 'jwt-student-token-123' });
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      const headers = new Headers(init?.headers);
      capturedAuthHeader = headers.get('Authorization') || '';

      return new Response(
        JSON.stringify({
          type: 'structured',
          summary: 'Giải thích từ vựng 你好',
          blocks: [
            {
              type: 'explanation',
              title: 'NGHĨA TIẾNG VIỆT',
              content: '你好 (nǐ hǎo) nghĩa là Xin chào.',
            },
            {
              type: 'chinese_example',
              hanzi: '你好！',
              pinyin: 'Nǐ hǎo!',
              vietnamese: 'Xin chào!',
            },
          ],
          suggestedActions: ['Cho thêm ví dụ'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as unknown as typeof fetch;

    const result = await AITutorService.sendChatMessage({
      conversationId: 'conv-1',
      message: 'Giải thích từ 你好',
      mode: 'EXPLAIN',
      context: {
        source: 'vocabulary',
        hskLevel: 1,
        vocabularyWord: { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' },
      },
    });

    expect(capturedUrl).toEndWith('/api/v1/ai-tutor/chat');
    expect(capturedAuthHeader).toBe('Bearer jwt-student-token-123');
    expect(result.type).toBe('structured');
    expect(result.blocks).toHaveLength(2);
  });

  test('normalizeResponse safely degrades invalid or non-structured AI output to markdownFallback without crashing UI', () => {
    const malformedPayload = {
      type: 'structured',
      summary: 'Giải đáp ngắn',
      markdownFallback: '**学习** (xuéxí): học tập.',
      blocks: [{ type: 'unknown_block', foo: 'bar' }, { type: 'chinese_example', hanzi: 'missing-pinyin' }],
      suggestedActions: ['Hỏi thêm'],
    };

    const normalized = AITutorService.normalizeResponse(malformedPayload);
    expect(normalized.type).toBe('markdown');
    expect(normalized.blocks).toEqual([]);
    expect(normalized.markdownFallback).toContain('学习');
  });

  test('sendChatMessage does NOT return mock answers when backend returns 401, 429, or 503', async () => {
    const statuses = [401, 429, 503] as const;

    for (const status of statuses) {
      globalThis.fetch = (async () =>
        new Response(
          JSON.stringify({ title: 'Error', status, detail: `Server status ${status}` }),
          { status, headers: { 'Content-Type': 'application/problem+json' } }
        )) as unknown as typeof fetch;

      let caught: unknown = null;
      try {
        await AITutorService.sendChatMessage({
          conversationId: 'conv-err',
          message: 'Xin chào',
          mode: 'ASK',
          context: { source: 'general', hskLevel: 2 },
        });
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ApiClientError);
      expect((caught as ApiClientError).status).toBe(status);
      expect(AITutorService.getErrorMessage(caught).length).toBeGreaterThan(10);
    }
  });

  test('AI Tutor service has no hardcoded mock replies and UI components preserve retry + markdownFallback support', () => {
    const serviceSrc = readFileSync(
      resolve(import.meta.dir, '../features/ai-tutor/services/AITutorService.ts'),
      'utf-8'
    );
    const drawerSrc = readFileSync(
      resolve(import.meta.dir, '../features/ai-tutor/components/AITutorDrawer.tsx'),
      'utf-8'
    );
    const chatViewSrc = readFileSync(
      resolve(import.meta.dir, '../features/ai-tutor/components/chat/AITutorChatView.tsx'),
      'utf-8'
    );
    const msgItemSrc = readFileSync(
      resolve(import.meta.dir, '../features/ai-tutor/components/AITutorMessageItem.tsx'),
      'utf-8'
    );

    expect(serviceSrc).not.toContain('Mock generation');
    expect(serviceSrc).toContain('/ai-tutor/chat');
    expect(drawerSrc).toContain('Thử lại');
    expect(chatViewSrc).toContain('Thử lại');
    expect(msgItemSrc).toContain('markdownFallback');
  });
});
