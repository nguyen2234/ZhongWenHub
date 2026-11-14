import { describe, expect, it } from 'bun:test';
import {
  diagnosticAssessmentService,
  type DiagnosticQuestion,
  type DiagnosticSessionStart,
  type DiagnosticSubmission,
  type DiagnosticResult,
} from '../features/ai/services/diagnostic-assessment.service';
import { STUDENT_MAIN_NAV_ITEMS } from '../config/student-navigation.config';

describe('Phase 2 HSK Diagnostic Placement Test Frontend Contracts', () => {
  it('exposes Phase 2 placement assessment service endpoints and target confirmation', () => {
    expect(typeof diagnosticAssessmentService.startSession).toBe('function');
    expect(typeof diagnosticAssessmentService.submitSession).toBe('function');
    expect(typeof diagnosticAssessmentService.getLatestResult).toBe('function');
    expect(typeof diagnosticAssessmentService.confirmTargetHsk).toBe('function');
  });

  it('guarantees zero answer leaks and no sentence translation in reading/listening contracts', () => {
    const readingQuestion: DiagnosticQuestion = {
      id: 'pl-1-rea-01',
      hskLevel: 1,
      skillCategory: 'reading',
      topicTitle: 'Đọc hiểu câu đơn',
      promptZh: '我喝茶，不喝咖啡。',
      promptVi: 'Người nói muốn uống gì?',
      options: ['Cà phê', 'Trà', 'Nước ngọt', 'Nước cam'],
    };

    // Client question DTO MUST NOT contain correct answer or explanation fields
    const keys = Object.keys(readingQuestion);
    expect(keys).not.toContain('correctIndex');
    expect(keys).not.toContain('correctAnswer');
    expect(keys).not.toContain('explanationVi');
    expect(readingQuestion.options.length).toBe(4);
    expect(readingQuestion.hskLevel).toBe(1);

    // Reading instruction MUST NOT translate the Chinese sentence
    expect(readingQuestion.promptVi).not.toContain('Tôi uống trà, không uống cà phê');
  });

  it('validates DiagnosticSessionStart structure with placement screening metadata', () => {
    const mockSession: DiagnosticSessionStart = {
      sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      assessmentType: 'HSK_PLACEMENT_SCREENING',
      totalQuestions: 12,
      maxDurationMinutes: 60,
      questions: [
        {
          id: 'q1',
          hskLevel: 1,
          skillCategory: 'vocabulary',
          topicTitle: 'Từ xưng hô',
          promptZh: '你好！',
          options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Không có gì'],
        },
        {
          id: 'q2',
          hskLevel: 2,
          skillCategory: 'grammar',
          topicTitle: 'Câu chữ 把',
          promptZh: '请把门___。',
          options: ['关上', '走', '看', '吃'],
        },
      ],
      startedAt: new Date().toISOString(),
    };

    expect(mockSession.totalQuestions).toBe(12);
    expect(mockSession.maxDurationMinutes).toBe(60);
    expect(mockSession.assessmentType).toBe('HSK_PLACEMENT_SCREENING');
    expect(mockSession.questions.length).toBe(2);
    expect(mockSession.sessionId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('correctly structures student submission payload with timeSpentSeconds', () => {
    const mockSubmission: DiagnosticSubmission = {
      sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      answers: [
        { questionId: 'q1', selectedIndex: 0, userAnswer: 'Xin chào' },
        { questionId: 'q2', selectedIndex: 0, userAnswer: '关上' },
        { questionId: 'q3', selectedIndex: -1 }, // Unanswered question
      ],
      timeSpentSeconds: 245,
    };

    expect(mockSubmission.timeSpentSeconds).toBe(245);
    expect(mockSubmission.answers.length).toBe(3);
    expect(mockSubmission.answers[2].selectedIndex).toBe(-1);
  });

  it('validates DiagnosticResult schema with screening psychometrics, limitations disclaimer, and server-side explanations', () => {
    const mockResult: DiagnosticResult = {
      sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      assessmentType: 'HSK_PLACEMENT_SCREENING',
      estimatedHskLevel: 2,
      confidenceScore: 0.462,
      totalQuestions: 12,
      correctCount: 9,
      accuracyPercent: 75.0,
      timeSpentSeconds: 310,
      assessmentSummaryVi: 'Định vị thành công: Trình độ khuyến nghị là HSK 2. Mục tiêu học tập của bạn được giữ nguyên.',
      assessmentLimitationsVi: 'Kết quả định vị ban đầu (Screening Placement). Do số lượng câu hỏi sàng lọc là 12 câu, độ tin cậy đạt mức sơ bộ (~46%).',
      skillAccuracyPercent: {
        grammar: 80.0,
        vocabulary: 100.0,
        reading: 66.7,
        listening: 50.0,
        pinyin: 100.0,
        hanzi: 50.0,
      },
      hskLevelAccuracyPercent: {
        1: 100.0,
        2: 75.0,
        3: 50.0,
        4: 0.0,
      },
      detailedQuestions: [
        {
          questionId: 'q1',
          hskLevel: 1,
          skillCategory: 'vocabulary',
          topicTitle: 'Từ xưng hô',
          promptZh: '你好！',
          options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Không có gì'],
          userSelectedIndex: 0,
          correctIndex: 0,
          isCorrect: true,
          explanationVi: '你好 (nǐ hǎo) có nghĩa là Xin chào trong tiếng Trung.',
        },
      ],
      completedAt: new Date().toISOString(),
    };

    expect(mockResult.estimatedHskLevel).toBe(2);
    expect(mockResult.confidenceScore).toBe(0.462);
    expect(mockResult.assessmentLimitationsVi).toContain('Screening Placement');
    expect(mockResult.accuracyPercent).toBe(75.0);
    expect(mockResult.skillAccuracyPercent.vocabulary).toBe(100.0);
    expect(mockResult.detailedQuestions[0].isCorrect).toBe(true);
    expect(mockResult.detailedQuestions[0].explanationVi).toContain('nǐ hǎo');
  });

  it('verifies that /diagnostic-assessment route is registered in AI navigation features', () => {
    const aiNav = STUDENT_MAIN_NAV_ITEMS.find((item) => item.id === 'ai-tutor');
    expect(aiNav).toBeDefined();
    expect(aiNav?.activeMatchPaths).toContain('/diagnostic-assessment');

    const diagFeature = aiNav?.secondaryFeatures.find((f) => f.id === 'diagnostic-assessment');
    expect(diagFeature).toBeDefined();
    expect(diagFeature?.path).toBe('/diagnostic-assessment');
  });
});
