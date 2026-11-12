import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formatLessonSource } from '../features/vocabulary/components/VocabularyBank';

describe('Vocabulary Deduplication & Multi-Lesson Display Contracts', () => {
  test('formatLessonSource formats single linked lesson accurately instead of ambiguous levelLabel "1"', () => {
    const label = formatLessonSource(
      1,
      [{ lessonId: 'l-7', hskLevel: 1, lessonNumber: 7, titleVi: 'Hôm nay thứ mấy?' }],
      '1'
    );
    expect(label).toBe('HSK 1 · Bài 7');
    expect(label).not.toBe('HSK 1 · 1');
  });

  test('formatLessonSource formats multi-lesson words cleanly in sorted order without duplicates', () => {
    const label = formatLessonSource(
      2,
      [
        { lessonId: 'l-14', hskLevel: 2, lessonNumber: 14, titleVi: 'Bài 14' },
        { lessonId: 'l-1', hskLevel: 2, lessonNumber: 1, titleVi: 'Bài 1' },
        { lessonId: 'l-1b', hskLevel: 2, lessonNumber: 1, titleVi: 'Bài 1 dup' },
      ],
      '2'
    );
    expect(label).toBe('HSK 2 · Bài 1, Bài 14');
  });

  test('formatLessonSource falls back to "HSK N chuẩn quốc tế" when no lesson or matching levelLabel exists', () => {
    expect(formatLessonSource(1, [], '1')).toBe('HSK 1 chuẩn quốc tế');
    expect(formatLessonSource(3, undefined, undefined)).toBe('HSK 3 chuẩn quốc tế');
  });

  test('VocabularyCard & VocabularyDetailDrawer support multi-lesson indicator without hiding duplicates via CSS', () => {
    const cardSrc = readFileSync(resolve(import.meta.dir, '../features/vocabulary/components/VocabularyCard.tsx'), 'utf-8');
    const drawerSrc = readFileSync(resolve(import.meta.dir, '../features/vocabulary/components/VocabularyDetailDrawer.tsx'), 'utf-8');

    expect(cardSrc).toContain('vocabulary.lessons.length > 1');
    expect(cardSrc).not.toContain('display: none');
    expect(drawerSrc).toContain('Thuộc các bài học:');
  });
});

