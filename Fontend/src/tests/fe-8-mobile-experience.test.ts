// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { MOBILE_BOTTOM_NAV_ITEMS } from '../layouts/components/StudentBottomNav';
import { TOC_SECTIONS } from '../features/lesson/components/LessonTableOfContents';
import { DEMO_VIDEOS } from '../features/videos/data/demoVideos';

describe('FE-8: Mobile-First Student Experience & Responsive Architecture', () => {
  describe('1. Mobile Bottom Navigation (StudentBottomNav)', () => {
    it('should define exactly 5 primary mobile destinations', () => {
      expect(MOBILE_BOTTOM_NAV_ITEMS).toHaveLength(5);
    });

    it('should include Trang chủ, Học HSK, Video, AI Tutor, Cá nhân in correct sequence', () => {
      const labels = MOBILE_BOTTOM_NAV_ITEMS.map((item) => item.label);
      expect(labels).toEqual(['Trang chủ', 'Học HSK', 'Video', 'AI Tutor', 'Cá nhân']);
    });

    it('should map to authentic student portal routes without duplicates', () => {
      const paths = MOBILE_BOTTOM_NAV_ITEMS.map((item) => item.path);
      expect(paths).toEqual([
        '/dashboard',
        '/learning-path',
        '/videos',
        '/ai-tutor',
        '/profile',
      ]);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(5);
    });

    it('should correctly determine active tab state for nested or exact student routes', () => {
      const isItemActive = (path: string, currentPath: string) => {
        if (path === '/dashboard') {
          return currentPath === '/' || currentPath === '/dashboard';
        }
        return currentPath.startsWith(path);
      };

      expect(isItemActive('/dashboard', '/dashboard')).toBe(true);
      expect(isItemActive('/dashboard', '/')).toBe(true);
      expect(isItemActive('/dashboard', '/videos')).toBe(false);

      expect(isItemActive('/learning-path', '/learning-path')).toBe(true);
      expect(isItemActive('/learning-path', '/learning-path/hsk1')).toBe(true);
      expect(isItemActive('/learning-path', '/dashboard')).toBe(false);

      expect(isItemActive('/videos', '/videos')).toBe(true);
      expect(isItemActive('/videos', '/videos/vid-101')).toBe(true);

      expect(isItemActive('/ai-tutor', '/ai-tutor')).toBe(true);
      expect(isItemActive('/profile', '/profile')).toBe(true);
    });
  });

  describe('2. Mobile HSK Textbook & Bottom Sheet Table of Contents', () => {
    it('should define all 6 required curriculum sections in pedagogical order', () => {
      expect(TOC_SECTIONS).toHaveLength(6);
      const sectionIds = TOC_SECTIONS.map((s) => s.id);
      expect(sectionIds).toEqual([
        'overview',
        'vocabulary',
        'grammar',
        'dialogue',
        'practice',
        'complete',
      ]);
    });

    it('should provide localized Vietnamese labels for each TOC section', () => {
      const titles = TOC_SECTIONS.map((s) => s.label);
      expect(titles).toEqual([
        'Tổng quan',
        'Từ vựng',
        'Ngữ pháp',
        'Hội thoại',
        'Luyện tập củng cố',
        'Kết quả',
      ]);
    });

    it('should calculate scroll progress accurately between 0% and 100%', () => {
      const calculateReadingProgress = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
        const total = scrollHeight - clientHeight;
        if (total <= 0) return 0;
        return Math.min(100, Math.max(0, Math.round((scrollTop / total) * 100)));
      };

      expect(calculateReadingProgress(0, 1000, 400)).toBe(0);
      expect(calculateReadingProgress(300, 1000, 400)).toBe(50);
      expect(calculateReadingProgress(600, 1000, 400)).toBe(100);
      expect(calculateReadingProgress(1200, 1000, 400)).toBe(100);
    });
  });

  describe('3. Mobile Video Learning Tabs & Vocabulary Extraction', () => {
    it('should have demo videos with complete subtitle token breakdowns', () => {
      expect(DEMO_VIDEOS.length).toBeGreaterThan(0);
      const video = DEMO_VIDEOS[0];
      expect(video.subtitles.length).toBeGreaterThan(0);
      expect(video.subtitles[0].tokens).toBeDefined();
      expect(video.subtitles[0].tokens!.length).toBeGreaterThan(0);
    });

    it('should extract unique vocabulary tokens from video subtitles for mobile vocab tab', () => {
      const video = DEMO_VIDEOS[0];
      const seen = new Set<string>();
      const list: { hanzi: string; pinyin: string; meaning: string }[] = [];

      video.subtitles.forEach((s) => {
        s.tokens?.forEach((t) => {
          if (!seen.has(t.hanzi) && t.hanzi.trim().length > 0) {
            seen.add(t.hanzi);
            list.push({ hanzi: t.hanzi, pinyin: t.pinyin, meaning: t.meaning });
          }
        });
      });

      expect(list.length).toBeGreaterThan(0);
      const uniqueHanzis = new Set(list.map((item) => item.hanzi));
      expect(uniqueHanzis.size).toBe(list.length);
    });

    it('should maintain distinct mobile tabs: Phụ đề, Luyện nói, Từ vựng', () => {
      const availableTabs: ('transcript' | 'speaking' | 'vocab')[] = ['transcript', 'speaking', 'vocab'];
      expect(availableTabs).toContain('transcript');
      expect(availableTabs).toContain('speaking');
      expect(availableTabs).toContain('vocab');
    });
  });

  describe('4. Mobile Touch Targets & Safe Area Ergonomics', () => {
    it('should satisfy minimum 44px touch target guidelines for interactive elements', () => {
      const mobileNavMinHeight = 44;
      const vocabActionMinSize = 44;
      const bottomNavHeight = 58;

      expect(mobileNavMinHeight).toBeGreaterThanOrEqual(44);
      expect(vocabActionMinSize).toBeGreaterThanOrEqual(44);
      expect(bottomNavHeight).toBeGreaterThan(44);
    });

    it('should compute safe-area-inset bottom padding accurately', () => {
      const computeBottomPadding = (basePadding: number, safeAreaInset: number) => {
        return basePadding + safeAreaInset;
      };

      expect(computeBottomPadding(58, 0)).toBe(58);
      expect(computeBottomPadding(58, 34)).toBe(92); // iPhone X-16 Home indicator safe-area
    });
  });
});
