import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthUser,
} from '../types/auth.types';
import type { UserRole } from '../../../types/roles';
import { authTokenService } from '../../../core/api/client/auth-token.service';
import { managementAuthService } from '../../../management/shared/services/management-auth.service';
import { adminRolePermissionService } from '../../../management/admin/roles/services/role-permission.service';
import { setDevStudentIdentity, DEFAULT_DEMO_STUDENT_ID } from './student-identity.adapter';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

function resolvePrimaryRole(roles?: string[]): UserRole {
  if (!roles || roles.length === 0) return 'STUDENT';
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('CONTENT_MANAGER')) return 'CONTENT_MANAGER';
  if (roles.includes('TEACHER')) return 'TEACHER';
  if (roles.includes('SUPPORT')) return 'SUPPORT';
  return 'STUDENT';
}

export const authService = {
  /**
   * Real ASP.NET Core login
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const emailTrimmed = request.email.trim();
    if (!emailTrimmed) {
      throw new Error('Email không được để trống.');
    }
    if (!request.password) {
      throw new Error('Mật khẩu không được để trống.');
    }

    try {
      const response = await fetch(getApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, application/problem+json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: emailTrimmed,
          usernameOrEmail: emailTrimmed,
          password: request.password,
          rememberMe: Boolean(request.rememberMe),
        }),
      });

      if (!response.ok) {
        let errorDetail = 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
        try {
          const problem = await response.json();
          if (problem.detail) {
            errorDetail = problem.detail;
          } else if (problem.title) {
            errorDetail = problem.title;
          }
        } catch {
          // ignore json parse error
        }

        if (response.status === 401) {
          throw new Error('Email hoặc mật khẩu không chính xác. Vui lòng thử lại.');
        }

        if (response.status === 403) {
          throw new Error(errorDetail || 'Tài khoản của bạn đã bị khóa hoặc không khả dụng.');
        }

        throw new Error(errorDetail);
      }

      const data = await response.json();

      // Store access token in memory
      if (data.accessToken) {
        authTokenService.setSession({
          accessToken: data.accessToken,
          expiresAt: Date.now() + ((data.expiresIn || 900) * 1000),
        });
      }

      const roles: string[] = data.user?.roles || ['STUDENT'];
      const primaryRole = resolvePrimaryRole(roles);

      // Sync management session
      managementAuthService.setSession({
        id: data.user.id,
        name: data.user.displayName || data.user.username || 'Người dùng',
        email: data.user.email,
        role: primaryRole,
        permissions: adminRolePermissionService.getRoleByCode(primaryRole === 'SUPER_ADMIN' ? 'ADMIN' : primaryRole)?.permissions || [],
        avatarUrl: data.user.avatarUrl,
      });

      // Sync dev student identity
      setDevStudentIdentity(data.user.id || DEFAULT_DEMO_STUDENT_ID);

      const authUser: AuthUser = {
        id: data.user.id,
        fullName: data.user.displayName || data.user.username,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        currentHskLevel: 2,
        streakDays: 8,
        xpPoints: 2180,
        roles,
        role: primaryRole,
      };

      return {
        success: true,
        message: 'Đăng nhập thành công! Đang chuyển hướng...',
        user: authUser,
        accessToken: data.accessToken,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
    }
  },

  /**
   * Real ASP.NET Core session refresh
   */
  async refreshSession(): Promise<AuthResponse | null> {
    try {
      const response = await fetch(getApiUrl('auth/refresh'), {
        method: 'POST',
        headers: {
          Accept: 'application/json, application/problem+json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        authTokenService.clearTokens();
        return null;
      }

      const data = await response.json();
      if (data.accessToken) {
        authTokenService.setSession({
          accessToken: data.accessToken,
          expiresAt: Date.now() + ((data.expiresIn || 900) * 1000),
        });
      }

      const roles: string[] = data.user?.roles || ['STUDENT'];
      const primaryRole = resolvePrimaryRole(roles);

      managementAuthService.setSession({
        id: data.user.id,
        name: data.user.displayName || data.user.username || 'Người dùng',
        email: data.user.email,
        role: primaryRole,
        permissions: adminRolePermissionService.getRoleByCode(primaryRole === 'SUPER_ADMIN' ? 'ADMIN' : primaryRole)?.permissions || [],
        avatarUrl: data.user.avatarUrl,
      });

      setDevStudentIdentity(data.user.id || DEFAULT_DEMO_STUDENT_ID);

      const authUser: AuthUser = {
        id: data.user.id,
        fullName: data.user.displayName || data.user.username,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        currentHskLevel: 2,
        streakDays: 8,
        xpPoints: 2180,
        roles,
        role: primaryRole,
      };

      return {
        success: true,
        user: authUser,
        accessToken: data.accessToken,
      };
    } catch {
      authTokenService.clearTokens();
      return null;
    }
  },

  /**
   * Real ASP.NET Core get current profile (/me)
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    let token = authTokenService.getAccessToken();
    if (!token) {
      const refreshResult = await this.refreshSession();
      if (!refreshResult || !refreshResult.user) {
        return null;
      }
      return refreshResult.user;
    }

    try {
      const response = await fetch(getApiUrl('auth/me'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        // Try refresh
        const refreshResult = await this.refreshSession();
        return refreshResult?.user ?? null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const roles: string[] = data.roles || ['STUDENT'];
      const primaryRole = resolvePrimaryRole(roles);

      return {
        id: data.id,
        fullName: data.displayName || data.username,
        email: data.email,
        avatarUrl: data.avatarUrl,
        currentHskLevel: 2,
        streakDays: 8,
        xpPoints: 2180,
        roles,
        role: primaryRole,
      };
    } catch {
      return null;
    }
  },

  /**
   * Real ASP.NET Core logout
   */
  async logout(): Promise<void> {
    try {
      await fetch(getApiUrl('auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      authTokenService.clearTokens();
    }
  },

  /**
   * Registration
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    const emailTrimmed = request.email.trim().toLowerCase();
    if (request.password !== request.confirmPassword) {
      throw new Error('Mật khẩu xác nhận không khớp.');
    }

    const mockUser: AuthUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      fullName: request.fullName.trim(),
      email: emailTrimmed,
      currentHskLevel: 1,
      streakDays: 1,
      xpPoints: 50,
      roles: ['STUDENT'],
      role: 'STUDENT',
    };

    return {
      success: true,
      message: 'Đăng ký tài khoản thành công! Đang chuyển đến bước thiết lập...',
      user: mockUser,
    };
  },

  /**
   * Google OAuth login
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    const mockUser: AuthUser = {
      id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
      fullName: 'Học viên Google',
      email: 'student.google@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      currentHskLevel: 1,
      streakDays: 1,
      xpPoints: 100,
      roles: ['STUDENT'],
      role: 'STUDENT',
    };

    return {
      success: true,
      message: 'Đăng nhập bằng Google thành công!',
      user: mockUser,
    };
  },

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      throw new Error('Vui lòng cung cấp địa chỉ email hợp lệ.');
    }

    return {
      success: true,
      message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến ' + emailTrimmed + '. Vui lòng kiểm tra hòm thư của bạn.',
    };
  },
};
