// @ts-ignore
import { describe, it, expect } from 'bun:test';
import {
  HSK_CURRICULUM,
  getAllCurriculumLessons,
  findLessonMetadata,
} from '../features/learning/data/curriculumData';
import {
  mapUnitToTopic,
  HSK_LEVEL_TABS,
} from '../features/learning-path/components/HskCurriculumView';
import {
  BEGINNER_STEPS,
} from '../features/learning-path/components/BeginnerRoadmap';

describe('Phase FE-5.4: Redesign Beginner Roadmap & HSK Curriculum', () => {
  describe('1. Beginner 6-Step Roadmap (Single Horizontal Row Specs)', () => {
    it('defines exactly 6 steps in the required order with correct Hanzi and titles', () => {
      expect(BEGINNER_STEPS).toHaveLength(6);

      const expected = [
        { step: 1, hanzi: '拼', title: 'Pinyin' },
        { step: 2, hanzi: '声', title: 'Thanh điệu' },
        { step: 3, hanzi: '字', title: 'Chữ Hán' },
        { step: 4, hanzi: '词', title: 'Từ vựng' },
        { step: 5, hanzi: '语', title: 'Ngữ pháp' },
        { step: 6, hanzi: '听', title: 'nghe và nói' },
      ];

      expected.forEach((exp, idx) => {
        const item = BEGINNER_STEPS[idx];
        expect(item.stepNumber).toBe(exp.step);
        expect(item.hanzi).toBe(exp.hanzi);
        expect(item.title).toContain(exp.title);
        expect(item.shortDescription.length).toBeGreaterThan(10);
        expect(item.practiceRoute).toBeDefined();
      });
    });

    it('has non-empty objective and topic lists for instructional guidance without forced progress', () => {
      BEGINNER_STEPS.forEach((step) => {
        expect(step.objectives.length).toBeGreaterThanOrEqual(2);
        expect(step.topics.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('2. HSK Compact Pill Tabs', () => {
    it('defines 7 compact level tabs covering HSK 1 to HSK 7-9', () => {
      expect(HSK_LEVEL_TABS).toHaveLength(7);
      expect(HSK_LEVEL_TABS.map((t) => t.level)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(HSK_LEVEL_TABS[0].label).toBe('HSK 1');
      expect(HSK_LEVEL_TABS[6].label).toBe('HSK 7–9');
    });

    it('provides valid metadata for every HSK level in curriculum without gaps', () => {
      for (let level = 1; level <= 7; level++) {
        const curriculumLevel = HSK_CURRICULUM[level];
        expect(curriculumLevel).toBeDefined();
        expect(curriculumLevel.level).toBe(level);
        expect(curriculumLevel.units.length).toBeGreaterThan(0);
        expect(curriculumLevel.totalLessons).toBeGreaterThan(0);
      }
    });
  });

  describe('3. Unit-to-Topic Presentation Adapter & No Duplication', () => {
    it('maps every curriculum unit to a topic preserving all lessons and IDs', () => {
      Object.values(HSK_CURRICULUM).forEach((lvl) => {
        lvl.units.forEach((unit) => {
          const topic = mapUnitToTopic(unit);
          expect(topic.id).toBe(unit.id);
          expect(topic.unitNumber).toBe(unit.unitNumber);
          expect(topic.hskLevel).toBe(unit.hskLevel);
          expect(topic.title).toBe(unit.vietnameseTitle);
          expect(topic.hanziTitle).toBe(unit.hanziTitle);
          expect(topic.icon).toBeDefined();
          expect(topic.lessons).toEqual(unit.lessons);
        });
      });
    });

    it('ensures each lesson appears in exactly ONE topic with zero duplication', () => {
      const allLessons = getAllCurriculumLessons();
      const seenIds = new Set<string>();

      allLessons.forEach((lesson) => {
        expect(seenIds.has(lesson.id)).toBe(false);
        seenIds.add(lesson.id);
      });

      expect(seenIds.size).toBe(allLessons.length);
    });

    it('calculates topic progress dynamically based on completedLessonIds', () => {
      const unit = HSK_CURRICULUM[2].units[0]; // Unit 1 of HSK 2: 4 lessons (les-1 to les-4)
      const topic = mapUnitToTopic(unit);

      const mockCompletedLessonIds = ['les-1', 'les-2'];
      const completedCount = topic.lessons.filter((l) => mockCompletedLessonIds.includes(l.id)).length;
      const progressPercent = Math.round((completedCount / topic.lessons.length) * 100);

      expect(completedCount).toBe(2);
      expect(topic.lessons.length).toBe(4);
      expect(progressPercent).toBe(50);
    });
  });

  describe('4. Navigation Integrity & Real Lesson IDs', () => {
    it('resolves valid metadata for all lesson actions across all levels', () => {
      const allLessons = getAllCurriculumLessons();
      allLessons.forEach((lesson) => {
        const meta = findLessonMetadata(lesson.id);
        expect(meta).toBeDefined();
        expect(meta?.id).toBe(lesson.id);
        expect(meta?.hanzi.length).toBeGreaterThan(0);
        expect(meta?.meaning.length).toBeGreaterThan(0);
        expect(meta?.durationMinutes).toBeGreaterThan(0);
      });
    });
  });
});
