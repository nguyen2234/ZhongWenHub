import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Headphones,
  ShieldCheck,
  BookOpen,
  FolderKanban,
  FileText,
  CheckSquare,
  LifeBuoy,
  BarChart3,
  Settings,
  Bot,
  Video,
  ShieldAlert,
  History,
} from 'lucide-react';
import type { ManagementNavGroup } from '../types';

export const ADMIN_NAV_GROUPS: ManagementNavGroup[] = [
  {
    id: 'admin-overview',
    title: 'TỔNG QUAN',
    items: [
      {
        id: 'admin-dashboard',
        label: 'Dashboard V2',
        path: '/management/admin/dashboard',
        icon: <LayoutDashboard size={17} />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'admin-content-mgmt',
    title: 'HỌC LIỆU & NỘI DUNG',
    items: [
      {
        id: 'admin-hsk-repository',
        label: 'Kho chuẩn HSK',
        path: '/management/admin/hsk-repository',
        icon: <BookOpen size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-curriculum',
        label: 'Giáo trình & Bài học',
        path: '/management/admin/curriculum',
        icon: <FolderKanban size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-grammar',
        label: 'Ngữ pháp HSK (FE-9)',
        path: '/management/admin/grammar',
        icon: <FileText size={17} />,
        badge: 'Mới',
        roles: ['ADMIN'],
      },
      {
        id: 'admin-exercises',
        label: 'Ngân hàng bài tập (FE-9)',
        path: '/management/admin/exercises',
        icon: <CheckSquare size={17} />,
        badge: 'Mới',
        roles: ['ADMIN'],
      },
      {
        id: 'admin-videos',
        label: 'Học liệu Video',
        path: '/management/admin/videos',
        icon: <Video size={17} />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'admin-moderation-ai',
    title: 'KIỂM DUYỆT & TRỢ LÝ AI',
    items: [
      {
        id: 'admin-moderation',
        label: 'Duyệt nội dung',
        path: '/management/admin/moderation',
        icon: <ShieldAlert size={17} />,
        badge: 14,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-ai-management',
        label: 'Trợ lý AI Tutor',
        path: '/management/admin/ai-management',
        icon: <Bot size={17} />,
        badge: 'AI',
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'admin-user-mgmt',
    title: 'NGƯỜI DÙNG & TỔ CHỨC',
    items: [
      {
        id: 'admin-users',
        label: 'Học viên & Người dùng',
        path: '/management/admin/users',
        icon: <Users size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-teachers',
        label: 'Đội ngũ Giáo viên',
        path: '/management/admin/teachers',
        icon: <GraduationCap size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-support-staff',
        label: 'Nhân viên hỗ trợ',
        path: '/management/admin/support-staff',
        icon: <Headphones size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-roles',
        label: 'Vai trò & Phân quyền',
        path: '/management/admin/roles',
        icon: <ShieldCheck size={17} />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'admin-system',
    title: 'VẬN HÀNH & HỆ THỐNG',
    items: [
      {
        id: 'admin-analytics',
        label: 'Báo cáo học tập',
        path: '/management/admin/analytics',
        icon: <BarChart3 size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-support-requests',
        label: 'Yêu cầu hỗ trợ',
        path: '/management/admin/support-requests',
        icon: <LifeBuoy size={17} />,
        badge: 3,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-settings',
        label: 'Cài đặt hệ thống',
        path: '/management/admin/settings',
        icon: <Settings size={17} />,
        roles: ['ADMIN'],
      },
    ],
  },
];

export const TEACHER_NAV_GROUPS: ManagementNavGroup[] = [
  {
    id: 'teacher-overview',
    title: 'TỔNG QUAN',
    items: [
      {
        id: 'teacher-dashboard',
        label: 'Dashboard',
        path: '/management/teacher/dashboard',
        icon: <LayoutDashboard size={17} />,
        roles: ['TEACHER'],
      },
    ],
  },
  {
    id: 'teacher-ai',
    title: 'TRỢ LÝ AI',
    items: [
      {
        id: 'teacher-ai-workspace',
        label: 'Không gian AI',
        path: '/management/teacher/ai-workspace',
        icon: <Bot size={17} />,
        badge: 'Mới',
        roles: ['TEACHER'],
      },
    ],
  },
  {
    id: 'teacher-teaching',
    title: 'GIẢNG DẠY',
    items: [
      {
        id: 'teacher-classes',
        label: 'Lớp của tôi',
        path: '/management/teacher/classes',
        icon: <FolderKanban size={17} />,
        roles: ['TEACHER'],
      },
      {
        id: 'teacher-assignments',
        label: 'Bài tập',
        path: '/management/teacher/assignments',
        icon: <CheckSquare size={17} />,
        roles: ['TEACHER'],
      },
    ],
  },
];

export const SUPPORT_NAV_GROUPS: ManagementNavGroup[] = [
  {
    id: 'support-overview',
    title: 'TỔNG QUAN',
    items: [
      {
        id: 'support-dashboard',
        label: 'Dashboard',
        path: '/management/support/dashboard',
        icon: <LayoutDashboard size={17} />,
        roles: ['SUPPORT'],
      },
    ],
  },
  {
    id: 'support-services',
    title: 'HỖ TRỢ',
    items: [
      {
        id: 'support-requests',
        label: 'Yêu cầu hỗ trợ',
        path: '/management/support/dashboard',
        icon: <LifeBuoy size={17} />,
        badge: 3,
        roles: ['SUPPORT'],
      },
    ],
  },
];

export const CONTENT_MANAGER_NAV_GROUPS: ManagementNavGroup[] = [
  {
    id: 'cm-overview',
    title: 'TỔNG QUAN',
    items: [
      {
        id: 'cm-dashboard',
        label: 'Tổng quan',
        path: '/management/content-manager/dashboard',
        icon: <LayoutDashboard size={17} />,
        roles: ['CONTENT_MANAGER'],
      },
    ],
  },
  {
    id: 'cm-repository',
    title: 'KHO HỌC LIỆU',
    items: [
      {
        id: 'cm-hsk-repository',
        label: 'Kho học liệu HSK',
        path: '/management/content-manager/hsk-repository',
        icon: <BookOpen size={17} />,
        roles: ['CONTENT_MANAGER'],
      },
      {
        id: 'cm-curriculum',
        label: 'Giáo trình & Bài học',
        path: '/management/content-manager/curriculum',
        icon: <FolderKanban size={17} />,
        roles: ['CONTENT_MANAGER'],
      },
      {
        id: 'cm-grammar',
        label: 'Ngữ pháp',
        path: '/management/content-manager/grammar',
        icon: <FileText size={17} />,
        roles: ['CONTENT_MANAGER'],
      },
      {
        id: 'cm-questions',
        label: 'Ngân hàng câu hỏi',
        path: '/management/content-manager/question-bank',
        icon: <CheckSquare size={17} />,
        roles: ['CONTENT_MANAGER'],
      },
    ],
  },
  {
    id: 'cm-governance',
    title: 'KIỂM DUYỆT & XỬ LÝ LỖI',
    items: [
      {
        id: 'cm-moderation',
        label: 'Kiểm duyệt & Xuất bản',
        path: '/management/content-manager/moderation',
        icon: <ShieldCheck size={17} />,
        badge: 7,
        roles: ['CONTENT_MANAGER'],
      },
      {
        id: 'cm-issues',
        label: 'Báo cáo lỗi nội dung',
        path: '/management/content-manager/issues',
        icon: <ShieldAlert size={17} />,
        badge: 5,
        roles: ['CONTENT_MANAGER'],
      },
      {
        id: 'cm-audit',
        label: 'Lịch sử phiên bản',
        path: '/management/content-manager/audit-history',
        icon: <History size={17} />,
        roles: ['CONTENT_MANAGER'],
      },
      {
        id: 'cm-quality',
        label: 'Thống kê chất lượng',
        path: '/management/content-manager/quality-metrics',
        icon: <BarChart3 size={17} />,
        roles: ['CONTENT_MANAGER'],
      },
    ],
  },
];

export const getNavItemsForRole = (role: 'ADMIN' | 'TEACHER' | 'SUPPORT' | 'CONTENT_MANAGER') => {
  switch (role) {
    case 'CONTENT_MANAGER':
      return CONTENT_MANAGER_NAV_GROUPS.flatMap((g) => g.items);
    case 'TEACHER':
      return TEACHER_NAV_GROUPS.flatMap((g) => g.items);
    case 'SUPPORT':
      return SUPPORT_NAV_GROUPS.flatMap((g) => g.items);
    default:
      return ADMIN_NAV_GROUPS.flatMap((g) => g.items);
  }
};
