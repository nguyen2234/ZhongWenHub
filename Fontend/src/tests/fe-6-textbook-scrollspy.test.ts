// @ts-ignore
import { describe, expect, it } from 'bun:test';
import { hskTextbookService } from '../features/lesson/services/hsk-textbook.service';
import { TOC_SECTIONS } from '../features/lesson/components/LessonTableOfContents';

describe('FE-6 & FE-6.1: HSK Digital Textbook & Sticky Scroll-Spy', () => {
  it('should load authentic textbook content for les-hsk1-1 (HSK 1 Lesson 1)', async () => {
    const lesson = await hskTextbookService.getTextbookLesson('les-hsk1-1');
    expect(lesson).not.toBeNull();
    if (!lesson) return;

    // Check metadata mapping
    expect(lesson.lessonId).toBe('les-hsk1-1');
    expect(lesson.hskLevel).toBe(1);
    expect(lesson.titleVi).toContain('Xin chào');
    expect(lesson.titleZh).toContain('你好');
    expect(lesson.pinyin).toContain('Nǐ hǎo');

    // Check vocabulary count and fields
    expect(lesson.vocabularies.length).toBeGreaterThanOrEqual(1);
    const firstVocab = lesson.vocabularies[0];
    expect(firstVocab.hanzi).toBeDefined();
    expect(firstVocab.pinyin).toBeDefined();
    expect(firstVocab.meaning).toBeDefined();

    // Check grammar points
    expect(lesson.grammars.length).toBeGreaterThanOrEqual(1);
    const firstGrammar = lesson.grammars[0];
    expect(firstGrammar.title).toBeDefined();
    expect(firstGrammar.structure).toBeDefined();
    expect(firstGrammar.explanation).toBeDefined();

    // Check dialogue
    expect(lesson.dialogue).toBeDefined();
    expect(lesson.dialogue.lines.length).toBeGreaterThanOrEqual(2);
    expect(lesson.dialogue.speakers.length).toBeGreaterThanOrEqual(2);
  });

  it('should load authentic textbook content for les-1 (HSK 2 Lesson 1)', async () => {
    const lesson = await hskTextbookService.getTextbookLesson('les-1');
    expect(lesson).not.toBeNull();
    if (!lesson) return;

    expect(lesson.lessonId).toBe('les-1');
    expect(lesson.hskLevel).toBe(2);
    expect(lesson.vocabularies.length).toBeGreaterThanOrEqual(1);
  });

  it('should fallback gracefully for unknown lessonId without crashing or masking as another lesson', async () => {
    const lesson = await hskTextbookService.getTextbookLesson('unknown-id-xyz');
    expect(lesson).not.toBeNull();
    if (!lesson) return;
    expect(lesson.lessonId).toBe('unknown-id-xyz');
    expect(lesson.titleVi).toContain('unknown-id-xyz');
    expect(Array.isArray(lesson.vocabularies)).toBe(true);
    expect(Array.isArray(lesson.grammars)).toBe(true);
    expect(lesson.dialogue).toBeDefined();
  });

  it('should have 6 defined scroll-spy TOC sections in exact order', () => {
    const sectionIds = TOC_SECTIONS.map((s) => s.id);
    expect(sectionIds).toEqual([
      'overview',
      'vocabulary',
      'grammar',
      'dialogue',
      'practice',
      'complete',
    ]);

    // Check section labels in Vietnamese
    expect(TOC_SECTIONS[0].label).toBe('Tổng quan');
    expect(TOC_SECTIONS[1].label).toBe('Từ vựng');
    expect(TOC_SECTIONS[2].label).toBe('Ngữ pháp');
    expect(TOC_SECTIONS[3].label).toBe('Hội thoại');
    expect(TOC_SECTIONS[4].label).toBe('Luyện tập củng cố');
    expect(TOC_SECTIONS[5].label).toBe('Kết quả');
  });

  it('should get correct next and previous lesson navigation in curriculum order', () => {
    const next1 = hskTextbookService.getNextLessonId('les-hsk1-1');
    expect(next1).toBe('les-hsk1-2');

    const prev2 = hskTextbookService.getPrevLessonId('les-hsk1-2');
    expect(prev2).toBe('les-hsk1-1');

    const prev1 = hskTextbookService.getPrevLessonId('les-hsk1-1');
    expect(prev1).toBeNull();
  });
});
