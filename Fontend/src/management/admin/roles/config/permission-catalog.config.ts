import type { PermissionDefinition, PermissionModuleGroup } from '../types/role-permission.types';

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  // 1. Quản lý người dùng
  {
    code: 'USER_VIEW',
    name: 'Xem người dùng',
    description: 'Xem danh sách và chi tiết tài khoản học viên, người dùng trong hệ thống',
    module: 'USER_MANAGEMENT',
  },
  {
    code: 'USER_CREATE',
    name: 'Tạo người dùng',
    description: 'Thêm tài khoản người dùng hoặc học viên mới thủ công',
    module: 'USER_MANAGEMENT',
  },
  {
    code: 'USER_UPDATE',
    name: 'Cập nhật người dùng',
    description: 'Chỉnh sửa thông tin hồ sơ, trạng thái kích hoạt tài khoản',
    module: 'USER_MANAGEMENT',
  },
  {
    code: 'USER_LOCK',
    name: 'Khóa người dùng',
    description: 'Đình chỉ hoặc khóa tạm thời tài khoản vi phạm chính sách',
    module: 'USER_MANAGEMENT',
  },

  // 2. Quản lý giáo viên
  {
    code: 'TEACHER_VIEW',
    name: 'Xem giáo viên',
    description: 'Xem hồ sơ giảng dạy, danh sách lớp học và bằng cấp của giáo viên',
    module: 'TEACHER_MANAGEMENT',
  },
  {
    code: 'TEACHER_CREATE',
    name: 'Tạo giáo viên',
    description: 'Tiếp nhận và khởi tạo tài khoản giáo viên mới',
    module: 'TEACHER_MANAGEMENT',
  },
  {
    code: 'TEACHER_UPDATE',
    name: 'Cập nhật giáo viên',
    description: 'Sửa thông tin chuyên môn, trình độ HSK phụ trách',
    module: 'TEACHER_MANAGEMENT',
  },
  {
    code: 'TEACHER_LOCK',
    name: 'Khóa giáo viên',
    description: 'Tạm ngưng quyền truy cập giảng dạy của giáo viên',
    module: 'TEACHER_MANAGEMENT',
  },

  // 3. Nhân viên hỗ trợ
  {
    code: 'SUPPORT_STAFF_VIEW',
    name: 'Xem nhân viên hỗ trợ',
    description: 'Xem danh sách đội ngũ hỗ trợ viên, ca trực và hiệu suất',
    module: 'SUPPORT_STAFF',
  },
  {
    code: 'SUPPORT_STAFF_CREATE',
    name: 'Tạo nhân viên hỗ trợ',
    description: 'Tạo hồ sơ và phân công ca trực cho nhân viên hỗ trợ',
    module: 'SUPPORT_STAFF',
  },
  {
    code: 'SUPPORT_STAFF_UPDATE',
    name: 'Cập nhật nhân viên hỗ trợ',
    description: 'Điều chỉnh phạm vi hỗ trợ và thông tin liên hệ',
    module: 'SUPPORT_STAFF',
  },
  {
    code: 'SUPPORT_STAFF_LOCK',
    name: 'Khóa nhân viên hỗ trợ',
    description: 'Tạm dừng hoạt động tiếp nhận hỗ trợ của nhân viên',
    module: 'SUPPORT_STAFF',
  },

  // 4. Nội dung học tập
  {
    code: 'CONTENT_VIEW',
    name: 'Xem nội dung',
    description: 'Truy cập thư viện bài học, chữ Hán, ngữ pháp, bài khóa',
    module: 'LEARNING_CONTENT',
  },
  {
    code: 'CONTENT_CREATE',
    name: 'Tạo nội dung',
    description: 'Soạn thảo và đăng tải bài học, học liệu mới',
    module: 'LEARNING_CONTENT',
  },
  {
    code: 'CONTENT_UPDATE',
    name: 'Cập nhật nội dung',
    description: 'Chỉnh sửa ngữ pháp, phiên âm Pinyin, âm thanh và ví dụ bài học',
    module: 'LEARNING_CONTENT',
  },
  {
    code: 'CONTENT_DELETE',
    name: 'Xóa nội dung',
    description: 'Xóa bài học hoặc tài liệu học tập khỏi hệ thống',
    module: 'LEARNING_CONTENT',
  },
  {
    code: 'CONTENT_APPROVE',
    name: 'Phê duyệt nội dung',
    description: 'Duyệt bài học do giáo viên soạn trước khi công khai cho học viên',
    module: 'LEARNING_CONTENT',
  },
  {
    code: 'CONTENT_PUBLISH',
    name: 'Xuất bản nội dung',
    description: 'Phát hành chính thức học liệu, bài học và ngữ pháp lên nền tảng',
    module: 'LEARNING_CONTENT',
  },
  {
    code: 'CONTENT_ARCHIVE',
    name: 'Lưu trữ / Thu hồi nội dung',
    description: 'Thu hồi bài giảng đã xuất bản về trạng thái lưu trữ hoặc nháp',
    module: 'LEARNING_CONTENT',
  },
  {
    code: 'CONTENT_RESTORE',
    name: 'Khôi phục nội dung',
    description: 'Khôi phục phiên bản học liệu từ lịch sử lưu trữ',
    module: 'LEARNING_CONTENT',
  },
  {
    code: 'CONTENT_AUDIT_VIEW',
    name: 'Xem lịch sử phiên bản',
    description: 'Truy xuất toàn bộ audit log, lịch sử sửa đổi và snapshot phiên bản',
    module: 'LEARNING_CONTENT',
  },

  // 5. Ngân hàng câu hỏi
  {
    code: 'QUESTION_BANK_VIEW',
    name: 'Xem ngân hàng câu hỏi',
    description: 'Xem kho đề trắc nghiệm, bài tập luyện nghe và bài tập dịch',
    module: 'QUESTION_BANK',
  },
  {
    code: 'QUESTION_BANK_CREATE',
    name: 'Tạo câu hỏi',
    description: 'Thêm câu hỏi mới theo các định dạng HSK 1 - HSK 6',
    module: 'QUESTION_BANK',
  },
  {
    code: 'QUESTION_BANK_UPDATE',
    name: 'Cập nhật câu hỏi',
    description: 'Sửa đáp án, giải thích chi tiết và audio của câu hỏi',
    module: 'QUESTION_BANK',
  },

  // 6. Bài tập & Đánh giá
  {
    code: 'ASSIGNMENT_VIEW',
    name: 'Xem bài tập',
    description: 'Xem danh sách bài tập đã giao và danh sách bài nộp',
    module: 'ASSIGNMENTS',
  },
  {
    code: 'ASSIGNMENT_CREATE',
    name: 'Tạo bài tập',
    description: 'Tạo bài luyện tập và giao hạn nộp cho lớp học',
    module: 'ASSIGNMENTS',
  },
  {
    code: 'ASSIGNMENT_GRADE',
    name: 'Chấm điểm & Nhận xét',
    description: 'Chấm điểm bài nộp, sửa phát âm và ghi chú phản hồi học viên',
    module: 'ASSIGNMENTS',
  },

  // 7. Vé hỗ trợ & Yêu cầu
  {
    code: 'TICKET_VIEW',
    name: 'Xem vé hỗ trợ',
    description: 'Xem các ticket yêu cầu trợ giúp kỹ thuật hoặc giải đáp học tập',
    module: 'SUPPORT_TICKETS',
  },
  {
    code: 'TICKET_ASSIGN',
    name: 'Phân công vé',
    description: 'Điều phối ticket cho nhân viên trực theo chuyên môn',
    module: 'SUPPORT_TICKETS',
  },
  {
    code: 'TICKET_REPLY',
    name: 'Phản hồi vé',
    description: 'Gửi câu trả lời, trao đổi và hướng dẫn người dùng',
    module: 'SUPPORT_TICKETS',
  },
  {
    code: 'TICKET_CLOSE',
    name: 'Đóng vé hỗ trợ',
    description: 'Đánh dấu hoàn thành và đóng phiên hỗ trợ',
    module: 'SUPPORT_TICKETS',
  },
  {
    code: 'CONTENT_ISSUE_VIEW',
    name: 'Xem báo cáo lỗi học liệu',
    description: 'Tiếp nhận và theo dõi các báo cáo lỗi nội dung được Support chuyển lên',
    module: 'SUPPORT_TICKETS',
  },
  {
    code: 'CONTENT_ISSUE_ASSIGN',
    name: 'Phân công xử lý lỗi học liệu',
    description: 'Chỉ định Content Manager phụ trách xử lý báo cáo lỗi nội dung',
    module: 'SUPPORT_TICKETS',
  },
  {
    code: 'CONTENT_ISSUE_RESOLVE',
    name: 'Xử lý báo cáo lỗi học liệu',
    description: 'Chỉnh sửa, xuất bản bản vá và gửi phản hồi kết quả về Support',
    module: 'SUPPORT_TICKETS',
  },

  // 8. Báo cáo & Thống kê
  {
    code: 'REPORT_VIEW',
    name: 'Xem báo cáo',
    description: 'Xem báo cáo tăng trưởng người dùng, tỷ lệ hoàn thành bài học',
    module: 'REPORTS',
  },
  {
    code: 'CONTENT_REPORT_VIEW',
    name: 'Xem thống kê chất lượng học liệu',
    description: 'Theo dõi chỉ số chất lượng, độ chuẩn hóa và tỷ lệ lỗi học liệu',
    module: 'REPORTS',
  },

  // 9. Hệ thống
  {
    code: 'SYSTEM_SETTINGS_VIEW',
    name: 'Xem cấu hình hệ thống',
    description: 'Xem thông số vận hành nền tảng, tích hợp AI và thông báo',
    module: 'SYSTEM',
  },
  {
    code: 'SYSTEM_SETTINGS_UPDATE',
    name: 'Cập nhật cấu hình',
    description: 'Thay đổi tham số cấu hình chung của toàn hệ thống',
    module: 'SYSTEM',
  },
  {
    code: 'ROLE_PERMISSION_MANAGE',
    name: 'Quản lý vai trò & quyền',
    description: 'Cấu hình và phân quyền thao tác cho từng nhóm vai trò',
    module: 'SYSTEM',
  },
];

