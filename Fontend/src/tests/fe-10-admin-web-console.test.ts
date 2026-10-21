// @ts-ignore
import { describe, it, expect } from 'bun:test';
import {
  ADMIN_NAV_GROUPS,
  TEACHER_NAV_GROUPS,
  SUPPORT_NAV_GROUPS,
  getNavItemsForRole,
} from '../management/shared/config/navigation.config';
import { getAdminDashboardData, mockDashboardDataByRange } from '../management/admin/data/mockDashboardData';
import { managementRoutes } from '../app/router/management.routes';

describe('FE-10.1: Admin Web Console Redesign Suite', () => {
  describe('1. Admin Navigation Architecture (FE-12 Restructured & Streamlined)', () => {
    it('defines exactly 4 main navigation groups for Admin Console (Content separated to Content Manager)', () => {
      expect(ADMIN_NAV_GROUPS).toHaveLength(4);
      const groupIds = ADMIN_NAV_GROUPS.map((g) => g.id);
      expect(groupIds).toEqual([
        'admin-overview',
        'admin-user-mgmt',
        'admin-ai-group',
        'admin-system',
      ]);
    });

    it('has standard uppercase group titles matching Evondev UX/UI', () => {
      expect(ADMIN_NAV_GROUPS[0].title).toBe('TỔNG QUAN');
      expect(ADMIN_NAV_GROUPS[1].title).toBe('NGƯỜI DÙNG & TỔ CHỨC');
      expect(ADMIN_NAV_GROUPS[2].title).toBe('TRÍ TUỆ NHÂN TẠO');
      expect(ADMIN_NAV_GROUPS[3].title).toBe('VẬN HÀNH & HỆ THỐNG');
    });

    it('ensures all admin navigation items have valid /management/admin/ paths', () => {
      ADMIN_NAV_GROUPS.forEach((group) => {
        expect(group.items.length).toBeGreaterThan(0);
        group.items.forEach((item) => {
          expect(item.path.startsWith('/management/admin/')).toBe(true);
          expect(item.roles).toContain('ADMIN');
          expect(item.icon).toBeDefined();
          expect(item.label.length).toBeGreaterThan(0);
        });
      });
    });

    it('verifies that HỌC LIỆU & NỘI DUNG and Duyệt nội dung are completely removed from Admin sidebar', () => {
      const contentGroup = ADMIN_NAV_GROUPS.find((g) => g.id === 'admin-content-mgmt');
      expect(contentGroup).toBeUndefined();

      const allAdminItems = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
      const itemPaths = allAdminItems.map((i) => i.path);
      const itemIds = allAdminItems.map((i) => i.id);

      expect(itemPaths).not.toContain('/management/admin/hsk-repository');
      expect(itemPaths).not.toContain('/management/admin/curriculum');
      expect(itemPaths).not.toContain('/management/admin/grammar');
      expect(itemPaths).not.toContain('/management/admin/exercises');
      expect(itemPaths).not.toContain('/management/admin/videos');
      expect(itemPaths).not.toContain('/management/admin/moderation');
      expect(itemIds).not.toContain('admin-moderation');
    });

    it('displays actionable badges for AI and operational support requests', () => {
      const aiGroup = ADMIN_NAV_GROUPS.find((g) => g.id === 'admin-ai-group');
      expect(aiGroup).toBeDefined();
      const aiItem = aiGroup!.items.find((i) => i.id === 'admin-ai-management');
      expect(aiItem?.badge).toBe('AI');

      const systemGroup = ADMIN_NAV_GROUPS.find((g) => g.id === 'admin-system');
      expect(systemGroup).toBeDefined();
      const supportItem = systemGroup!.items.find((i) => i.id === 'admin-support-requests');
      expect(supportItem?.badge).toBe(3);
    });
  });

  describe('2. Multi-Role Navigation & Workspace Switcher', () => {
    it('provides distinct navigation groups for Teacher and Support roles', () => {
      expect(TEACHER_NAV_GROUPS.length).toBeGreaterThanOrEqual(2);
      expect(SUPPORT_NAV_GROUPS.length).toBeGreaterThanOrEqual(2);

      const adminItems = getNavItemsForRole('ADMIN');
      const teacherItems = getNavItemsForRole('TEACHER');
      const supportItems = getNavItemsForRole('SUPPORT');

      expect(adminItems.length).toBeGreaterThan(teacherItems.length);
      expect(teacherItems.every((i) => i.roles.includes('TEACHER'))).toBe(true);
      expect(supportItems.every((i) => i.roles.includes('SUPPORT'))).toBe(true);
    });
  });

  describe('3. Route Integrity & Scope Protection', () => {
    it('registers all required admin routes without breaking existing views', () => {
      const adminRoute = managementRoutes[0].children?.find((r) => r.path === 'admin');
      expect(adminRoute).toBeDefined();
      expect(adminRoute?.children).toBeDefined();

      const registeredPaths = adminRoute!.children!.map((r) => r.path);
      // Existing routes preserved
      expect(registeredPaths).toContain('dashboard');
      expect(registeredPaths).toContain('users');
      expect(registeredPaths).toContain('teachers');
      expect(registeredPaths).toContain('support-staff');
      expect(registeredPaths).toContain('roles');
      expect(registeredPaths).toContain('hsk-repository');
      expect(registeredPaths).toContain('curriculum');
      expect(registeredPaths).toContain('curriculum/lessons/:lessonId/edit');

      // New planned FE-10 routes
      expect(registeredPaths).toContain('grammar');
      expect(registeredPaths).toContain('exercises');
      expect(registeredPaths).toContain('videos');
      expect(registeredPaths).toContain('moderation');
      expect(registeredPaths).toContain('ai-management');
      expect(registeredPaths).toContain('analytics');
      expect(registeredPaths).toContain('support-requests');
      expect(registeredPaths).toContain('settings');
    });
  });

  describe('4. Admin Dashboard V2 Operational Data & Mock Transparency', () => {
    it('provides multi-range dashboard datasets with transparent demo labels', () => {
      const data7d = getAdminDashboardData('7d');
      const data30d = getAdminDashboardData('30d');
      const data90d = getAdminDashboardData('90d');

      expect(data7d.rangeLabel).toBe('7 ngày qua');
      expect(data30d.rangeLabel).toBe('30 ngày qua');
      expect(data90d.rangeLabel).toBe('90 ngày qua');

      // Metric cards
      expect(data30d.metrics.length).toBe(4);
      data30d.metrics.forEach((metric) => {
        expect(metric.id).toBeDefined();
        expect(metric.title).toBeDefined();
        expect(metric.currentTotal).toBeDefined();
        expect(metric.deltaInRange).toBeDefined();
        expect(['positive', 'negative', 'neutral']).toContain(metric.deltaInRange.trend);
      });
    });

    it('structures learning activity with all three core dimensions', () => {
      const data = mockDashboardDataByRange['30d'];
      expect(data.learningActivity.length).toBeGreaterThan(0);
      data.learningActivity.forEach((point) => {
        expect(point.date).toBeDefined();
        expect(point.sessions).toBeGreaterThan(0);
        expect(point.completedLessons).toBeGreaterThan(0);
        expect(point.practiceSubmissions).toBeGreaterThan(0);
      });
    });

    it('covers all standard HSK levels 1 through 7-9 in distribution card', () => {
      const data = mockDashboardDataByRange['30d'];
      const levelIds = data.hskDistribution.map((d) => d.levelId);
      expect(levelIds).toContain('hsk-1');
      expect(levelIds).toContain('hsk-2');
      expect(levelIds).toContain('hsk-3');
      expect(levelIds).toContain('hsk-4');
      expect(levelIds).toContain('hsk-5');
      expect(levelIds).toContain('hsk-6');
      expect(levelIds).toContain('hsk-7-9');

      const sumPercentages = data.hskDistribution.reduce((sum, item) => sum + item.percentage, 0);
      expect(sumPercentages).toBe(100);
    });

    it('records urgent tickets with SLA and categories', () => {
      const data = mockDashboardDataByRange['30d'];
      expect(data.supportOverview.urgentTickets.length).toBeGreaterThan(0);
      data.supportOverview.urgentTickets.forEach((ticket) => {
        expect(ticket.code.startsWith('TICK-')).toBe(true);
        expect(ticket.subject.length).toBeGreaterThan(0);
        expect(['urgent', 'high', 'medium', 'low']).toContain(ticket.priority);
      });
    });
  });
});
