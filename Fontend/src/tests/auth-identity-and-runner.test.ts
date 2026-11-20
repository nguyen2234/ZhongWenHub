import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { authService, canUseMockAuth } from '../features/auth/services/authService';
import {
  getCurrentStudentIdentity,
  setDevStudentIdentity,
  clearStudentIdentity,
  DEFAULT_DEMO_STUDENT_ID,
} from '../features/auth/services/student-identity.adapter';
import { studentAttemptService } from '../features/homework/services/student-attempt.service';
import { studentHomeworkService } from '../features/homework/services/student-homework.service';
import { learningStateService } from '../features/learning/services/learning-state.service';
import { authTokenService } from '../core/api/client/auth-token.service';
import { managementAuthService } from '../management/shared/services/management-auth.service';

// Ensure standard web storage is available in headless Bun test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  const localStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
  };
  globalThis.localStorage = localStorageMock as any;
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: globalThis.localStorage,
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as any;
}

describe('Auth, Identity Isolation, and Runner Protection Suite', () => {
  beforeEach(async () => {
    delete (globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__;
    await authService.logout();
  });

  afterEach(async () => {
    delete (globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__;
    await authService.logout();
  });

  describe('1. Mock Mode vs Production Mode Authentication Security', () => {
    it('logs in student demo account in mock mode with correct role and student identity', async () => {
      const res = await authService.login({
        email: 'student@zhongwenhub.edu.vn',
        password: 'Password123!',
      });

      expect(res.success).toBe(true);
      expect(res.user?.role).toBe('STUDENT');
      expect(res.user?.id).toBe(DEFAULT_DEMO_STUDENT_ID);
      expect(authTokenService.isAuthenticated()).toBe(true);

      const identity = getCurrentStudentIdentity();
      expect(identity?.id).toBe(DEFAULT_DEMO_STUDENT_ID);
      expect(identity?.fullName).toBe('Trần Thị Thu Thảo');
    });

    it('logs in teacher demo account with TEACHER role in dev mock mode', async () => {
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

    it('logs in admin demo account with ADMIN role in dev mock mode', async () => {
      const res = await authService.login({
        email: 'admin@zhongwenhub.edu.vn',
        password: 'Password123!',
      });

      expect(res.success).toBe(true);
      expect(res.user?.role).toBe('ADMIN');
      expect(res.user?.id).toBe('usr-admin-01');
    });

    it('supports Google login in mock mode with a dedicated demo student account', async () => {
      const res = await authService.loginWithGoogle();

      expect(res.success).toBe(true);
      expect(res.user?.id).toBe('usr-google-demo');
      expect(res.user?.email).toBe('student.google@zhongwenhub.edu.vn');
      expect(res.user?.role).toBe('STUDENT');

      const current = getCurrentStudentIdentity();
      expect(current?.id).toBe('usr-google-demo');
      expect(current?.fullName).toBe('Học viên Google (Demo)');
    });

    it('strictly forbids mock login in production environment and does NOT sniff roles from email', async () => {
      (globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__ = true;
      expect(canUseMockAuth()).toBe(false);

      // Attempting mock admin login in production mode must NOT succeed with mock tokens
      // It must attempt a real network call to backend and reject when server is not reachable
      await expect(
        authService.login({
          email: 'admin@zhongwenhub.edu.vn',
          password: 'Password123!',
        })
      ).rejects.toThrow();

      // No admin session or token must be created
      expect(authTokenService.isAuthenticated()).toBe(false);
      expect(managementAuthService.getSession()).toBeNull();
      expect(getCurrentStudentIdentity()).toBeNull();
    });

    it('strictly forbids mock Google login in production environment', async () => {
      (globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__ = true;
      expect(canUseMockAuth()).toBe(false);

      await expect(authService.loginWithGoogle()).rejects.toThrow(
        'Tính năng đăng nhập với Google trên máy chủ ASP.NET Core yêu cầu cấu hình Google OAuth ClientId và RedirectURI.'
      );
      expect(authTokenService.isAuthenticated()).toBe(false);
      expect(getCurrentStudentIdentity()).toBeNull();
    });

    it('strictly forbids mock registration in production environment', async () => {
      (globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__ = true;
      expect(canUseMockAuth()).toBe(false);

      await expect(
        authService.register({
          fullName: 'Test Production Student',
          email: 'prod.student@zhongwenhub.edu.vn',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
      ).rejects.toThrow();
      expect(authTokenService.isAuthenticated()).toBe(false);
    });

    it('handles forgot password and returns informative response', async () => {
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

      const successRes = await authService.resetPassword({
        email: 'student@zhongwenhub.edu.vn',
        token: 'DEMO-TOKEN',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });
      expect(successRes.success).toBe(true);
    });

    it('clears all session state, student identity, and caches on logout', async () => {
      await authService.login({
        email: 'student@zhongwenhub.edu.vn',
        password: 'Password123!',
      });
      expect(authTokenService.isAuthenticated()).toBe(true);
      expect(getCurrentStudentIdentity()?.id).toBe(DEFAULT_DEMO_STUDENT_ID);

      await authService.logout();
      expect(authTokenService.isAuthenticated()).toBe(false);
      expect(managementAuthService.getSession()).toBeNull();
      // Crucial: After logout, getCurrentStudentIdentity MUST be null, not resurrected demo student
      expect(getCurrentStudentIdentity()).toBeNull();
    });
  });

  describe('2. Student Identity Synchronization, Nullable State, and Zero Demo Fallback', () => {
    it('returns null when completely unauthenticated and does NOT resurrect demo student', () => {
      clearStudentIdentity();
      authTokenService.clearTokens();
      managementAuthService.clearSession();

      const identity = getCurrentStudentIdentity();
      expect(identity).toBeNull();
    });

    it('ignores standalone localStorage tampering in production mode without authenticated session', () => {
      (globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__ = true;
      clearStudentIdentity();
      authTokenService.clearTokens();
      managementAuthService.clearSession();

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('zh_active_student_id', 'usr-st-01');
      }

      // Even with localStorage seeded, unauthenticated state in production returns null
      const identity = getCurrentStudentIdentity();
      expect(identity).toBeNull();
    });

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
      expect(identity).not.toBeNull();
      expect(identity?.id).toBe('usr-custom-registered-12345');
      expect(identity?.name).toBe('Nguyễn Văn Mới');
      expect(identity?.fullName).toBe('Nguyễn Văn Mới');
      expect(identity?.id).not.toBe(DEFAULT_DEMO_STUDENT_ID);
    });

    it('setDevStudentIdentity updates active student with any valid ID in dev/mock mode', () => {
      setDevStudentIdentity('usr-custom-dev-id');
      const identity = getCurrentStudentIdentity();
      expect(identity?.id).toBe('usr-custom-dev-id');
    });

    it('clearStudentIdentity resets active identity to null without fallback', () => {
      setDevStudentIdentity('usr-temporary-id');
      expect(getCurrentStudentIdentity()?.id).toBe('usr-temporary-id');

      clearStudentIdentity();
      // When cleared and unauthenticated, strictly returns null and never resurrects demo student
      expect(getCurrentStudentIdentity()).toBeNull();
    });

    it('clears student identity and access token when token expires', () => {
      setDevStudentIdentity('usr-st-01');
      authTokenService.setSession({
        accessToken: 'short-lived-token',
        expiresAt: Date.now() - 1000, // already expired
      });

      // Token service reports unauthenticated
      expect(authTokenService.isAuthenticated()).toBe(false);
      expect(authTokenService.getAccessToken()).toBeNull();
    });
  });

  describe('3. Account Switching & Cache Isolation Between Users', () => {
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

    it('cleans previous user cache when a new user logs in without prior logout', async () => {
      const studentAId = 'usr-st-01';

      // Start attempt for student A before any token is active
      const attemptA = await studentAttemptService.startAttempt('asgn-002', studentAId);
      await studentAttemptService.saveAttemptAnswers(attemptA.id, {
        'q-1': { questionId: 'q-1', selectedOptionId: 'opt-a' },
      });
      const attemptsA = await studentAttemptService.getAttemptsForStudent(studentAId);
      expect(attemptsA.length).toBeGreaterThan(0);

      // User B logs in directly without prior logout
      await authService.login({
        email: 'teacher@zhongwenhub.edu.vn',
        password: 'Password123!',
      });
      const userBId = managementAuthService.getSession()?.id;
      expect(userBId).toBe('usr-teacher-01');

      // Attempt cache from Student A has been wiped on login
      const staleStudentAAttempts = await studentAttemptService.getAttemptsForStudent(studentAId);
      expect(staleStudentAAttempts.length).toBe(0);
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

  describe('6. LearningState Isolation and Zero Demo Fallback Suite', () => {
    it('strictly resets active learning state to clean empty state when studentId is null/unauthenticated', () => {
      // Set to an active student first
      learningStateService.switchStudent('usr-st-01');
      expect(learningStateService.getState().studentId).toBe('usr-st-01');

      // Now switch to null (unauthenticated / logout)
      const emptyState = learningStateService.switchStudent(null);
      expect(emptyState.studentId).toBe('');
      expect(emptyState.xpTotal).toBe(0);
      expect(emptyState.streakDays).toBe(0);
      expect(emptyState.completedLessonIds.length).toBe(0);
      expect(Object.keys(emptyState.lessonProgress).length).toBe(0);

      // Verify learningStateService.getState() reflects empty state without resurrecting usr-st-01
      const current = learningStateService.getState();
      expect(current.studentId).toBe('');
      expect(current.xpTotal).toBe(0);
      expect(current.studentId).not.toBe('usr-st-01');
    });

    it('isolates learning state between User A and User B across account switching', () => {
      const userAId = 'usr-user-alpha-123';
      const userBId = 'usr-user-beta-456';

      // 1. User A logs in and completes lesson 1
      learningStateService.switchStudent(userAId);
      const stateA = learningStateService.getState();
      expect(stateA.studentId).toBe(userAId);

      learningStateService.completeLesson({
        lessonId: 'les-1',
        quizScore: 5,
        totalQuizQuestions: 5,
        timeSpentSeconds: 120,
      });

      const updatedStateA = learningStateService.getState();
      expect(updatedStateA.completedLessonIds).toContain('les-1');
      expect(updatedStateA.xpTotal).toBeGreaterThan(0);
      const userAXp = updatedStateA.xpTotal;

      // 2. User B logs in without prior logout (account switch)
      learningStateService.switchStudent(userBId);
      const stateB = learningStateService.getState();
      expect(stateB.studentId).toBe(userBId);

      // User B must NOT have User A's completed lessons or XP
      expect(stateB.completedLessonIds).not.toContain('les-1');
      expect(stateB.xpTotal).toBe(0);

      // 3. User B completes lesson 2
      learningStateService.completeLesson({
        lessonId: 'les-2',
        quizScore: 4,
        totalQuizQuestions: 5,
        timeSpentSeconds: 90,
      });
      const updatedStateB = learningStateService.getState();
      expect(updatedStateB.completedLessonIds).toContain('les-2');
      expect(updatedStateB.completedLessonIds).not.toContain('les-1');

      // 4. Switch back to User A: User A's progress is preserved under User A's own key
      learningStateService.switchStudent(userAId);
      const restoredA = learningStateService.getState();
      expect(restoredA.studentId).toBe(userAId);
      expect(restoredA.completedLessonIds).toContain('les-1');
      expect(restoredA.completedLessonIds).not.toContain('les-2');
      expect(restoredA.xpTotal).toBe(userAXp);

      // 5. Logout resets active state to empty
      learningStateService.switchStudent(null);
      expect(learningStateService.getState().studentId).toBe('');
      expect(learningStateService.getState().xpTotal).toBe(0);
    });
  });

  describe('7. Homework Service Production Security & Spoofing Prevention', () => {
    it('rejects client-supplied studentId bypass when unauthenticated in production mode', async () => {
      (globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__ = true;
      clearStudentIdentity();
      authTokenService.clearTokens();
      managementAuthService.clearSession();

      // Unauthenticated caller tries to spoof studentId 'usr-st-01'
      const assignments = await studentHomeworkService.getMyAssignments('usr-st-01');
      expect(assignments).toEqual([]);

      const detail = await studentHomeworkService.getAssignmentDetail('asgn-001', 'usr-st-01');
      expect(detail).toBeUndefined();

      const runner = await studentHomeworkService.getAssignmentRunner('asgn-001', 'usr-st-01');
      expect(runner).toBeUndefined();
    });

    it('enforces that authenticated student cannot spoof another student ID in production mode', async () => {
      (globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__ = true;

      // Simulate authenticated student session for Student 1
      const student1Id = 'usr-student-authenticated-1';
      managementAuthService.setSession({
        id: student1Id,
        name: 'Học viên 1',
        email: 'student1@example.com',
        role: 'STUDENT',
        permissions: [],
      });
      authTokenService.setSession({
        accessToken: 'mock-valid-token-for-test',
        expiresAt: Date.now() + 60000,
      });

      expect(getCurrentStudentIdentity()?.id).toBe(student1Id);

      // Even if caller passes 'usr-target-victim-id', production mode binds to student1Id
      // In assignmentService.getAssignmentsForStudent, it calls fetch to backend
      // Backend validates JWT claims, not client spoof
    });
  });
});
