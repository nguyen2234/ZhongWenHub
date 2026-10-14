export type { PaginatedResponse } from '../../../shared/types';

// 1. Account Status (Independently controls system access)
export type SupportAccountStatus = 'ACTIVE' | 'PENDING' | 'LOCKED' | 'INACTIVE';

// 2. Work Status (Independently controls current availability for support)
export type SupportWorkStatus = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY' | 'ON_LEAVE';

// 3. Support Scopes (Data-driven, single shared source of config)
export const SUPPORT_SCOPES = [
  'ACCOUNT',
  'LEARNING',
  'TECHNICAL',
  'PAYMENT',
  'CONTENT_REPORT',
] as const;

export type SupportScope = (typeof SUPPORT_SCOPES)[number];
export const ALL_SUPPORT_SCOPES = SUPPORT_SCOPES;

export const SUPPORT_SCOPE_META: Record<
  SupportScope,
  { label: string; shortLabel: string; description: string }
> = {
  ACCOUNT: {
    label: 'Tài khoản & Đăng nhập',
    shortLabel: 'Tài khoản',
    description: 'Xác thực tài khoản, mật khẩu, đăng nhập, bảo mật 2 lớp',
  },
  LEARNING: {
    label: 'Học tập & Bài học',
    shortLabel: 'Học tập',
    description: 'Nội dung bài học, ngữ pháp, bài tập, phát âm, lỗi học phần',
  },
  TECHNICAL: {
    label: 'Kỹ thuật & Hệ thống',
    shortLabel: 'Kỹ thuật',
    description: 'Lỗi tải trang, hiển thị giao diện, âm thanh, app mobile',
  },
  PAYMENT: {
    label: 'Thanh toán & Hội viên',
    shortLabel: 'Thanh toán',
    description: 'Gói Pro/VIP, giao dịch, hóa đơn, hoàn tiền, kích hoạt khóa',
  },
  CONTENT_REPORT: {
    label: 'Báo cáo vi phạm nội dung',
    shortLabel: 'Báo cáo vi phạm',
    description: 'Khiếu nại bình luận, dịch thuật sai, nội dung không phù hợp',
  },
};

// 4. Shifts (Data-driven, single shared source of config)
export const SUPPORT_SHIFTS = ['MORNING', 'AFTERNOON', 'EVENING', 'FLEXIBLE'] as const;

export type SupportShift = (typeof SUPPORT_SHIFTS)[number];
export const ALL_SUPPORT_SHIFTS = SUPPORT_SHIFTS;

export const SUPPORT_SHIFT_META: Record<
  SupportShift,
  { label: string; shortLabel: string; timeRange: string }
> = {
  MORNING: {
    label: 'Ca sáng (08:00 – 12:00)',
    shortLabel: 'Ca sáng',
    timeRange: '08:00 – 12:00',
  },
  AFTERNOON: {
    label: 'Ca chiều (13:30 – 17:30)',
    shortLabel: 'Ca chiều',
    timeRange: '13:30 – 17:30',
  },
  EVENING: {
    label: 'Ca tối (18:30 – 22:30)',
    shortLabel: 'Ca tối',
    timeRange: '18:30 – 22:30',
  },
  FLEXIBLE: {
    label: 'Ca linh hoạt / Xoay ca',
    shortLabel: 'Linh hoạt',
    timeRange: 'Theo phân công tuần',
  },
};

// 5. Workload & Performance Metrics (READ-ONLY)
export interface SupportPerformanceKPIs {
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResponseTime: string; // e.g. "4.2 phút"
  resolutionRate: string; // e.g. "96.5%"
}

// 6. Recent Activity
export interface SupportStaffActivity {
  id: string;
  actionText: string;
  targetName: string;
  timeAgo: string;
  timestamp: string;
}

// 7. Full Support Staff Detail Entity
export interface SupportStaffDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  accountStatus: SupportAccountStatus;
  workStatus: SupportWorkStatus;
  supportScopes: SupportScope[];
  shift: SupportShift;
  joinedAt: string;
  joinedDateRaw: string;
  lastActiveAt: string;
  lastActiveDateRaw: string;
  notes?: string;
  performance: SupportPerformanceKPIs;
  recentActivities: SupportStaffActivity[];
}

// 8. Compact Table / List Item
export interface SupportStaffListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  accountStatus: SupportAccountStatus;
  workStatus: SupportWorkStatus;
  supportScopes: SupportScope[];
  shift: SupportShift;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  lastActiveAt: string;
  lastActiveDateRaw: string;
}

// 9. Filters & Sorting
export interface SupportStaffFilters {
  search: string;
  accountStatus: 'ALL' | SupportAccountStatus;
  workStatus: 'ALL' | SupportWorkStatus;
  supportScope: 'ALL' | SupportScope;
  shift: 'ALL' | SupportShift;
}

export type SupportStaffSortField =
  | 'name'
  | 'joinedDate'
  | 'lastActive'
  | 'openTickets'
  | 'resolvedTickets';

export interface SupportStaffSort {
  field: SupportStaffSortField;
  direction: 'asc' | 'desc';
}

// 10. Summary KPIs for top strip
export interface SupportStaffSummaryKPIs {
  totalStaff: number;
  availableStaff: number;
  busyStaff: number;
  totalOpenTickets: number;
}

// 11. DTOs
export interface CreateSupportStaffDTO {
  name: string;
  email: string;
  phone: string;
  supportScopes: SupportScope[];
  shift: SupportShift;
  initialWorkStatus: SupportWorkStatus;
}

export interface UpdateSupportStaffDTO {
  name: string;
  email: string;
  phone: string;
  supportScopes: SupportScope[];
  shift: SupportShift;
  notes?: string;
}
