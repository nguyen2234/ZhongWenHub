// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { HSK_CURRICULUM } from '../features/learning/data/curriculumData';
import { orderLessonExercises } from '../features/exercise-engine/utils/lesson-exercises';
import { getPublishedCurriculum } from '../features/learning-path/services/published-curriculum.service';

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

it('uses saved exercise sections and order while retaining the previous layout for older lessons', () => {
  const legacy = [{ id: '01', section: undefined }, { id: '02', section: undefined }];
  expect(orderLessonExercises(legacy).map(({ presentation }) => presentation.section)).toEqual(['PRACTICE', 'QUIZ']);

  const ordered = orderLessonExercises([
    { id: 'a', lessonPresentationJson: '{"section":"QUIZ","displayOrder":2,"points":15}' },
    { id: 'b', lessonPresentationJson: '{"section":"PRACTICE","displayOrder":1}' },
    { id: 'c', lessonPresentationJson: '{"section":"QUIZ","displayOrder":1}' },
  ]);
  expect(ordered.map(({ exercise }) => exercise.id)).toEqual(['b', 'c', 'a']);
  expect(ordered[2].presentation.points).toBe(15);
});

it('shows later pages and other courses for the same HSK level, including lessons without units', async () => {
  const originalFetch = globalThis.fetch;
  const lesson = (id: string, unitId: string | null) => ({
    id, unitId, lessonNumber: 1, titleZh: '你好', titleVi: 'Xin chào', durationMinutes: 10, xpReward: 15,
  });
  globalThis.fetch = async (input) => {
    const url = new URL(String(input), 'http://localhost');
    expect(url.searchParams.get('status')).toBe('PUBLISHED');
    if (url.pathname.endsWith('/courses')) {
      expect(url.searchParams.get('hskLevel')).toBe('5');
      return Response.json([{ id: 'c1', title: 'Khóa 1' }, { id: 'c2', title: 'Khóa 2' }]);
    }
    const isFirstCourse = url.searchParams.get('courseId') === 'c1';
    if (url.pathname.endsWith('/units')) {
      return Response.json([{ id: isFirstCourse ? 'u1' : 'u2', unitNumber: 1, titleVi: 'Chủ đề', titleZh: '' }]);
    }
    if (isFirstCourse && url.searchParams.get('page') === '2') {
      return Response.json({ items: [lesson('b', null), lesson('hidden', 'unpublished-unit')], totalPages: 2 });
    }
    return Response.json(isFirstCourse
      ? { items: [lesson('a', 'u1')], totalPages: 2 }
      : { items: [lesson('c', 'u2')], totalPages: 1 });
  };
  try {
    const topics = await getPublishedCurriculum(5);
    expect(topics.map((topic) => topic.id)).toEqual(['u1', 'c1', 'u2']);
    expect(topics.flatMap((topic) => topic.lessons.map((item) => item.dbId))).toEqual(['a', 'b', 'c']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
