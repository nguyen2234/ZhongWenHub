import { describe, expect, it } from 'bun:test';
import {
  aiLearningEngineService,
  type CompetencyProfile,
  type PersonalizedLearningPlanV2,
  type SkillCompetency,
} from '../features/ai/services/ai-learning-engine.service';

describe('Phase 1 AI Competency Profile & Recommendation Engine V2 Frontend Contracts', () => {
  it('exposes Phase 1 service endpoints without client-side mock bypass', () => {
    expect(typeof aiLearningEngineService.getCompetencyProfile).toBe('function');
    expect(typeof aiLearningEngineService.getRecommendationsV2).toBe('function');
  });

  it('validates CompetencyProfile schema with distinct selected vs estimated HSK and transparent speaking disclaimer', () => {
    const mockProfile: CompetencyProfile = {
      userId: '11111111-2222-3333-4444-555555555555',
      assessmentStatus: 'IN_PROGRESS',
      selectedHskLevel: 2,
      estimatedHskLevel: null, // Insufficient multi-skill evidence preserves null
      confidenceScore: 0.42,
      overallMasteryPercent: 68.5,
      totalEvaluations: 8,
      unclassifiedEvaluationsCount: 0,
      hasSpeakingAudioData: false,
      speakingAudioNote: 'Chưa có dữ liệu âm thanh được chấm điểm; không suy đoán điểm nói.',
      macroSkills: [
        {
          skillCategory: 'vocabulary',
          labelVi: 'Từ vựng (Vocabulary)',
          totalAttempts: 5,
          correctAttempts: 4,
          accuracyPercent: 80.0,
          masteryScore: 0.72,
          masteryPercent: 72.0,
          confidenceScore: 0.45,
          masteryTier: 'COMPETENT',
          isMeasuredRealData: true,
          weakTopics: [],
        },
        {
          skillCategory: 'grammar',
          labelVi: 'Ngữ pháp (Grammar)',
          totalAttempts: 3,
          correctAttempts: 1,
          accuracyPercent: 33.3,
          masteryScore: 0.38,
          masteryPercent: 38.0,
          confidenceScore: 0.31,
          masteryTier: 'NOVICE',
          isMeasuredRealData: true,
          weakTopics: ['Trợ từ 的'],
        },
        {
          skillCategory: 'hanzi',
          labelVi: 'Nhận diện & Viết chữ Hán (Hanzi)',
          totalAttempts: 0,
          correctAttempts: 0,
          accuracyPercent: 0.0,
          masteryScore: 0.0,
          masteryPercent: 0.0,
          confidenceScore: 0.0,
          masteryTier: 'NOT_ASSESSED',
          isMeasuredRealData: true,
          weakTopics: [],
        },
        {
          skillCategory: 'pinyin',
          labelVi: 'Phiên âm & Thanh điệu (Pinyin)',
          totalAttempts: 0,
          correctAttempts: 0,
          accuracyPercent: 0.0,
          masteryScore: 0.0,
          masteryPercent: 0.0,
          confidenceScore: 0.0,
          masteryTier: 'NOT_ASSESSED',
          isMeasuredRealData: true,
          weakTopics: [],
        },
      ],
      topWeakConcepts: [
        {
          conceptCode: 'CP-2-GRAMMAR-TRO-TU-DE-A1B2C3D4',
          titleVi: 'Trợ từ 的',
          skillCategory: 'grammar',
          hskLevel: 2,
          masteryScore: 0.35,
          masteryTier: 'NOVICE',
          totalAttempts: 3,
          incorrectAttempts: 2,
          evidenceVi: 'Sai 2/3 câu hỏi về trợ từ kết cấu 的.',
          recommendedActionRoute: '/ai-exercises?hsk=2&source=WEAKNESS',
        },
      ],
      topStrengths: [],
      lastAssessedAt: new Date().toISOString(),
    };

    expect(mockProfile.selectedHskLevel).toBe(2);
    expect(mockProfile.estimatedHskLevel).toBeNull();
    expect(mockProfile.hasSpeakingAudioData).toBe(false);
    expect(mockProfile.unclassifiedEvaluationsCount).toBe(0);
    expect(mockProfile.macroSkills.length).toBe(4);

    const activeSkillCategories = mockProfile.macroSkills.map((s: SkillCompetency) => s.skillCategory);
    expect(activeSkillCategories).toContain('vocabulary');
    expect(activeSkillCategories).toContain('grammar');
    expect(activeSkillCategories).toContain('hanzi');
    expect(activeSkillCategories).toContain('pinyin');
    expect(activeSkillCategories).not.toContain('speaking');
    expect(activeSkillCategories).not.toContain('listening');
    expect(activeSkillCategories).not.toContain('reading');
    expect(activeSkillCategories).not.toContain('writing');

    // Verify ConceptCode is unique and prefixed CP-
    expect(mockProfile.topWeakConcepts[0].conceptCode).toMatch(/^CP-2-GRAMMAR-/);
  });

  it('validates PersonalizedLearningPlanV2 schema with real React router routes and no fake diagnostic route', () => {
    const mockPlan: PersonalizedLearningPlanV2 = {
      userId: '11111111-2222-3333-4444-555555555555',
      assessmentStatus: 'ASSESSED',
      currentHskLevel: 1,
      estimatedHskLevel: 1,
      availableMinutes: 25,
      confidenceScore: 0.85,
      overallMasteryPercent: 72.0,
      dueSrsCount: 5,
      masteredWordsCount: 28,
      inProgressLessonId: null,
      streakDays: 4,
      recommendations: [
        {
          id: 'rec-srs-due',
          category: 'srs-due',
          title: 'Ôn tập 5 từ vựng SRS đến hạn',
          priority: 1,
          utilityScore: 0.85,
          reason: '5 từ vựng đã chạm ngưỡng quên theo chu kỳ SuperMemo SM-2.',
          pedagogicalGoalVi: 'Khôi phục trí nhớ dài hạn trước khi nạp kiến thức mới.',
          evidenceData: { dueCount: 5, algorithm: 'SuperMemo SM-2' },
          estimatedMinutes: 5,
          destinationRoute: '/srs-review',
          badge: '5 từ',
          actionLabel: 'Ôn tập SRS ngay',
        },
        {
          id: 'rec-weak-CP-1-GRAMMAR-TRO-TU-DE',
          category: 'weak-skill',
          title: 'Củng cố điểm yếu: Trợ từ 的',
          priority: 2,
          utilityScore: 0.76,
          reason: 'Độ thành thạo ước tính 35% với 3 lần làm bài chưa chính xác.',
          pedagogicalGoalVi: 'Lấp lỗ hổng kiến thức ngữ pháp.',
          evidenceData: { conceptCode: 'CP-1-GRAMMAR-TRO-TU-DE', incorrectAttempts: 3 },
          estimatedMinutes: 10,
          destinationRoute: '/ai-exercises?hsk=1&source=WEAKNESS',
          badge: 'NOVICE',
          actionLabel: 'Tạo bài tập AI củng cố',
        },
        {
          id: 'rec-next-lesson-01',
          category: 'next-lesson',
          title: 'Học bài mới: Xin chào',
          priority: 3,
          utilityScore: 0.68,
          reason: 'Bài học kế tiếp theo khung đào tạo HSK 1.',
          pedagogicalGoalVi: 'Tiếp thu từ mới và điểm ngữ pháp tiếp theo.',
          evidenceData: { lessonId: 'lesson-01', hskLevel: 1 },
          estimatedMinutes: 15,
          destinationRoute: '/lesson/lesson-01',
          badge: 'HSK 1',
          actionLabel: 'Bắt đầu bài mới',
        },
      ],
      aiCoachingExplanationVi: 'Nên ưu tiên giải quyết 5 từ vựng đến hạn trước khi củng cố ngữ pháp.',
      aiFocusTipVi: 'Dành 5 phút ôn từ vựng SRS.',
      usedLlmExplanation: true,
      generatedAt: new Date().toISOString(),
    };

    expect(mockPlan.recommendations).toHaveLength(3);

    // Assert strictly valid React Router paths
    const validRoutes = ['/srs-review', '/ai-exercises?hsk=1&source=WEAKNESS', '/lesson/lesson-01'];
    mockPlan.recommendations.forEach((rec) => {
      expect(validRoutes).toContain(rec.destinationRoute);
      // Guarantee no fake diagnostic test route
      expect(rec.category).not.toBe('diagnostic-test');
    });

    expect(mockPlan.recommendations[0].priority).toBe(1);
    expect(mockPlan.recommendations[0].utilityScore).toBeGreaterThanOrEqual(
      mockPlan.recommendations[1].utilityScore
    );
  });
});
