import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AI_TUTOR_WELCOME_MESSAGE } from '../features/ai-tutor/components/AITutorDrawer';
import { ContextBuilder } from '../features/ai-tutor/services/ContextBuilder';

const readFeatureFile = (relPath: string) =>
  readFileSync(resolve(import.meta.dir, '../features/ai-tutor', relPath), 'utf-8');

describe('AI Tutor Minimalist Chat UI Redesign', () => {
  test('header preserves AI character icon, title and minimal subtitle without HSK 1-6 or Gia sư toàn diện badges', () => {
    const headerSrc = readFeatureFile('components/AITutorHeader.tsx');

    expect(headerSrc).toContain('<StickerIllustration name="aiTutor"');
    expect(headerSrc).toContain('Trợ giảng AI ZhongWen');
    expect(headerSrc).toContain('AI Contextual Tutor');
    expect(headerSrc).toContain('Đóng Trợ giảng AI');

    expect(headerSrc).not.toContain('HSK 1-6');
    expect(headerSrc).not.toContain('HSK 1–6');
    expect(headerSrc).not.toContain('Gia sư toàn diện');
    expect(headerSrc).not.toContain('getReadableHeader');
  });

  test('drawer removes old mode tabs, shows exact concise welcome message once, and limits initial suggestions to <= 3', () => {
    const drawerSrc = readFeatureFile('components/AITutorDrawer.tsx');

    expect(AI_TUTOR_WELCOME_MESSAGE).toBe(
      'Chào bạn! Mình là Trợ giảng AI ZhongWen.\n\nBạn có thể hỏi mình về từ vựng, ngữ pháp, bài tập hoặc luyện hội thoại tiếng Trung.\n\nMình luôn sẵn sàng hỗ trợ bạn! 😊'
    );
    expect(AI_TUTOR_WELCOME_MESSAGE).not.toContain('HSK 1');

    expect(drawerSrc).not.toContain('Hỏi đáp & Giải thích');
    expect(drawerSrc).not.toContain('💬 Luyện hội thoại');
    expect(drawerSrc).not.toContain("setMode('CONVERSATION')");
    expect(drawerSrc).not.toContain('<ConversationScenario');

    expect(drawerSrc).toContain('hasInitializedWelcomeRef');
    expect(drawerSrc).toContain('isNearBottomRef');
    expect(drawerSrc).toContain('distanceFromBottom < 80');
    expect(drawerSrc).toContain('.slice(0, 3)');
    expect(drawerSrc).toContain('!hasUserStartedChat');
    expect(drawerSrc).toContain('zIndex: 1100');
  });

  test('input supports Enter/Shift+Enter, exact placeholder, draft preservation on failure, and no file/mic clutter', () => {
    const inputSrc = readFeatureFile('components/AITutorInput.tsx');

    expect(inputSrc).toContain('Hỏi bất kỳ điều gì về bài học hoặc chữ Hán...');
    expect(inputSrc).toContain('<textarea');
    expect(inputSrc).toContain('<Sparkles');
    expect(inputSrc).toContain("e.key === 'Enter' && !e.shiftKey");
    expect(inputSrc).toContain('result !== false');
    expect(inputSrc).not.toContain('type="file"');
    expect(inputSrc).not.toContain('Mic');
  });

  test('message item uses distinct light user/AI bubbles, safe formatting, Copy and Like/Dislike controls', () => {
    const msgSrc = readFeatureFile('components/AITutorMessageItem.tsx');

    expect(msgSrc).toContain('#e0ecff');
    expect(msgSrc).toContain('#f1f5f9');
    expect(msgSrc).toContain('<StickerIllustration name="aiTutor"');
    expect(msgSrc).toContain('Copy');
    expect(msgSrc).toContain('ThumbsUp');
    expect(msgSrc).toContain('ThumbsDown');
    expect(msgSrc).not.toMatch(/dangerouslySetInnerHTML\s*=/);
  });

  test('HSK level context logic remains intact in ContextBuilder even though UI HSK badges were removed', () => {
    const vocabCtx = ContextBuilder.build('vocabulary', {
      hskLevel: 4,
      vocabularyWord: { hanzi: '安排', pinyin: 'ānpái', meaning: 'sắp xếp' },
    });
    expect(vocabCtx.hskLevel).toBe(4);
    expect(vocabCtx.vocabularyWord?.hanzi).toBe('安排');
    expect(ContextBuilder.getReadableHeader(vocabCtx).tag).toBe('HSK 4');
  });
});

