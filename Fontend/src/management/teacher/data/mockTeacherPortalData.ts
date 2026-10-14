import type {
  ClassMember,
  ClassSchedule,
  TeachingClass,
} from '../types/class.types';
import type {
  DemoSubmissionItem,
  RecentClassActivity,
  TeacherQuickAction,
} from '../types/dashboard.types';

/**
 * Danh tính giảng viên đang đăng nhập (Centralized Mock Auth)
 * Trong tương lai, Spring Boot sẽ trích xuất thông tin này từ JWT Security Context.
 */
export const CURRENT_TEACHER_ID = 'tch-001';
export const CURRENT_TEACHER_NAME = 'Thầy Nguyễn Văn A';
export const CURRENT_TEACHER_EMAIL = 'nguyen.vana@zhongwenhub.edu.vn';

/**
 * Danh bạ người dùng học viên (User Store mô phỏng)
 * Độc lập với ClassMember, cung cấp tên/email/avatar cho ClassMemberViewDTO.
 */
export interface MockStudentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export const MOCK_STUDENTS_STORE: MockStudentUser[] = [
  { id: 'usr-st-01', name: 'Trần Thị Thu Thảo', email: 'thuthao.tran@gmail.com', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-st-02', name: 'Lê Hoàng Nam', email: 'nam.lehoang@gmail.com', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-st-03', name: 'Phạm Minh Đức', email: 'duc.pham98@outlook.com', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-st-04', name: 'Nguyễn Bích Ngọc', email: 'ngoc.bich@hotmail.com', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-st-05', name: 'Vũ Quốc Bảo', email: 'baovu.quoc@gmail.com', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-st-06', name: 'Đặng Thanh Hằng', email: 'hang.dang@yahoo.com', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-st-07', name: 'Hoàng Gia Huy', email: 'giahuy.hoang@gmail.com' },
  { id: 'usr-st-08', name: 'Bùi Phương Mai', email: 'mai.buiphuong@gmail.com', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-st-09', name: 'Đỗ Tiến Đạt', email: 'tiendat.do@gmail.com' },
  { id: 'usr-st-10', name: 'Ngô Thùy Trang', email: 'trang.ngothuy@gmail.com', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-st-11', name: 'Dương Tuấn Khang', email: 'khang.duong@gmail.com' },
  { id: 'usr-st-12', name: 'Trịnh Cẩm Tú', email: 'camtu.trinh@gmail.com' },
  { id: 'usr-st-13', name: 'Hồ Quang Dũng', email: 'dung.hoquang@gmail.com' },
  { id: 'usr-st-14', name: 'Mai Khánh Linh', email: 'linh.maikhanh@gmail.com' },
  { id: 'usr-st-15', name: 'Lý Quốc Trung', email: 'trung.ly@gmail.com' },
];

/**
 * Danh sách lớp học ban đầu (TeachingClass)
 * Lưu ý: KHÔNG LƯU currentEnrollmentCount ở đây!
 */
export const INITIAL_TEACHING_CLASSES: TeachingClass[] = [
  {
    id: 'cls-001',
    teacherId: CURRENT_TEACHER_ID,
    name: 'HSK 3 Giao Tiếp Thực Hành - K24',
    code: 'CLS-HSK3-024',
    description: 'Lớp học hội thoại nâng cao theo chuẩn HSK 3.0 kết hợp phản xạ nghe nói và ngữ pháp đời sống.',
    hskLevelId: 'level-hsk-3',
    courseId: 'course-hsk-std',
    status: 'ACTIVE',
    capacity: 25,
    startDate: '2026-09-15',
    endDate: '2026-12-20',
    locationType: 'ONLINE',
    meetingUrl: 'https://zoom.us/j/84920491029',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-10T14:30:00Z',
  },
  {
    id: 'cls-002',
    teacherId: CURRENT_TEACHER_ID,
    name: 'HSK 2 Nền Tảng Căn Bản - K19',
    code: 'CLS-HSK2-019',
    description: 'Xây dựng cấu trúc câu căn bản, phát âm chuẩn thanh điệu và mở rộng 600 chữ Hán thường gặp.',
    hskLevelId: 'level-hsk-2',
    courseId: 'course-hsk-std',
    status: 'ACTIVE',
    capacity: 20,
    startDate: '2026-10-01',
    endDate: '2027-01-15',
    locationType: 'HYBRID',
    meetingUrl: 'https://meet.google.com/xyz-hsk2-k19',
    roomLocation: 'Phòng 302, Tòa nhà ZhongWenHub',
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-10-05T09:15:00Z',
  },
  {
    id: 'cls-003',
    teacherId: CURRENT_TEACHER_ID,
    name: 'HSK 4 Luyện Đọc Hiểu & Ngữ Pháp Chuyên Sâu',
    code: 'CLS-HSK4-008',
    description: 'Phân tích văn bản dài, luyện viết đoạn văn phức hợp và rèn luyện kỹ năng giải đề thi HSK 4.',
    hskLevelId: 'level-hsk-4',
    courseId: 'course-hsk-std',
    status: 'ACTIVE',
    capacity: 15,
    startDate: '2026-08-20',
    endDate: '2026-11-30',
    locationType: 'ONLINE',
    meetingUrl: 'https://zoom.us/j/99201481920',
    createdAt: '2026-08-10T07:30:00Z',
    updatedAt: '2026-10-12T16:00:00Z',
  },
  {
    id: 'cls-004',
    teacherId: CURRENT_TEACHER_ID,
    name: 'HSK 1 Khởi Đầu Nhập Môn - K30',
    code: 'CLS-HSK1-030',
    description: 'Khóa học dành cho người mới bắt đầu từ con số 0: bảng chữ cái Pinyin, nét viết bút thuận và 150 từ vựng.',
    hskLevelId: 'level-hsk-1',
    courseId: 'course-comm-fast',
    status: 'UPCOMING',
    capacity: 30,
    startDate: '2026-11-01',
    endDate: '2027-01-30',
    locationType: 'ONLINE',
    meetingUrl: 'https://zoom.us/j/12389104829',
    createdAt: '2026-10-08T11:00:00Z',
    updatedAt: '2026-10-08T11:00:00Z',
  },
  {
    id: 'cls-005',
    teacherId: CURRENT_TEACHER_ID,
    name: 'HSK 7–9 Nghiên Cứu & Dịch Thuật Nâng Cao',
    code: 'CLS-HSK79-002',
    description: 'Chuyên đề dịch thuật tài liệu thương mại, văn hóa, cổ văn và thuật ngữ chuyên ngành HSK 7-9.',
    hskLevelId: 'level-hsk-79',
    status: 'DRAFT',
    capacity: 12,
    startDate: '2026-12-01',
    locationType: 'OFFLINE',
    roomLocation: 'Phòng Hội thảo 501',
    createdAt: '2026-10-12T09:00:00Z',
    updatedAt: '2026-10-12T09:00:00Z',
  },
  {
    id: 'cls-006',
    teacherId: CURRENT_TEACHER_ID,
    name: 'HSK 3 Khóa Mùa Hè 2026',
    code: 'CLS-HSK3-018',
    description: 'Lớp học HSK 3 đã hoàn thành khóa giảng dạy vào tháng 8/2026.',
    hskLevelId: 'level-hsk-3',
    status: 'COMPLETED',
    capacity: 20,
    startDate: '2026-05-10',
    endDate: '2026-08-25',
    locationType: 'ONLINE',
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-08-26T17:00:00Z',
  },
  {
    id: 'cls-007',
    teacherId: CURRENT_TEACHER_ID,
    name: 'HSK 2 Khóa Thử Nghiệm 2025',
    code: 'CLS-HSK2-001',
    description: 'Lớp thử nghiệm giáo trình mới, đã lưu trữ.',
    hskLevelId: 'level-hsk-2',
    status: 'ARCHIVED',
    capacity: 15,
    startDate: '2025-11-01',
    endDate: '2026-02-15',
    locationType: 'OFFLINE',
    createdAt: '2025-10-15T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

/**
 * Danh sách thành viên lớp ban đầu (ClassMember)
 * Sĩ số lớp = số bản ghi có classId tương ứng và status === 'ACTIVE'.
 */
export const INITIAL_CLASS_MEMBERS: ClassMember[] = [
  // Lớp CLS-HSK3-024 (cls-001): 8 học viên active
  { id: 'mb-01', classId: 'cls-001', studentId: 'usr-st-01', enrolledAt: '2026-09-10T10:00:00Z', status: 'ACTIVE', attendanceRate: 95, completedAssignmentsCount: 7 },
  { id: 'mb-02', classId: 'cls-001', studentId: 'usr-st-02', enrolledAt: '2026-09-11T14:20:00Z', status: 'ACTIVE', attendanceRate: 88, completedAssignmentsCount: 6 },
  { id: 'mb-03', classId: 'cls-001', studentId: 'usr-st-03', enrolledAt: '2026-09-11T16:00:00Z', status: 'ACTIVE', attendanceRate: 100, completedAssignmentsCount: 8 },
  { id: 'mb-04', classId: 'cls-001', studentId: 'usr-st-04', enrolledAt: '2026-09-12T09:30:00Z', status: 'ACTIVE', attendanceRate: 92, completedAssignmentsCount: 7 },
  { id: 'mb-05', classId: 'cls-001', studentId: 'usr-st-05', enrolledAt: '2026-09-12T11:00:00Z', status: 'ACTIVE', attendanceRate: 75, completedAssignmentsCount: 4 },
  { id: 'mb-06', classId: 'cls-001', studentId: 'usr-st-06', enrolledAt: '2026-09-13T08:45:00Z', status: 'ACTIVE', attendanceRate: 90, completedAssignmentsCount: 7 },
  { id: 'mb-07', classId: 'cls-001', studentId: 'usr-st-07', enrolledAt: '2026-09-14T13:10:00Z', status: 'ACTIVE', attendanceRate: 85, completedAssignmentsCount: 5 },
  { id: 'mb-08', classId: 'cls-001', studentId: 'usr-st-08', enrolledAt: '2026-09-14T15:30:00Z', status: 'ACTIVE', attendanceRate: 92, completedAssignmentsCount: 6 },
  { id: 'mb-09', classId: 'cls-001', studentId: 'usr-st-09', enrolledAt: '2026-09-15T09:00:00Z', status: 'PAUSED', attendanceRate: 50, completedAssignmentsCount: 2, notes: 'Xin bảo lưu 2 tuần vì lý do công tác' },

  // Lớp CLS-HSK2-019 (cls-002): 5 học viên active
  { id: 'mb-10', classId: 'cls-002', studentId: 'usr-st-10', enrolledAt: '2026-09-25T10:00:00Z', status: 'ACTIVE', attendanceRate: 100, completedAssignmentsCount: 4 },
  { id: 'mb-11', classId: 'cls-002', studentId: 'usr-st-11', enrolledAt: '2026-09-26T11:20:00Z', status: 'ACTIVE', attendanceRate: 90, completedAssignmentsCount: 4 },
  { id: 'mb-12', classId: 'cls-002', studentId: 'usr-st-12', enrolledAt: '2026-09-27T08:40:00Z', status: 'ACTIVE', attendanceRate: 80, completedAssignmentsCount: 3 },
  { id: 'mb-13', classId: 'cls-002', studentId: 'usr-st-13', enrolledAt: '2026-09-28T14:15:00Z', status: 'ACTIVE', attendanceRate: 95, completedAssignmentsCount: 4 },
  { id: 'mb-14', classId: 'cls-002', studentId: 'usr-st-14', enrolledAt: '2026-09-29T16:00:00Z', status: 'ACTIVE', attendanceRate: 85, completedAssignmentsCount: 3 },

  // Lớp CLS-HSK4-008 (cls-003): 3 học viên active
  { id: 'mb-15', classId: 'cls-003', studentId: 'usr-st-01', enrolledAt: '2026-08-15T09:00:00Z', status: 'ACTIVE', attendanceRate: 92, completedAssignmentsCount: 9 },
  { id: 'mb-16', classId: 'cls-003', studentId: 'usr-st-03', enrolledAt: '2026-08-16T10:30:00Z', status: 'ACTIVE', attendanceRate: 96, completedAssignmentsCount: 10 },
  { id: 'mb-17', classId: 'cls-003', studentId: 'usr-st-15', enrolledAt: '2026-08-18T14:00:00Z', status: 'ACTIVE', attendanceRate: 88, completedAssignmentsCount: 8 },
];

/**
 * Danh sách thời khóa biểu các lớp (ClassSchedule)
 */
export const INITIAL_CLASS_SCHEDULES: ClassSchedule[] = [
  // Lớp HSK 3 (cls-001): T3, T5, T7 (19:00 - 20:30) Online
  { id: 'sch-01', classId: 'cls-001', dayOfWeek: 'TUESDAY', startTime: '19:00', endTime: '20:30', timezone: 'Asia/Ho_Chi_Minh', locationType: 'ONLINE', meetingUrl: 'https://zoom.us/j/84920491029' },
  { id: 'sch-02', classId: 'cls-001', dayOfWeek: 'THURSDAY', startTime: '19:00', endTime: '20:30', timezone: 'Asia/Ho_Chi_Minh', locationType: 'ONLINE', meetingUrl: 'https://zoom.us/j/84920491029' },
  { id: 'sch-03', classId: 'cls-001', dayOfWeek: 'SATURDAY', startTime: '19:00', endTime: '20:30', timezone: 'Asia/Ho_Chi_Minh', locationType: 'ONLINE', meetingUrl: 'https://zoom.us/j/84920491029' },

  // Lớp HSK 2 (cls-002): T2, T4, T6 (08:30 - 10:00) Hybrid
  { id: 'sch-04', classId: 'cls-002', dayOfWeek: 'MONDAY', startTime: '08:30', endTime: '10:00', timezone: 'Asia/Ho_Chi_Minh', locationType: 'HYBRID', meetingUrl: 'https://meet.google.com/xyz-hsk2-k19', roomLocation: 'Phòng 302' },
  { id: 'sch-05', classId: 'cls-002', dayOfWeek: 'WEDNESDAY', startTime: '08:30', endTime: '10:00', timezone: 'Asia/Ho_Chi_Minh', locationType: 'HYBRID', meetingUrl: 'https://meet.google.com/xyz-hsk2-k19', roomLocation: 'Phòng 302' },
  { id: 'sch-06', classId: 'cls-002', dayOfWeek: 'FRIDAY', startTime: '08:30', endTime: '10:00', timezone: 'Asia/Ho_Chi_Minh', locationType: 'HYBRID', meetingUrl: 'https://meet.google.com/xyz-hsk2-k19', roomLocation: 'Phòng 302' },

  // Lớp HSK 4 (cls-003): Thứ 7 & Chủ Nhật (14:00 - 16:00) Online
  { id: 'sch-07', classId: 'cls-003', dayOfWeek: 'SATURDAY', startTime: '14:00', endTime: '16:00', timezone: 'Asia/Ho_Chi_Minh', locationType: 'ONLINE', meetingUrl: 'https://zoom.us/j/99201481920' },
  { id: 'sch-08', classId: 'cls-003', dayOfWeek: 'SUNDAY', startTime: '14:00', endTime: '16:00', timezone: 'Asia/Ho_Chi_Minh', locationType: 'ONLINE', meetingUrl: 'https://zoom.us/j/99201481920' },
];

/**
 * Danh sách bài nộp chờ chấm (Bản xem thử Demo-Only cho Phase 1)
 */
export const INITIAL_DEMO_SUBMISSIONS: DemoSubmissionItem[] = [
  {
    id: 'sub-01',
    assignmentTitle: 'Bài tập 8: Đặt câu với 把 và 被',
    classId: 'cls-001',
    className: 'HSK 3 Giao Tiếp Thực Hành - K24',
    studentId: 'usr-st-01',
    studentName: 'Trần Thị Thu Thảo',
    studentAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    submittedAt: '2026-10-14T14:25:00Z',
    submittedTimeAgo: '1 giờ trước',
    status: 'SUBMITTED',
  },
  {
    id: 'sub-02',
    assignmentTitle: 'Đoạn văn tự giới thiệu bản thân 150 chữ',
    classId: 'cls-002',
    className: 'HSK 2 Nền Tảng Căn Bản - K19',
    studentId: 'usr-st-10',
    studentName: 'Ngô Thùy Trang',
    studentAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    submittedAt: '2026-10-14T11:10:00Z',
    submittedTimeAgo: '4 giờ trước',
    status: 'SUBMITTED',
  },
  {
    id: 'sub-03',
    assignmentTitle: 'Luyện dịch đoạn văn kinh tế HSK 4',
    classId: 'cls-003',
    className: 'HSK 4 Luyện Đọc Hiểu & Ngữ Pháp Chuyên Sâu',
    studentId: 'usr-st-03',
    studentName: 'Phạm Minh Đức',
    studentAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    submittedAt: '2026-10-13T20:30:00Z',
    submittedTimeAgo: 'Hôm qua',
    status: 'SUBMITTED',
  },
  {
    id: 'sub-04',
    assignmentTitle: 'Ghi âm phát âm 20 từ vựng Unit 4',
    classId: 'cls-001',
    className: 'HSK 3 Giao Tiếp Thực Hành - K24',
    studentId: 'usr-st-04',
    studentName: 'Nguyễn Bích Ngọc',
    studentAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    submittedAt: '2026-10-13T16:00:00Z',
    submittedTimeAgo: 'Hôm qua',
    status: 'LATE',
  },
];

/**
 * Nhật ký hoạt động gần đây
 */
export const INITIAL_RECENT_ACTIVITIES: RecentClassActivity[] = [
  {
    id: 'act-01',
    timestamp: '2026-10-14T14:25:00Z',
    timeAgo: '1 giờ trước',
    type: 'SUBMISSION',
    title: 'Bài nộp mới',
    description: 'Học viên Trần Thị Thu Thảo đã nộp Bài tập 8 (HSK 3 K24)',
    classId: 'cls-001',
  },
  {
    id: 'act-02',
    timestamp: '2026-10-14T09:00:00Z',
    timeAgo: '6 giờ trước',
    type: 'ENROLLMENT',
    title: 'Học viên ghi danh',
    description: 'Bùi Phương Mai đã hoàn tất đăng ký vào lớp HSK 3 - K24',
    classId: 'cls-001',
  },
  {
    id: 'act-03',
    timestamp: '2026-10-13T18:00:00Z',
    timeAgo: 'Hôm qua',
    type: 'SCHEDULE',
    title: 'Hoàn thành buổi dạy',
    description: 'Buổi học HSK 2 Căn Bản (08:30–10:00) diễn ra thành công',
    classId: 'cls-002',
  },
  {
    id: 'act-04',
    timestamp: '2026-10-12T16:00:00Z',
    timeAgo: '2 ngày trước',
    type: 'SYSTEM',
    title: 'Cập nhật phòng học',
    description: 'Đã cập nhật link Google Meet phòng học cho lớp HSK 2 - K19',
    classId: 'cls-002',
  },
];

/**
 * Phím tắt thao tác nhanh cho Giảng viên
 */
export const INITIAL_QUICK_ACTIONS: TeacherQuickAction[] = [
  {
    id: 'qa-classes',
    label: 'Lớp của tôi',
    description: 'Xem toàn bộ 4 lớp đang giảng dạy',
    path: '/management/teacher/classes',
    iconName: 'classes',
  },
  {
    id: 'qa-curriculum',
    label: 'Kho giáo trình HSK',
    description: 'Tra cứu chuẩn HSK 3.0 & bài học',
    path: '/management/admin/curriculum',
    iconName: 'curriculum',
  },
  {
    id: 'qa-questions',
    label: 'Ngân hàng đề thi',
    description: 'Khám phá câu hỏi & bài tập chuẩn',
    path: '/management/admin/hsk-repository',
    iconName: 'questions',
  },
  {
    id: 'qa-submissions',
    label: 'Hàng đợi bài nộp',
    description: '14 bài tập học viên đang chờ chấm',
    path: '/management/teacher/classes',
    iconName: 'submissions',
    badge: '14 mới',
  },
];
