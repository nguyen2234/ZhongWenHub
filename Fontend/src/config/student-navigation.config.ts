import type { ElementType } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Languages,
  Dumbbell,
  Sparkles,
  TrendingUp,
  GraduationCap,
  BookText,
  Headphones,
  Mic,
  FileText,
  PenTool,
  Film,
  Award,
  User,
  Settings,
  Users,
  CheckCircle2,
  Trophy,
  Radio,
  FileCheck,
  BrainCircuit,
  ClipboardList,
  Gamepad2,
} from 'lucide-react';

export interface SecondaryFeatureItem {
  id: string;
  path: string;
  label: string;
  shortLabel?: string;
  icon?: ElementType;
  badge?: string;
}

export interface StudentNavItem {
  id: string;
  path: string;
  label: string;
  shortLabel?: string;
  icon: ElementType;
  badge?: string;
  badgeType?: 'primary' | 'streak' | 'danger' | 'ai' | 'success';
  activeMatchPaths: string[];
  secondaryFeatures: SecondaryFeatureItem[];
}

export interface StudentNavGroupItem {
  id: string;
  path: string;
  label: string;
  icon: ElementType;
  badge?: string;
  badgeType?: 'primary' | 'streak' | 'danger' | 'ai' | 'success';
  matchPrefixes?: string[];
}

export interface StudentNavCollapsibleGroup {
  id: string;
  groupTitle: string;
  items: StudentNavGroupItem[];
  defaultOpen?: boolean;
}

/**
 * 4 Collapsible Navigation Groups (Phase FE-5 HanbeeGo Dashboard Alignment)
 * A. Nhóm Tổng quan
 * B. Nhóm Khóa học
 * C. Nhóm Kỹ năng
 * D. Nhóm Cá nhân hóa
 */
export const HANBEEGO_STUDENT_NAV_GROUPS: StudentNavCollapsibleGroup[] = [
  // 1. Nhóm Tổng quan
  {
    id: 'overview',
    groupTitle: 'TỔNG QUAN',
    defaultOpen: true,
    items: [
      {
        id: 'dashboard',
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        matchPrefixes: ['/dashboard', '/'],
      },
    ],
  },

  // 2. Nhóm Khóa học
  {
    id: 'courses',
    groupTitle: 'KHÓA HỌC',
    defaultOpen: true,
    items: [
      {
        id: 'beginner',
        path: '/learning-path?mode=beginner',
        label: 'Lộ trình học tập',
        icon: GraduationCap,
        badge: 'Mới',
        badgeType: 'primary',
      },
      {
        id: 'curriculum',
        path: '/learning-path?mode=hsk',
        label: 'Giáo trình HSK',
        icon: BookOpen,
        matchPrefixes: ['/lesson'],
      },
      {
        id: 'practice',
        path: '/practice',
        label: 'Bài tập',
        icon: Dumbbell,
        matchPrefixes: ['/practice', '/homework'],
      },
      {
        id: 'grammar',
        path: '/grammar',
        label: 'Ngữ pháp',
        icon: BookText,
        matchPrefixes: ['/grammar'],
      },
      {
        id: 'mock-exams',
        path: '/mock-exams',
        label: 'Luyện thi HSK',
        icon: Award,
        badge: 'Thi thử',
        badgeType: 'streak',
        matchPrefixes: ['/mock-exams'],
      },
      {
        id: 'games',
        path: '/games',
        label: 'Trò chơi học tập',
        icon: Gamepad2,
        matchPrefixes: ['/games'],
      },
      {
        id: 'videos',
        path: '/videos',
        label: 'Học qua video',
        icon: Film,
        badge: 'Mới',
        badgeType: 'ai',
        matchPrefixes: ['/videos'],
      },
    ],
  },

  // 3. Nhóm Kỹ năng
  {
    id: 'skills',
    groupTitle: 'KỸ NĂNG',
    defaultOpen: true,
    items: [
      {
        id: 'listening',
        path: '/skills/listening',
        label: 'Luyện nghe',
        icon: Headphones,
        matchPrefixes: ['/skills/listening'],
      },
      {
        id: 'speaking',
        path: '/skills/speaking',
        label: 'Luyện nói',
        icon: Mic,
        matchPrefixes: ['/skills/speaking'],
      },
      {
        id: 'reading',
        path: '/skills/reading',
        label: 'Đọc hiểu',
        icon: FileText,
        matchPrefixes: ['/skills/reading'],
      },
      {
        id: 'writing',
        path: '/skills/writing',
        label: 'Luyện viết',
        icon: PenTool,
        matchPrefixes: ['/skills/writing'],
      },
    ],
  },

  // 4. Nhóm Cá nhân hóa
  {
    id: 'personal',
    groupTitle: 'CÁ NHÂN HÓA',
    defaultOpen: true,
    items: [
      {
        id: 'vocabulary',
        path: '/vocabulary',
        label: 'Từ vựng',
        icon: Languages,
        badge: 'SRS',
        badgeType: 'streak',
        matchPrefixes: ['/vocabulary', '/srs-review'],
      },
      {
        id: 'ai-tutor',
        path: '/ai-tutor',
        label: 'AI Tutor',
        icon: Sparkles,
        badge: 'AI',
        badgeType: 'ai',
        matchPrefixes: ['/ai-tutor', '/ai-live', '/ai-grading', '/ai-analytics'],
      },
      {
        id: 'progress',
        path: '/progress',
        label: 'Tiến độ học tập',
        icon: TrendingUp,
        matchPrefixes: ['/progress', '/learning-results', '/achievements', '/leaderboard'],
      },
    ],
  },
];

