import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Headphones,
  ShieldCheck,
  Award,
  Languages,
  BookOpen,
  FolderKanban,
  FileText,
  HelpCircle,
  CheckSquare,
  ClipboardCheck,
  LifeBuoy,
  BarChart3,
  Settings,
  PenTool,
  Layers,
  Inbox,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  BookMarked,
} from 'lucide-react';
import type { ManagementNavGroup } from '../types';

export const ADMIN_NAV_GROUPS: ManagementNavGroup[] = [
  {
    id: 'admin-overview',
    title: 'TỔNG QUAN',
    items: [
      {
        id: 'admin-dashboard',
        label: 'Dashboard',
        path: '/management/admin/dashboard',
        icon: <LayoutDashboard size={17} />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'admin-user-mgmt',
    title: 'QUẢN LÝ NGƯỜI DÙNG',
    items: [
      {
        id: 'admin-users',
        label: 'Người dùng',
        path: '/management/admin/users',
        icon: <Users size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-teachers',
        label: 'Giáo viên',
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
        label: 'Vai trò & quyền',
        path: '/management/admin/roles',
        icon: <ShieldCheck size={17} />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'admin-content-mgmt',
    title: 'NỘI DUNG HỌC TẬP',
    items: [
      {
        id: 'admin-hsk',
        label: 'HSK',
        path: '/management/admin/hsk-content',
        icon: <Award size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-vocabulary',
        label: 'Từ vựng',
        path: '/management/admin/vocabulary',
        icon: <Languages size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-grammar',
        label: 'Ngữ pháp',
        path: '/management/admin/grammar',
        icon: <BookOpen size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-hanzi',
        label: 'Chữ Hán',
        path: '/management/admin/hanzi',
        icon: <PenTool size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-courses',
        label: 'Khóa học',
        path: '/management/admin/courses',
        icon: <FolderKanban size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-lessons',
        label: 'Bài học',
        path: '/management/admin/lessons',
        icon: <FileText size={17} />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'admin-assessment',
    title: 'ĐÁNH GIÁ',
    items: [
      {
        id: 'admin-question-bank',
        label: 'Ngân hàng câu hỏi',
        path: '/management/admin/question-bank',
        icon: <HelpCircle size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-exercises',
        label: 'Bài tập',
        path: '/management/admin/exercises',
        icon: <CheckSquare size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-tests',
        label: 'Bài kiểm tra',
        path: '/management/admin/tests',
        icon: <ClipboardCheck size={17} />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'admin-system',
    title: 'HỆ THỐNG',
    items: [
      {
        id: 'admin-support-requests',
        label: 'Yêu cầu hỗ trợ',
        path: '/management/admin/support-requests',
        icon: <LifeBuoy size={17} />,
        badge: 3,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-reports',
        label: 'Báo cáo',
        path: '/management/admin/reports',
        icon: <BarChart3 size={17} />,
        roles: ['ADMIN'],
      },
      {
        id: 'admin-settings',
        label: 'Cài đặt',
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
    id: 'teacher-teaching',
    title: 'GIẢNG DẠY',
    items: [
      {
        id: 'teacher-classes',
        label: 'Lớp của tôi',
        path: '/management/teacher/classes',
        icon: <Layers size={17} />,
        roles: ['TEACHER'],
      },
      {
        id: 'teacher-students',
        label: 'Học viên',
        path: '/management/teacher/students',
        icon: <Users size={17} />,
        roles: ['TEACHER'],
      },
      {
        id: 'teacher-lectures',
        label: 'Bài giảng',
        path: '/management/teacher/lectures',
        icon: <FileText size={17} />,
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
  {
    id: 'teacher-content',
    title: 'NỘI DUNG',
    items: [
      {
        id: 'teacher-my-content',
        label: 'Nội dung của tôi',
        path: '/management/teacher/my-content',
        icon: <FolderKanban size={17} />,
        roles: ['TEACHER'],
      },
      {
        id: 'teacher-question-bank',
        label: 'Ngân hàng câu hỏi',
        path: '/management/teacher/question-bank',
        icon: <HelpCircle size={17} />,
        roles: ['TEACHER'],
      },
      {
        id: 'teacher-tests',
        label: 'Bài kiểm tra',
        path: '/management/teacher/tests',
        icon: <ClipboardCheck size={17} />,
        roles: ['TEACHER'],
      },
    ],
  },
  {
    id: 'teacher-assessment',
    title: 'ĐÁNH GIÁ',
    items: [
      {
        id: 'teacher-submissions',
        label: 'Bài nộp',
        path: '/management/teacher/submissions',
        icon: <Inbox size={17} />,
        badge: 14,
        roles: ['TEACHER'],
      },
      {
        id: 'teacher-grading',
        label: 'Chấm điểm',
        path: '/management/teacher/grading',
        icon: <PenTool size={17} />,
        roles: ['TEACHER'],
      },
    ],
  },
  {
    id: 'teacher-analytics',
    title: 'PHÂN TÍCH',
    items: [
      {
        id: 'teacher-student-progress',
        label: 'Tiến độ học viên',
        path: '/management/teacher/student-progress',
        icon: <TrendingUp size={17} />,
        roles: ['TEACHER'],
      },
      {
        id: 'teacher-class-performance',
        label: 'Hiệu suất lớp',
        path: '/management/teacher/class-performance',
        icon: <BarChart3 size={17} />,
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
        id: 'support-tickets',
        label: 'Tickets',
        path: '/management/support/tickets',
        icon: <LifeBuoy size={17} />,
        badge: 5,
        roles: ['SUPPORT'],
      },
      {
        id: 'support-requests',
        label: 'Yêu cầu người dùng',
        path: '/management/support/requests',
        icon: <MessageSquare size={17} />,
        roles: ['SUPPORT'],
      },
      {
        id: 'support-issues',
        label: 'Vấn đề được báo cáo',
        path: '/management/support/issues',
        icon: <AlertCircle size={17} />,
        badge: 2,
        roles: ['SUPPORT'],
      },
    ],
  },
  {
    id: 'support-knowledge',
    title: 'KIẾN THỨC',
    items: [
      {
        id: 'support-faq',
        label: 'FAQ',
        path: '/management/support/faq',
        icon: <HelpCircle size={17} />,
        roles: ['SUPPORT'],
      },
      {
        id: 'support-articles',
        label: 'Bài viết trợ giúp',
        path: '/management/support/articles',
        icon: <BookMarked size={17} />,
        roles: ['SUPPORT'],
      },
    ],
  },
];

// Helper to get flat list if needed
export const getNavItemsForRole = (role: 'ADMIN' | 'TEACHER' | 'SUPPORT') => {
  switch (role) {
    case 'TEACHER':
      return TEACHER_NAV_GROUPS.flatMap((g) => g.items);
    case 'SUPPORT':
      return SUPPORT_NAV_GROUPS.flatMap((g) => g.items);
    default:
      return ADMIN_NAV_GROUPS.flatMap((g) => g.items);
  }
};
