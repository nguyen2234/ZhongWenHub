import type {
  Assignment,
  AssignmentQuestion,
  AssignmentTarget,
} from '../types/assignment.types';

/**
 * DEMO ONLY — Dữ liệu khởi tạo cho Assignment Store (in-memory).
 * Dữ liệu này reset mỗi khi trang được tải lại (refresh).
 * Không dùng trong production.
 */

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn-001',
    teacherId: 'tch-001',
    title: 'Luyện tập từ vựng chủ đề Gia đình',
    description: 'Bài tập ôn luyện từ vựng HSK 2 về chủ đề gia đình và các mối quan hệ thân tộc.',
    hskLevelId: 'level-hsk-2',
    status: 'PUBLISHED',
    timeLimitMinutes: 30,
    maxAttempts: 2,
    retakePolicy: 'HIGHEST_SCORE',
    passingPoints: 7,
    allowLateSubmission: true,
    latePenaltyPercent: 20,
    shuffleQuestions: false,
    showCorrectAnswers: true,
    createdAt: '2026-10-08T10:00:00Z',
    updatedAt: '2026-10-10T14:00:00Z',
    publishedAt: '2026-10-10T14:00:00Z',
  },
  {
    id: 'asgn-002',
    teacherId: 'tch-001',
    title: 'Ngữ pháp câu chữ 把 và 被',
    description: 'Nhận biết và sử dụng đúng cấu trúc câu có 把 và 被 trong các tình huống thực tế.',
    hskLevelId: 'level-hsk-3',
    status: 'PUBLISHED',
    maxAttempts: 3,
    retakePolicy: 'HIGHEST_SCORE',
    passingPoints: 15,
    allowLateSubmission: false,
    latePenaltyPercent: 0,
    shuffleQuestions: true,
    showCorrectAnswers: false,
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-10-12T08:00:00Z',
    publishedAt: '2026-10-12T08:00:00Z',
  },
  {
    id: 'asgn-003',
    teacherId: 'tch-001',
    title: 'Đọc hiểu đoạn văn HSK 4 — Kinh tế',
    description: 'Luyện đọc hiểu các đoạn văn ngắn về chủ đề kinh tế, tài chính theo chuẩn HSK 4.',
    hskLevelId: 'level-hsk-4',
    status: 'DRAFT',
    maxAttempts: 1,
    retakePolicy: 'LATEST_ATTEMPT',
    passingPoints: 12,
    allowLateSubmission: true,
    latePenaltyPercent: 10,
    shuffleQuestions: false,
    showCorrectAnswers: true,
    createdAt: '2026-10-13T16:00:00Z',
    updatedAt: '2026-10-13T16:00:00Z',
  },
  {
    id: 'asgn-004',
    teacherId: 'tch-001',
    title: 'Kiểm tra phát âm Pinyin cơ bản',
    description: 'Bài kiểm tra phát âm 20 từ vựng cốt lõi cấp HSK 1 với thanh điệu chuẩn.',
    hskLevelId: 'level-hsk-1',
    status: 'CLOSED',
    timeLimitMinutes: 20,
    maxAttempts: 1,
    retakePolicy: 'LATEST_ATTEMPT',
    passingPoints: 16,
    allowLateSubmission: false,
    latePenaltyPercent: 0,
    shuffleQuestions: true,
    showCorrectAnswers: true,
    createdAt: '2026-09-20T08:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z',
    publishedAt: '2026-09-22T08:00:00Z',
    closedAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'asgn-005',
    teacherId: 'tch-001',
    title: 'Luyện dịch Hán-Việt nâng cao',
    description: 'Bộ câu hỏi dịch thuật văn bản cổ điển và tài liệu thương mại dành cho HSK 7-9.',
    hskLevelId: 'level-hsk-79',
    status: 'DRAFT',
    maxAttempts: 2,
    retakePolicy: 'HIGHEST_SCORE',
    passingPoints: 0,
    allowLateSubmission: true,
    latePenaltyPercent: 0,
    shuffleQuestions: false,
    showCorrectAnswers: false,
    createdAt: '2026-10-14T11:00:00Z',
    updatedAt: '2026-10-14T11:00:00Z',
  },
];

