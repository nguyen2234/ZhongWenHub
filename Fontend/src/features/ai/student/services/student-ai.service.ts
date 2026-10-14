/**
 * Student AI Service
 * Manages personalized AI learning features, diagnostic profile queries, and AI Tutor bridging.
 */

import type {
  StudentLearningProfile,
  WeakKnowledgeItem,
  AIPracticeRecommendation,
} from '../types/student-ai.types';

export interface StudentAIFeatureItem {
  id: string;
  title: string;
  description: string;
  category: 'TUTOR' | 'GRADING' | 'DIAGNOSIS' | 'ADAPTIVE' | 'PRACTICE' | 'RECOMMENDATION' | 'INSIGHTS';
  status: 'AVAILABLE' | 'COMING_SOON';
  tier: 'FREE' | 'PRO';
  badge?: string;
  iconName: string;
}

export const STUDENT_AI_FEATURES: StudentAIFeatureItem[] = [
  {
    id: 'ai-tutor',
    title: 'AI Tutor Đối Thoại & Giải Thích',
    description: 'Trợ lý gia sư AI đồng hành 1-1, giải thích ngữ pháp HSK, đặt câu và đàm thoại ngữ cảnh theo thời gian thực.',
    category: 'TUTOR',
    status: 'AVAILABLE',
    tier: 'FREE',
    badge: 'Đang hoạt động',
    iconName: 'MessageSquare',
  },
  {
    id: 'ai-grading',
    title: 'AI Chấm Điểm & Sửa Lỗi Tự Luận',
    description: 'Chẩn đoán bài viết, phát hiện lỗi ngữ pháp, cấu trúc câu chữ 把/被 và gợi ý cách dùng từ tự nhiên hơn.',
    category: 'GRADING',
    status: 'COMING_SOON',
    tier: 'PRO',
    badge: 'Sắp ra mắt',
    iconName: 'Sparkles',
  },
  {
    id: 'weak-knowledge',
    title: 'Phân Tích Điểm Yếu HSK',
    description: 'Chẩn đoán chính xác các chủ điểm ngữ pháp hoặc từ vựng thường xuyên trả lời sai qua các buổi luyện tập.',
    category: 'DIAGNOSIS',
    status: 'COMING_SOON',
    tier: 'FREE',
    badge: 'Sắp ra mắt',
    iconName: 'AlertTriangle',
  },
  {
    id: 'adaptive-path',
    title: 'Lộ Trình Học Thích Ứng',
    description: 'Tự động hiệu chỉnh lộ trình bài học theo tốc độ tiếp thu thực tế của học viên, không ép học thuộc lòng.',
    category: 'ADAPTIVE',
    status: 'COMING_SOON',
    tier: 'PRO',
    badge: 'Sắp ra mắt',
    iconName: 'Compass',
  },
  {
    id: 'ai-practice-generator',
    title: 'Sinh Bài Luyện Tập Cá Nhân Hóa',
    description: 'Hệ thống tự động biên soạn bộ câu hỏi trắc nghiệm và điền từ tập trung 100% vào các từ bạn vừa quên.',
    category: 'PRACTICE',
    status: 'COMING_SOON',
    tier: 'PRO',
    badge: 'Sắp ra mắt',
    iconName: 'Dumbbell',
  },
  {
    id: 'personalized-recommendations',
    title: 'Gợi Ý Học Tập Hàng Ngày',
    description: 'Đề xuất danh sách từ vựng cần ôn Spaced Repetition (SRS) và các bài học tiếp theo cần ưu tiên.',
    category: 'RECOMMENDATION',
    status: 'COMING_SOON',
    tier: 'FREE',
    badge: 'Sắp ra mắt',
    iconName: 'Flame',
  },
  {
    id: 'progress-insights',
    title: 'Báo Cáo & Dự Báo Đỗ HSK',
    description: 'Đánh giá tỷ lệ thành thạo 4 kỹ năng (Nghe, Đọc, Viết, Ngữ pháp) và ước lượng điểm thi HSK mục tiêu.',
    category: 'INSIGHTS',
    status: 'COMING_SOON',
    tier: 'FREE',
    badge: 'Sắp ra mắt',
    iconName: 'BarChart3',
  },
];

class StudentAIService {
  getFeatures(): StudentAIFeatureItem[] {
    return [...STUDENT_AI_FEATURES];
  }

  /**
   * Returns honest learning profile baseline.
   */
  async getStudentLearningProfile(studentId: string): Promise<StudentLearningProfile> {
    await new Promise((r) => setTimeout(r, 60));

    const weakPoints: WeakKnowledgeItem[] = [
      {
        id: 'wp-01',
        title: 'Cấu trúc câu chữ 把 (Bǎ)',
        category: 'GRAMMAR',
        hskLevel: 'HSK 3',
        errorFrequency: 3,
        explanationVi: 'Nhầm lẫn vị trí tân ngữ chịu tác động và phó từ phủ định 不/没.',
        recommendedAction: 'Xem bài giảng Ngữ pháp Bài 8 và luyện bài tập chuyên đề.',
      },
      {
        id: 'wp-02',
        title: 'Phân biệt 再 (zài) và 又 (yòu)',
        category: 'VOCABULARY',
        hskLevel: 'HSK 2',
        errorFrequency: 2,
        explanationVi: 'Chưa phân biệt rõ hành động lặp lại trong tương lai (再) và quá khứ (又).',
        recommendedAction: 'Luyện 5 câu đặt câu phân biệt trong Trung tâm Luyện tập.',
      },
    ];

    const recommendations: AIPracticeRecommendation[] = [
      {
        recommendationId: 'rec-01',
        hskLevel: 'HSK 3',
        focusArea: 'Ngữ pháp câu chữ 把 & 被',
        suggestedExerciseTypes: ['sentence-order', 'fill-blank'],
        reasonVi: 'Dựa trên kết quả bài làm gần đây cần củng cố trước hạn nộp bài tập.',
        estimatedMinutes: 10,
        priority: 'HIGH',
      },
    ];

    return {
      studentId,
      targetHskLevel: 'HSK 3',
      currentMasteryAverage: 78,
      totalEvidenceCount: 42,
      recentWeakPoints: weakPoints,
      masteryBreakdown: [
        { knowledgePointId: 'kp-01', title: 'Từ vựng HSK 1-2', hskLevel: 'HSK 2', masteryPercent: 94, totalAttempts: 120, lastPracticedAt: '2026-10-12T10:00:00Z' },
        { knowledgePointId: 'kp-02', title: 'Cấu trúc câu so sánh 比', hskLevel: 'HSK 3', masteryPercent: 82, totalAttempts: 45, lastPracticedAt: '2026-10-13T14:30:00Z' },
        { knowledgePointId: 'kp-03', title: 'Câu chữ 把 / 被', hskLevel: 'HSK 3', masteryPercent: 62, totalAttempts: 38, lastPracticedAt: '2026-10-14T09:15:00Z' },
      ],
      activeRecommendations: recommendations,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const studentAIService = new StudentAIService();
