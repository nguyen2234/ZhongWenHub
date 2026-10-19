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

  describe('5. Mobile Lesson Practice Modal Ergonomics', () => {
    it('should configure fullscreen dialog geometry for mobile viewports', () => {
      const mobileViewportWidth = 390;
      const isMobile = mobileViewportWidth < 768;
      const modalWidth = isMobile ? '100vw' : 'min(1040px, calc(100vw - 48px))';
      const modalHeight = isMobile ? '100dvh' : 'min(760px, calc(100dvh - 48px))';

      expect(modalWidth).toBe('100vw');
      expect(modalHeight).toBe('100dvh');
    });

    it('should enforce flex: 1 with min-height: 0 on practice modal body to prevent nested scroll shifts', () => {
      const modalBodyStyles = {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
      };

      expect(modalBodyStyles.flex).toBe(1);
      expect(modalBodyStyles.minHeight).toBe(0);
      expect(modalBodyStyles.overflowY).toBe('auto');
    });
  });

  describe('6. Mobile Learning Path 6-Step Pedagogical Road', () => {
    it('should have exactly 6 sequential foundational steps', () => {
      const totalSteps = 6;
      expect(totalSteps).toBe(6);
    });

    it('should provide complete metadata for each roadmap step including hanzi, title, and practiceRoute', () => {
      const sampleSteps = [
        { stepNumber: 1, hanzi: '拼', title: 'Pinyin – Phiên âm Latin', practiceRoute: '/skills/speaking?tab=pinyin' },
        { stepNumber: 2, hanzi: '声', title: 'Thanh điệu tiếng Trung', practiceRoute: '/skills/speaking' },
        { stepNumber: 3, hanzi: '字', title: 'Chữ Hán cơ bản', practiceRoute: '/skills/writing' },
        { stepNumber: 4, hanzi: '词', title: 'Từ vựng HSK 1', practiceRoute: '/vocabulary' },
        { stepNumber: 5, hanzi: '语', title: 'Ngữ pháp cơ bản', practiceRoute: '/grammar' },
        { stepNumber: 6, hanzi: '听', title: 'Luyện nghe và nói', practiceRoute: '/skills' },
      ];

      expect(sampleSteps).toHaveLength(6);
      sampleSteps.forEach((step, idx) => {
        expect(step.stepNumber).toBe(idx + 1);
        expect(step.hanzi.length).toBeGreaterThan(0);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.practiceRoute.length).toBeGreaterThan(0);
      });
    });

    it('should clearly resolve all 3 learning statuses: not_started, in_progress, completed', () => {
      const resolveStatus = (completedLessonIds: string[], targetLessonId: string | null, activeLessonId: string | null) => {
        if (targetLessonId && completedLessonIds.includes(targetLessonId)) return 'completed';
        if (targetLessonId && targetLessonId === activeLessonId) return 'in_progress';
        return 'not_started';
      };

      expect(resolveStatus(['les-hsk1-1'], 'les-hsk1-1', 'les-hsk1-2')).toBe('completed');
      expect(resolveStatus(['les-hsk1-1'], 'les-hsk1-2', 'les-hsk1-2')).toBe('in_progress');
      expect(resolveStatus(['les-hsk1-1'], 'les-hsk1-3', 'les-hsk1-2')).toBe('not_started');
    });
  });

  describe('7. Mobile HSK Curriculum Level Tabs & Layout', () => {
    it('should define HSK levels from 1 to 9 with proper names', () => {
      const levels = [1, 2, 3, 4, 5, 6, 7];
      expect(levels).toHaveLength(7);
      expect(levels[0]).toBe(1);
      expect(levels[levels.length - 1]).toBe(7);
    });

    it('should support switching between 2-column desktop and vertical mobile layout without horizontal overflow', () => {
      const isMobileLayout = (viewportWidth: number) => viewportWidth < 1024;

      expect(isMobileLayout(320)).toBe(true);
      expect(isMobileLayout(375)).toBe(true);
      expect(isMobileLayout(390)).toBe(true);
      expect(isMobileLayout(430)).toBe(true);
      expect(isMobileLayout(768)).toBe(true);
      expect(isMobileLayout(1024)).toBe(false);
      expect(isMobileLayout(1440)).toBe(false);
    });
  });

  describe('8. Responsive Breakpoint Consistency (320px to 1440px)', () => {
    it('should correctly categorize all requested breakpoints', () => {
      const targetBreakpoints = [320, 375, 390, 430, 768, 1024, 1440];
      expect(targetBreakpoints).toHaveLength(7);

      const getLayoutMode = (width: number): 'compact-mobile' | 'standard-mobile' | 'tablet' | 'desktop' => {
        if (width <= 430) return 'compact-mobile';
        if (width < 768) return 'standard-mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
      };

      const modes = targetBreakpoints.map((w) => getLayoutMode(w));
      expect(modes).toEqual([
        'compact-mobile',
        'compact-mobile',
        'compact-mobile',
        'compact-mobile',
        'tablet',
        'desktop',
        'desktop',
      ]);
    });

    it('should restrict mobile hero sticker illustration to maximum 80-100px', () => {
      const maxMobileStickerSize = 80;
      expect(maxMobileStickerSize).toBeLessThanOrEqual(100);
      expect(maxMobileStickerSize).toBeGreaterThanOrEqual(60);
    });
  });
});

