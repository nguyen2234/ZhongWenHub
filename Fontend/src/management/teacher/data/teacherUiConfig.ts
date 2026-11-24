import type { TeacherQuickAction } from '../types/dashboard.types';

export const TEACHER_QUICK_ACTIONS: TeacherQuickAction[] = [
  {
    id: 'qa-create-assignment',
    label: 'Tạo bài tập mới',
    description: 'Soạn bài tập từ ngân hàng câu hỏi hoặc tự luận',
    iconName: 'questions',
    path: '/management/teacher/assignments/create',
  },
  {
    id: 'qa-create-class',
    label: 'Mở lớp học mới',
    description: 'Thêm lớp giảng dạy mới và thiết lập thời khóa biểu',
    iconName: 'classes',
    path: '/management/teacher/classes',
  },
  {
    id: 'qa-grade-submissions',
    label: 'Chấm bài tập',
    description: 'Xem danh sách bài nộp đang chờ giảng viên chấm điểm',
    iconName: 'submissions',
    path: '/management/teacher/assignments',
  },
];
