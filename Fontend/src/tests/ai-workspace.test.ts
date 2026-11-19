import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { aiCoreService } from '../features/ai/core/services/ai-core.service';
import { validateTaskRequest, validateStructuredAIResponse } from '../features/ai/core/utils/ai-validation.utils';
import { studentAIService } from '../features/ai/student/services/student-ai.service';
import { teacherAIService } from '../features/ai/teacher/services/teacher-ai.service';
import { aiUsageService } from '../features/ai/usage/services/ai-usage.service';
import { mockAIProviderAdapter } from '../features/ai/core/adapters/mock-ai-provider.adapter';
import type { AITaskRequest } from '../features/ai/core/types/ai-task.types';
import { authTokenService } from '../core/api/client/auth-token.service';

describe('Phase AI-0 Dual AI Workspace Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  it('TEST 01: Core Task Validation rejects invalid input', () => {
    const invalidReq: AITaskRequest = {
      taskId: '',
      taskType: 'STUDENT_TUTOR_CHAT',
      actorId: '',
      actorRole: 'STUDENT',
      payload: {},
      timestamp: new Date().toISOString(),
    };
    const validationRes = validateTaskRequest(invalidReq);
    expect(validationRes.valid).toBe(false);
  });

  it('TEST 02 & 03: Core Task Dispatch with mock provider executes cleanly and meters tokens', async () => {
    const validReq: AITaskRequest = {
      taskId: 'task-test-01',
      taskType: 'STUDENT_TUTOR_CHAT',
      actorId: 'usr-st-01',
      actorRole: 'STUDENT',
      payload: { query: 'Hello' },
      timestamp: new Date().toISOString(),
    };
    const response = await aiCoreService.dispatchTask(validReq);
    expect(response.status).toBe('SUCCESS');
    expect(response.tokensConsumed.totalTokens).toBeGreaterThan(0);
  });

  it('TEST 04 & 05: Structured Response validation helper', () => {
    const sampleEvaluation = {
      studentId: 'usr-st-01',
      exerciseId: 'ex-01',
      suggestedScore: 9,
      maxScore: 10,
    };
    const evalValidation = validateStructuredAIResponse(sampleEvaluation, ['studentId', 'exerciseId', 'suggestedScore']);
    expect(evalValidation.valid).toBe(true);

    const missingValidation = validateStructuredAIResponse(sampleEvaluation, ['studentId', 'feedback']);
    expect(missingValidation.valid).toBe(false);
    expect(missingValidation.missingFields).toContain('feedback');
  });

  it('TEST 06 - 08: Student AI Feature list contains 7 distinct modules with correct availability states', () => {
    const studentFeatures = studentAIService.getFeatures();
    expect(studentFeatures.length).toBe(7);

    const tutorFeature = studentFeatures.find((f) => f.id === 'ai-tutor');
    expect(tutorFeature?.status).toBe('AVAILABLE');

    const gradingFeature = studentFeatures.find((f) => f.id === 'ai-grading');
    expect(gradingFeature?.status).toBe('COMING_SOON');
  });

  it('TEST 09 & 10: Student Diagnostic Profile query resolves correct student and weak points', async () => {
    const profile = await studentAIService.getStudentLearningProfile('usr-st-01');
    expect(profile.studentId).toBe('usr-st-01');
    expect(profile.recentWeakPoints.length).toBeGreaterThan(0);
  });

  it('TEST 11 & 12: Teacher AI Feature list contains 7 distinct productivity tools', () => {
    const teacherFeatures = teacherAIService.getFeatures();
    expect(teacherFeatures.length).toBe(7);

    const plannerFeature = teacherFeatures.find((f) => f.id === 'lesson-planner');
    expect(plannerFeature?.status).toBe('ACTIVE_SHELL');
  });

  it('TEST 13 & 14: Lesson Planner Shell draft generation', async () => {
    const planDraft = await teacherAIService.generateLessonPlanDraft({
      classId: 'cls-001',
      hskLevel: 'HSK 3',
      topic: 'Câu chữ 把',
      learningObjectives: 'Nắm vững quy tắc ngữ pháp 把',
      durationMinutes: 45,
      teachingStyle: 'COMMUNICATIVE',
    });
    expect(planDraft.stages.length).toBe(4);
    expect(planDraft.durationMinutes).toBe(45);
  });

  it('TEST 15 & 16: Exercise Generator Shell draft generation', async () => {
    const exerciseDrafts = await teacherAIService.generateExerciseBatchDraft({
      classId: 'cls-001',
      hskLevel: 'HSK 3',
      knowledgePoints: '把 và 被',
      exerciseTypes: ['multiple-choice', 'sentence-order'],
      difficulty: 'MEDIUM',
      questionCount: 2,
    });
    expect(exerciseDrafts.length).toBe(2);
    expect(Boolean(exerciseDrafts[0].suggestedAnswer)).toBe(true);
  });

  it('TEST 17 & 18: Pre-Grading Queue query & Teacher-in-the-Loop review', async () => {
    const preGradingJobs = await teacherAIService.getPreGradingJobs();
    expect(preGradingJobs.length).toBeGreaterThan(0);
    expect(preGradingJobs[0].requiresManualReview).toBe(true);
  });

  it('TEST 19 - 22: Usage Quota & Entitlement checks', () => {
    const studentEnt = aiUsageService.getStudentEntitlement('usr-st-01');
    expect(studentEnt.tier).toBe('FREE');

    const tutorCheck = aiUsageService.checkFeatureAccess('STUDENT', 'usr-st-01', 'STUDENT_AI_GRADING');
    expect(tutorCheck.allowed).toBe(false);

    const teacherEnt = aiUsageService.getTeacherEntitlement('tch-001');
    expect(teacherEnt.tier).toBe('TEACHER_PRO');

    const plannerCheck = aiUsageService.checkFeatureAccess('TEACHER', 'tch-001', 'TEACHER_LESSON_PLANNER');
    expect(plannerCheck.allowed).toBe(true);
  });

  it('TEST 23: Audit logging records operations', () => {
    const logs = aiCoreService.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
  });

  it('TEST 24: Mock model catalog metadata', async () => {
    const models = await mockAIProviderAdapter.getAvailableModels();
    expect(models.length).toBeGreaterThanOrEqual(2);
  });

  it('TEST 25: Cross-role isolation strictly blocked between student and teacher AI tasks', () => {
    const studentTutorAccess = aiUsageService.checkFeatureAccess('STUDENT', 'usr-st-01', 'TEACHER_LESSON_PLANNER' as any);
    expect(studentTutorAccess.allowed).toBe(false);
  });
});
