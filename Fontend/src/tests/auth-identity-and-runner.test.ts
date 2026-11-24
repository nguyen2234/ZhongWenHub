import { describe, it, expect, beforeAll, beforeEach, afterEach, mock } from 'bun:test';
import { authService } from '../features/auth/services/authService';
import {
  getCurrentStudentIdentity,
  setDevStudentIdentity,
  clearStudentIdentity,
  DEFAULT_DEMO_STUDENT_ID,
} from '../features/auth/services/student-identity.adapter';
import { studentAttemptService } from '../features/homework/services/student-attempt.service';
import { authTokenService } from '../core/api/client/auth-token.service';
import { managementAuthService } from '../management/shared/services/management-auth.service';
import { setTestTeacherPortalStores } from '../management/teacher/services/teacher-portal.service';
import { setTestAssignmentStores } from '../management/teacher/services/assignment.service';
import {
  INITIAL_TEACHING_CLASSES,
  INITIAL_CLASS_MEMBERS,
  INITIAL_CLASS_SCHEDULES,
  INITIAL_DEMO_SUBMISSIONS,
  INITIAL_RECENT_ACTIVITIES,
} from './mocks/mockTeacherPortalData';
import {
  INITIAL_ASSIGNMENTS,
  INITIAL_ASSIGNMENT_QUESTIONS,
  INITIAL_ASSIGNMENT_TARGETS,
} from './mocks/mockAssignmentData';
import { MOCK_QUESTION_CATALOG } from './mocks/mockQuestionCatalog';

