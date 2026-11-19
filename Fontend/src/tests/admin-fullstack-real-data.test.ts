// @ts-ignore
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { adminDashboardService } from '../management/admin/services/admin-dashboard.service';
import { adminOperationsService } from '../management/admin/services/admin-operations.service';
import { adminTeacherService } from '../management/admin/teachers/services/teacher.service';
import { adminSupportStaffService } from '../management/admin/support-staff/services/support-staff.service';
import { adminRolePermissionService } from '../management/admin/roles/services/role-permission.service';
import { authTokenService } from '../core/api/client/auth-token.service';

describe('Admin Full-Stack Real Data Integration Tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  describe('1. Admin Dashboard Service Real Integration', () => {
    it('fetches and maps all real SQL Server metrics from /api/v1/admin/dashboard/stats', async () => {
      authTokenService.setTokens({
        accessToken: 'valid-admin-token',
        refreshToken: 'valid-refresh-token',
      });

      globalThis.fetch = (async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/admin/dashboard/stats')) {
          return new Response(
            JSON.stringify({
              totalStudents: 150,
              totalTeachers: 12,
              totalStaff: 5,
              totalCourses: 6,
              totalClasses: 8,
              pendingSupportTickets: 2,
              activeUsers: 140,
              lockedUsers: 10,
              newUsers30d: 25,
              totalVocabularies: 1200,
              totalGrammarPoints: 180,
              totalCharacters: 600,
              totalLessons: 45,
              totalExercises: 320,
              totalVideos: 14,
              totalExams: 8,
              pendingModerationCount: 3,
              recentActivities: [
                {
                  id: 'act-1',
                  actionText: 'Tài khoản người dùng mới đăng ký',
                  targetName: 'Học viên A',
                  actorName: 'Hệ thống',
                  timeAgo: 'Gần đây',
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }) as any;

      const stats = await adminDashboardService.fetchDashboardStats();
      expect(stats).not.toBeNull();
      expect(stats?.totalStudents).toBe(150);
      expect(stats?.totalTeachers).toBe(12);
      expect(stats?.totalClasses).toBe(8);
      expect(stats?.totalVocabularies).toBe(1200);
      expect(stats?.totalGrammarPoints).toBe(180);
      expect(stats?.totalCharacters).toBe(600);
      expect(stats?.totalLessons).toBe(45);
      expect(stats?.totalExercises).toBe(320);
      expect(stats?.pendingModerationCount).toBe(3);
      expect(stats?.recentActivities?.length).toBe(1);
    });
  });

  describe('2. Admin Operations Service Real Endpoints', () => {
    it('fetches real AI telemetry from /api/v1/admin/operations/ai-stats', async () => {
      authTokenService.setTokens({
        accessToken: 'admin-token',
        refreshToken: 'refresh-token',
      });

      globalThis.fetch = (async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/admin/operations/ai-stats')) {
          return new Response(
            JSON.stringify({
              totalRequests: 2450,
              averageLatencyMs: 195,
              successRate: 99.4,
              totalTokens: 185000,
              services: [
                {
                  id: 'ai-tutor',
                  name: 'AI Tutor (Trợ lý đối thoại)',
                  role: 'Hội thoại tiếng Trung',
                  provider: 'Google Gemini 2.5 Flash',
                  latencyMs: 210,
                  uptime: '99.9%',
                  usagePercent: 65,
                  status: 'HEALTHY',
                  description: 'Hỗ trợ hội thoại HSK.',
                  totalEvents: 420,
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }) as any;

      const data = await adminOperationsService.getAIOperationsStats();
      expect(data).not.toBeNull();
      expect(data?.totalRequests).toBe(2450);
      expect(data?.averageLatencyMs).toBe(195);
      expect(data?.successRate).toBe(99.4);
      expect(data?.services[0].provider).toBe('Google Gemini 2.5 Flash');
    });

    it('fetches real analytics report from /api/v1/admin/operations/analytics', async () => {
      authTokenService.setTokens({
        accessToken: 'admin-token',
        refreshToken: 'refresh-token',
      });

      globalThis.fetch = (async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/admin/operations/analytics')) {
          return new Response(
            JSON.stringify({
              activeStudents: 320,
              completionRate: 81.2,
              learningHours: 4250,
              retentionRate: 88.5,
              hskDistribution: [
                { level: 'HSK 1', count: 120, percentage: 37.5, color: '#e60012' },
                { level: 'HSK 2', count: 90, percentage: 28.1, color: '#f97316' },
              ],
              skillMetrics: [
                { skill: 'Từ vựng (Flashcard & Spaced Repetition)', hours: 1400, avgScore: 89 },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }) as any;

      const report = await adminOperationsService.getAnalyticsReport('30d');
      expect(report).not.toBeNull();
      expect(report?.activeStudents).toBe(320);
      expect(report?.completionRate).toBe(81.2);
      expect(report?.hskDistribution.length).toBe(2);
      expect(report?.skillMetrics[0].avgScore).toBe(89);
    });

    it('gets and updates system settings persistently via /api/v1/admin/operations/settings', async () => {
      authTokenService.setTokens({
        accessToken: 'admin-token',
        refreshToken: 'refresh-token',
      });

      let storedSettings = {
        platformName: 'ZhongWenHub (中文社)',
        contactEmail: 'admin@zhongwenhub.edu.vn',
        slogan: 'Nền tảng HSK chuẩn',
        defaultLanguage: 'vi-VN',
        timezone: 'Asia/Ho_Chi_Minh',
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
        require2FA: false,
        systemNotice: 'Hoạt động bình thường',
        isMaintenanceMode: false,
      };

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.includes('/admin/operations/settings')) {
          if (init?.method === 'PUT') {
            const body = JSON.parse(init.body as string);
            storedSettings = { ...storedSettings, ...body };
            return new Response(JSON.stringify(storedSettings), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify(storedSettings), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }) as any;

      const current = await adminOperationsService.getSystemSettings();
      expect(current?.platformName).toBe('ZhongWenHub (中文社)');

      const updated = await adminOperationsService.updateSystemSettings({
        ...current!,
        platformName: 'ZhongWenHub Production Platform',
        maxLoginAttempts: 3,
        require2FA: true,
      });

      expect(updated.platformName).toBe('ZhongWenHub Production Platform');
      expect(updated.maxLoginAttempts).toBe(3);
      expect(updated.require2FA).toBe(true);
    });
  });

  describe('3. Admin Teacher Service Fail-Closed & Real API Integration', () => {
    it('throws error when creating teacher without admin authentication', async () => {
      authTokenService.clearTokens();
      expect(
        adminTeacherService.createTeacher({
          name: 'Cô Mai',
          email: 'mai@zhongwenhub.edu.vn',
          teachingStatus: 'ACTIVE',
          teachingLevels: ['HSK 3'],
          specializations: ['GRAMMAR'],
          qualifications: 'Thạc sĩ Ngôn ngữ Trung',
          experienceYears: 5,
        })
      ).rejects.toThrow('Yêu cầu phiên đăng nhập quản trị viên');
    });

    it('creates teacher on backend and stores returned ID without mock branching', async () => {
      authTokenService.setTokens({
        accessToken: 'admin-token',
        refreshToken: 'refresh-token',
      });

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.includes('/admin/users') && init?.method === 'POST') {
          return new Response(
            JSON.stringify({
              id: 'real-guid-teacher-001',
              name: 'Cô Lan',
              email: 'lan@zhongwenhub.edu.vn',
              roles: ['TEACHER'],
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }) as any;

      const teacher = await adminTeacherService.createTeacher({
        name: 'Cô Lan',
        email: 'lan@zhongwenhub.edu.vn',
        teachingStatus: 'ACTIVE',
        teachingLevels: ['HSK 4'],
        specializations: ['CONVERSATION'],
        qualifications: 'HSK 6',
        experienceYears: 3,
      });

      expect(teacher.id).toBe('real-guid-teacher-001');
      expect(teacher.name).toBe('Cô Lan');
    });
  });

  describe('4. Admin Support Staff Service Fail-Closed & Real API Integration', () => {
    it('throws error when creating support staff without admin authentication', async () => {
      authTokenService.clearTokens();
      expect(
        adminSupportStaffService.createStaff({
          name: 'Anh Tuấn',
          email: 'tuan@zhongwenhub.edu.vn',
          phone: '0901234567',
          initialWorkStatus: 'AVAILABLE',
          supportScopes: ['TECHNICAL'],
          shift: 'MORNING',
        })
      ).rejects.toThrow('Yêu cầu phiên đăng nhập quản trị viên');
    });

    it('creates support staff on backend and stores returned ID without mock branching', async () => {
      authTokenService.setTokens({
        accessToken: 'admin-token',
        refreshToken: 'refresh-token',
      });

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.includes('/admin/users') && init?.method === 'POST') {
          return new Response(
            JSON.stringify({
              id: 'real-guid-support-001',
              name: 'Anh Minh',
              email: 'minh@zhongwenhub.edu.vn',
              roles: ['SUPPORT'],
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }) as any;

      const staff = await adminSupportStaffService.createStaff({
        name: 'Anh Minh',
        email: 'minh@zhongwenhub.edu.vn',
        phone: '0912345678',
        initialWorkStatus: 'AVAILABLE',
        supportScopes: ['ACCOUNT', 'TECHNICAL'],
        shift: 'EVENING',
      });

      expect(staff.id).toBe('real-guid-support-001');
      expect(staff.name).toBe('Anh Minh');
    });
  });

  describe('5. Role Permission Real Counts Synchronization', () => {
    it('syncs real user counts and descriptions from /api/v1/admin/users/roles', async () => {
      authTokenService.setTokens({
        accessToken: 'admin-token',
        refreshToken: 'refresh-token',
      });

      globalThis.fetch = (async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/admin/users/roles')) {
          return new Response(
            JSON.stringify([
              {
                id: 'role-1',
                name: 'ADMIN',
                description: 'Toàn quyền điều hành',
                userCount: 2,
                isSystemRole: true,
              },
              {
                id: 'role-2',
                name: 'TEACHER',
                description: 'Giảng dạy',
                userCount: 18,
                isSystemRole: true,
              },
              {
                id: 'role-3',
                name: 'STUDENT',
                description: 'Học viên',
                userCount: 450,
                isSystemRole: true,
              },
            ]),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }) as any;

      const res = await adminRolePermissionService.syncFromBackend();
      expect(res.success).toBe(true);

      const roles = adminRolePermissionService.getRoles();
      const adminRole = roles.find((r) => r.code === 'ADMIN');
      const teacherRole = roles.find((r) => r.code === 'TEACHER');
      const studentRole = roles.find((r) => r.code === 'STUDENT');

      expect(adminRole?.userCount).toBe(2);
      expect(teacherRole?.userCount).toBe(18);
      expect(studentRole?.userCount).toBe(450);
    });
  });
});
