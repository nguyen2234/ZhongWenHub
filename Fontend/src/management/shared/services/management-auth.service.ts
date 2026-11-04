import type { UserRole } from '../../../types/roles';
import { adminRolePermissionService } from '../../admin/roles/services/role-permission.service';

export interface ManagementSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  avatarUrl?: string;
}

const STORAGE_KEY = 'zwh_management_session';

const DEFAULT_SESSIONS: Record<UserRole, ManagementSession> = {
  SUPER_ADMIN: {
    id: 'usr-superadmin-01',
    name: 'Hệ Thống Super Admin',
    email: 'superadmin@zhongwenhub.edu.vn',
    role: 'SUPER_ADMIN',
    permissions: adminRolePermissionService.getRoleByCode('ADMIN')?.permissions || [],
  },
  ADMIN: {
    id: 'usr-admin-01',
    name: 'Quản Trị Viên (Admin)',
    email: 'admin@zhongwenhub.edu.vn',
    role: 'ADMIN',
    permissions: adminRolePermissionService.getRoleByCode('ADMIN')?.permissions || [],
  },
  CONTENT_MANAGER: {
    id: 'usr-cm-01',
    name: 'Nguyễn Văn Minh (CM)',
    email: 'content.lead@zhongwenhub.edu.vn',
    role: 'CONTENT_MANAGER',
    permissions: adminRolePermissionService.getRoleByCode('CONTENT_MANAGER')?.permissions || [],
  },
  TEACHER: {
    id: 'usr-teacher-01',
    name: 'Trần Thị Mai (Teacher)',
    email: 'teacher.mai@zhongwenhub.edu.vn',
    role: 'TEACHER',
    permissions: adminRolePermissionService.getRoleByCode('TEACHER')?.permissions || [],
  },
  SUPPORT: {
    id: 'usr-support-01',
    name: 'Hoàng Long (Support)',
    email: 'support.long@zhongwenhub.edu.vn',
    role: 'SUPPORT',
    permissions: adminRolePermissionService.getRoleByCode('SUPPORT')?.permissions || [],
  },
  STUDENT: {
    id: 'usr-student-01',
    name: 'Học Viên (Student)',
    email: 'student@zhongwenhub.edu.vn',
    role: 'STUDENT',
    permissions: adminRolePermissionService.getRoleByCode('STUDENT')?.permissions || [],
  },
};

type SessionListener = (session: ManagementSession | null) => void;

class ManagementAuthService {
  private currentSession: ManagementSession | null = null;
  private listeners: Set<SessionListener> = new Set();

  constructor() {
    this.currentSession = this.loadInitialSession();
  }

  private loadInitialSession(): ManagementSession | null {
    // SECURITY: Strictly unauthenticated by default.
    // Never auto-elevate to ADMIN or guess roles from URL or uncontrolled storage.
    // In unit test environment (e.g. Bun test), fallback allows isolated mock testing.
    if ((globalThis as any).process?.env?.NODE_ENV === 'test' || import.meta.env?.MODE === 'test') {
      return { ...DEFAULT_SESSIONS.ADMIN };
    }
    return null;
  }

  public getSession(): ManagementSession | null {
    if (!this.currentSession) return null;
    return { ...this.currentSession, permissions: [...this.currentSession.permissions] };
  }

  public isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  public setSession(session: ManagementSession | null): void {
    if (!session) {
      this.clearSession();
      return;
    }

    const roleCode = session.role === 'SUPER_ADMIN' ? 'ADMIN' : session.role;
    const catalogPermissions = adminRolePermissionService.getRoleByCode(roleCode)?.permissions || [];

    this.currentSession = {
      ...session,
      permissions: catalogPermissions.length > 0 ? catalogPermissions : session.permissions,
    };

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSession));
      } catch {
        // Ignore storage errors
      }
    }
    this.notifyListeners();
  }

  public clearSession(): void {
    this.currentSession = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
    this.notifyListeners();
  }

  /**
   * Role switching is only permitted in isolated test suites.
   * Prohibited in browser runtime to avoid privilege escalation.
   */
  public switchRole(role: UserRole): ManagementSession | null {
    const isTest = typeof (globalThis as any).Bun !== 'undefined' || (globalThis as any).process?.env?.NODE_ENV === 'test' || import.meta.env?.MODE === 'test';
    if (!isTest) {
      console.warn('[ManagementAuthService] Chuyển đổi vai trò bị chặn trên môi trường runtime.');
      return this.currentSession;
    }
    const template = DEFAULT_SESSIONS[role] || DEFAULT_SESSIONS.ADMIN;
    this.setSession(template);
    return this.getSession();
  }

  public subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const session = this.getSession();
    this.listeners.forEach((fn) => fn(session));
  }

  public hasRole(requiredRoles: UserRole | UserRole[]): boolean {
    if (!this.currentSession) return false;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(this.currentSession.role);
  }

  public hasPermission(permission: string): boolean {
    if (!this.currentSession) return false;
    if (this.currentSession.role === 'ADMIN' || this.currentSession.role === 'SUPER_ADMIN') return true;
    return this.currentSession.permissions.includes(permission);
  }

  public hasAnyPermission(permissions: string[]): boolean {
    if (!this.currentSession) return false;
    if (this.currentSession.role === 'ADMIN' || this.currentSession.role === 'SUPER_ADMIN') return true;
    return permissions.some((p) => this.currentSession?.permissions.includes(p) ?? false);
  }

  /**
   * Kiểm tra quyền quản trị / biên tập học liệu:
   * Yêu cầu role CONTENT_MANAGER hoặc ADMIN, hoặc có permission CONTENT_VIEW kèm quyền sửa/duyệt.
   */
  public canManageContent(): boolean {
    if (!this.currentSession) return false;
    if (this.currentSession.role === 'ADMIN' || this.currentSession.role === 'SUPER_ADMIN' || this.currentSession.role === 'CONTENT_MANAGER') {
      return true;
    }
    const perms = this.currentSession.permissions;
    return perms.includes('CONTENT_VIEW') && (perms.includes('CONTENT_APPROVE') || perms.includes('CONTENT_PUBLISH'));
  }

  /**
   * Kiểm tra quyền truy cập một workspace quản trị cụ thể:
   * ADMIN có quyền truy cập tổng thể mọi workspace.
   * Các vai trò khác chỉ được truy cập workspace tương ứng.
   */
  public canAccessWorkspace(workspaceRole: UserRole): boolean {
    if (!this.currentSession) return false;
    if (this.currentSession.role === 'ADMIN' || this.currentSession.role === 'SUPER_ADMIN') return true;
    return this.currentSession.role === workspaceRole;
  }

  /**
   * Reset về trạng thái mặc định (hữu ích cho testing)
   */
  public reset(role?: UserRole): void {
    if (role && ((globalThis as any).process?.env?.NODE_ENV === 'test' || import.meta.env?.MODE === 'test')) {
      this.currentSession = { ...DEFAULT_SESSIONS[role] };
    } else {
      this.currentSession = null;
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    this.notifyListeners();
  }
}

export const managementAuthService = new ManagementAuthService();
