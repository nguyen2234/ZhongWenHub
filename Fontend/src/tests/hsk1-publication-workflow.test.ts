// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { HSK_CURRICULUM } from '../features/learning/data/curriculumData';

describe('HSK 1 15-Lesson Curriculum Order & HSK 2.0 Scope Guardrails', () => {
  it('keeps HSK 1 with 15 sequential lessons, preserves HSK 2-4 configs, and keeps HSK 5-6 Coming Soon', () => {
    const hsk1 = HSK_CURRICULUM[1];
    const hsk2 = HSK_CURRICULUM[2];
    const hsk3 = HSK_CURRICULUM[3];
    const hsk4 = HSK_CURRICULUM[4];
    const hsk5 = HSK_CURRICULUM[5];
    const hsk6 = HSK_CURRICULUM[6];

    expect(hsk1).toBeDefined();
    expect(hsk2).toBeDefined();
    expect(hsk3).toBeDefined();
    expect(hsk4).toBeDefined();
    expect(hsk5?.isComingSoon).toBe(true);
    expect(hsk6?.isComingSoon).toBe(true);
    expect(hsk5?.units.length).toBe(0);
    expect(hsk6?.units.length).toBe(0);

    const hsk1Lessons = hsk1.units.flatMap((u) => u.lessons);
    const hsk2Lessons = hsk2.units.flatMap((u) => u.lessons);
    const hsk3Lessons = hsk3.units.flatMap((u) => u.lessons);

    expect(hsk1Lessons.length).toBe(15);
    expect(hsk2Lessons.length).toBe(15);
    expect(hsk3Lessons.length).toBe(20);
    expect(hsk4.units.length).toBeGreaterThanOrEqual(1);

    // Ensure sequential order 1..15 in HSK 1
    expect(hsk1Lessons.map((l) => l.lessonNumber)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1)
    );
  });

  it('does not expose any split HSK 4A or HSK 4B level definitions', () => {
    for (const cfg of Object.values(HSK_CURRICULUM)) {
      const label = `${cfg.code}:${cfg.name}`.toUpperCase();
      expect(label).not.toContain('4A');
      expect(label).not.toContain('4B');
    }
  });
});
