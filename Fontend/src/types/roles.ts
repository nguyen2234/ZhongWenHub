export type UserRole = 'ADMIN' | 'CONTENT_MANAGER' | 'TEACHER' | 'SUPPORT' | 'STUDENT';

export interface RouteRoleConfig {
  role: UserRole;
  defaultPath: string;
}

export const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  ADMIN: '/management/admin/dashboard',
  CONTENT_MANAGER: '/management/content-manager/dashboard',
  TEACHER: '/management/teacher/dashboard',
  SUPPORT: '/management/support/dashboard',
  STUDENT: '/dashboard',
};