export const PERMISSION_MODULE_GROUPS: PermissionModuleGroup[] = [
  {
    id: 'USER_MANAGEMENT',
    name: 'Quản lý người dùng',
    description: 'Tài khoản người dùng và học viên nền tảng',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'USER_MANAGEMENT'),
  },
  {
    id: 'TEACHER_MANAGEMENT',
    name: 'Quản lý giáo viên',
    description: 'Hồ sơ, bằng cấp và phân công giáo viên',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'TEACHER_MANAGEMENT'),
  },
  {
    id: 'SUPPORT_STAFF',
    name: 'Nhân viên hỗ trợ',
    description: 'Đội ngũ trực hỗ trợ học viên và kỹ thuật',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'SUPPORT_STAFF'),
  },
  {
    id: 'LEARNING_CONTENT',
    name: 'Nội dung học tập',
    description: 'Kho bài giảng, chữ Hán, từ vựng và ngữ pháp',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'LEARNING_CONTENT'),
  },
  {
    id: 'QUESTION_BANK',
    name: 'Ngân hàng câu hỏi',
    description: 'Đề thi, câu hỏi trắc nghiệm và luyện đề HSK',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'QUESTION_BANK'),
  },
  {
    id: 'ASSIGNMENTS',
    name: 'Bài tập & Đánh giá',
    description: 'Giao bài tập, chấm điểm và theo dõi tiến độ',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'ASSIGNMENTS'),
  },
  {
    id: 'SUPPORT_TICKETS',
    name: 'Vé hỗ trợ & Yêu cầu',
    description: 'Tiếp nhận, xử lý phản hồi và giải đáp học viên',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'SUPPORT_TICKETS'),
  },
  {
    id: 'REPORTS',
    name: 'Báo cáo & Thống kê',
    description: 'Biểu đồ hiệu suất, doanh thu và dữ liệu học tập',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'REPORTS'),
  },
  {
    id: 'SYSTEM',
    name: 'Hệ thống & Phân quyền',
    description: 'Cấu hình nền tảng, tích hợp dịch vụ và phân quyền',
    permissions: PERMISSION_CATALOG.filter((p) => p.module === 'SYSTEM'),
  },
];

// Helper to get all permission codes (ADMIN automatically has all)
export const ALL_PERMISSION_CODES = PERMISSION_CATALOG.map((p) => p.code);
