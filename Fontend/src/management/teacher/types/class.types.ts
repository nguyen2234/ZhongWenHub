import type { HskLevel } from '../../admin/content/types';
import type { Course } from '../../admin/content/types';

/**
 * Trạng thái vòng đời của lớp học giảng dạy
 * Độc lập hoàn toàn với TeacherAccountStatus của Admin.
 */
export type ClassLifecycleStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

/**
 * Trạng thái thành viên trong lớp học
 * Độc lập với UserStatus của hệ thống tài khoản.
 */
export type ClassMemberStatus = 'ACTIVE' | 'PAUSED' | 'DROPPED' | 'COMPLETED';

/**
 * Các ngày trong tuần
 */
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, { short: string; full: string }> = {
  MONDAY: { short: 'T2', full: 'Thứ Hai' },
  TUESDAY: { short: 'T3', full: 'Thứ Ba' },
  WEDNESDAY: { short: 'T4', full: 'Thứ Tư' },
  THURSDAY: { short: 'T5', full: 'Thứ Năm' },
  FRIDAY: { short: 'T6', full: 'Thứ Sáu' },
  SATURDAY: { short: 'T7', full: 'Thứ Bảy' },
  SUNDAY: { short: 'CN', full: 'Chủ Nhật' },
};

/**
 * Hình thức đào tạo
 */
export type LocationType = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ONLINE: 'Trực tuyến (Online)',
  OFFLINE: 'Trực tiếp tại lớp (Offline)',
  HYBRID: 'Kết hợp (Hybrid)',
};

/**
 * Thực thể Lớp Giảng Dạy (TeachingClass)
 * Lưu ý kiến trúc bắt buộc: KHÔNG lưu currentEnrollmentCount trong TeachingClass.
 * Sĩ số thực tế phải được tính toán động (derived) từ các bản ghi ClassMember active.
 */
export interface TeachingClass {
  id: string;
  teacherId: string;               // ID giáo viên phụ trách (Data Ownership)
  name: string;                    // Tên lớp (vd: "HSK 3 Giao Tiếp Thực Hành - K24")
  code: string;                    // Mã lớp duy nhất (vd: "CLS-HSK3-024")
  description: string;
  hskLevelId: string;              // Khóa ngoại trỏ đến HskLevel.id (từ HSK Repository)
  courseId?: string;               // Khóa ngoại trỏ đến Course.id (từ Curriculum, tùy chọn)
  status: ClassLifecycleStatus;
  capacity: number;                // Sĩ số tối đa
  startDate: string;               // Ngày khai giảng (YYYY-MM-DD)
  endDate?: string;                // Ngày bế giảng dự kiến (YYYY-MM-DD)
  locationType: LocationType;
  meetingUrl?: string;             // Link lớp học trực tuyến mặc định (Zoom/Google Meet)
  roomLocation?: string;           // Phòng học thực tế (nếu là Offline/Hybrid)
  createdAt: string;
  updatedAt: string;
}

/**
 * Thực thể Thành Viên Lớp Học (ClassMember)
 * Lưu ý kiến trúc bắt buộc: Thông tin họ tên/email/avatar thuộc về User.
 * ClassMember chỉ lưu khóa ngoại và trạng thái tham gia.
 */
export interface ClassMember {
  id: string;
  classId: string;
  studentId: string;               // Khóa ngoại trỏ đến ID người dùng
  enrolledAt: string;              // Ngày ghi danh vào lớp (ISO 8601)
  status: ClassMemberStatus;
  attendanceRate: number;          // Tỷ lệ tham gia các buổi học (%)
  completedAssignmentsCount: number; // Số bài tập đã nộp
  notes?: string;
}

/**
 * Thực thể Lịch Học Tuần Của Lớp (ClassSchedule)
 */
export interface ClassSchedule {
  id: string;
  classId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;               // Format "HH:mm" (vd: "19:00")
  endTime: string;                 // Format "HH:mm" (vd: "20:30")
  timezone: string;                // Mặc định "Asia/Ho_Chi_Minh"
  locationType: LocationType;
  meetingUrl?: string;
  roomLocation?: string;
}

/* ==========================================================================
   TRANSPORT DTOs (Data Transfer Objects)
   ========================================================================== */

/**
 * ClassSummaryDTO: Dữ liệu tóm tắt cho màn hình danh sách lớp
 */
export interface ClassSummaryDTO {
  id: string;
  name: string;
  code: string;
  description: string;
  hskLevelId: string;
  hskLevelName: string;
  hskLevelColor: string;
  courseId?: string;
  courseName?: string;
  status: ClassLifecycleStatus;
  capacity: number;
  derivedEnrollmentCount: number;  // Tính động từ ClassMember active
  startDate: string;
  endDate?: string;
  locationType: LocationType;
  meetingUrl?: string;
  roomLocation?: string;
  schedulesSummary: string;        // vd: "T3, T5, T7 (19:00–20:30)"
  nextSessionText?: string;        // vd: "Hôm nay, 19:00"
}

/**
 * ClassDetailDTO: Dữ liệu chi tiết đầy đủ của một lớp học
 */
export interface ClassDetailDTO {
  classInfo: TeachingClass;
  hskLevel?: HskLevel;
  course?: Course;
  derivedEnrollmentCount: number;
  derivedAttendanceAverage: number;
  schedules: ClassSchedule[];
  membersSummary: {
    total: number;
    active: number;
    paused: number;
    dropped: number;
  };
}

/**
 * ClassMemberViewDTO: View DTO hiển thị danh sách học viên trong lớp
 * Kết hợp thông tin ClassMember và hồ sơ Student User
 */
export interface ClassMemberViewDTO {
  id: string;                      // ClassMember.id
  classId: string;
  studentId: string;               // User.id
  studentName: string;
  studentEmail: string;
  studentAvatarUrl?: string;
  enrolledAt: string;
  status: ClassMemberStatus;
  attendanceRate: number;
  completedAssignmentsCount: number;
  notes?: string;
}

/**
 * DTO Tạo Lớp Học Mới
 */
export interface CreateTeachingClassDTO {
  name: string;
  code: string;
  description: string;
  hskLevelId: string;
  courseId?: string;
  capacity: number;
  startDate: string;
  endDate?: string;
  locationType: LocationType;
  meetingUrl?: string;
  roomLocation?: string;
  schedules: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    locationType: LocationType;
    meetingUrl?: string;
    roomLocation?: string;
  }>;
}

/**
 * DTO Cập Nhật Lớp Học (Không cho phép đổi teacherId)
 */
export interface UpdateTeachingClassDTO {
  name: string;
  description: string;
  hskLevelId: string;
  courseId?: string;
  capacity: number;
  startDate: string;
  endDate?: string;
  locationType: LocationType;
  meetingUrl?: string;
  roomLocation?: string;
  status?: ClassLifecycleStatus;
  schedules: Array<{
    id?: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    locationType: LocationType;
    meetingUrl?: string;
    roomLocation?: string;
  }>;
}

/**
 * Bộ lọc danh sách lớp học
 */
export interface ClassFilters {
  search: string;
  hskLevelId: 'ALL' | string;
  status: 'ALL' | ClassLifecycleStatus;
  locationType: 'ALL' | LocationType;
}

export type ClassSortField = 'name' | 'code' | 'startDate' | 'enrollment' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface ClassSort {
  field: ClassSortField;
  direction: SortDirection;
}
