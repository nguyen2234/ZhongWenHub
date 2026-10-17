// @ts-ignore
import { describe, it, expect } from 'bun:test';
import {
  BEGINNER_STEPS,
  computeStepStatus,
} from '../features/learning-path/components/BeginnerRoadmap';
import {
  HANBEEGO_STUDENT_NAV_GROUPS,
} from '../config/student-navigation.config';
import { findLessonMetadata } from '../features/learning/data/curriculumData';
import type { StudentLearningState } from '../features/learning/types/learning-state.types';

describe('Phase FE-5.3: Beginner Learning Guidance & 6-Step Roadmap', () => {
  describe('1. Sidebar Navigation Alignment', () => {
    it('renames beginner menu item to "Lộ trình học tập" with mode=beginner query parameter', () => {
      const coursesGroup = HANBEEGO_STUDENT_NAV_GROUPS.find((g) => g.id === 'courses');
      expect(coursesGroup).toBeDefined();

      const beginnerItem = coursesGroup?.items.find((i) => i.id === 'beginner');
      expect(beginnerItem).toBeDefined();
      expect(beginnerItem?.label).toBe('Lộ trình học tập');
      expect(beginnerItem?.path).toBe('/learning-path?mode=beginner');
    });

    it('preserves HSK curriculum item in courses group', () => {
      const coursesGroup = HANBEEGO_STUDENT_NAV_GROUPS.find((g) => g.id === 'courses');
      const curriculumItem = coursesGroup?.items.find((i) => i.id === 'curriculum');
      expect(curriculumItem).toBeDefined();
      expect(curriculumItem?.label).toBe('Giáo trình HSK');
      expect(curriculumItem?.path).toBe('/learning-path?mode=hsk');
    });
  });

  describe('2. Visual 6-Step Roadmap Definitions', () => {
    it('defines exactly 6 structured beginner steps in sequential order', () => {
      expect(BEGINNER_STEPS).toHaveLength(6);
      BEGINNER_STEPS.forEach((step, index) => {
        expect(step.stepNumber).toBe(index + 1);
        expect(step.hanzi.length).toBeGreaterThan(0);
        expect(step.pinyin.length).toBeGreaterThan(0);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.shortDescription.length).toBeGreaterThan(0);
        expect(step.objectives.length).toBeGreaterThanOrEqual(2);
        expect(step.topics.length).toBeGreaterThanOrEqual(2);
        expect(step.practiceRoute).toBeDefined();
        expect(step.completionCriteria.length).toBeGreaterThan(0);
      });
    });

    it('contains the correct step titles and large Hanzi representations', () => {
      expect(BEGINNER_STEPS[0].hanzi).toBe('拼');
      expect(BEGINNER_STEPS[0].pinyin).toBe('Pīnyīn');
      expect(BEGINNER_STEPS[0].title).toContain('Pinyin');

      expect(BEGINNER_STEPS[1].hanzi).toBe('声');
      expect(BEGINNER_STEPS[1].pinyin).toBe('Shēngdiào');
      expect(BEGINNER_STEPS[1].title).toContain('Thanh điệu');

      expect(BEGINNER_STEPS[2].hanzi).toBe('字');
      expect(BEGINNER_STEPS[2].pinyin).toBe('Hànzì');
      expect(BEGINNER_STEPS[2].title).toContain('Chữ Hán');

      expect(BEGINNER_STEPS[3].hanzi).toBe('词');
      expect(BEGINNER_STEPS[3].pinyin).toBe('Cíhuì');
      expect(BEGINNER_STEPS[3].title).toContain('Từ vựng');

      expect(BEGINNER_STEPS[4].hanzi).toBe('语');
      expect(BEGINNER_STEPS[4].pinyin).toBe('Yǔfǎ');
      expect(BEGINNER_STEPS[4].title).toContain('Ngữ pháp');

      expect(BEGINNER_STEPS[5].hanzi).toBe('听');
      expect(BEGINNER_STEPS[5].pinyin).toBe('Tīngshuō');
      expect(BEGINNER_STEPS[5].title).toContain('nghe và nói');
    });

    it('maps every step to a valid lesson in the real curriculum without dead links', () => {
      BEGINNER_STEPS.forEach((step) => {
        if (step.linkedLessonId) {
          const lessonMeta = findLessonMetadata(step.linkedLessonId);
          expect(lessonMeta).toBeDefined();
          expect(lessonMeta?.id).toBe(step.linkedLessonId);
          expect(lessonMeta?.durationMinutes).toBeGreaterThan(0);
          expect(lessonMeta?.xpReward).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('3. Dynamic Step Status Computation', () => {
    const createBaseState = (): StudentLearningState => ({
      schemaVersion: 1,
      studentId: 'test-user',
      selectedHskLevel: 1,
      currentLessonId: 'les-hsk1-1',
      completedLessonIds: [],
      lessonProgress: {},
      exerciseAttempts: [],
      userVocabStates: {},
      userSrsStates: {},
      weakKnowledgePoints: [],
      xpTotal: 0,
      rewardedEventIds: [],
      streakDays: 0,
      lastActivityDate: '',
      dailyGoal: {
        targetMinutes: 15,
        targetXp: 30,
      },
      dailyActivityHistory: {},
    });

    it('marks all steps as not_started for a brand new student', () => {
      const state = createBaseState();
      for (let i = 1; i <= 6; i++) {
        const status = computeStepStatus(i, state, BEGINNER_STEPS[i - 1].linkedLessonId);
        expect(status).toBe('not_started');
      }
    });

    it('marks Step 1 as in_progress when user has started lesson 1', () => {
      const state = createBaseState();
      state.lessonProgress['les-hsk1-1'] = {
        lessonId: 'les-hsk1-1',
        userId: 'test-user',
        status: 'IN_PROGRESS',
        currentStepIndex: 1,
        maxUnlockedStepIndex: 1,
        xpEarned: 10,
        updatedAt: new Date().toISOString(),
      };

      const step1Status = computeStepStatus(1, state, 'les-hsk1-1');
      expect(step1Status).toBe('in_progress');

      const step2Status = computeStepStatus(2, state, 'les-hsk1-2');
      expect(step2Status).toBe('not_started');
    });

    it('marks Step 1 as completed and Step 2 as in_progress when lesson 1 is finished', () => {
      const state = createBaseState();
      state.completedLessonIds = ['les-hsk1-1'];

      expect(computeStepStatus(1, state, 'les-hsk1-1')).toBe('completed');
      expect(computeStepStatus(2, state, 'les-hsk1-2')).toBe('in_progress');
      expect(computeStepStatus(3, state, 'les-hsk1-3')).toBe('not_started');
    });

    it('marks Step 4 as completed when student accumulates 30+ learned words', () => {
      const state = createBaseState();
      state.completedLessonIds = ['les-hsk1-1', 'les-hsk1-2', 'les-hsk1-3'];

      // Fill 30 vocab items
      for (let i = 1; i <= 30; i++) {
        state.userVocabStates[`vocab-${i}`] = {
          vocabularyId: `vocab-${i}`,
          status: 'learning',
          firstLearnedAt: new Date().toISOString(),
          lastReviewedAt: new Date().toISOString(),
          nextReviewAt: new Date().toISOString(),
          reviewCount: 2,
          correctCount: 2,
          isDueToday: false,
        };
      }

      expect(computeStepStatus(4, state, 'les-hsk1-4')).toBe('completed');
    });

    it('marks all 6 steps as completed when student finishes all 6 lessons', () => {
      const state = createBaseState();
      state.completedLessonIds = [
        'les-hsk1-1',
        'les-hsk1-2',
        'les-hsk1-3',
        'les-hsk1-4',
        'les-hsk1-5',
        'les-hsk1-6',
      ];

      for (let i = 1; i <= 6; i++) {
        expect(computeStepStatus(i, state, BEGINNER_STEPS[i - 1].linkedLessonId)).toBe('completed');
      }
    });
  });
});
