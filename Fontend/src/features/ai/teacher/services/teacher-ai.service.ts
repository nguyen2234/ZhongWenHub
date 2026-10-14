/**
 * Teacher AI Service
 * Coordinates teaching productivity tools: Lesson Planning, Exercise Generation, and Pre-Grading shells.
 */

import type {
  TeacherAIFeatureItem,
  LessonPlanInput,
  GeneratedLessonPlanPreview,
  ExerciseGeneratorInput,
  GeneratedQuestionDraft,
} from '../types/teacher-ai.types';
import type { AIGradingJob } from '../types/teacher-grading-ai.types';

export const TEACHER_AI_FEATURES: TeacherAIFeatureItem[] = [
  {
    id: 'lesson-planner',
    title: 'AI Lesson Planner (Soạn giáo án thông minh)',
    description: 'Tự động tạo khung giáo án 5 bước theo chuẩn HSK với phân bổ thời lượng, mục tiêu bài học và hoạt động đàm thoại.',
    category: 'PLANNER',
    status: 'ACTIVE_SHELL',
    tier: 'PRO',
    badge: 'Khung làm việc sẵn sàng',
    iconName: 'BookOpen',
  },
  {
    id: 'exercise-generator',
    title: 'AI Exercise Generator (Sinh đề bài tập)',
    description: 'Biên soạn hàng loạt câu hỏi trắc nghiệm, nối từ, sắp xếp câu chữ 把/被 bám sát điểm ngữ pháp cụ thể.',
    category: 'EXERCISES',
    status: 'ACTIVE_SHELL',
    tier: 'PRO',
    badge: 'Khung làm việc sẵn sàng',
    iconName: 'CheckSquare',
  },
  {
    id: 'pre-grading',
    title: 'AI Pre-Grading (Tiền chấm điểm tự luận)',
    description: 'Hỗ trợ giáo viên chấm bài nhanh: phát hiện lỗi sai, đề xuất thang điểm và nhận xét để giáo viên phê duyệt.',
    category: 'GRADING',
    status: 'ACTIVE_SHELL',
    tier: 'PRO',
    badge: 'Khung làm việc sẵn sàng',
    iconName: 'PenTool',
  },
  {
    id: 'content-assistant',
    title: 'AI Content Assistant (Trợ lý tài liệu bài giảng)',
    description: 'Gợi ý đoạn hội thoại tình huống thực tế, từ vựng mở rộng và bài đọc hiểu theo ngữ cảnh văn hóa Trung Hoa.',
    category: 'CONTENT',
    status: 'COMING_SOON',
    tier: 'FREE',
    badge: 'Sắp ra mắt',
    iconName: 'FileText',
  },
  {
    id: 'class-analytics',
    title: 'AI Class Analytics (Chẩn đoán phổ điểm lớp)',
    description: 'Phân tích tự động tỷ lệ đạt điểm của lớp học, nhóm học viên cần phụ đạo và chủ điểm kiến thức cả lớp hay nhầm.',
    category: 'ANALYTICS',
    status: 'COMING_SOON',
    tier: 'PRO',
    badge: 'Sắp ra mắt',
    iconName: 'BarChart3',
  },
  {
    id: 'teaching-recommendations',
    title: 'AI Teaching Recommendations (Đề xuất giảng dạy)',
    description: 'Gợi ý phương pháp ôn tập và điều chỉnh tốc độ giảng dạy dựa trên tiến độ hoàn thành bài tập về nhà.',
    category: 'RECOMMENDATION',
    status: 'COMING_SOON',
    tier: 'FREE',
    badge: 'Sắp ra mắt',
    iconName: 'TrendingUp',
  },
  {
    id: 'teaching-assistant',
    title: 'AI Teaching Assistant (Trợ giảng ảo trực tuyến)',
    description: 'Hỗ trợ giải đáp các câu hỏi thường gặp của học viên ngoài giờ học dựa trên tài liệu bài giảng của giáo viên.',
    category: 'ASSISTANT',
    status: 'COMING_SOON',
    tier: 'PRO',
    badge: 'Sắp ra mắt',
    iconName: 'Bot',
  },
];

class TeacherAIService {
  getFeatures(): TeacherAIFeatureItem[] {
    return [...TEACHER_AI_FEATURES];
  }

