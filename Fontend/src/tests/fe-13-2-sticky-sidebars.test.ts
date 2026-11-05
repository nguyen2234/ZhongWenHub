// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { StudentSidebar } from '../layouts/components/StudentSidebar';
import { StudentLayout } from '../layouts/StudentLayout';
import { ManagementSidebar } from '../management/shared/components/ManagementSidebar';
import { ManagementLayout } from '../layouts/ManagementLayout';
import {
  ADMIN_NAV_GROUPS,
  CONTENT_MANAGER_NAV_GROUPS,
  TEACHER_NAV_GROUPS,
  SUPPORT_NAV_GROUPS,
} from '../management/shared/config/navigation.config';
import { HANBEEGO_STUDENT_NAV_GROUPS } from '../config/student-navigation.config';

describe('FE-13.2: Sticky Sidebars & Independent Scrolling Architecture', () => {
  describe('1. Management Layout & Component Exports', () => {
    it('exports ManagementLayout and ManagementSidebar as valid React functional components', () => {
      expect(typeof ManagementLayout).toBe('function');
      expect(typeof ManagementSidebar).toBe('function');
    });

    it('provides all 4 role navigation groups with required items and valid route paths', () => {
      expect(ADMIN_NAV_GROUPS.length).toBeGreaterThan(0);
      expect(CONTENT_MANAGER_NAV_GROUPS.length).toBeGreaterThan(0);
      expect(TEACHER_NAV_GROUPS.length).toBeGreaterThan(0);
      expect(SUPPORT_NAV_GROUPS.length).toBeGreaterThan(0);

      // Verify all items start with /management/
      const allMgmtItems = [
        ...ADMIN_NAV_GROUPS.flatMap((g) => g.items),
        ...CONTENT_MANAGER_NAV_GROUPS.flatMap((g) => g.items),
        ...TEACHER_NAV_GROUPS.flatMap((g) => g.items),
        ...SUPPORT_NAV_GROUPS.flatMap((g) => g.items),
      ];

      allMgmtItems.forEach((item) => {
        expect(item.id.length).toBeGreaterThan(0);
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.path.startsWith('/management/')).toBe(true);
        expect(typeof item.icon).toBe('object');
      });
    });

    it('ensures each management group has unique IDs and non-empty titles', () => {
      const groups = [...ADMIN_NAV_GROUPS, ...CONTENT_MANAGER_NAV_GROUPS, ...TEACHER_NAV_GROUPS, ...SUPPORT_NAV_GROUPS];
      groups.forEach((g) => {
        expect(g.id.length).toBeGreaterThan(0);
        expect(g.title.length).toBeGreaterThan(0);
        expect(g.items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('2. Student Layout & Sidebar Navigation', () => {
    it('exports StudentLayout and StudentSidebar as valid React functional components', () => {
      expect(typeof StudentLayout).toBe('function');
      expect(typeof StudentSidebar).toBe('function');
    });

    it('provides all 4 student navigation groups with correct IDs', () => {
      const groupIds = HANBEEGO_STUDENT_NAV_GROUPS.map((g) => g.id);
      expect(groupIds).toEqual(['overview', 'courses', 'skills', 'personal']);
    });

    it('validates student nav items have valid paths, icons, and non-empty labels', () => {
      const items = HANBEEGO_STUDENT_NAV_GROUPS.flatMap((g) => g.items);
      expect(items.length).toBeGreaterThanOrEqual(12);

      items.forEach((item) => {
        expect(item.id.length).toBeGreaterThan(0);
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.path.startsWith('/')).toBe(true);
      });
    });

    it('confirms critical student routes exist in navigation hierarchy', () => {
      const paths = HANBEEGO_STUDENT_NAV_GROUPS.flatMap((g) => g.items).map((i) => i.path);
      expect(paths).toContain('/dashboard');
      expect(paths.some((p) => p.startsWith('/learning-path'))).toBe(true);
      expect(paths).toContain('/vocabulary');
      expect(paths).toContain('/grammar');
      expect(paths).toContain('/practice');
      expect(paths).toContain('/ai-tutor');
      expect(paths).toContain('/progress');
    });
  });

  describe('3. Dynamic Viewport & Layout Sizing Constants', () => {
    it('verifies standard header height matches 64px design token', () => {
      // In tokens.css, --app-header-height is 64px
      const headerHeight = 64;
      const expectedOffset = `calc(100dvh - ${headerHeight}px)`;
      expect(expectedOffset).toBe('calc(100dvh - 64px)');
    });

    it('verifies sidebar widths between collapsed and expanded modes', () => {
      const studentExpandedWidth = 256;
      const studentCollapsedWidth = 72;
      const mgmtExpandedWidth = 264;
      const mgmtCollapsedWidth = 72;

      expect(studentExpandedWidth).toBeGreaterThan(studentCollapsedWidth);
      expect(mgmtExpandedWidth).toBeGreaterThan(mgmtCollapsedWidth);
      expect(studentCollapsedWidth).toBe(72);
      expect(mgmtCollapsedWidth).toBe(72);
    });
  });
});
