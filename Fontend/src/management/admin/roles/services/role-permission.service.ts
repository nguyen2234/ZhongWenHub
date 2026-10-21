import { ALL_PERMISSION_CODES, PERMISSION_CATALOG, PERMISSION_MODULE_GROUPS } from '../config/permission-catalog.config';
import type {
  PermissionDefinition,
  PermissionModuleGroup,
  RoleDetail,
  SystemRoleCode,
} from '../types/role-permission.types';

// Mock storage for roles
let INITIAL_ROLES: RoleDetail[] = [
  {
    id: 'role-admin',
    code: 'ADMIN',
    name: 'Quản trị viên',
    description: 'Toàn quyền điều hành, giám sát hoạt động và cấu hình nền tảng ZhongWenHub.',
    systemRole: true,
    userCount: 1,
    permissions: [...ALL_PERMISSION_CODES],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-teacher',
    code: 'TEACHER',
    name: 'Giáo viên',
    description: 'Giảng dạy, quản lý tài liệu học tập, soạn đề thi và chấm điểm bài tập học viên.',
    systemRole: true,
    userCount: 85,
    permissions: [
      'TEACHER_VIEW',
      'CONTENT_VIEW',
      'CONTENT_CREATE',
      'CONTENT_UPDATE',
      'QUESTION_BANK_VIEW',
      'QUESTION_BANK_CREATE',
      'QUESTION_BANK_UPDATE',
      'ASSIGNMENT_VIEW',
      'ASSIGNMENT_CREATE',
      'ASSIGNMENT_GRADE',
      'REPORT_VIEW',
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-03-20T10:30:00Z',
  },
  {
    id: 'role-content-manager',
    code: 'CONTENT_MANAGER',
    name: 'Quản lý học liệu & Kiểm duyệt',
    description: 'Chuyên trách kho học liệu HSK, ngân hàng câu hỏi, phê duyệt bài học, tự xuất bản và xử lý lỗi từ Support.',
    systemRole: true,
    userCount: 4,
    permissions: [
      'CONTENT_VIEW',
      'CONTENT_CREATE',
      'CONTENT_UPDATE',
      'CONTENT_APPROVE',
      'CONTENT_PUBLISH',
      'CONTENT_ARCHIVE',
      'CONTENT_RESTORE',
      'QUESTION_BANK_VIEW',
      'QUESTION_BANK_CREATE',
      'QUESTION_BANK_UPDATE',
      'CONTENT_ISSUE_VIEW',
      'CONTENT_ISSUE_ASSIGN',
      'CONTENT_ISSUE_RESOLVE',
      'CONTENT_AUDIT_VIEW',
      'CONTENT_REPORT_VIEW',
    ],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-20T11:00:00Z',
  },
  {
    id: 'role-support',
    code: 'SUPPORT',
    name: 'Nhân viên hỗ trợ',
    description: 'Tiếp nhận, xử lý vé hỗ trợ, giải đáp thắc mắc và hỗ trợ kỹ thuật cho người dùng.',
    systemRole: true,
    userCount: 12,
    permissions: [
      'USER_VIEW',
      'SUPPORT_STAFF_VIEW',
      'TICKET_VIEW',
      'TICKET_ASSIGN',
      'TICKET_REPLY',
      'TICKET_CLOSE',
      'REPORT_VIEW',
    ],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-03-18T14:15:00Z',
  },
  {
    id: 'role-student',
    code: 'STUDENT',
    name: 'Học viên',
    description: 'Học tập các bài giảng HSK, luyện phát âm, làm bài tập và gửi yêu cầu trợ giúp.',
    systemRole: true,
    userCount: 1420,
    permissions: ['CONTENT_VIEW', 'ASSIGNMENT_VIEW'],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-03-01T09:00:00Z',
  },
];

class RolePermissionService {
  /**
   * Lấy danh sách toàn bộ các vai trò trong hệ thống
   * ADMIN luôn tự động đồng bộ sở hữu toàn bộ quyền trong catalog
   */
  getRoles(): RoleDetail[] {
    return INITIAL_ROLES.map((role) => {
      if (role.code === 'ADMIN') {
        return {
          ...role,
          permissions: [...ALL_PERMISSION_CODES],
        };
      }
      return {
        ...role,
        permissions: [...role.permissions],
      };
    });
  }

  /**
   * Lấy chi tiết một vai trò theo mã code
   */
  getRoleByCode(code: SystemRoleCode): RoleDetail | undefined {
    const role = INITIAL_ROLES.find((r) => r.code === code);
    if (!role) return undefined;
    if (role.code === 'ADMIN') {
      return {
        ...role,
        permissions: [...ALL_PERMISSION_CODES],
      };
    }
    return {
      ...role,
      permissions: [...role.permissions],
    };
  }

  /**
   * Lấy danh mục quyền hệ thống
   */
  getPermissions(): PermissionDefinition[] {
    return [...PERMISSION_CATALOG];
  }

  /**
   * Lấy danh mục quyền gom theo nhóm phân hệ
   */
  getPermissionModuleGroups(): PermissionModuleGroup[] {
    return [...PERMISSION_MODULE_GROUPS];
  }

  /**
   * Cập nhật danh sách quyền cho vai trò
   * ADMIN là vai trò bất biến toàn quyền, không bị sửa đổi
   */
  updateRolePermissions(roleCode: SystemRoleCode, permissions: string[]): RoleDetail {
    if (roleCode === 'ADMIN') {
      const adminRole = this.getRoleByCode('ADMIN')!;
      return adminRole;
    }

    const index = INITIAL_ROLES.findIndex((r) => r.code === roleCode);
    if (index === -1) {
      throw new Error(`Không tìm thấy vai trò với mã: ${roleCode}`);
    }

    const updatedRole: RoleDetail = {
      ...INITIAL_ROLES[index],
      permissions: [...permissions],
      updatedAt: new Date().toISOString(),
    };

    INITIAL_ROLES[index] = updatedRole;
    return { ...updatedRole, permissions: [...updatedRole.permissions] };
  }

  /**
   * Cập nhật mô tả vai trò
   * Cho phép chỉnh sửa mô tả cho TEACHER, SUPPORT, STUDENT
   */
  updateRoleDescription(roleCode: SystemRoleCode, description: string): RoleDetail {
    const index = INITIAL_ROLES.findIndex((r) => r.code === roleCode);
    if (index === -1) {
      throw new Error(`Không tìm thấy vai trò với mã: ${roleCode}`);
    }

    // ADMIN description is read-only according to specifications
    if (roleCode === 'ADMIN') {
      return { ...INITIAL_ROLES[index], permissions: [...ALL_PERMISSION_CODES] };
    }

    const updatedRole: RoleDetail = {
      ...INITIAL_ROLES[index],
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    };

    INITIAL_ROLES[index] = updatedRole;
    return { ...updatedRole, permissions: [...updatedRole.permissions] };
  }
}

export const adminRolePermissionService = new RolePermissionService();
