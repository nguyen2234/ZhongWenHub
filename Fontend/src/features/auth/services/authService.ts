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
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('CONTENT_MANAGER')) return 'CONTENT_MANAGER';
  if (roles.includes('TEACHER')) return 'TEACHER';
  if (roles.includes('SUPPORT')) return 'SUPPORT';
  return 'STUDENT';
}

function getSystemRoleCode(role: string): 'ADMIN' | 'CONTENT_MANAGER' | 'TEACHER' | 'SUPPORT' | 'STUDENT' {
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'CONTENT_MANAGER') return 'CONTENT_MANAGER';
  if (role === 'TEACHER') return 'TEACHER';
  if (role === 'SUPPORT') return 'SUPPORT';
  return 'STUDENT';
}

interface BackendUserPayload {
  id: string;
  username?: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  roles?: string[];
  currentHskLevel?: string | number;
  streakDays?: number;
  xpPoints?: number;
  createdAt?: string;
}

function mapBackendUserToAuthUser(user: BackendUserPayload): AuthUser {
  const roles: string[] = user?.roles || ['STUDENT'];
  const primaryRole = resolvePrimaryRole(roles);

  let hskLevel = 1;
  if (typeof user?.currentHskLevel === 'number') {
    hskLevel = user.currentHskLevel;
  } else if (typeof user?.currentHskLevel === 'string') {
    const match = user.currentHskLevel.match(/\d+/);
    if (match) hskLevel = parseInt(match[0], 10);
  }

  return {
    id: user.id,
    fullName: user.displayName || user.username || 'Người dùng',
    email: user.email,
    avatarUrl: user.avatarUrl,
    currentHskLevel: hskLevel,
    streakDays: typeof user.streakDays === 'number' ? user.streakDays : 0,
    xpPoints: typeof user.xpPoints === 'number' ? user.xpPoints : 0,
    roles,
    role: primaryRole,
    createdAt: user.createdAt,
  };
}

