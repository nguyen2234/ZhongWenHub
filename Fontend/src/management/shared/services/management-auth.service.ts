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
    name: 'Minh Anh (Admin)',
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
    name: 'Lê Bảo Anh (Student)',
    email: 'student.baoanh@gmail.com',
    role: 'STUDENT',
    permissions: adminRolePermissionService.getRoleByCode('STUDENT')?.permissions || [],
  },
};

type SessionListener = (session: ManagementSession) => void;

class ManagementAuthService {
  private currentSession: ManagementSession;
  private listeners: Set<SessionListener> = new Set();

  constructor() {
    this.currentSession = this.loadInitialSession();
  }

  private loadInitialSession(): ManagementSession {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const stored = window.sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ManagementSession;
          if (parsed && parsed.role && DEFAULT_SESSIONS[parsed.role]) {
            // Re-sync permissions from catalog
            const roleCode = parsed.role === 'SUPER_ADMIN' ? 'ADMIN' : parsed.role;
            const catalogPermissions = adminRolePermissionService.getRoleByCode(roleCode)?.permissions || [];
            return {
              ...parsed,
              permissions: catalogPermissions.length > 0 ? catalogPermissions : parsed.permissions,
            };
          }
        }
      } catch {
        // Fallback to default
      }
    }
    // Default session: Content Manager workspace if URL indicates, otherwise Admin
    if (typeof window !== 'undefined' && window.location) {
      if (window.location.pathname.includes('/content-manager')) {
        return DEFAULT_SESSIONS.CONTENT_MANAGER;
      }
      if (window.location.pathname.includes('/teacher')) {
        return DEFAULT_SESSIONS.TEACHER;
      }
      if (window.location.pathname.includes('/support')) {
        return DEFAULT_SESSIONS.SUPPORT;
      }
    }
    return DEFAULT_SESSIONS.ADMIN;
  }

  public getSession(): ManagementSession {
    return { ...this.currentSession, permissions: [...this.currentSession.permissions] };
  }

  public setSession(session: ManagementSession): void {
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

  public switchRole(role: UserRole): ManagementSession {
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
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(this.currentSession.role);
  }

  public hasPermission(permission: string): boolean {
    if (this.currentSession.role === 'ADMIN') return true;
    return this.currentSession.permissions.includes(permission);
  }

  public hasAnyPermission(permissions: string[]): boolean {
    if (this.currentSession.role === 'ADMIN') return true;
    return permissions.some((p) => this.currentSession.permissions.includes(p));
  }

  /**
   * Kiểm tra quyền quản trị / biên tập học liệu:
   * Yêu cầu role CONTENT_MANAGER hoặc ADMIN, hoặc có permission CONTENT_VIEW kèm quyền sửa/duyệt.
   */
  public canManageContent(): boolean {
    if (this.currentSession.role === 'ADMIN' || this.currentSession.role === 'CONTENT_MANAGER') {
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
    if (this.currentSession.role === 'ADMIN') return true;
    return this.currentSession.role === workspaceRole;
  }

  /**
   * Reset về trạng thái mặc định (hữu ích cho testing)
   */
  public reset(role: UserRole = 'ADMIN'): void {
    this.currentSession = { ...DEFAULT_SESSIONS[role] };
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