describe('Auth, Identity Isolation, and Runner Protection Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    setTestTeacherPortalStores({
      classes: INITIAL_TEACHING_CLASSES,
      members: INITIAL_CLASS_MEMBERS,
      schedules: INITIAL_CLASS_SCHEDULES,
      submissions: INITIAL_DEMO_SUBMISSIONS,
      activities: INITIAL_RECENT_ACTIVITIES,
    });
    setTestAssignmentStores({
      assignments: INITIAL_ASSIGNMENTS,
      questions: INITIAL_ASSIGNMENT_QUESTIONS,
      targets: INITIAL_ASSIGNMENT_TARGETS,
      catalog: MOCK_QUESTION_CATALOG,
      classes: INITIAL_TEACHING_CLASSES,
    });
  });

  beforeEach(async () => {
    globalThis.fetch = originalFetch;
    await authService.logout();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. Mock Mode vs HTTP Mode Authentication', () => {
    it('logs in student account via HTTP API with correct role and student identity', async () => {
      globalThis.fetch = mock(async () => new Response(
        JSON.stringify({
          accessToken: 'jwt-student-token',
          refreshToken: 'refresh-token',
          user: {
            id: DEFAULT_DEMO_STUDENT_ID,
            email: 'student@zhongwenhub.edu.vn',
            fullName: 'Trần Thị Thu Thảo',
            roles: ['STUDENT'],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));

      const res = await authService.login({
        email: 'student@zhongwenhub.edu.vn',
        password: 'Password123!',
      });

      expect(res.success).toBe(true);
      expect(res.user?.role).toBe('STUDENT');
      expect(res.user?.id).toBe(DEFAULT_DEMO_STUDENT_ID);
      expect(authTokenService.isAuthenticated()).toBe(true);

      const identity = getCurrentStudentIdentity();
      expect(identity.id).toBe(DEFAULT_DEMO_STUDENT_ID);
      expect(identity.fullName).toBe('Trần Thị Thu Thảo');
    });

    it('logs in teacher demo account with TEACHER role', async () => {
      globalThis.fetch = mock(async () => new Response(
        JSON.stringify({
          accessToken: 'jwt-teacher-token',
          refreshToken: 'refresh-token',
          user: {
            id: 'usr-teacher-01',
            email: 'teacher@zhongwenhub.edu.vn',
            fullName: 'Thầy Hùng',
            roles: ['TEACHER'],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));

      const res = await authService.login({
        email: 'teacher@zhongwenhub.edu.vn',
        password: 'Password123!',
      });

      expect(res.success).toBe(true);
      expect(res.user?.role).toBe('TEACHER');
      expect(res.user?.id).toBe('usr-teacher-01');

      const session = managementAuthService.getSession();
      expect(session?.role).toBe('TEACHER');
    });

    it('logs in admin demo account with ADMIN role', async () => {
      globalThis.fetch = mock(async () => new Response(
        JSON.stringify({
          accessToken: 'jwt-admin-token',
          refreshToken: 'refresh-token',
          user: {
            id: 'usr-admin-01',
            email: 'admin@zhongwenhub.edu.vn',
            fullName: 'Admin Tổng',
            roles: ['ADMIN'],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));

      const res = await authService.login({
        email: 'admin@zhongwenhub.edu.vn',
        password: 'Password123!',
      });

      expect(res.success).toBe(true);
      expect(res.user?.role).toBe('ADMIN');
      expect(res.user?.id).toBe('usr-admin-01');
    });

    it('rejects Google OAuth login when server configuration is not provisioned', async () => {
      expect(authService.loginWithGoogle()).rejects.toThrow('Google OAuth');
    });

    it('handles forgot password and returns informative response', async () => {
      globalThis.fetch = mock(async () => new Response(
        JSON.stringify({ message: 'Email đặt lại mật khẩu đã được gửi.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));

      const res = await authService.forgotPassword('student@zhongwenhub.edu.vn');
      expect(res.success).toBe(true);
      expect(res.message).toBeDefined();
    });

    it('rejects forgot password with invalid email format', async () => {
      expect(authService.forgotPassword('invalid-email')).rejects.toThrow('Vui lòng cung cấp địa chỉ email hợp lệ.');
    });

    it('handles reset password and enforces password match', async () => {
      expect(
        authService.resetPassword({
          email: 'student@zhongwenhub.edu.vn',
          token: 'DEMO-TOKEN',
          newPassword: 'NewPassword123!',
          confirmPassword: 'MismatchPassword123!',
        })
      ).rejects.toThrow('Mật khẩu xác nhận không khớp.');

      globalThis.fetch = mock(async () => new Response(
        JSON.stringify({ message: 'Mật khẩu đã được đặt lại thành công.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));

      const successRes = await authService.resetPassword({
        email: 'student@zhongwenhub.edu.vn',
        token: 'DEMO-TOKEN',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });
      expect(successRes.success).toBe(true);
    });

    it('clears all session state, student identity, and caches on logout', async () => {
      globalThis.fetch = mock(async () => new Response(
        JSON.stringify({
          accessToken: 'jwt-student-token',
          refreshToken: 'refresh-token',
          user: {
            id: DEFAULT_DEMO_STUDENT_ID,
            email: 'student@zhongwenhub.edu.vn',
            fullName: 'Trần Thị Thu Thảo',
            roles: ['STUDENT'],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));

      await authService.login({
        email: 'student@zhongwenhub.edu.vn',
        password: 'Password123!',
      });
      expect(authTokenService.isAuthenticated()).toBe(true);

      await authService.logout();
      expect(authTokenService.isAuthenticated()).toBe(false);
      expect(managementAuthService.getSession()).toBeNull();
    });
  });

  describe('2. Student Identity Synchronization and Non-UUID Acceptance', () => {
    it('accepts non-UUID user IDs and does NOT fall back to DEFAULT_DEMO_STUDENT_ID when a session exists', () => {
      // Simulate registering or logging in a user with custom ID
      managementAuthService.setSession({
        id: 'usr-custom-registered-12345',
        name: 'Nguyễn Văn Mới',
        email: 'newuser@example.com',
        role: 'STUDENT',
        permissions: [],
      });

      const identity = getCurrentStudentIdentity();
      expect(identity.id).toBe('usr-custom-registered-12345');
      expect(identity.name).toBe('Nguyễn Văn Mới');
      expect(identity.fullName).toBe('Nguyễn Văn Mới');
      expect(identity.id).not.toBe(DEFAULT_DEMO_STUDENT_ID);
    });

    it('setDevStudentIdentity updates active student with any valid ID', () => {
      setDevStudentIdentity('usr-custom-dev-id');
      const identity = getCurrentStudentIdentity();
      expect(identity.id).toBe('usr-custom-dev-id');
    });

    it('clearStudentIdentity resets active identity', () => {
      setDevStudentIdentity('usr-temporary-id');
      expect(getCurrentStudentIdentity().id).toBe('usr-temporary-id');

      clearStudentIdentity();
      // When cleared and unauthenticated, strictly returns empty identity (zero fallback to demo)
      expect(getCurrentStudentIdentity().id).toBe('');
    });
  });

  describe('3. Homework Attempt Isolation & Cache Cleanup', () => {
    it('isolates attempts between different students and cleans up on demand', async () => {
      const student1 = 'usr-st-01';
      const student2 = 'usr-st-02';

      // Start attempt for student 1
      const attempt1 = await studentAttemptService.startAttempt('asgn-002', student1);
      expect(attempt1.studentId).toBe(student1);

      // Save draft answer for student 1
      await studentAttemptService.saveAttemptAnswers(attempt1.id, {
        'q-1': { questionId: 'q-1', selectedOptionId: 'opt-a' },
      });

      // Verify student 2 has no active attempt initially
      const s2Active = await studentAttemptService.getActiveAttempt('asgn-002', student2);
      expect(s2Active).toBeUndefined();

      // Start attempt for student 2
      const attempt2 = await studentAttemptService.startAttempt('asgn-002', student2);
      expect(attempt2.studentId).toBe(student2);
      expect(attempt2.id).not.toBe(attempt1.id);

      // Verify student 2 cannot submit student 1's attempt
      expect(
        studentAttemptService.submitAttempt(attempt1.id, student2)
      ).rejects.toThrow();

      // Clear student 1 cache only
      studentAttemptService.clearUserCache(student1);

      const s1Attempts = await studentAttemptService.getAttemptsForStudent(student1);
      expect(s1Attempts.length).toBe(0);

      // Student 2's attempt remains safe
      const s2Attempts = await studentAttemptService.getAttemptsForStudent(student2);
      expect(s2Attempts.length).toBe(1);

      // Full cleanup on logout
      studentAttemptService.clearUserCache();
      const allS2Attempts = await studentAttemptService.getAttemptsForStudent(student2);
      expect(allS2Attempts.length).toBe(0);
    });
  });

  describe('4. Reset Password Page & Router Contracts', () => {
    it('exports ResetPasswordPage component properly', async () => {
      const authModule = await import('../features/auth');
      expect(authModule.ResetPasswordPage).toBeDefined();
      expect(typeof authModule.ResetPasswordPage).toBe('function');
    });

    it('registers /reset-password route in authRoutes', async () => {
      const { authRoutes } = await import('../app/router/auth.routes');
      const authChildren = authRoutes[0]?.children;
      expect(authChildren).toBeDefined();

      const resetRoute = authChildren?.find((r) => r.path === '/reset-password');
      expect(resetRoute).toBeDefined();
      expect(resetRoute?.element).toBeDefined();
    });
  });

  describe('5. RBAC & Strict Route Guard Contracts', () => {
    it('ManagementRouteGuard is exported and provides RBAC protection', async () => {
      const guardModule = await import('../management/shared/components/ManagementRouteGuard');
      expect(guardModule.ManagementRouteGuard).toBeDefined();
    });
  });
});
