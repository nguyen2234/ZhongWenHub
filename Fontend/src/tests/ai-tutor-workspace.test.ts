import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { VoiceSessionController } from '../features/ai-tutor/services/voice/VoiceSessionController';
import { AITutorService } from '../features/ai-tutor/services/AITutorService';
import { authTokenService } from '../core/api/client/auth-token.service';
import { hskLevelIdToNumber, hskNumberToLevelId } from '../utils/hsk.utils';

describe('Phase FE-1 & FE-2 AI Tutor Workspace Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  it('TEST 01 - 03: Voice Session Controller initializes in IDLE state', () => {
    const controller = new VoiceSessionController();
    expect(controller.getState()).toBe('IDLE');
    expect(controller.getTurns().length).toBe(0);
    expect(controller.getMetrics().interruptionCount).toBe(0);
  });

  it('TEST 04 - 07: Starting session transitions to SPEAKING and generates assistant greeting', async () => {
    const controller = new VoiceSessionController();
    await controller.startSession('daily_conversation', 'Gọi đồ uống tại quán cà phê', 2);
    expect(controller.getState()).toBe('SPEAKING');
    expect(controller.getTurns().length).toBe(1);
    expect(controller.getTurns()[0].speaker).toBe('assistant');
    expect(controller.getTurns()[0].hanzi).toContain('你想喝点什么');
  });

  it('TEST 08 - 10: Barge-in interruption and state recovery', async () => {
    const controller = new VoiceSessionController();
    await controller.startSession('daily_conversation', 'Gọi đồ uống tại quán cà phê', 2);
    controller.interruptAssistant();
    expect(controller.getState()).toBe('INTERRUPTED');
    expect(controller.getMetrics().interruptionCount).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(controller.getState()).toBe('LISTENING');
  });

  it('TEST 11: Stale playback prevention', async () => {
    const controller = new VoiceSessionController();
    await controller.startSession('daily_conversation', 'Gọi đồ uống tại quán cà phê', 2);
    const currentCount = controller.getTurns().length;
    controller.cancelPlayback();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(controller.getTurns().length).toBe(currentCount);
  });

  it('TEST 12 & 13: Pause and resume session', async () => {
    const controller = new VoiceSessionController();
    await controller.startSession('daily_conversation', 'Gọi đồ uống tại quán cà phê', 2);
    controller.pauseSession();
    expect(controller.getState()).toBe('PAUSED');
    controller.resumeSession();
    expect(controller.getState()).toBe('LISTENING');
  });

  it('TEST 14 - 19: Simulated user utterance and assistant response', async () => {
    const controller = new VoiceSessionController();
    await controller.startSession('daily_conversation', 'Gọi đồ uống tại quán cà phê', 2);

    controller.sendUserUtterance({
      hanzi: '我要一杯冰美式咖啡。',
      pinyin: 'Wǒ yào yībēi bīng měishì kāfēi.',
      vietnamese: 'Tôi muốn một ly Americano đá.',
    });
    expect(controller.getState()).toBe('PROCESSING');
    expect(controller.getTurns().length).toBe(2);
    expect(controller.getTurns()[1].speaker).toBe('user');

    // Wait for AI response processing (~1.3s)
    await new Promise((resolve) => setTimeout(resolve, 1350));
    expect(controller.getState()).toBe('SPEAKING');
    expect(controller.getTurns().length).toBe(3);
    expect(controller.getTurns()[2].speaker).toBe('assistant');
  });

  it('TEST 20 - 24: Stop session and honest post-session review data', async () => {
    const controller = new VoiceSessionController();
    await controller.startSession('daily_conversation', 'Gọi đồ uống tại quán cà phê', 2);

    controller.sendUserUtterance({
      hanzi: '我要一杯冰美式咖啡。',
      pinyin: 'Wǒ yào yībēi bīng měishì kāfēi.',
      vietnamese: 'Tôi muốn một ly Americano đá.',
    });
    await new Promise((resolve) => setTimeout(resolve, 1350));

    const review = controller.stopSession();
    expect(controller.getState()).toBe('ENDED');
    expect(review.isDemoEvaluation).toBe(true);
    expect(review.vocabularyPracticed.length).toBeGreaterThan(0);
    expect(review.grammarPointsObserved.length).toBeGreaterThan(0);
    expect(review.turnCount).toBe(3);
  });

  it('TEST 25 - 28: AITutorService normalizes structured responses and sentence corrections', async () => {
    authTokenService.setSession({ accessToken: 'test-jwt-token' });
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          type: 'structured',
          summary: 'Giải thích lỗi sai',
          blocks: [
            {
              type: 'explanation',
              title: 'PHÂN TÍCH',
              content: 'Dùng 想 (xiǎng) trước động từ 喝 (hē).',
            },
          ],
          suggestedActions: ['Phân biệt 想 và 要'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )) as unknown as typeof fetch;

    const errResponse = await AITutorService.sendChatMessage({
      conversationId: 'test-conv-1',
      message: 'Tại sao câu của tôi sai?',
      mode: 'EXPLAIN',
      context: {
        source: 'practice',
        hskLevel: 2,
        exerciseContext: {
          exerciseId: 'ex-101',
          question: 'Điền từ thích hợp vào chỗ trống',
          userAnswer: 'shì',
          correctAnswer: '想 (xiǎng)',
          promptHanzi: '我 ___ 喝茶。',
        },
      },
    });
    expect(errResponse.type).toBe('structured');
    expect(errResponse.blocks.length).toBeGreaterThan(0);
    expect(errResponse.suggestedActions.length).toBeGreaterThan(0);

    // Sentence correction test
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          type: 'structured',
          summary: 'Sửa câu',
          blocks: [
            {
              type: 'correction',
              originalSentence: '我想喝咖啡了',
              correctedSentence: '我想喝咖啡。',
              pinyin: 'Wǒ xiǎng hē kāfēi.',
              vietnamese: 'Tôi muốn uống cà phê.',
              explanation: 'Không cần 了 trong câu biểu thị nguyện vọng hiện tại.',
              diffItems: [{ type: 'same', text: '我想喝咖啡' }],
            },
          ],
          suggestedActions: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )) as unknown as typeof fetch;

    const corrResponse = await AITutorService.sendChatMessage({
      conversationId: 'test-conv-2',
      message: 'Sửa giúp tôi câu này: 我想喝咖啡了',
      mode: 'CORRECT',
      context: {
        source: 'dashboard',
        hskLevel: 2,
      },
    });
    const hasCorrection = corrResponse.blocks.some((b) => b.type === 'correction');
    expect(hasCorrection).toBe(true);
  });

  it('TEST 29 - 33: HSK 7-9 Level Support', () => {
    expect(hskLevelIdToNumber('level-hsk-79')).toBe(7);
    expect(hskLevelIdToNumber('hsk7-9')).toBe(7);
    expect(hskNumberToLevelId(7)).toBe('level-hsk-79');
    expect(hskNumberToLevelId(8)).toBe('level-hsk-79');
    expect(hskNumberToLevelId(9)).toBe('level-hsk-79');
  });
});
