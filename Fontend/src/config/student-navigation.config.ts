import type { ElementType } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Languages,
  BookText,
  Headphones,
  Mic,
  FileText,
  PenTool,
  Dumbbell,
  GraduationCap as ExamIcon,
  Gamepad2,
  Users,
  ClipboardList,
  CheckCircle2,
  Sparkles,
  Radio,
  FileCheck,
  BrainCircuit,
  TrendingUp,
  Trophy,
  Award,
  User,
  Settings,
} from 'lucide-react';

export interface StudentNavItem {
  id: string;
  path: string;
  label: string;
  shortLabel?: string;
  icon: ElementType;
  badge?: string;
  badgeType?: 'primary' | 'streak' | 'danger' | 'ai' | 'success';
  children?: StudentNavItem[];
}

export interface StudentNavGroup {
  id: string;
  groupTitle: string;
  items: StudentNavItem[];
  collapsible?: boolean;
}

export const STUDENT_NAV_GROUPS: StudentNavGroup[] = [
  // A. TỔNG QUAN
  {
    id: 'overview',
    groupTitle: 'TỔNG QUAN',
    items: [
      {
        id: 'dashboard',
        path: '/dashboard',
        label: 'Trang chủ',
        shortLabel: 'Trang chủ',
        icon: LayoutDashboard,
      },
      {
        id: 'learning-path',
        path: '/learning-path',
        label: 'Lộ trình HSK 1–9',
        shortLabel: 'Lộ trình',
        icon: BookOpen,
      },
    ],
  },

  // B. HỌC TIẾNG TRUNG
  {
    id: 'learning',
    groupTitle: 'HỌC TIẾNG TRUNG',
    items: [
      {
        id: 'lesson',
        path: '/lesson',
        label: 'Bài học',
        shortLabel: 'Bài học',
        icon: GraduationCap,
        badge: 'Bài 8',
        badgeType: 'primary',
      },
      {
        id: 'vocabulary',
        path: '/vocabulary',
        label: 'Từ vựng',
        shortLabel: 'Từ vựng',
        icon: Languages,
        badge: '18 cần ôn',
        badgeType: 'streak',
      },
      {
        id: 'grammar',
        path: '/grammar',
        label: 'Ngữ pháp',
        shortLabel: 'Ngữ pháp',
        icon: BookText,
      },
      {
        id: 'skills',
        path: '/skills/listening',
        label: 'Luyện kỹ năng',
        shortLabel: 'Kỹ năng',
        icon: Headphones,
        children: [
          {
            id: 'skill-listening',
            path: '/skills/listening',
            label: 'Luyện nghe',
            icon: Headphones,
          },
          {
            id: 'skill-speaking',
            path: '/skills/speaking',
            label: 'Luyện nói',
            icon: Mic,
          },
          {
            id: 'skill-reading',
            path: '/skills/reading',
            label: 'Luyện đọc',
            icon: FileText,
          },
          {
            id: 'skill-writing',
            path: '/skills/writing',
            label: 'Luyện viết',
            icon: PenTool,
          },
        ],
      },
    ],
  },

  // C. LUYỆN TẬP & KIỂM TRA
  {
    id: 'practice',
    groupTitle: 'LUYỆN TẬP & KIỂM TRA',
    items: [
      {
        id: 'practice-center',
        path: '/practice',
        label: 'Luyện tập',
        shortLabel: 'Luyện tập',
        icon: Dumbbell,
        badge: '12 bài',
        badgeType: 'danger',
      },
      {
        id: 'mock-exams',
        path: '/mock-exams',
        label: 'Thi thử HSK',
        shortLabel: 'Thi thử',
        icon: ExamIcon,
        badge: 'HSK 1-6',
        badgeType: 'primary',
      },
      {
        id: 'games',
        path: '/games',
        label: 'Trò chơi học tập',
        shortLabel: 'Trò chơi',
        icon: Gamepad2,
        badge: 'Mini-game',
        badgeType: 'success',
      },
    ],
  },

  // D. LỚP HỌC
  {
    id: 'classroom',
    groupTitle: 'LỚP HỌC',
    items: [
      {
        id: 'classes',
        path: '/classes',
        label: 'Lớp học của tôi',
        shortLabel: 'Lớp học',
        icon: Users,
      },
      {
        id: 'homework',
        path: '/homework',
        label: 'Bài tập được giao',
        shortLabel: 'Bài tập',
        icon: ClipboardList,
        badge: '2 mới',
        badgeType: 'danger',
      },
      {
        id: 'learning-results',
        path: '/learning-results',
        label: 'Kết quả học tập',
        shortLabel: 'Kết quả',
        icon: CheckCircle2,
      },
    ],
  },

  // E. TRỢ LÝ AI
  {
    id: 'ai-assistant',
    groupTitle: 'TRỢ LÝ AI',
    items: [
      {
        id: 'ai-tutor',
        path: '/ai-tutor',
        label: 'AI Tutor Trò chuyện',
        shortLabel: 'AI Tutor',
        icon: Sparkles,
        badge: 'AI',
        badgeType: 'ai',
      },
      {
        id: 'ai-live',
        path: '/ai-live',
        label: 'Hội thoại Live (Kippy)',
        shortLabel: 'AI Live',
        icon: Radio,
        badge: 'Live',
        badgeType: 'ai',
      },
      {
        id: 'ai-grading',
        path: '/ai-grading',
        label: 'AI chấm bài & Sửa văn',
        shortLabel: 'AI Chấm bài',
        icon: FileCheck,
      },
      {
        id: 'ai-analytics',
        path: '/ai-analytics',
        label: 'Phân tích năng lực AI',
        shortLabel: 'Phân tích AI',
        icon: BrainCircuit,
      },
    ],
  },

  // F. THÀNH TÍCH
  {
    id: 'achievements-group',
    groupTitle: 'THÀNH TÍCH',
    items: [
      {
        id: 'progress',
        path: '/progress',
        label: 'Tiến độ học tập',
        shortLabel: 'Tiến độ',
        icon: TrendingUp,
      },
      {
        id: 'leaderboard',
        path: '/leaderboard',
        label: 'Bảng xếp hạng',
        shortLabel: 'Xếp hạng',
        icon: Trophy,
      },
      {
        id: 'achievements',
        path: '/achievements',
        label: 'Thành tựu & Huy hiệu',
        shortLabel: 'Thành tựu',
        icon: Award,
      },
    ],
  },

  // G. CÁ NHÂN
  {
    id: 'account',
    groupTitle: 'CÁ NHÂN',
    items: [
      {
        id: 'profile',
        path: '/profile',
        label: 'Hồ sơ học viên',
        shortLabel: 'Hồ sơ',
        icon: User,
      },
      {
        id: 'settings',
        path: '/settings',
        label: 'Cài đặt hệ thống',
        shortLabel: 'Cài đặt',
        icon: Settings,
      },
    ],
  },
];
