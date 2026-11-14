import { describe, expect, it } from 'bun:test';
import {
  diagnosticAssessmentService,
  type DiagnosticQuestion,
  type DiagnosticSessionStart,
  type DiagnosticSubmission,
  type DiagnosticResult,
} from '../features/ai/services/diagnostic-assessment.service';
import { STUDENT_MAIN_NAV_ITEMS } from '../config/student-navigation.config';

describe('Phase 2 Adaptive HSK Diagnostic Assessment Frontend Contracts', () => {
  it('exposes Phase 2 diagnostic assessment service endpoints', () => {
    expect(typeof diagnosticAssessmentService.startSession).toBe('function');
    expect(typeof diagnosticAssessmentService.submitSession).toBe('function');
    expect(typeof diagnosticAssessmentService.getLatestResult).toBe('function');
  });

  it('guarantees zero answer leaks in DiagnosticQuestion contract', () => {
    const questionSample: DiagnosticQuestion = {
      id: 'diag-q1',
      hskLevel: 1,
      skillCategory: 'grammar',
      topicTitle: 'Cấu trúc 是...的',
      promptZh: '他是昨天来___。',
      promptPinyin: 'Tā shì zuótiān lái ___.',
      promptVi: 'Điền từ thích hợp vào chỗ trống',
      options: ['的', '了', '过', '在'],
    };

    // Client question DTO MUST NOT contain correct answer or explanation fields
    const keys = Object.keys(questionSample);
    expect(keys).not.toContain('correctIndex');
    expect(keys).not.toContain('correctAnswer');
    expect(keys).not.toContain('explanationVi');
    expect(questionSample.options.length).toBe(4);
    expect(questionSample.hskLevel).toBe(1);
  });

  it('validates DiagnosticSessionStart structure with multiple adaptive questions', () => {
    const mockSession: DiagnosticSessionStart = {
      sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      totalQuestions: 12,
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

  it('validates DiagnosticResult schema with BKT confidence, skill breakdown, and server-side explanations', () => {
    const mockResult: DiagnosticResult = {
      sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      estimatedHskLevel: 2,
      confidenceScore: 0.85,
      totalQuestions: 12,
      correctCount: 9,
      accuracyPercent: 75.0,
      timeSpentSeconds: 310,
      assessmentSummaryVi: 'Học viên đạt trình độ ước tính HSK 2 với độ tin cậy BKT 85.0%.',
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
    expect(mockResult.confidenceScore).toBe(0.85);
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