/**
 * 6 Primary Modules mapping for backward-compatible routing / secondary bar
 */
export const STUDENT_MAIN_NAV_ITEMS: StudentNavItem[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Trang chủ',
    shortLabel: 'Trang chủ',
    icon: LayoutDashboard,
    activeMatchPaths: ['/dashboard', '/'],
    secondaryFeatures: [],
  },
  {
    id: 'learning-path',
    path: '/learning-path',
    label: 'Học HSK',
    shortLabel: 'Học HSK',
    icon: BookOpen,
    activeMatchPaths: ['/learning-path', '/lesson', '/grammar', '/skills'],
    secondaryFeatures: [
      { id: 'path', path: '/learning-path', label: 'Lộ trình HSK', icon: BookOpen },
      { id: 'lesson', path: '/lesson', label: 'Bài học', icon: GraduationCap, badge: 'Bài 8' },
      { id: 'grammar', path: '/grammar', label: 'Ngữ pháp', icon: BookText },
      { id: 'listening', path: '/skills/listening', label: 'Luyện nghe', icon: Headphones },
      { id: 'speaking', path: '/skills/speaking', label: 'Luyện nói', icon: Mic },
      { id: 'reading', path: '/skills/reading', label: 'Luyện đọc', icon: FileText },
      { id: 'writing', path: '/skills/writing', label: 'Luyện viết', icon: PenTool },
    ],
  },
  {
    id: 'vocabulary',
    path: '/vocabulary',
    label: 'Từ vựng',
    shortLabel: 'Từ vựng',
    icon: Languages,
    badge: 'SRS',
    badgeType: 'streak',
    activeMatchPaths: ['/vocabulary', '/srs-review'],
    secondaryFeatures: [
      { id: 'vocab-bank', path: '/vocabulary', label: 'Kho từ vựng', icon: Languages },
      { id: 'srs-review', path: '/srs-review', label: 'Ôn tập SRS Flashcard', icon: Sparkles, badge: '18 từ' },
    ],
  },
  {
    id: 'practice',
    path: '/practice',
    label: 'Luyện tập',
    shortLabel: 'Luyện tập',
    icon: Dumbbell,
    activeMatchPaths: ['/practice', '/mock-exams', '/games', '/homework', '/classes'],
    secondaryFeatures: [
      { id: 'practice-center', path: '/practice', label: 'Trung tâm Luyện tập', icon: Dumbbell },
      { id: 'mock-exams', path: '/mock-exams', label: 'Thi thử HSK', icon: Award, badge: 'HSK 1-6' },
      { id: 'games', path: '/games', label: 'Trò chơi học tập', icon: Gamepad2 },
      { id: 'homework', path: '/homework', label: 'Bài tập được giao', icon: ClipboardList, badge: '2 mới' },
      { id: 'classes', path: '/classes', label: 'Lớp học của tôi', icon: Users },
    ],
  },
  {
    id: 'ai-tutor',
    path: '/ai-tutor',
    label: 'AI Tutor',
    shortLabel: 'AI Tutor',
    icon: Sparkles,
    badge: 'AI',
    badgeType: 'ai',
    activeMatchPaths: ['/ai-tutor', '/ai-live', '/ai-grading', '/ai-analytics', '/ai-learning'],
    secondaryFeatures: [
      { id: 'ai-chat', path: '/ai-tutor', label: 'AI Chat', icon: Sparkles },
      { id: 'ai-live', path: '/ai-live', label: 'AI Live Kippy', icon: Radio, badge: 'Live' },
      { id: 'ai-grading', path: '/ai-grading', label: 'AI Chấm bài', icon: FileCheck },
      { id: 'ai-analytics', path: '/ai-analytics', label: 'Phân tích AI', icon: BrainCircuit },
    ],
  },
  {
    id: 'progress',
    path: '/progress',
    label: 'Tiến độ',
    shortLabel: 'Tiến độ',
    icon: TrendingUp,
    activeMatchPaths: ['/progress', '/learning-results', '/achievements', '/leaderboard'],
    secondaryFeatures: [
      { id: 'progress-overview', path: '/progress', label: 'Tiến độ học tập', icon: TrendingUp },
      { id: 'learning-results', path: '/learning-results', label: 'Kết quả học tập', icon: CheckCircle2 },
      { id: 'achievements', path: '/achievements', label: 'Thành tựu & Huy hiệu', icon: Award },
      { id: 'leaderboard', path: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
    ],
  },
];

/**
 * Account Menu Items
 */
export const ACCOUNT_MENU_ITEMS = [
  {
    id: 'profile',
    path: '/profile',
    label: 'Hồ sơ học viên',
    icon: User,
    description: 'Thông tin cá nhân & cấp độ HSK',
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Cài đặt hệ thống',
    icon: Settings,
    description: 'Âm thanh, Pinyin & thông báo',
  },
  {
    id: 'classes',
    path: '/classes',
    label: 'Lớp học của tôi',
    icon: Users,
    description: 'Lớp học & giáo viên hướng dẫn',
  },
];

export interface StudentNavGroup {
  id: string;
  groupTitle: string;
  items: StudentNavItem[];
}

export const STUDENT_NAV_GROUPS: StudentNavGroup[] = [
  {
    id: 'main',
    groupTitle: 'MENU CHÍNH',
    items: STUDENT_MAIN_NAV_ITEMS,
  },
];
