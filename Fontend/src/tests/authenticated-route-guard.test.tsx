// @ts-ignore
import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { AuthenticatedRouteGuard } from '../features/auth/components/AuthenticatedRouteGuard';
import { getSafeRedirectTarget } from '../features/auth/pages/LoginPage';
import { AuthContext, type AuthContextType } from '../features/auth/context/AuthContext';
import type { AuthUser } from '../features/auth/types/auth.types';
import { studentRoutes } from '../app/router/student.routes';

const createMockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => ({ success: true, token: 'mock-token' }),
  register: async () => ({ success: true, token: 'mock-token' }),
  logout: async () => {},
  refreshUser: async () => null,
  updateUser: () => {},
  ...overrides,
});

describe('F01: AuthenticatedRouteGuard & Route Protection Suite (Behavioral)', () => {
  it('1. shows neutral loading screen and prevents rendering protected content while auth hydration is in flight', () => {
    const authState = createMockAuthContext({
      isLoading: true,
      isAuthenticated: false,
      user: null,
    });

    const html = renderToString(
      <AuthContext.Provider value={authState}>
        <MemoryRouter initialEntries={['/protected-view']}>
          <AuthenticatedRouteGuard>
            <div data-testid="protected-content">SECRET_STUDENT_DATA_123</div>
          </AuthenticatedRouteGuard>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Must show genuine loading text
    expect(html).toContain('Đang kiểm tra phiên đăng nhập...');
    // Must NOT leak protected content
    expect(html).not.toContain('SECRET_STUDENT_DATA_123');
  });

  it('2. unauthenticated guest returns Navigate element to /login with state.from preserved and never renders children', () => {
    const authState = createMockAuthContext({
      isLoading: false,
      isAuthenticated: false,
      user: null,
    });

    const capturedElements: React.ReactNode[] = [];
    const TestSpy: React.FC = () => {
      const el = AuthenticatedRouteGuard({
        children: <div data-testid="protected-content">SECRET_STUDENT_DATA_456</div>,
      });
      capturedElements.push(el);
      return <>{el}</>;
    };

    const html = renderToString(
      <AuthContext.Provider value={authState}>
        <MemoryRouter initialEntries={['/homework?filter=due#sec-1']}>
          <TestSpy />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // 1. SSR html must be empty (Navigate renders null in SSR, zero protected content leak)
    expect(html).toBe('');
    expect(html).not.toContain('SECRET_STUDENT_DATA_456');

    // 2. Behavioral verification of the returned Navigate element
    expect(capturedElements.length).toBeGreaterThan(0);
    const navElement = capturedElements[0] as React.ReactElement;
    expect(navElement.props.to).toBe('/login');
    expect(navElement.props.replace).toBe(true);
    expect(navElement.props.state?.from?.pathname).toBe('/homework');
    expect(navElement.props.state?.from?.search).toBe('?filter=due');
    expect(navElement.props.state?.from?.hash).toBe('#sec-1');
  });

  it('3. authenticated student accesses protected route without role constraint', () => {
    const studentUser: AuthUser = {
      id: 'usr-student-01',
      email: 'student@zhongwenhub.edu.vn',
      fullName: 'Trần Thị Thu Thảo',
      role: 'STUDENT',
    };

    const authState = createMockAuthContext({
      isLoading: false,
      isAuthenticated: true,
      user: studentUser,
    });

    const html = renderToString(
      <AuthContext.Provider value={authState}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthenticatedRouteGuard>
            <div data-testid="student-dashboard">AUTHENTICATED_STUDENT_DASHBOARD</div>
          </AuthenticatedRouteGuard>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(html).toContain('AUTHENTICATED_STUDENT_DASHBOARD');
    expect(html).not.toContain('Không có quyền truy cập');
  });

  it('4. RBAC denial: student accessing teacher-only guard receives 403 alert and protected content is blocked', () => {
    const studentUser: AuthUser = {
      id: 'usr-student-01',
      email: 'student@zhongwenhub.edu.vn',
      fullName: 'Trần Thị Thu Thảo',
      role: 'STUDENT',
    };

    const authState = createMockAuthContext({
      isLoading: false,
      isAuthenticated: true,
      user: studentUser,
    });

    const html = renderToString(
      <AuthContext.Provider value={authState}>
        <MemoryRouter initialEntries={['/teacher/gradebook']}>
          <AuthenticatedRouteGuard requiredRole="TEACHER">
            <div data-testid="teacher-content">CONFIDENTIAL_TEACHER_GRADEBOOK</div>
          </AuthenticatedRouteGuard>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Actual AuthenticatedRouteGuard renders 403 alert
    expect(html).toContain('Không có quyền truy cập');
    expect(html).toContain('Tài khoản của bạn không được phân quyền để truy cập chức năng này.');
    expect(html).toContain('role="alert"');
    // Confidential teacher data is NOT rendered
    expect(html).not.toContain('CONFIDENTIAL_TEACHER_GRADEBOOK');
  });

  it('5. RBAC authorization: teacher accessing teacher-only guard renders protected content', () => {
    const teacherUser: AuthUser = {
      id: 'usr-teacher-01',
      email: 'teacher@zhongwenhub.edu.vn',
      fullName: 'Lê Thầy Giáo',
      role: 'TEACHER',
    };

    const authState = createMockAuthContext({
      isLoading: false,
      isAuthenticated: true,
      user: teacherUser,
    });

    const html = renderToString(
      <AuthContext.Provider value={authState}>
        <MemoryRouter initialEntries={['/teacher/gradebook']}>
          <AuthenticatedRouteGuard requiredRole="TEACHER">
            <div data-testid="teacher-content">CONFIDENTIAL_TEACHER_GRADEBOOK</div>
          </AuthenticatedRouteGuard>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(html).toContain('CONFIDENTIAL_TEACHER_GRADEBOOK');
    expect(html).not.toContain('Không có quyền truy cập');
  });

  it('6. RBAC superuser: admin accessing teacher-only guard bypasses constraint and renders content', () => {
    const adminUser: AuthUser = {
      id: 'usr-admin-01',
      email: 'admin@zhongwenhub.edu.vn',
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
    };

    const authState = createMockAuthContext({
      isLoading: false,
      isAuthenticated: true,
      user: adminUser,
    });

    const html = renderToString(
      <AuthContext.Provider value={authState}>
        <MemoryRouter initialEntries={['/teacher/gradebook']}>
          <AuthenticatedRouteGuard requiredRole="TEACHER">
            <div data-testid="teacher-content">CONFIDENTIAL_TEACHER_GRADEBOOK</div>
          </AuthenticatedRouteGuard>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(html).toContain('CONFIDENTIAL_TEACHER_GRADEBOOK');
    expect(html).not.toContain('Không có quyền truy cập');
  });

  it('7. multi-role user support in AuthenticatedRouteGuard', () => {
    const multiRoleUser: AuthUser = {
      id: 'usr-hybrid-01',
      email: 'hybrid@zhongwenhub.edu.vn',
      fullName: 'Giáo Viên kiêm Quản Lý Nội Dung',
      role: 'CONTENT_MANAGER',
      roles: ['CONTENT_MANAGER', 'TEACHER'],
    };

    const authState = createMockAuthContext({
      isLoading: false,
      isAuthenticated: true,
      user: multiRoleUser,
    });

    const html = renderToString(
      <AuthContext.Provider value={authState}>
        <MemoryRouter initialEntries={['/teacher/assignments']}>
          <AuthenticatedRouteGuard requiredRole="TEACHER">
            <div>MULTI_ROLE_TEACHER_VIEW</div>
          </AuthenticatedRouteGuard>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(html).toContain('MULTI_ROLE_TEACHER_VIEW');
  });

  it('8. real studentRoutes tree execution: unauthenticated access to standalone focus runners triggers redirect and blocks content', () => {
    const authState = createMockAuthContext({
      isLoading: false,
      isAuthenticated: false,
      user: null,
    });

    const StudentRoutesRenderer: React.FC = () => {
      const element = useRoutes(studentRoutes);
      return element;
    };

    const testFocusRoutes = ['/lesson/focus', '/srs-review', '/homework/asg-01/run'];

    for (const testPath of testFocusRoutes) {
      const html = renderToString(
        <AuthContext.Provider value={authState}>
          <MemoryRouter initialEntries={[testPath]}>
            <StudentRoutesRenderer />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      // In SSR, Navigate renders null; protected runner content must never be leaked
      expect(html).toBe('');
      expect(html).not.toContain('Flashcard');
      expect(html).not.toContain('Homework');
    }
  });

  describe('getSafeRedirectTarget Security & Deep Link Contract', () => {
    it('preserves deep link pathname, query string and hash for authorized student route', () => {
      const fromLoc = {
        pathname: '/homework',
        search: '?tab=pending&hsk=2',
        hash: '#assignment-01',
      };
      const result = getSafeRedirectTarget(fromLoc, 'STUDENT');
      expect(result).toBe('/homework?tab=pending&hsk=2#assignment-01');
    });

    it('parses full URL string fromLocation cleanly preserving query and hash', () => {
      const result = getSafeRedirectTarget('/lesson/focus?theme=dark#step2', 'STUDENT');
      expect(result).toBe('/lesson/focus?theme=dark#step2');
    });

    it('blocks open redirect attempts to external protocols, backslashes, or host bypasses', () => {
      expect(getSafeRedirectTarget('https://evil.com/phishing', 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget('//evil.com/phishing', 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget('/\\evil.com', 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget('javascript:alert(1)', 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget({ pathname: 'http://malicious.org' }, 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget({ pathname: '/\\\\evil.com' }, 'STUDENT')).toBe('/dashboard');
    });

    it('blocks encoded path traversal exploits (%2e%2e, %2f, %5c)', () => {
      expect(getSafeRedirectTarget('/%2e%2e/%2e%2e/etc/passwd', 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget('/%2E%2E/%2E%2E/windows/win.ini', 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget('/%5c%5cevil.com', 'STUDENT')).toBe('/dashboard');
    });

    it('blocks student from accessing /management/admin or any management route using segment check', () => {
      const fromLoc = { pathname: '/management/admin/users', search: '?role=ALL' };
      expect(getSafeRedirectTarget(fromLoc, 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget('/management', 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget('/management/teacher/classes', 'STUDENT')).toBe('/dashboard');
    });

    it('blocks teacher from accessing admin or support areas and preserves teacher portal default', () => {
      expect(getSafeRedirectTarget({ pathname: '/management/admin/roles' }, 'TEACHER')).toBe('/management/teacher/dashboard');
      expect(getSafeRedirectTarget({ pathname: '/management/support/dashboard' }, 'TEACHER')).toBe('/management/teacher/dashboard');
      expect(getSafeRedirectTarget({ pathname: '/management/teacher/classes', search: '?level=3' }, 'TEACHER')).toBe('/management/teacher/classes?level=3');
    });

    it('blocks content manager from accessing admin or teacher consoles and routes to content manager dashboard', () => {
      expect(getSafeRedirectTarget({ pathname: '/management/admin/operations' }, 'CONTENT_MANAGER')).toBe('/management/content-manager/dashboard');
      expect(getSafeRedirectTarget({ pathname: '/management/content-manager/videos', search: '?status=DRAFT' }, 'CONTENT_MANAGER')).toBe('/management/content-manager/videos?status=DRAFT');
    });

    it('supports multi-role user profile objects allowing cross-role authorized management access', () => {
      const multiUser: AuthUser = {
        id: 'usr-hybrid-01',
        email: 'hybrid@test.com',
        fullName: 'Hybrid User',
        role: 'TEACHER',
        roles: ['TEACHER', 'CONTENT_MANAGER'],
      };

      // Can access teacher portal
      expect(getSafeRedirectTarget('/management/teacher/classes', multiUser)).toBe('/management/teacher/classes');
      // Can also access content-manager portal because roles array includes CONTENT_MANAGER
      expect(getSafeRedirectTarget('/management/content-manager/videos', multiUser)).toBe('/management/content-manager/videos');
      // Still blocked from admin portal
      expect(getSafeRedirectTarget('/management/admin/users', multiUser)).toBe('/management/teacher/dashboard');
    });

    it('allows admin full access across all management modules with query params preserved', () => {
      const adminLoc = { pathname: '/management/admin/users', search: '?search=student' };
      expect(getSafeRedirectTarget(adminLoc, 'ADMIN')).toBe('/management/admin/users?search=student');
    });

    it('prevents redirect loops by rejecting auth routes as targets', () => {
      expect(getSafeRedirectTarget('/login', 'STUDENT')).toBe('/dashboard');
      expect(getSafeRedirectTarget('/register', 'TEACHER')).toBe('/management/teacher/dashboard');
      expect(getSafeRedirectTarget('/forgot-password', 'ADMIN')).toBe('/management/admin/dashboard');
      expect(getSafeRedirectTarget('/reset-password', 'SUPPORT')).toBe('/management/support/dashboard');
      expect(getSafeRedirectTarget('/onboarding', 'STUDENT')).toBe('/dashboard');
    });
  });
});
