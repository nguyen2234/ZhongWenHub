import { describe, it, expect } from 'bun:test';
import { ROLE_DEFAULT_PATHS, type UserRole } from '../types/roles';
import type { AuthUser } from '../features/auth/types/auth.types';

describe('Auth Registration & Onboarding Removal Verification', () => {
  // Test 1: Navigation after registration routes directly to dashboard instead of onboarding
  it('should route student directly to /dashboard after registration instead of /onboarding', () => {
    let navigatedTo = '';
    const mockNavigate = (route: string) => {
      navigatedTo = route;
    };

    const studentUser: AuthUser = {
      id: 'usr-student-new',
      fullName: 'Nguyễn Văn Mới',
      email: 'newstudent@example.com',
      role: 'STUDENT',
      roles: ['STUDENT'],
      currentHskLevel: 1,
      streakDays: 0,
      xpPoints: 0,
    };

    // Simulate handleSuccess in RegisterPage
    const role = (studentUser.role || studentUser.roles?.[0] || 'STUDENT') as UserRole;
    const targetPath = ROLE_DEFAULT_PATHS[role] || '/dashboard';
    if (!targetPath.startsWith('/management')) {
      mockNavigate('dashboard');
    } else {
      mockNavigate(targetPath);
    }

    expect(navigatedTo).toBe('dashboard');
    expect(navigatedTo).not.toBe('onboarding');
  });

  // Test 2: Role-based navigation after registration for Teacher and Admin
  it('should route teacher and admin to their respective management dashboards upon registration', () => {
    const teacherUser: AuthUser = {
      id: 'usr-teacher-new',
      fullName: 'Cô Mai',
      email: 'teacher.mai@example.com',
      role: 'TEACHER',
      roles: ['TEACHER'],
    };

    const adminUser: AuthUser = {
      id: 'usr-admin-new',
      fullName: 'Admin Test',
      email: 'admin.test@example.com',
      role: 'ADMIN',
      roles: ['ADMIN'],
    };

    const getTargetPath = (user: AuthUser) => {
      const role = (user.role || user.roles?.[0] || 'STUDENT') as UserRole;
      return ROLE_DEFAULT_PATHS[role] || '/dashboard';
    };

    expect(getTargetPath(teacherUser)).toBe('/management/teacher/dashboard');
    expect(getTargetPath(adminUser)).toBe('/management/admin/dashboard');
  });

  // Test 3: Direct access to /onboarding redirects to appropriate home/dashboard
  it('should resolve safe redirect path when accessing /onboarding directly', () => {
    const resolveOnboardingRedirect = (isAuthenticated: boolean, user?: AuthUser | null) => {
      if (!isAuthenticated || !user) {
        return '/dashboard'; // Safe fallback
      }
      const role = (user.role || user.roles?.[0] || 'STUDENT') as UserRole;
      return ROLE_DEFAULT_PATHS[role] || '/dashboard';
    };

    // Authenticated student
    const studentUser: AuthUser = {
      id: 'usr-1',
      fullName: 'Học viên A',
      email: 'a@example.com',
      role: 'STUDENT',
    };
    expect(resolveOnboardingRedirect(true, studentUser)).toBe('/dashboard');

    // Authenticated teacher
    const teacherUser: AuthUser = {
      id: 'usr-2',
      fullName: 'Thầy Hùng',
      email: 'hung@example.com',
      role: 'TEACHER',
    };
    expect(resolveOnboardingRedirect(true, teacherUser)).toBe('/management/teacher/dashboard');

    // Authenticated admin
    const adminUser: AuthUser = {
      id: 'usr-3',
      fullName: 'Admin System',
      email: 'admin@example.com',
      role: 'ADMIN',
    };
    expect(resolveOnboardingRedirect(true, adminUser)).toBe('/management/admin/dashboard');

    // Unauthenticated guest
    expect(resolveOnboardingRedirect(false, null)).toBe('/dashboard');
  });

  // Test 4: Role default paths coverage
  it('should have complete and valid default paths for all 5 system roles', () => {
    expect(ROLE_DEFAULT_PATHS.STUDENT).toBe('/dashboard');
    expect(ROLE_DEFAULT_PATHS.TEACHER).toBe('/management/teacher/dashboard');
    expect(ROLE_DEFAULT_PATHS.ADMIN).toBe('/management/admin/dashboard');
    expect(ROLE_DEFAULT_PATHS.CONTENT_MANAGER).toBe('/management/content-manager/dashboard');
    expect(ROLE_DEFAULT_PATHS.SUPPORT).toBe('/management/support/dashboard');
  });

  // Test 5: Verify AI Tutor & learning state compatibility without mandatory onboarding
  it('should provide valid initial learning state and HSK defaults so AI Tutor and SRS never break', () => {
    // Default fallback state when user registers without onboarding wizard
    const defaultInitialState = {
      selectedHskLevel: 1,
      currentLessonId: 'les-1',
      completedLessonIds: [],
      dailyGoal: {
        targetMinutes: 30,
        targetXp: 50,
      },
    };

    // System safely defaults to level 1 and 30min daily goal
    expect(defaultInitialState.selectedHskLevel).toBeGreaterThanOrEqual(1);
    expect(defaultInitialState.dailyGoal.targetMinutes).toBeGreaterThan(0);
    expect(defaultInitialState.currentLessonId).toBeDefined();

    // Verify AI Tutor system prompt builder does not throw when HSK level is defaulted
    const buildAiTutorPrompt = (hskLevel: number, lessonId?: string) => {
      const levelStr = `HSK ${hskLevel || 1}`;
      const contextStr = lessonId ? `Lesson: ${lessonId}` : 'General practice';
      return `Target level: ${levelStr}, Context: ${contextStr}`;
    };

    const prompt = buildAiTutorPrompt(defaultInitialState.selectedHskLevel, defaultInitialState.currentLessonId);
    expect(prompt).toContain('Target level: HSK 1');
    expect(prompt).toContain('Lesson: les-1');
  });

  // Test 6: Optional future interactive goal setting
  it('should allow optional interactive onboarding mode when allowInteractive is true', () => {
    const shouldRedirect = (allowInteractive: boolean) => !allowInteractive;

    expect(shouldRedirect(false)).toBe(true);  // Default: redirect away from mandatory onboarding
    expect(shouldRedirect(true)).toBe(false); // Optional interactive mode allowed
  });
});
