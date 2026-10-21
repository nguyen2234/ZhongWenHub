// @ts-ignore
import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ADMIN_NAV_GROUPS,
  CONTENT_MANAGER_NAV_GROUPS,
  getNavItemsForRole,
} from '../management/shared/config/navigation.config';
import { managementRoutes } from '../app/router/management.routes';
import { managementAuthService } from '../management/shared/services/management-auth.service';
import { adminRolePermissionService } from '../management/admin/roles/services/role-permission.service';
import { ROLE_DEFAULT_PATHS } from '../types/roles';

describe('FE-12: Complete Separation of Admin & Content Manager Workspaces', () => {
  beforeEach(() => {
    managementAuthService.reset('ADMIN');
  });

  describe('1. Admin Sidebar Simplification (No Content Editing or Moderation)', () => {
    it('ensures ADMIN_NAV_GROUPS has no HỌC LIỆU & NỘI DUNG group', () => {
      const groupTitles = ADMIN_NAV_GROUPS.map((g) => g.title);
      expect(groupTitles).not.toContain('HỌC LIỆU & NỘI DUNG');
      expect(ADMIN_NAV_GROUPS.some((g) => g.id === 'admin-content-mgmt')).toBe(false);
    });

    it('ensures ADMIN_NAV_GROUPS has no Duyệt nội dung item', () => {
      const allItems = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
      const itemLabels = allItems.map((i) => i.label);
      const itemPaths = allItems.map((i) => i.path);

      expect(itemLabels).not.toContain('Duyệt nội dung');
      expect(itemPaths).not.toContain('/management/admin/moderation');
      expect(allItems.some((i) => i.id === 'admin-moderation')).toBe(false);
    });

    it('ensures ADMIN_NAV_GROUPS contains no content editing routes', () => {
      const allPaths = ADMIN_NAV_GROUPS.flatMap((g) => g.items).map((i) => i.path);
      const forbiddenContentPaths = [
        '/management/admin/hsk-repository',
        '/management/admin/curriculum',
        '/management/admin/grammar',
        '/management/admin/exercises',
        '/management/admin/videos',
        '/management/admin/moderation',
      ];

      for (const p of forbiddenContentPaths) {
        expect(allPaths).not.toContain(p);
      }
    });

    it('preserves governance: users, teachers, support-staff, roles, AI, analytics, support-requests, settings', () => {
      const allPaths = ADMIN_NAV_GROUPS.flatMap((g) => g.items).map((i) => i.path);
      const requiredGovernancePaths = [
        '/management/admin/dashboard',
        '/management/admin/users',
        '/management/admin/teachers',
        '/management/admin/support-staff',
        '/management/admin/roles',
        '/management/admin/ai-management',
        '/management/admin/analytics',
        '/management/admin/support-requests',
        '/management/admin/settings',
      ];

      for (const p of requiredGovernancePaths) {
        expect(allPaths).toContain(p);
      }
    });
  });

  describe('2. Content Manager Workspace Complete Academic Menu (10 Features)', () => {
    it('defines exactly the required groups in CONTENT_MANAGER_NAV_GROUPS', () => {
      const groupTitles = CONTENT_MANAGER_NAV_GROUPS.map((g) => g.title);
      expect(groupTitles).toContain('TỔNG QUAN');
      expect(groupTitles).toContain('HỌC LIỆU & BIÊN TẬP');
      expect(groupTitles).toContain('KIỂM DUYỆT & VẬN HÀNH');
    });

    it('provides all 10 academic content features in CONTENT_MANAGER_NAV_GROUPS', () => {
      const items = CONTENT_MANAGER_NAV_GROUPS.flatMap((g) => g.items);
      const itemMap = new Map(items.map((i) => [i.id, i]));

      // 1. Kho HSK
      expect(itemMap.has('cm-hsk-repository')).toBe(true);
      expect(itemMap.get('cm-hsk-repository')?.path).toBe('/management/content-manager/hsk-repository');
      expect(itemMap.get('cm-hsk-repository')?.label).toContain('Kho HSK');

      // 2. Giáo trình & Bài học
      expect(itemMap.has('cm-curriculum')).toBe(true);
      expect(itemMap.get('cm-curriculum')?.path).toBe('/management/content-manager/curriculum');
      expect(itemMap.get('cm-curriculum')?.label).toContain('Giáo trình & Bài học');

      // 3. Trình biên tập bài học
      expect(itemMap.has('cm-lesson-editor')).toBe(true);
      expect(itemMap.get('cm-lesson-editor')?.path).toContain('/management/content-manager/curriculum/lessons/');
      expect(itemMap.get('cm-lesson-editor')?.label).toContain('Trình biên tập bài học');

      // 4. Ngữ pháp
      expect(itemMap.has('cm-grammar')).toBe(true);
      expect(itemMap.get('cm-grammar')?.path).toBe('/management/content-manager/grammar');
      expect(itemMap.get('cm-grammar')?.label).toContain('Ngữ pháp');

      // 5. Ngân hàng câu hỏi
      expect(itemMap.has('cm-questions')).toBe(true);
      expect(itemMap.get('cm-questions')?.path).toBe('/management/content-manager/question-bank');
      expect(itemMap.get('cm-questions')?.label).toContain('Ngân hàng câu hỏi');

      // 6. Học liệu video
      expect(itemMap.has('cm-videos')).toBe(true);
      expect(itemMap.get('cm-videos')?.path).toBe('/management/content-manager/videos');
      expect(itemMap.get('cm-videos')?.label).toContain('Học liệu video');

      // 7. Kiểm duyệt & Xuất bản
      expect(itemMap.has('cm-moderation')).toBe(true);
      expect(itemMap.get('cm-moderation')?.path).toBe('/management/content-manager/moderation');
      expect(itemMap.get('cm-moderation')?.badge).toBe(7);

      // 8. Báo cáo lỗi học liệu do Support chuyển đến
      expect(itemMap.has('cm-issues')).toBe(true);
      expect(itemMap.get('cm-issues')?.path).toBe('/management/content-manager/issues');
      expect(itemMap.get('cm-issues')?.label).toContain('Báo cáo lỗi');
      expect(itemMap.get('cm-issues')?.badge).toBe(5);

      // 9. Lịch sử phiên bản
      expect(itemMap.has('cm-audit')).toBe(true);
      expect(itemMap.get('cm-audit')?.path).toBe('/management/content-manager/audit-history');

      // 10. Thống kê chất lượng
      expect(itemMap.has('cm-quality')).toBe(true);
      expect(itemMap.get('cm-quality')?.path).toBe('/management/content-manager/quality-metrics');
    });

    it('ensures getNavItemsForRole("CONTENT_MANAGER") yields exactly CM items', () => {
      const cmItems = getNavItemsForRole('CONTENT_MANAGER');
      expect(cmItems.length).toBe(11); // 1 dashboard + 10 content features
      expect(cmItems.every((i) => i.roles.includes('CONTENT_MANAGER'))).toBe(true);
      expect(cmItems.every((i) => i.path.startsWith('/management/content-manager/'))).toBe(true);
    });
  });

  describe('3. Route Architecture & Privilege Escalation Protection', () => {
    it('verifies all content routes are registered under /management/content-manager', () => {
      const cmRoute = managementRoutes[0].children?.find((r) => r.path === 'content-manager');
      expect(cmRoute).toBeDefined();
      expect(cmRoute?.children).toBeDefined();

      const registeredPaths = cmRoute!.children!.map((r) => r.path);
      expect(registeredPaths).toContain('dashboard');
      expect(registeredPaths).toContain('hsk-repository');
      expect(registeredPaths).toContain('curriculum');
      expect(registeredPaths).toContain('curriculum/lessons/:lessonId/edit');
      expect(registeredPaths).toContain('lesson-editor');
      expect(registeredPaths).toContain('grammar');
      expect(registeredPaths).toContain('question-bank');
      expect(registeredPaths).toContain('videos');
      expect(registeredPaths).toContain('moderation');
      expect(registeredPaths).toContain('issues');
      expect(registeredPaths).toContain('audit-history');
      expect(registeredPaths).toContain('quality-metrics');
    });

    it('verifies legacy admin content routes exist as safe redirect elements', () => {
      const adminRoute = managementRoutes[0].children?.find((r) => r.path === 'admin');
      expect(adminRoute).toBeDefined();

      const registeredAdminPaths = adminRoute!.children!.map((r) => r.path);
      const legacyPaths = [
        'hsk-repository',
        'curriculum',
        'curriculum/lessons/:lessonId/edit',
        'grammar',
        'exercises',
        'videos',
        'moderation',
      ];

      for (const lp of legacyPaths) {
        expect(registeredAdminPaths).toContain(lp);
      }
    });

    it('enforces that session authentication controls content management permissions (not URL)', () => {
      // 1. Student Session
      managementAuthService.switchRole('STUDENT');
      expect(managementAuthService.canManageContent()).toBe(false);
      expect(managementAuthService.canAccessWorkspace('CONTENT_MANAGER')).toBe(false);
      expect(managementAuthService.canAccessWorkspace('ADMIN')).toBe(false);

      // 2. Support Session
      managementAuthService.switchRole('SUPPORT');
      expect(managementAuthService.canManageContent()).toBe(false);
      expect(managementAuthService.canAccessWorkspace('CONTENT_MANAGER')).toBe(false);
      expect(managementAuthService.canAccessWorkspace('ADMIN')).toBe(false);

      // 3. Teacher Session
      managementAuthService.switchRole('TEACHER');
      expect(managementAuthService.canManageContent()).toBe(false); // Teacher cannot approve/publish or manage canonical content
      expect(managementAuthService.canAccessWorkspace('CONTENT_MANAGER')).toBe(false);
      expect(managementAuthService.canAccessWorkspace('ADMIN')).toBe(false);

      // 4. Content Manager Session
      managementAuthService.switchRole('CONTENT_MANAGER');
      expect(managementAuthService.canManageContent()).toBe(true);
      expect(managementAuthService.canAccessWorkspace('CONTENT_MANAGER')).toBe(true);
      expect(managementAuthService.canAccessWorkspace('ADMIN')).toBe(false); // CM cannot access Admin console

      // 5. Admin Session
      managementAuthService.switchRole('ADMIN');
      expect(managementAuthService.canManageContent()).toBe(true);
      expect(managementAuthService.canAccessWorkspace('CONTENT_MANAGER')).toBe(true);
      expect(managementAuthService.canAccessWorkspace('ADMIN')).toBe(true);
    });

    it('verifies Content Manager permissions match requirements', () => {
      const cmRole = adminRolePermissionService.getRoleByCode('CONTENT_MANAGER');
      expect(cmRole).toBeDefined();
      const perms = cmRole?.permissions || [];

      // Moderation & Publishing
      expect(perms).toContain('CONTENT_APPROVE');
      expect(perms).toContain('CONTENT_PUBLISH');
      expect(perms).toContain('CONTENT_ARCHIVE');
      expect(perms).toContain('CONTENT_RESTORE');

      // Issue resolution loop with Support
      expect(perms).toContain('CONTENT_ISSUE_VIEW');
      expect(perms).toContain('CONTENT_ISSUE_ASSIGN');
      expect(perms).toContain('CONTENT_ISSUE_RESOLVE');

      // Audit and reporting
      expect(perms).toContain('CONTENT_AUDIT_VIEW');
      expect(perms).toContain('CONTENT_REPORT_VIEW');
    });
  });

  describe('4. Deep Link & Internal Navigation Integrity', () => {
    it('defines correct default paths for all roles', () => {
      expect(ROLE_DEFAULT_PATHS.ADMIN).toBe('/management/admin/dashboard');
      expect(ROLE_DEFAULT_PATHS.CONTENT_MANAGER).toBe('/management/content-manager/dashboard');
      expect(ROLE_DEFAULT_PATHS.TEACHER).toBe('/management/teacher/dashboard');
      expect(ROLE_DEFAULT_PATHS.SUPPORT).toBe('/management/support/dashboard');
      expect(ROLE_DEFAULT_PATHS.STUDENT).toBe('/dashboard');
    });

    it('verifies lesson editor route pattern consistency', () => {
      const editorPattern = '/management/content-manager/curriculum/lessons/:lessonId/edit';
      expect(editorPattern.startsWith('/management/content-manager')).toBe(true);
      expect(editorPattern.includes('/management/admin')).toBe(false);
    });
  });
});
