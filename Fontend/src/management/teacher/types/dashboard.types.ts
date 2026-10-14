import type { ClassSummaryDTO, LocationType } from './class.types';

/**
 * 4 Chỉ số KPI cốt lõi trên Dashboard Giảng Viên
 */
export interface TeacherKPIMetrics {
  activeClassesCount: number;         // Số lớp đang trực tiếp giảng dạy (ACTIVE)
  totalEnrolledStudents: number;      // Tổng số học viên active trong các lớp
  pendingSubmissionsCount: number;    // Số bài tập học viên đã nộp chờ chấm (demo-only)
  weeklyTeachingHours: number;        // Tổng số giờ dạy theo lịch trong tuần
}

/**
 * Buổi dạy sắp diễn ra (Upcoming Session - trong 24h tới 7 ngày)
 */
export interface UpcomingTeachingSession {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  hskLevelName: string;
  hskLevelColor: string;
  dayOfWeekText: string;              // vd: "Hôm nay", "Ngày mai", "Thứ Sáu"
  dateFormatted: string;              // vd: "14/10/2026"
  timeRange: string;                  // vd: "19:00 – 20:30"
  locationType: LocationType;
  meetingUrl?: string;
  roomLocation?: string;
  enrolledStudentsCount: number;
  lessonTopicPreview?: string;        // vd: "Bài 8: Đi siêu thị mua hoa quả"
  isToday: boolean;
}

/**
 * Bài nộp chờ chấm (Bản xem thử Demo-Only cho Phase 1)
 * Lưu ý: Không cài đặt hành động chấm điểm giả.
 */
export interface DemoSubmissionItem {
  id: string;
  assignmentTitle: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl?: string;
  submittedAt: string;
  submittedTimeAgo: string;
  status: 'SUBMITTED' | 'LATE';
  score?: number;
}

/**
 * Nhật ký hoạt động giảng dạy gần đây
 */
export interface RecentClassActivity {
  id: string;
  timestamp: string;
  timeAgo: string;
  type: 'ENROLLMENT' | 'SUBMISSION' | 'SCHEDULE' | 'SYSTEM';
  title: string;
  description: string;
  classId?: string;
}

/**
 * Phím tắt điều hướng nhanh (Quick Actions)
 */
export interface TeacherQuickAction {
  id: string;
  label: string;
  description: string;
  path: string;
  iconName: 'classes' | 'curriculum' | 'questions' | 'submissions';
  badge?: string;
}

/**
 * Toàn bộ dữ liệu tổng hợp cho Teacher Dashboard
 */
export interface TeacherDashboardDTO {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  metrics: TeacherKPIMetrics;
  upcomingSessions: UpcomingTeachingSession[];
  activeClasses: ClassSummaryDTO[];
  pendingSubmissions: DemoSubmissionItem[];
  recentActivities: RecentClassActivity[];
  quickActions: TeacherQuickAction[];
}
