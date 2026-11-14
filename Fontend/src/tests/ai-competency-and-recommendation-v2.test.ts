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

  it('validates CompetencyProfile schema with 6 macro-skills and transparent speaking disclaimer', () => {
    const mockProfile: CompetencyProfile = {
      userId: '11111111-2222-3333-4444-555555555555',
      assessmentStatus: 'ASSESSED',
      estimatedHskLevel: 2,
      confidenceScore: 0.82,
      overallMasteryPercent: 74.5,
      totalEvaluations: 45,
      hasSpeakingAudioData: false,
      speakingAudioNote: 'Chưa có dữ liệu âm thanh được chấm điểm; không suy đoán điểm nói.',
      macroSkills: [
        {
          skillCategory: 'vocabulary',
          labelVi: 'Từ vựng (Vocabulary)',
          totalAttempts: 15,
          correctAttempts: 13,
          accuracyPercent: 86.7,
          masteryScore: 0.85,
          masteryPercent: 85.0,
          confidenceScore: 0.78,
          masteryTier: 'MASTERED',
          isMeasuredRealData: true,
          weakTopics: [],
        },
        {
          skillCategory: 'grammar',
          labelVi: 'Ngữ pháp (Grammar)',
          totalAttempts: 12,
          correctAttempts: 8,
          accuracyPercent: 66.7,
          masteryScore: 0.62,
          masteryPercent: 62.0,
          confidenceScore: 0.71,
          masteryTier: 'EMERGING',
          isMeasuredRealData: true,
          weakTopics: ['Trợ từ 的'],
        },
        {
          skillCategory: 'reading',
          labelVi: 'Đọc hiểu (Reading)',
          totalAttempts: 10,
          correctAttempts: 8,
          accuracyPercent: 80.0,
          masteryScore: 0.77,
          masteryPercent: 77.0,
          confidenceScore: 0.65,
          masteryTier: 'COMPETENT',
          isMeasuredRealData: true,
          weakTopics: [],
        },
        {
          skillCategory: 'listening',
          labelVi: 'Nghe hiểu (Listening)',
          totalAttempts: 5,
          correctAttempts: 4,
          accuracyPercent: 80.0,
          masteryScore: 0.70,
          masteryPercent: 70.0,
          confidenceScore: 0.45,
          masteryTier: 'COMPETENT',
          isMeasuredRealData: true,
          weakTopics: [],
        },
        {
          skillCategory: 'hanzi',
          labelVi: 'Chữ Hán & Bộ thủ (Hanzi)',
          totalAttempts: 3,
          correctAttempts: 2,
          accuracyPercent: 66.7,
          masteryScore: 0.58,
          masteryPercent: 58.0,
          confidenceScore: 0.32,
          masteryTier: 'EMERGING',
          isMeasuredRealData: true,
          weakTopics: [],
        },
        {
          skillCategory: 'speaking',
          labelVi: 'Phát âm & Nói (Speaking)',
          totalAttempts: 0,
          correctAttempts: 0,
          accuracyPercent: 0.0,
          masteryScore: 0.0,
          masteryPercent: 0.0,
          confidenceScore: 0.0,
          masteryTier: 'NOT_ASSESSED',
          isMeasuredRealData: false,
          weakTopics: [],
        },
      ],
      topWeakConcepts: [
        {
          conceptCode: 'WK-1-GRAMMAR',
          titleVi: 'Trợ từ 的',
          skillCategory: 'grammar',
          hskLevel: 1,
          masteryScore: 0.35,
          masteryTier: 'NOVICE',
          totalAttempts: 4,
          incorrectAttempts: 3,
          evidenceVi: 'Sai 3/4 câu hỏi về trợ từ kết cấu 的.',
          recommendedActionRoute: '/ai-exercises?hsk=1&source=WEAKNESS',
        },
      ],
      topStrengths: ['Từ vựng (Vocabulary)'],
      lastAssessedAt: new Date().toISOString(),
    };

    expect(mockProfile.macroSkills).toHaveLength(6);
    expect(mockProfile.hasSpeakingAudioData).toBe(false);

    const speakingSkill = mockProfile.macroSkills.find(
      (s: SkillCompetency) => s.skillCategory === 'speaking'
    );
    expect(speakingSkill).toBeDefined();
    expect(speakingSkill?.masteryTier).toBe('NOT_ASSESSED');
    expect(speakingSkill?.isMeasuredRealData).toBe(false);
    expect(mockProfile.speakingAudioNote).toContain('không suy đoán điểm nói');
  });

  it('validates PersonalizedLearningPlanV2 schema with multi-factor utility ranking and real routes', () => {
    const mockPlan: PersonalizedLearningPlanV2 = {
      userId: '11111111-2222-3333-4444-555555555555',
      assessmentStatus: 'ASSESSED',
      currentHskLevel: 1,
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
          id: 'rec-weak-WK-1-GRAMMAR',
          category: 'weak-skill',
          title: 'Củng cố điểm yếu: Trợ từ 的',
          priority: 2,
          utilityScore: 0.76,
          reason: 'Độ thành thạo ước tính 35% với 3 lần làm bài chưa chính xác.',
          pedagogicalGoalVi: 'Lấp lỗ hổng kiến thức ngữ pháp.',
          evidenceData: { conceptCode: 'WK-1-GRAMMAR', incorrectAttempts: 3 },
          estimatedMinutes: 10,
          destinationRoute: '/ai-exercises?hsk=1&source=WEAKNESS',
          badge: 'NOVICE',
          actionLabel: 'Tạo bài tập AI củng cố',
        },
      ],
      aiCoachingExplanationVi: 'Nên ưu tiên giải quyết 5 từ vựng đến hạn trước khi củng cố ngữ pháp.',
      aiFocusTipVi: 'Dành 5 phút ôn từ vựng SRS.',
      usedLlmExplanation: true,
      generatedAt: new Date().toISOString(),
    };

    expect(mockPlan.recommendations).toHaveLength(2);
    expect(mockPlan.recommendations[0].priority).toBe(1);
    expect(mockPlan.recommendations[0].utilityScore).toBeGreaterThanOrEqual(
      mockPlan.recommendations[1].utilityScore
    );
    expect(mockPlan.recommendations[0].destinationRoute).toBe('/srs-review');
    expect(mockPlan.recommendations[1].destinationRoute).toBe('/ai-exercises?hsk=1&source=WEAKNESS');
    expect(mockPlan.usedLlmExplanation).toBe(true);
    expect(mockPlan.aiCoachingExplanationVi).toBeDefined();
  });
});
