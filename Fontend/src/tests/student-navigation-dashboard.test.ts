import { describe, it, expect } from 'bun:test';
import {
  STUDENT_MAIN_NAV_ITEMS,
  ACCOUNT_MENU_ITEMS,
} from '../config/student-navigation.config';
import { studentRoutes } from '../app/router/student.routes';

describe('Phase FE-4: Simplified Student Dashboard and Navigation', () => {
  describe('1. Sidebar Simplification: Exactly 6 Main Navigation Items', () => {
    it('provides exactly 6 primary student navigation items', () => {
      expect(STUDENT_MAIN_NAV_ITEMS).toHaveLength(6);
    });

    it('contains the required 6 items in correct order with correct labels', () => {
      const expected = [
        { id: 'dashboard', label: 'Trang chủ', path: '/dashboard' },
        { id: 'learning-path', label: 'Học HSK', path: '/learning-path' },
        { id: 'vocabulary', label: 'Từ vựng', path: '/vocabulary' },
        { id: 'practice', label: 'Luyện tập', path: '/practice' },
        { id: 'ai-tutor', label: 'AI Tutor', path: '/ai-tutor' },
        { id: 'progress', label: 'Tiến độ', path: '/progress' },
      ];

      expected.forEach((exp, index) => {
        const item = STUDENT_MAIN_NAV_ITEMS[index];
        expect(item.id).toBe(exp.id);
        expect(item.label).toBe(exp.label);
        expect(item.path).toBe(exp.path);
        expect(item.icon).toBeDefined();
        expect(item.activeMatchPaths.length).toBeGreaterThan(0);
      });
    });
  });

  describe('2. Secondary Features Preserved in Parent Pages', () => {
    it('moves Học HSK secondary features into parent page config', () => {
      const hskItem = STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'learning-path');
      expect(hskItem).toBeDefined();
      const secondaryPaths = hskItem?.secondaryFeatures.map((f) => f.path);

      expect(secondaryPaths).toContain('/learning-path');
      expect(secondaryPaths).toContain('/lesson');
      expect(secondaryPaths).toContain('/grammar');
      expect(secondaryPaths).toContain('/skills/listening');
      expect(secondaryPaths).toContain('/skills/speaking');
      expect(secondaryPaths).toContain('/skills/reading');
      expect(secondaryPaths).toContain('/skills/writing');
    });

    it('moves Từ vựng secondary features into parent page config', () => {
      const vocabItem = STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'vocabulary');
      expect(vocabItem).toBeDefined();
      const secondaryPaths = vocabItem?.secondaryFeatures.map((f) => f.path);

      expect(secondaryPaths).toContain('/vocabulary');
      expect(secondaryPaths).toContain('/srs-review');
    });

    it('moves Luyện tập secondary features into parent page config', () => {
      const practiceItem = STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'practice');
      expect(practiceItem).toBeDefined();
      const secondaryPaths = practiceItem?.secondaryFeatures.map((f) => f.path);

      expect(secondaryPaths).toContain('/practice');
      expect(secondaryPaths).toContain('/mock-exams');
      expect(secondaryPaths).toContain('/games');
      expect(secondaryPaths).toContain('/homework');
    });

    it('moves AI Tutor secondary features into parent page config', () => {
      const tutorItem = STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'ai-tutor');
      expect(tutorItem).toBeDefined();
      const secondaryPaths = tutorItem?.secondaryFeatures.map((f) => f.path);

      expect(secondaryPaths).toContain('/ai-tutor');
      expect(secondaryPaths).toContain('/ai-live');
      expect(secondaryPaths).toContain('/ai-grading');
      expect(secondaryPaths).toContain('/ai-analytics');
    });

    it('moves Tiến độ secondary features into parent page config', () => {
      const progressItem = STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'progress');
      expect(progressItem).toBeDefined();
      const secondaryPaths = progressItem?.secondaryFeatures.map((f) => f.path);

      expect(secondaryPaths).toContain('/progress');
      expect(secondaryPaths).toContain('/learning-results');
      expect(secondaryPaths).toContain('/achievements');
      expect(secondaryPaths).toContain('/leaderboard');
    });
  });

  describe('3. Profile & Settings Accessible in Account Menu', () => {
    it('defines Profile, Settings, and Class routes in account menu items', () => {
      const paths = ACCOUNT_MENU_ITEMS.map((item) => item.path);
      expect(paths).toContain('/profile');
      expect(paths).toContain('/settings');
      expect(paths).toContain('/classes');
    });
  });

  describe('4. Scope Protection & Route Integrity', () => {
    // Collect all registered route paths in studentRoutes
    const collectRoutePaths = (): string[] => {
      const paths: string[] = [];
      const traverse = (routes: typeof studentRoutes, prefix = '') => {
        routes.forEach((r) => {
          const current = r.path
            ? r.path.startsWith('/')
              ? r.path
              : `${prefix}/${r.path}`.replace(/\/+/g, '/')
            : prefix;
          if (current) paths.push(current);
          if (r.children) {
            traverse(r.children, current);
          }
        });
      };
      traverse(studentRoutes);
      return paths;
    };

    it('preserves direct routing for all main navigation items', () => {
      const registeredPaths = collectRoutePaths();
      STUDENT_MAIN_NAV_ITEMS.forEach((item) => {
        expect(registeredPaths).toContain(item.path);
      });
    });

    it('preserves direct routing for all secondary features', () => {
      const registeredPaths = collectRoutePaths();
      STUDENT_MAIN_NAV_ITEMS.forEach((item) => {
        item.secondaryFeatures.forEach((sub) => {
          // Normalize query params if any
          const cleanPath = sub.path.split('?')[0];
          expect(registeredPaths).toContain(cleanPath);
        });
      });
    });
  });
});
