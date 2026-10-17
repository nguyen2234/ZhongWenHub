// @ts-ignore
import { describe, expect, it } from 'bun:test';
import { STICKERS, STICKER_SIZES, STICKER_METADATA, type StickerName } from '../assets/stickers';
import { BEGINNER_STEPS } from '../features/learning-path/components/BeginnerRoadmap';

describe('FE-6.4: Sticker Integration & Visual Refinement', () => {
  it('should have all 20 authentic chibi stickers registered in STICKERS asset registry', () => {
    const keys = Object.keys(STICKERS) as StickerName[];
    expect(keys.length).toBe(20);

    const requiredKeys: StickerName[] = [
      'welcome',
      'learning',
      'vocabulary',
      'writing',
      'listening',
      'speaking',
      'aiTutor',
      'completion',
      'correct',
      'incorrect',
      'cheering',
      'thinking',
      'hint',
      'trophy',
      'streak',
      'review',
      'empty',
      'loading',
      'goodnight',
      'idea',
    ];

    requiredKeys.forEach((key) => {
      expect(STICKERS[key]).toBeDefined();
    });
  });

  it('should define standardized size scale tokens without exceeding 160px', () => {
    expect(STICKER_SIZES.xs).toBe(32);
    expect(STICKER_SIZES.sm).toBe(48);
    expect(STICKER_SIZES.md).toBe(72);
    expect(STICKER_SIZES.lg).toBe(104);
    expect(STICKER_SIZES.xl).toBe(136);

    Object.values(STICKER_SIZES).forEach((sizePx) => {
      expect(sizePx).toBeLessThanOrEqual(160);
      expect(sizePx).toBeGreaterThanOrEqual(24);
    });
  });

  it('should assign valid semantic stickers to all 6 beginner roadmap foundation steps', () => {
    expect(BEGINNER_STEPS.length).toBe(6);

    // Step 1: Pinyin -> speaking
    expect(BEGINNER_STEPS[0].stepNumber).toBe(1);
    expect(BEGINNER_STEPS[0].stickerName).toBe('speaking');

    // Step 2: Tones -> listening
    expect(BEGINNER_STEPS[1].stepNumber).toBe(2);
    expect(BEGINNER_STEPS[1].stickerName).toBe('listening');

    // Step 3: Hanzi -> writing
    expect(BEGINNER_STEPS[2].stepNumber).toBe(3);
    expect(BEGINNER_STEPS[2].stickerName).toBe('writing');

    // Step 4: Vocab -> vocabulary
    expect(BEGINNER_STEPS[3].stepNumber).toBe(4);
    expect(BEGINNER_STEPS[3].stickerName).toBe('vocabulary');

    // Step 5: Grammar -> thinking
    expect(BEGINNER_STEPS[4].stepNumber).toBe(5);
    expect(BEGINNER_STEPS[4].stickerName).toBe('thinking');

    // Step 6: Listening & Speaking -> cheering
    expect(BEGINNER_STEPS[5].stepNumber).toBe(6);
    expect(BEGINNER_STEPS[5].stickerName).toBe('cheering');

    // Ensure all assigned sticker keys exist in STICKERS registry
    BEGINNER_STEPS.forEach((step) => {
      const sName = step.stickerName as StickerName | undefined;
      if (sName) {
        expect(STICKERS[sName]).toBeDefined();
        expect(STICKER_METADATA[sName]).toBeDefined();
      }
    });
  });

  it('should contain authentic Viet-Chinese mascot metadata in STICKER_METADATA registry', () => {
    expect(STICKER_METADATA.welcome.label).toContain('Xin chào');
    expect(STICKER_METADATA.aiTutor.label).toContain('trợ lý AI');
    expect(STICKER_METADATA.trophy.label).toContain('cúp');
    expect(STICKER_METADATA.streak.label).toContain('ngọn lửa');
    expect(STICKER_METADATA.empty.label).toContain('trang trống');
  });
});
