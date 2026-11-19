import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { studentHomeworkService } from '../features/homework/services/student-homework.service';
import { studentAttemptService } from '../features/homework/services/student-attempt.service';
import { isExerciseTypeSupported } from '../features/exercise-engine/utils/exercise-capability';
import { authTokenService } from '../core/api/client/auth-token.service';
import { teacherPortalService } from '../management/teacher/services/teacher-portal.service';

describe('Phase 2B.2 Student Runner Tests', () => {
  const originalFetch = globalThis.fetch;
  const studentId = 'usr-st-01'; // Trần Thị Thu Thảo (enrolled in cls-001)

  beforeEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
    teacherPortalService.clearEnrolledClassesCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
    teacherPortalService.clearEnrolledClassesCache();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
    teacherPortalService.clearEnrolledClassesCache();
  });

  it('TEST 01 & 02: Enrolled student sees published assignment', async () => {
    const assignments = await studentHomeworkService.getMyAssignments(studentId);
    expect(assignments.length).toBeGreaterThan(0);
    const targetAsgn = assignments.find((a) => a.assignmentId === 'asgn-002');
    expect(targetAsgn).toBeDefined();
  });

  it('TEST 03 & 04: Assignment Detail retrieval', async () => {
    const detail = await studentHomeworkService.getAssignmentDetail('asgn-002', studentId);
    expect(detail).toBeDefined();
    expect(detail?.title).toBe('Ngữ pháp câu chữ 把 và 被');
    expect(detail?.canStartAttempt).toBe(true);
  });

  it('TEST 05 & 06: Runner question sanitization (No answer keys exposed)', async () => {
    const runner = await studentHomeworkService.getAssignmentRunner('asgn-002', studentId);
    expect(runner).toBeDefined();
    expect(runner!.questions.length).toBeGreaterThan(0);

    let leakedKeys = false;
    runner?.questions.forEach((q: any) => {
      if (
        q._correctOptionIndex !== undefined ||
        q.correctOptionIndex !== undefined ||
        q._correctSentence !== undefined ||
        q.correctSentence !== undefined ||
        q.explanation !== undefined
      ) {
        leakedKeys = true;
      }
    });
    expect(leakedKeys).toBe(false);
  });

  it('TEST 07 - 10: Attempt starting lifecycle & idempotency', async () => {
    const attempt = await studentAttemptService.startAttempt('asgn-002', studentId);
    expect(attempt).toBeDefined();
    expect(attempt.status).toBe('IN_PROGRESS');
    expect(attempt.attemptNumber).toBe(1);

    const activeAttempt = await studentAttemptService.getActiveAttempt('asgn-002', studentId);
    expect(activeAttempt?.id).toBe(attempt.id);

    const resumedAttempt = await studentAttemptService.startAttempt('asgn-002', studentId);
    expect(resumedAttempt.id).toBe(attempt.id);
  });

  it('TEST 11 & 12: Autosave answers with sequence numbering and stale sequence rejection', async () => {
    const attempt = await studentAttemptService.startAttempt('asgn-002', studentId);

    const saveResult1 = await studentAttemptService.saveAttemptAnswers(
      attempt.id,
      {
        'aq-001': {
          questionId: 'aq-001',
          exerciseType: 'multiple-choice',
          value: 1,
          answeredAt: new Date().toISOString(),
        },
      },
      1,
      30
    );
    expect(saveResult1.saved).toBe(true);

    const staleSave = await studentAttemptService.saveAttemptAnswers(
      attempt.id,
      {
        'aq-001': {
          questionId: 'aq-001',
          exerciseType: 'multiple-choice',
          value: 0,
          answeredAt: new Date().toISOString(),
        },
      },
      0, // Older sequence
      20
    );
    expect(staleSave.saved).toBe(false);
  });

  it('TEST 13 - 18: Submission workflow, idempotency, lock and summary', async () => {
    const attempt = await studentAttemptService.startAttempt('asgn-002', studentId);

    const submitted = await studentAttemptService.submitAttempt(
      attempt.id,
      studentId,
      {
        'aq-001': {
          questionId: 'aq-001',
          exerciseType: 'multiple-choice',
          value: 1,
          answeredAt: new Date().toISOString(),
        },
      },
      120
    );
    expect(submitted.status).toBe('SUBMITTED');
    expect(Boolean(submitted.submittedAt)).toBe(true);

    // Duplicate submission is idempotent
    const dupeSubmit = await studentAttemptService.submitAttempt(attempt.id, studentId);
    expect(dupeSubmit.status).toBe('SUBMITTED');

    // Editing locked after submission
    const postSubmitSave = await studentAttemptService.saveAttemptAnswers(
      attempt.id,
      {
        'aq-001': {
          questionId: 'aq-001',
          exerciseType: 'multiple-choice',
          value: 3,
          answeredAt: new Date().toISOString(),
        },
      },
      99
    );
    expect(postSubmitSave.saved).toBe(false);

    // Summary receipt
    const summary = await studentAttemptService.getAttemptSummary(attempt.id, studentId);
    expect(summary?.attempt.status).toBe('SUBMITTED');
    expect(summary?.answeredCount).toBe(1);
  });

  it('TEST 19 - 25: Exercise type capability constraints', () => {
    expect(isExerciseTypeSupported('multiple-choice').supported).toBe(true);
    expect(isExerciseTypeSupported('fill-blank').supported).toBe(true);
    expect(isExerciseTypeSupported('sentence-order').supported).toBe(true);
    expect(isExerciseTypeSupported('matching').supported).toBe(true);
    expect(isExerciseTypeSupported('pronunciation').supported).toBe(false);
    expect(isExerciseTypeSupported('speaking').supported).toBe(false);
    expect(isExerciseTypeSupported('hanzi-writing').supported).toBe(false);
  });
});
