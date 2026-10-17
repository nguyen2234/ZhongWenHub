// @ts-ignore
import { describe, it, expect } from 'bun:test';
import {
  HANBEEGO_STUDENT_NAV_GROUPS,
  STUDENT_MAIN_NAV_ITEMS,
} from '../config/student-navigation.config';
import {
  HSK_LEVEL_TABS,
  mapUnitToTopic,
} from '../features/learning-path/components/HskCurriculumView';
import { HSK_CURRICULUM } from '../features/learning/data/curriculumData';
import { LearningPathPage } from '../features/learning-path/pages/LearningPathPage';
import { VocabularyPage } from '../features/vocabulary/pages/VocabularyPage';
import { PracticePage } from '../features/practice/pages/PracticePage';
import { GrammarPage } from '../features/grammar/pages/GrammarPage';
import { ProgressPage } from '../features/progress/pages/ProgressPage';
import { VideoLibraryPage } from '../features/videos/pages/VideoLibraryPage';
import { StudentSidebar } from '../layouts/components/StudentSidebar';
import { StudentLayout } from '../layouts/StudentLayout';

describe('Phase FE-5.6: Centered Layout, Better Spacing & Invisible Sidebar Scrollbar', () => {
  describe('1. Sidebar Navigation Structure & Badges Integrity', () => {
    it('contains all 4 required HanbeeGo navigation groups in correct order', () => {
      expect(HANBEEGO_STUDENT_NAV_GROUPS.length).toBe(4);
      const groupIds = HANBEEGO_STUDENT_NAV_GROUPS.map((g) => g.id);
      expect(groupIds).toEqual(['overview', 'courses', 'skills', 'personal']);
    });

    it('validates badges for AI Tutor, Lộ trình mới and SRS features in sidebar', () => {
      const allItems = HANBEEGO_STUDENT_NAV_GROUPS.flatMap((g) => g.items);
      const aiItem = allItems.find((i) => i.id === 'ai-tutor');
      const beginnerItem = allItems.find((i) => i.id === 'beginner');
      const vocabItem = allItems.find((i) => i.id === 'vocabulary');
      const mockItem = allItems.find((i) => i.id === 'mock-exams');
      const videoItem = allItems.find((i) => i.id === 'videos');

      expect(aiItem).toBeDefined();
      expect(aiItem?.badge).toBe('AI');
      expect(beginnerItem).toBeDefined();
      expect(beginnerItem?.badge).toBe('Mới');
      expect(vocabItem).toBeDefined();
      expect(vocabItem?.badge).toBe('SRS');
      expect(mockItem).toBeDefined();
      expect(mockItem?.badge).toBe('Thi thử');
      expect(videoItem).toBeDefined();
      expect(videoItem?.badge).toBe('Mới');
    });

    it('ensures all sidebar items have valid paths and icon components', () => {
      const allItems = HANBEEGO_STUDENT_NAV_GROUPS.flatMap((g) => g.items);
      expect(allItems.length).toBeGreaterThanOrEqual(12);

      allItems.forEach((item) => {
        expect(item.id.length).toBeGreaterThan(0);
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.path.startsWith('/')).toBe(true);
        expect(typeof item.icon).toBe('object');
      });
    });
  });

  describe('2. Curriculum Topics & Compact Layout Integrity', () => {
    it('defines 7 HSK level tabs covering HSK 1 to HSK 7-9', () => {
      expect(HSK_LEVEL_TABS.length).toBe(7);
      expect(HSK_LEVEL_TABS[0].level).toBe(1);
      expect(HSK_LEVEL_TABS[6].level).toBe(7);
    });

    it('maps every curriculum unit to a topic with compact lessons', () => {
      const hsk1Units = HSK_CURRICULUM[1].units;
      expect(hsk1Units.length).toBeGreaterThan(0);

      hsk1Units.forEach((unit) => {
        const topic = mapUnitToTopic(unit);
        expect(topic.id).toBeDefined();
        expect(topic.title.length).toBeGreaterThan(0);
        expect(topic.lessons.length).toBeGreaterThan(0);

        topic.lessons.forEach((l) => {
          expect(l.hanzi.length).toBeGreaterThan(0);
          expect(l.pinyin.length).toBeGreaterThan(0);
          expect(l.meaning.length).toBeGreaterThan(0);
          expect(l.durationMinutes).toBeGreaterThanOrEqual(5);
        });
      });
    });
  });

  describe('3. Component Existence and Page Container Synchronization', () => {
    it('exports all student page components successfully for layout rendering', () => {
      expect(typeof LearningPathPage).toBe('function');
      expect(typeof VocabularyPage).toBe('function');
      expect(typeof PracticePage).toBe('function');
      expect(typeof GrammarPage).toBe('function');
      expect(typeof ProgressPage).toBe('function');
      expect(typeof VideoLibraryPage).toBe('function');
      expect(typeof StudentSidebar).toBe('function');
      expect(typeof StudentLayout).toBe('function');
    });

    it('ensures backward-compatible secondary features list in STUDENT_MAIN_NAV_ITEMS', () => {
      expect(STUDENT_MAIN_NAV_ITEMS.length).toBe(6);
      const learningPathItem = STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'learning-path');
      expect(learningPathItem).toBeDefined();
      expect(learningPathItem?.secondaryFeatures).toBeDefined();
      expect(learningPathItem?.secondaryFeatures?.length).toBeGreaterThan(0);
    });
  });
});
