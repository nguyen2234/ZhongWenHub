import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HANBEEGO_STUDENT_NAV_GROUPS } from '../config/student-navigation.config';
import {
  PRACTICE_FORMATS,
  formatHskRangeSummary,
  getFormatAvailability,
  resolveDynamicHskLevels,
} from '../features/practice/data/exerciseFormats';
import type { AdaptiveRecommendationsResponse } from '../features/practice/services/practice-question-bank.service';

describe('Student Sidebar & Practice Formats Architecture', () => {
  test('sidebar matches exact 4-group hierarchy with Bài tập in KHÓA HỌC and never in LUYỆN TẬP', () => {
    expect(HANBEEGO_STUDENT_NAV_GROUPS.map((g) => g.groupTitle)).toEqual([
      'TỔNG QUAN',
      'KHÓA HỌC',
      'KỸ NĂNG',
      'LUYỆN TẬP',
    ]);

    const overview = HANBEEGO_STUDENT_NAV_GROUPS[0].items.map((i) => i.label);
    const courses = HANBEEGO_STUDENT_NAV_GROUPS[1].items.map((i) => i.label);
    const skills = HANBEEGO_STUDENT_NAV_GROUPS[2].items.map((i) => i.label);
    const practiceZone = HANBEEGO_STUDENT_NAV_GROUPS[3].items.map((i) => i.label);

    expect(overview).toEqual(['Dashboard']);
    expect(courses).toEqual([
      'Lộ trình học tập',
      'Giáo trình HSK',
      'Từ vựng HSK 1–6',
      'Ngữ pháp HSK 1–6',
      'Học qua video',
      'Bài tập',
    ]);
    expect(skills).toEqual(['Luyện nghe', 'Luyện nói', 'Đọc hiểu', 'Luyện viết']);
    expect(practiceZone).toEqual(['Hội thoại', 'Viết thư', 'AI Tutor']);
  });

  test('resolves available HSK levels dynamically from backend metadata without hardcoding', () => {
    expect(resolveDynamicHskLevels(null)).toEqual([]);

    const partialMeta: AdaptiveRecommendationsResponse = {
      totalPublishedQuestions: 40,
      publishedByHsk: { 2: 15, 4: 25 },
      publishedBySkill: { grammar: 40 },
      publishedByDifficulty: { EASY: 40 },
      availableHskLevels: [2, 4],
      mistakeReviewCount: 0,
      weakAreas: [],
    };
    expect(resolveDynamicHskLevels(partialMeta)).toEqual([2, 4]);
    expect(formatHskRangeSummary([2, 4])).toBe('HSK 2, HSK 4');
    expect(formatHskRangeSummary([1, 2, 3, 4])).toBe('HSK 1 – HSK 4');
  });

  test('reports exact 5 exercise format availability states without faking unsupported types', () => {
    expect(PRACTICE_FORMATS.map((f) => f.title)).toEqual([
      'Sắp xếp từ thành câu hoàn chỉnh',
      'Điền từ vào chỗ trống',
      'Nghe điền từ còn thiếu',
      'Nghe và sắp xếp nội dung theo thứ tự',
      'Đọc hiểu và suy đoán điền từ',
    ]);

    const sampleMeta: AdaptiveRecommendationsResponse = {
      totalPublishedQuestions: 337,
      publishedByHsk: { 1: 62, 2: 75, 3: 100, 4: 100 },
      publishedBySkill: { vocabulary: 102, grammar: 65, listening: 55, reading: 57, sentence: 58 },
      publishedByDifficulty: { EASY: 100, MEDIUM: 150, HARD: 87 },
      publishedByType: {
        'sentence-order': 59,
        'fill-blank': 64,
        'listen-fill-blank': 0,
        'listen-order': 0,
        'reading-cloze': 0,
      },
      availableHskLevels: [1, 2, 3, 4],
      availableHskLevelsByType: {
        'sentence-order': [1, 2, 3, 4],
        'fill-blank': [1, 2, 3, 4],
        'listen-fill-blank': [],
        'listen-order': [],
        'reading-cloze': [],
      },
      mistakeReviewCount: 3,
      weakAreas: [],
    };

    const states = PRACTICE_FORMATS.map((f) => ({
      type: f.type,
      ...getFormatAvailability(f, sampleMeta),
    }));

    expect(states[0].isAvailable).toBe(true);
    expect(states[0].count).toBe(59);
    expect(states[1].isAvailable).toBe(true);
    expect(states[1].count).toBe(64);
    expect(states[2].isAvailable).toBe(false);
    expect(states[2].statusLabel).toBe('Chưa khả dụng');
    expect(states[3].isAvailable).toBe(false);
    expect(states[4].isAvailable).toBe(false);
  });

  test('HSKFilterSection does not hardcode hskLevels = [1, 2, 3, 4]', () => {
    const src = readFileSync(
      resolve(import.meta.dir, '../features/practice/components/HSKFilterSection.tsx'),
      'utf-8'
    );
    expect(src).not.toContain('const hskLevels = [1, 2, 3, 4]');
  });

  test('StudentSidebar removes Kippy AI widget cleanly, hosts unified brand header & keeps independent scroll', () => {
    const sidebarSrc = readFileSync(
      resolve(import.meta.dir, '../layouts/components/StudentSidebar.tsx'),
      'utf-8'
    );
    expect(sidebarSrc).not.toContain('Trợ lý Kippy AI');
    expect(sidebarSrc).not.toContain('Luyện giao tiếp 24/7');
    expect(sidebarSrc).not.toContain('Luyện phản xạ ngay');
    expect(sidebarSrc).not.toContain('Luyện nói AI Live Kippy');
    expect(sidebarSrc).toContain('student-sidebar-brand-header');
    expect(sidebarSrc).toContain('ZhongWenHub');
    expect(sidebarSrc).toContain('Học tiếng Trung dễ dàng');
    expect(sidebarSrc).toContain('showBrandHeader');
    expect(sidebarSrc).toContain('scrollContainerRef');
    expect(sidebarSrc).toContain('[aria-current="page"]');
  });

  test('StudentLayout implements CSS Grid Fixed App Shell (100dvh, overflow hidden, scrollable main, fixed header & sidebar)', () => {
    const layoutSrc = readFileSync(
      resolve(import.meta.dir, '../layouts/StudentLayout.tsx'),
      'utf-8'
    );
    expect(layoutSrc).toContain('student-app-shell');
    expect(layoutSrc).toContain("height: '100dvh'");
    expect(layoutSrc).toContain("overflow: 'hidden'");
    expect(layoutSrc).toContain("gridArea: 'sidebar'");
    expect(layoutSrc).toContain("gridArea: 'header'");
    expect(layoutSrc).toContain("gridArea: 'main'");
    expect(layoutSrc).toContain("overflowY: 'auto'");
    expect(layoutSrc).toContain('minHeight: 0');
    expect(layoutSrc).toContain('minWidth: 0');
    expect(layoutSrc).toContain('grid-template-columns: minmax(0, 1fr) !important;');
    expect(layoutSrc).toContain('mobile-header-left');
    expect(layoutSrc).toContain('showBrandHeader={false}');
    expect(layoutSrc).toContain('mobile-sidebar-drawer');
  });
});

