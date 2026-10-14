export type SystemRoleCode = 'ADMIN' | 'TEACHER' | 'SUPPORT' | 'STUDENT';

export type PermissionModuleId =
  | 'USER_MANAGEMENT'
  | 'TEACHER_MANAGEMENT'
  | 'SUPPORT_STAFF'
  | 'LEARNING_CONTENT'
  | 'QUESTION_BANK'
  | 'ASSIGNMENTS'
  | 'SUPPORT_TICKETS'
  | 'REPORTS'
  | 'SYSTEM';

export interface PermissionDefinition {
  code: string;
  name: string;
  description: string;
  module: PermissionModuleId;
}

export interface PermissionModuleGroup {
  id: PermissionModuleId;
  name: string;
  description: string;
  permissions: PermissionDefinition[];
}

export interface RoleDetail {
  id: string;
  code: SystemRoleCode;
  name: string;
  description: string;
  systemRole: boolean;
  userCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRolePermissionsDTO {
  roleCode: SystemRoleCode;
  permissions: string[];
}

export interface UpdateRoleDescriptionDTO {
  roleCode: SystemRoleCode;
  description: string;
}