export const authService = {
  /**
   * Real ASP.NET Core login
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const emailTrimmed = request.email.trim();
    if (!emailTrimmed) {
      throw new Error('Email hoặc tên đăng nhập không được để trống.');
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

      const authUser = mapBackendUserToAuthUser(data.user);

      // Sync management session
      managementAuthService.setSession({
        id: data.user.id,
        name: data.user.displayName || data.user.username || 'Người dùng',
        email: data.user.email,
        role: authUser.role as UserRole,
        permissions: adminRolePermissionService.getRoleByCode(getSystemRoleCode(authUser.role || 'STUDENT'))?.permissions || [],
        avatarUrl: data.user.avatarUrl,
      });

      // Sync student identity
      setDevStudentIdentity(data.user.id || DEFAULT_DEMO_STUDENT_ID);

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
      throw new Error('Không thể kết nối đến máy chủ Backend (http://127.0.0.1:5000). Vui lòng đảm bảo Backend ASP.NET Core đang chạy.');
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

      const authUser = mapBackendUserToAuthUser(data.user);

      managementAuthService.setSession({
        id: data.user.id,
        name: data.user.displayName || data.user.username || 'Người dùng',
        email: data.user.email,
        role: authUser.role as UserRole,
        permissions: adminRolePermissionService.getRoleByCode(getSystemRoleCode(authUser.role || 'STUDENT'))?.permissions || [],
        avatarUrl: data.user.avatarUrl,
      });

      setDevStudentIdentity(data.user.id || DEFAULT_DEMO_STUDENT_ID);

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
        const refreshResult = await this.refreshSession();
        return refreshResult?.user ?? null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return mapBackendUserToAuthUser(data);
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
      managementAuthService.reset('STUDENT');
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem('zwh_management_session');
          window.localStorage.removeItem('zh_active_student_id');
        } catch {
          // ignore
        }
      }
    }
  },

  /**
   * Real ASP.NET Core Update Current Profile
   */
  async updateProfile(payload: { displayName: string; avatarUrl?: string }): Promise<AuthUser> {
    let token = authTokenService.getAccessToken();
    if (!token) {
      const refreshed = await this.refreshSession();
      token = refreshed?.accessToken || null;
    }

    if (!token) {
      throw new Error('Chưa xác thực. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(getApiUrl('auth/me'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, application/problem+json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorDetail = 'Cập nhật thông tin không thành công.';
      try {
        const problem = await response.json();
        if (problem.detail) errorDetail = problem.detail;
        else if (problem.title) errorDetail = problem.title;
        if (problem.errors && typeof problem.errors === 'object') {
          const firstErr = Object.values(problem.errors).flat()[0];
          if (firstErr) errorDetail = String(firstErr);
        }
      } catch {
        // ignore json parse error
      }
      throw new Error(errorDetail);
    }

    const data = await response.json();
    const updatedUser = mapBackendUserToAuthUser(data);

    // Sync management session
    const session = managementAuthService.getSession();
    if (session) {
      managementAuthService.setSession({
        ...session,
        id: session.id || updatedUser.id,
        name: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
      });
    }

    return updatedUser;
  },

  /**
   * Real ASP.NET Core Registration with SQL Server
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    const emailTrimmed = request.email.trim().toLowerCase();
    if (!emailTrimmed) {
      throw new Error('Email hoặc tên đăng nhập không được để trống.');
    }
    if (!request.fullName?.trim()) {
      throw new Error('Họ và tên không được để trống.');
    }
    if (!request.password) {
      throw new Error('Mật khẩu không được để trống.');
    }
    if (request.password !== request.confirmPassword) {
      throw new Error('Mật khẩu xác nhận không khớp.');
    }

    try {
      const response = await fetch(getApiUrl('auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, application/problem+json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName: request.fullName.trim(),
          email: emailTrimmed,
          username: emailTrimmed.split('@')[0],
          password: request.password,
          confirmPassword: request.confirmPassword,
        }),
      });

      if (!response.ok) {
        let errorDetail = 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
        try {
          const problem = await response.json();
          if (problem.detail) {
            errorDetail = problem.detail;
          } else if (problem.title) {
            errorDetail = problem.title;
          }
          if (problem.errors && typeof problem.errors === 'object') {
            const firstErr = Object.values(problem.errors).flat()[0];
            if (firstErr) errorDetail = String(firstErr);
          }
        } catch {
          // ignore json parse error
        }

        if (response.status === 409) {
          throw new Error('Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.');
        }

        throw new Error(errorDetail);
      }

      const data = await response.json();

      if (data.accessToken) {
        authTokenService.setSession({
          accessToken: data.accessToken,
          expiresAt: Date.now() + ((data.expiresIn || 900) * 1000),
        });
      }

      const authUser = mapBackendUserToAuthUser(data.user);

      // Sync management session
      managementAuthService.setSession({
        id: data.user.id,
        name: data.user.displayName || data.user.username || 'Người dùng',
        email: data.user.email,
        role: authUser.role as UserRole,
        permissions: adminRolePermissionService.getRoleByCode(getSystemRoleCode(authUser.role || 'STUDENT'))?.permissions || [],
        avatarUrl: data.user.avatarUrl,
      });

      // Sync student identity
      setDevStudentIdentity(data.user.id || DEFAULT_DEMO_STUDENT_ID);

      return {
        success: true,
        message: 'Đăng ký tài khoản thành công! Đang chuyển hướng đến bảng điều khiển...',
        user: authUser,
        accessToken: data.accessToken,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Không thể kết nối đến máy chủ Backend (http://127.0.0.1:5000). Vui lòng đảm bảo Backend ASP.NET Core đang chạy.');
    }
  },

  /**
   * Google OAuth login
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    throw new Error('Tính năng đăng nhập với Google hiện đang được hoàn thiện và chưa khả dụng trên máy chủ.');
  },

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      throw new Error('Vui lòng cung cấp địa chỉ email hợp lệ.');
    }
    throw new Error('Tính năng tự đặt lại mật khẩu qua email đang được bảo trì. Vui lòng liên hệ bộ phận hỗ trợ (support@zhongwenhub.edu.vn) để được cấp lại mật khẩu.');
  },
};
