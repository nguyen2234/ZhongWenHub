export type UserRole = 'STUDENT' | 'ADMIN' | 'TEACHER' | 'SUPPORT';

export interface RouteRoleConfig {
  role: UserRole;
  defaultPath: string;
}

export const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  STUDENT: '/dashboard',
  ADMIN: '/management/admin/dashboard',
  TEACHER: '/management/teacher/dashboard',
  SUPPORT: '/management/support/dashboard',
};
