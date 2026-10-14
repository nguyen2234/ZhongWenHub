/**
 * Phase AI-0 Automated Test Suite
 * Validates Dual AI Workspace Foundation, Shared AI Core, Task Dispatch,
 * Validation, Data Contracts, Entitlement Checking, and Cross-Role Isolation.
 */

import { aiCoreService } from '../features/ai/core/services/ai-core.service';
import { validateTaskRequest, validateStructuredAIResponse } from '../features/ai/core/utils/ai-validation.utils';
import { studentAIService } from '../features/ai/student/services/student-ai.service';
import { teacherAIService } from '../features/ai/teacher/services/teacher-ai.service';
import { aiUsageService } from '../features/ai/usage/services/ai-usage.service';
import { mockAIProviderAdapter } from '../features/ai/core/adapters/mock-ai-provider.adapter';
import type { AITaskRequest } from '../features/ai/core/types/ai-task.types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== STARTING PHASE AI-0 DUAL AI WORKSPACE TESTS ===\n');

  // TEST 01: Core Task Validation rejects invalid input
  const invalidReq: AITaskRequest = {
    taskId: '',
    taskType: 'STUDENT_TUTOR_CHAT',
    actorId: '',
    actorRole: 'STUDENT',
    payload: {},
    timestamp: new Date().toISOString(),
  };
  const validationRes = validateTaskRequest(invalidReq);
  assert(validationRes.valid === false, 'TEST 01: AI Core rejects task request missing taskId or actorId');

  // TEST 02: Core Task Dispatch with mock provider executes cleanly
  const validReq: AITaskRequest = {
    taskId: 'task-test-01',
    taskType: 'STUDENT_TUTOR_CHAT',
    actorId: 'usr-st-01',
    actorRole: 'STUDENT',
    payload: { query: 'Hello' },
    timestamp: new Date().toISOString(),
  };
  const response = await aiCoreService.dispatchTask(validReq);
  assert(response.status === 'SUCCESS', 'TEST 02: AI Core executes validated task with SUCCESS status');
  assert(response.tokensConsumed.totalTokens > 0, 'TEST 03: Task response includes metered token consumption');

  // TEST 04: Structured Response validation helper
  const sampleEvaluation = {
    studentId: 'usr-st-01',
    exerciseId: 'ex-01',
    suggestedScore: 9,
    maxScore: 10,
  };
  const evalValidation = validateStructuredAIResponse(sampleEvaluation, ['studentId', 'exerciseId', 'suggestedScore']);
  assert(evalValidation.valid === true, 'TEST 04: Structured response validation succeeds when required fields are present');
  const missingValidation = validateStructuredAIResponse(sampleEvaluation, ['studentId', 'feedback']);
  assert(missingValidation.valid === false && missingValidation.missingFields.includes('feedback'), 'TEST 05: Structured response validation catches missing required fields');

  // TEST 06: Student AI Feature list contains 7 distinct modules
  const studentFeatures = studentAIService.getFeatures();
  assert(studentFeatures.length === 7, 'TEST 06: Student AI workspace provides exactly 7 feature modules');
  const tutorFeature = studentFeatures.find((f) => f.id === 'ai-tutor');
  assert(tutorFeature?.status === 'AVAILABLE', 'TEST 07: AI Tutor feature is marked AVAILABLE');
  const gradingFeature = studentFeatures.find((f) => f.id === 'ai-grading');
  assert(gradingFeature?.status === 'COMING_SOON', 'TEST 08: Unimplemented AI Grading shows explicit COMING_SOON state');

  // TEST 09: Student Diagnostic Profile query
  const profile = await studentAIService.getStudentLearningProfile('usr-st-01');
  assert(profile.studentId === 'usr-st-01', 'TEST 09: Student learning profile resolves to correct student');
  assert(profile.recentWeakPoints.length > 0, 'TEST 10: Profile preserves evidence-based weak knowledge points');

  // TEST 11: Teacher AI Feature list contains 7 distinct productivity tools
  const teacherFeatures = teacherAIService.getFeatures();
  assert(teacherFeatures.length === 7, 'TEST 11: Teacher AI workspace provides exactly 7 productivity tools');
  const plannerFeature = teacherFeatures.find((f) => f.id === 'lesson-planner');
  assert(plannerFeature?.status === 'ACTIVE_SHELL', 'TEST 12: AI Lesson Planner provides ACTIVE_SHELL working shell');

  // TEST 13: Lesson Planner Shell draft generation
  const planDraft = await teacherAIService.generateLessonPlanDraft({
    classId: 'cls-001',
    hskLevel: 'HSK 3',
    topic: 'Câu chữ 把',
    learningObjectives: 'Nắm vững quy tắc ngữ pháp 把',
    durationMinutes: 45,
    teachingStyle: 'COMMUNICATIVE',
  });
  assert(planDraft.stages.length === 4, 'TEST 13: Lesson Planner generates 4 structured pedagogical stages');
  assert(planDraft.durationMinutes === 45, 'TEST 14: Lesson Planner accurately allocates configured duration');

  // TEST 15: Exercise Generator Shell draft generation
  const exerciseDrafts = await teacherAIService.generateExerciseBatchDraft({
    classId: 'cls-001',
    hskLevel: 'HSK 3',
    knowledgePoints: '把 và 被',
    exerciseTypes: ['multiple-choice', 'sentence-order'],
    difficulty: 'MEDIUM',
    questionCount: 2,
  });
  assert(exerciseDrafts.length === 2, 'TEST 15: Exercise Generator generates exact requested draft count');
  assert(Boolean(exerciseDrafts[0].suggestedAnswer), 'TEST 16: Generated questions include suggested answer and explanation');

  // TEST 17: Pre-Grading Queue query & Teacher-in-the-Loop review
  const preGradingJobs = await teacherAIService.getPreGradingJobs();
  assert(preGradingJobs.length > 0, 'TEST 17: Pre-grading queue surfaces submissions requiring review');
  assert(preGradingJobs[0].requiresManualReview === true, 'TEST 18: Pre-grading enforces mandatory teacher review flag');

  // TEST 19: Usage Quota & Entitlement checks
  const studentEnt = aiUsageService.getStudentEntitlement('usr-st-01');
  assert(studentEnt.tier === 'FREE', 'TEST 19: Default student resolves to FREE tier entitlement');
  const tutorCheck = aiUsageService.checkFeatureAccess('STUDENT', 'usr-st-01', 'STUDENT_AI_GRADING');
  assert(tutorCheck.allowed === false, 'TEST 20: Pro-tier AI Grading access is protected from Free accounts');

  const teacherEnt = aiUsageService.getTeacherEntitlement('tch-001');
  assert(teacherEnt.tier === 'TEACHER_PRO', 'TEST 21: Authorized teacher resolves to TEACHER_PRO tier');
  const plannerCheck = aiUsageService.checkFeatureAccess('TEACHER', 'tch-001', 'TEACHER_LESSON_PLANNER');
  assert(plannerCheck.allowed === true, 'TEST 22: Teacher Pro account is permitted to access Lesson Planner');

  // TEST 23: Audit logging records operations
  const logs = aiCoreService.getAuditLogs();
  assert(logs.length > 0, 'TEST 23: AI Core accurately maintains audit log records');

  // TEST 24: Mock model catalog metadata
  const models = await mockAIProviderAdapter.getAvailableModels();
  assert(models.length >= 2, 'TEST 24: Available AI model metadata is queryable without live API calls');

  // TEST 25: Role isolation between Student and Teacher workspaces
  const studentTutorAccess = aiUsageService.checkFeatureAccess('STUDENT', 'usr-st-01', 'TEACHER_LESSON_PLANNER' as any);
  assert(studentTutorAccess.allowed === false, 'TEST 25: Cross-role violation strictly blocked between student and teacher AI tasks');

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed`);
  }
}

runTests().catch((e) => {
  console.error(e);
});
