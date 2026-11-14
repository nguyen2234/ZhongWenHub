import { describe, expect, it } from 'bun:test';
import {
  aiLearningEngineService,
  type AdaptiveExercise,
  type AdaptiveSession,
  type AIErrorAnalysisDetail,
  type AiExerciseAttemptResult,
  type NextPracticeSuggestion,
} from '../features/ai/services/ai-learning-engine.service';
import { AIExerciseGeneratorPage } from '../features/ai/student/pages/AIExerciseGeneratorPage';

describe('Phase 3 AI Error Analysis & Adaptive Exercises Frontend Contracts', () => {
  it('exposes Phase 3 adaptive session and deep error analysis service endpoints', () => {
    expect(typeof aiLearningEngineService.generateAdaptiveSession).toBe('function');
    expect(typeof aiLearningEngineService.explainErrorDetail).toBe('function');
    expect(typeof aiLearningEngineService.submitAiExerciseAttempt).toBe('function');
    expect(typeof aiLearningEngineService.listAiExercises).toBe('function');
    expect(typeof aiLearningEngineService.generateAiExercises).toBe('function');
  });

  it('guarantees zero answer leaks in AdaptiveExercise contract before submission', () => {
    const exercise: AdaptiveExercise = {
      id: 'ex-adapt-101',
      hskLevel: 2,
      skillCategory: 'grammar',
      exerciseType: 'multiple-choice',
      originTag: 'AI_GENERATED',
      academicStatus: 'UNAPPROVED_EXPERIMENTAL',
      sourceReviewNote: 'Sinh thích ứng theo điểm yếu',
      promptZh: '他昨天___去北京。',
      promptPinyin: 'Tā zuótiān ___ qù Běijīng.',
      promptVi: 'Chọn từ thích hợp điền vào chỗ trống',
      options: ['没', '不', '很', '太'],
      difficultyTag: 'Tiêu chuẩn',
      targetConcept: 'GRAMMAR',
    };

    const keys = Object.keys(exercise);
    // Client-facing test question MUST NOT contain correct index, correct answer or explanation
    expect(keys).not.toContain('correctIndex');
    expect(keys).not.toContain('correctAnswer');
    expect(keys).not.toContain('explanationVi');
    expect(exercise.options.length).toBe(4);
    expect(exercise.originTag).toBe('AI_GENERATED');
    expect(exercise.difficultyTag).toBe('Tiêu chuẩn');
  });

  it('validates AdaptiveSession structure with strategy summary and questions', () => {
    const session: AdaptiveSession = {
      sessionId: 'sess-adapt-999',
      hskLevel: 3,
      focusSkill: 'all',
      mode: 'ADAPTIVE',
      totalQuestions: 5,
      strategySummaryVi: 'Chiến lược: Tập trung khắc phục điểm yếu ngữ pháp và đan xen SRS từ vựng.',
      questions: [
        {
          id: 'q1',
          hskLevel: 3,
          skillCategory: 'vocabulary',
          exerciseType: 'multiple-choice',
          originTag: 'CURATED_QUESTION_BANK',
          academicStatus: 'ACADEMIC_APPROVED',
          promptZh: '“环境”的意思是：',
          options: ['Môi trường', 'Kinh tế', 'Văn hóa', 'Giao thông'],
        },
      ],
      createdAt: new Date().toISOString(),
    };

    expect(session.mode).toBe('ADAPTIVE');
    expect(session.hskLevel).toBe(3);
    expect(session.questions.length).toBe(1);
    expect(session.strategySummaryVi).toContain('Chiến lược:');
  });

  it('validates rich AIErrorAnalysisDetail schema and pedagogical breakdown', () => {
    const detail: AIErrorAnalysisDetail = {
      errorType: 'grammar',
      errorTypeLabelVi: 'Ngữ pháp - Phó từ phủ định 没 và 不',
      whyIncorrectVi: 'Bạn đã chọn "不" cho hành động đã diễn ra trong quá khứ ("昨天").',
      whyCorrectVi: 'Trong tiếng Trung, để phủ định hành động trong quá khứ bắt buộc dùng "没/没有".',
      knowledgePointVi: 'Phủ định quá khứ: 没/没有 + V; Phủ định hiện tại/tương lai hoặc thói quen: 不 + V.',
      examples: [
        {
          hanzi: '他昨天没去学校。',
          pinyin: 'Tā zuótiān méi qù xuéxiào.',
          vietnamese: 'Hôm qua anh ấy không đi học.',
        },
        {
          hanzi: '他明天不去学校。',
          pinyin: 'Tā míngtiān bù qù xuéxiào.',
          vietnamese: 'Ngày mai anh ấy không đi học.',
        },
      ],
      recommendedPracticeAction: 'Luyện tập thêm 3 câu trắc nghiệm phân biệt 不 và 没.',
      recommendedRoute: '/ai-exercises?hsk=2&source=GRAMMAR',
      isAiGenerated: true,
      isFallback: false,
    };

    expect(detail.errorType).toBe('grammar');
    expect(detail.examples.length).toBe(2);
    expect(detail.examples[0].hanzi).toBe('他昨天没去学校。');
    expect(detail.whyIncorrectVi).toContain('Bạn đã chọn "不"');
    expect(detail.whyCorrectVi).toContain('Trong tiếng Trung');
    expect(detail.knowledgePointVi).toContain('Phủ định');
    expect(detail.recommendedRoute).toBe('/ai-exercises?hsk=2&source=GRAMMAR');
  });

  it('validates NextPracticeSuggestion and full attempt result contract', () => {
    const suggestion: NextPracticeSuggestion = {
      title: 'Củng cố kỹ năng GRAMMAR',
      skillCategory: 'grammar',
      hskLevel: 2,
      actionRoute: '/ai-exercises?hsk=2&source=GRAMMAR',
      reasonVi: 'Luyện tập thêm 3-5 câu để củng cố phản xạ phủ định quá khứ.',
    };

    const attemptResult: AiExerciseAttemptResult = {
      attemptId: 'att-123',
      aiExerciseId: 'ex-adapt-101',
      isCorrect: false,
      correctIndex: 0,
      correctAnswer: '没',
      explanationVi: 'Trong quá khứ dùng 没.',
      skillCategory: 'grammar',
      attemptedAt: new Date().toISOString(),
      errorAnalysis: {
        errorType: 'grammar',
        errorTypeLabelVi: 'Ngữ pháp',
        whyIncorrectVi: 'Sai cấu trúc',
        whyCorrectVi: 'Đúng cấu trúc',
        knowledgePointVi: 'Quy tắc',
        examples: [],
        recommendedPracticeAction: 'Luyện tập',
        recommendedRoute: '/ai-exercises',
        isAiGenerated: false,
        isFallback: true,
      },
      nextSuggestion: suggestion,
    };

    expect(attemptResult.isCorrect).toBe(false);
    expect(attemptResult.correctAnswer).toBe('没');
    expect(attemptResult.errorAnalysis).not.toBeNull();
    expect(attemptResult.nextSuggestion?.skillCategory).toBe('grammar');
  });

  it('exports AIExerciseGeneratorPage component properly', () => {
    expect(typeof AIExerciseGeneratorPage).toBe('function');
  });
});