/**
 * Câu hỏi trong mỗi bài tập (tham chiếu questionBankId từ SharedExerciseItem catalog).
 * Demo sử dụng ID số nguyên (khớp với mock exercise data hiện có).
 */
export const INITIAL_ASSIGNMENT_QUESTIONS: AssignmentQuestion[] = [
  // asgn-001 (HSK 2 Gia đình) — 3 câu × 4 điểm = 12 điểm tổng (passingPoints=7)
  { id: 'aq-001', assignmentId: 'asgn-001', questionBankId: 1, orderIndex: 0, points: 4,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-10-10T14:00:00Z', exerciseType: 'multiple-choice', title: 'Chọn nghĩa đúng của từ 家庭', instruction: 'Chọn đáp án đúng nhất', promptHanzi: '家庭', promptPinyin: 'jiātíng', explanation: '家庭 (jiātíng) = Gia đình', options: ['Gia đình', 'Bạn bè', 'Đồng nghiệp', 'Hàng xóm'], _correctOptionIndex: 0 } },
  { id: 'aq-002', assignmentId: 'asgn-001', questionBankId: 2, orderIndex: 1, points: 4,
    snapshot: {
      snapshotVersion: 1,
      snapshotAt: '2026-10-10T14:00:00Z',
      exerciseType: 'matching',
      title: 'Ghép từ với nghĩa',
      instruction: 'Ghép mỗi từ tiếng Trung với nghĩa tiếng Việt tương ứng',
      matchingPairs: [
        { id: 'm1', hanzi: '爷爷', meaning: 'Ông nội' },
        { id: 'm2', hanzi: '奶奶', meaning: 'Bà nội' },
        { id: 'm3', hanzi: '哥哥', meaning: 'Anh trai' },
        { id: 'm4', hanzi: '妹妹', meaning: 'Em gái' },
      ],
      explanation: 'Ôn tập từ vựng gia đình',
    } },
  { id: 'aq-003', assignmentId: 'asgn-001', questionBankId: 3, orderIndex: 2, points: 4,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-10-10T14:00:00Z', exerciseType: 'fill-blank', title: 'Điền từ thích hợp', instruction: 'Điền từ thích hợp vào chỗ trống', promptHanzi: '我的_____有五个人。', explanation: 'Cấu trúc miêu tả thành viên gia đình', _correctSentence: '我的家庭有五个人。' } },

  // asgn-002 (HSK 3 把/被) — 4 câu × 5 điểm = 20 điểm tổng (passingPoints=15)
  { id: 'aq-004', assignmentId: 'asgn-002', questionBankId: 4, orderIndex: 0, points: 5,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-10-12T08:00:00Z', exerciseType: 'multiple-choice', title: 'Xác định câu dùng 把 đúng', instruction: 'Chọn câu sử dụng 把 chính xác về ngữ pháp', explanation: '把 dùng khi tân ngữ chịu tác động bởi hành động', options: ['他把书读了', '把他来了', '书把了我', '我被把书'], _correctOptionIndex: 0 } },
  { id: 'aq-005', assignmentId: 'asgn-002', questionBankId: 5, orderIndex: 1, points: 5,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-10-12T08:00:00Z', exerciseType: 'multiple-choice', title: 'Xác định câu dùng 被 đúng', instruction: 'Chọn câu sử dụng 被 chính xác', explanation: '被 dùng trong câu bị động', options: ['书被他读了', '他被书读了', '被书了他', '读被书他'], _correctOptionIndex: 0 } },
  { id: 'aq-006', assignmentId: 'asgn-002', questionBankId: 6, orderIndex: 2, points: 5,
    snapshot: {
      snapshotVersion: 1,
      snapshotAt: '2026-10-12T08:00:00Z',
      exerciseType: 'sentence-order',
      title: 'Sắp xếp câu với 把',
      instruction: 'Sắp xếp các từ thành câu đúng ngữ pháp',
      sentenceTokens: ['请', '你', '把', '作业', '交给我'],
      _correctSentence: '请你把作业交给我。',
      explanation: 'Cấu trúc: Chủ ngữ + 把 + Tân ngữ + Vị ngữ + Bổ ngữ',
    } },
  { id: 'aq-007', assignmentId: 'asgn-002', questionBankId: 7, orderIndex: 3, points: 5,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-10-12T08:00:00Z', exerciseType: 'chinese-to-vietnamese', title: 'Dịch câu có 被', instruction: 'Dịch câu sau sang tiếng Việt', promptHanzi: '这本书被他借走了。', promptPinyin: 'Zhè běn shū bèi tā jiè zǒu le.', explanation: 'Câu bị động: Quyển sách này bị anh ấy mượn đi rồi.' } },

  // asgn-004 (HSK 1 Phát âm — CLOSED) — 4 câu × 5 điểm = 20 điểm (passingPoints=16)
  { id: 'aq-012', assignmentId: 'asgn-004', questionBankId: 8, orderIndex: 0, points: 5,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-09-22T08:00:00Z', exerciseType: 'multiple-choice', title: 'Thanh điệu của 妈', instruction: 'Chọn thanh điệu đúng của 妈 (mā/má/mǎ/mà)', explanation: '妈 đọc thanh 1: mā', options: ['Thanh 1 (mā)', 'Thanh 2 (má)', 'Thanh 3 (mǎ)', 'Thanh 4 (mà)'], _correctOptionIndex: 0 } },
  { id: 'aq-013', assignmentId: 'asgn-004', questionBankId: 9, orderIndex: 1, points: 5,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-09-22T08:00:00Z', exerciseType: 'multiple-choice', title: 'Thanh điệu của 马', instruction: 'Chọn thanh điệu đúng của 马 (mā/má/mǎ/mà)', explanation: '马 đọc thanh 3: mǎ', options: ['Thanh 1 (mā)', 'Thanh 2 (má)', 'Thanh 3 (mǎ)', 'Thanh 4 (mà)'], _correctOptionIndex: 2 } },
  { id: 'aq-014', assignmentId: 'asgn-004', questionBankId: 10, orderIndex: 2, points: 5,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-09-22T08:00:00Z', exerciseType: 'listen-choice', title: 'Nghe và chọn từ đúng', instruction: 'Nghe âm thanh và chọn từ tương ứng', explanation: 'Phân biệt âm đầu b/p' } },
  { id: 'aq-015', assignmentId: 'asgn-004', questionBankId: 11, orderIndex: 3, points: 5,
    snapshot: { snapshotVersion: 1, snapshotAt: '2026-09-22T08:00:00Z', exerciseType: 'pronunciation', title: 'Đọc từ và ghi âm', instruction: 'Đọc to các từ sau và nộp bản ghi âm', promptHanzi: '你好 再见 谢谢', explanation: 'Ôn luyện ba từ chào hỏi cơ bản' } },
];

/**
 * Giao bài cho lớp (AssignmentTarget)
 * asgn-003 và asgn-005 chưa có target vì còn là bản nháp.
 */
export const INITIAL_ASSIGNMENT_TARGETS: AssignmentTarget[] = [
  // asgn-001 giao cho lớp HSK 2 (cls-002)
  { id: 'at-001', assignmentId: 'asgn-001', classId: 'cls-002', dueDate: '2026-10-20', closeDate: '2026-10-22' },

  // asgn-002 giao cho lớp HSK 3 (cls-001)
  { id: 'at-002', assignmentId: 'asgn-002', classId: 'cls-001', dueDate: '2026-10-25' },

  // asgn-004 (CLOSED) giao cho lớp HSK 1 (cls-004)
  { id: 'at-004', assignmentId: 'asgn-004', classId: 'cls-004', dueDate: '2026-09-30', closeDate: '2026-10-01' },
];