  /**
   * Generates a structured lesson plan outline shell based on teacher inputs.
   */
  async generateLessonPlanDraft(input: LessonPlanInput): Promise<GeneratedLessonPlanPreview> {
    await new Promise((r) => setTimeout(r, 400));

    const totalDur = input.durationMinutes || 45;
    const warmUp = Math.round(totalDur * 0.15);
    const presentation = Math.round(totalDur * 0.35);
    const practice = Math.round(totalDur * 0.30);
    const production = Math.round(totalDur * 0.20);

    return {
      planId: `lp-${Date.now()}`,
      title: `Giáo án: ${input.topic || 'Chủ đề HSK'}`,
      hskLevel: input.hskLevel || 'HSK 3',
      durationMinutes: totalDur,
      stages: [
        {
          stageNumber: 1,
          title: 'Khởi động & Kích hoạt từ vựng (Warm-up)',
          durationMinutes: warmUp,
          teacherActivitiesVi: 'Chiếu hình ảnh tình huống thực tế và đặt 2 câu hỏi gợi mở cho cả lớp.',
          studentActivitiesVi: 'Học viên quan sát và phát biểu nhanh các từ vựng liên quan đã biết.',
          targetHanziAndGrammar: ['你好', '欢迎', '复习'],
        },
        {
          stageNumber: 2,
          title: 'Giảng giải kiến thức mới (Presentation)',
          durationMinutes: presentation,
          teacherActivitiesVi: `Phân tích cấu trúc trọng tâm của chủ đề "${input.topic}". Nhấn mạnh quy tắc ngữ pháp.`,
          studentActivitiesVi: 'Ghi chép công thức, đồng thanh đọc mẫu câu chuẩn và phát hiện điểm nhấn âm điệu.',
          targetHanziAndGrammar: ['把', '被', '语法点'],
        },
        {
          stageNumber: 3,
          title: 'Luyện tập có kiểm soát (Guided Practice)',
          durationMinutes: practice,
          teacherActivitiesVi: 'Tổ chức bài tập sắp xếp thẻ từ và điền từ vào chỗ trống theo cặp đôi.',
          studentActivitiesVi: 'Làm việc theo cặp, hoàn thành 4 câu trắc nghiệm và đổi chéo để nhận xét.',
          targetHanziAndGrammar: ['练习', '句子', '作业'],
        },
        {
          stageNumber: 4,
          title: 'Ứng dụng tự do & Củng cố (Production)',
          durationMinutes: production,
          teacherActivitiesVi: 'Mời 2 cặp học viên lên đóng vai đàm thoại trực tiếp trước lớp.',
          studentActivitiesVi: 'Tự do ứng biến đàm thoại sử dụng tối thiểu 2 điểm ngữ pháp mới học.',
          targetHanziAndGrammar: ['对话', '总结', '交流'],
        },
      ],
      suggestedHomework: `Giao 3 câu dịch Hán-Việt và 1 bài tập đọc hiểu về "${input.topic}" trên ZhongWenHub.`,
      generatedAt: new Date().toISOString(),
      isDraft: true,
    };
  }

  /**
   * Generates sample draft questions based on teacher specification.
   */
  async generateExerciseBatchDraft(input: ExerciseGeneratorInput): Promise<GeneratedQuestionDraft[]> {
    await new Promise((r) => setTimeout(r, 400));

    const count = Math.min(input.questionCount || 3, 5);
    const drafts: GeneratedQuestionDraft[] = [];

    for (let i = 0; i < count; i++) {
      if (i === 0) {
        drafts.push({
          id: `draft-q-${Date.now()}-1`,
          orderIndex: 1,
          exerciseType: 'multiple-choice',
          promptHanzi: '请你_____作业交给我。',
          promptPinyin: 'Qǐng nǐ _____ zuòyè jiāo gěi wǒ.',
          promptVi: 'Hãy nộp bài tập cho tôi (Chọn từ thích hợp).',
          suggestedOptions: ['把', '被', '比', '向'],
          suggestedAnswer: '把',
          explanationVi: 'Câu chữ 把: Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác.',
          estimatedDifficulty: input.difficulty,
        });
      } else if (i === 1) {
        drafts.push({
          id: `draft-q-${Date.now()}-2`,
          orderIndex: 2,
          exerciseType: 'sentence-order',
          promptHanzi: 'Sắp xếp câu: [书] [被] [借走了] [他]',
          promptVi: 'Quyển sách bị anh ấy mượn đi rồi.',
          suggestedAnswer: '书被他借走了。',
          explanationVi: 'Câu bị động với chữ 被: Tân ngữ chịu tác động + 被 + Chủ thể tác động + Động từ.',
          estimatedDifficulty: input.difficulty,
        });
      } else {
        drafts.push({
          id: `draft-q-${Date.now()}-${i + 1}`,
          orderIndex: i + 1,
          exerciseType: 'fill-blank',
          promptHanzi: '这本书是他昨天_____买的。',
          promptPinyin: 'Zhè běn shū shì tā zuótiān _____ mǎi de.',
          promptVi: 'Quyển sách này là anh ấy mới mua hôm qua.',
          suggestedAnswer: '刚',
          explanationVi: 'Phó từ 刚 (gāng) biểu thị hành động vừa mới xảy ra trong quá khứ gần.',
          estimatedDifficulty: input.difficulty,
        });
      }
    }

    return drafts;
  }

  /**
   * Returns sample mock grading jobs for demonstration of the Teacher-in-the-Loop workflow.
   */
  async getPreGradingJobs(): Promise<AIGradingJob[]> {
    await new Promise((r) => setTimeout(r, 100));

    return [
      {
        jobId: 'job-01',
        assignmentId: 'asgn-002',
        attemptId: 'att-demo-01',
        studentId: 'usr-st-01',
        studentName: 'Trần Thị Thu Thảo',
        submittedAt: '2026-10-14T14:30:00Z',
        status: 'SUGGESTIONS_READY',
        totalSuggestedScore: 18,
        maxScore: 20,
        requiresManualReview: true,
        reviewedByTeacher: false,
        suggestions: [
          {
            suggestionId: 'sug-01',
            questionId: 'aq-007',
            exerciseType: 'chinese-to-vietnamese',
            studentAnswer: 'Quyển sách này đã bị anh ta mượn mất rồi.',
            proposedScore: 4.5,
            maxPoints: 5,
            grammarFeedbackVi: 'Dịch đúng cấu trúc câu bị động chữ 被 và sắc thái hoàn thành của 了.',
            vocabularyFeedbackVi: 'Cách dịch "mượn mất rồi" tự nhiên, biểu đạt đúng ngữ cảnh.',
            confidenceScore: 0.92,
            reasoningNotes: 'Bản dịch chính xác 95% so với đáp án tham chiếu. Đề xuất cộng 4.5/5 điểm.',
            generatedAt: '2026-10-14T14:31:00Z',
          },
        ],
      },
    ];
  }
}

export const teacherAIService = new TeacherAIService();
