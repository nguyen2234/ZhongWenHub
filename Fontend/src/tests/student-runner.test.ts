/**
 * Phase 2B.2 Automated Test Suite
 * Validates Student Homework List, Assignment Detail, Attempt Lifecycle,
 * Autosave sequence protection, Submission idempotency, and Exam Runner constraints.
 */

import { studentHomeworkService } from '../features/homework/services/student-homework.service';
import { studentAttemptService } from '../features/homework/services/student-attempt.service';
import { isExerciseTypeSupported } from '../features/exercise-engine/utils/exercise-capability';

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
  console.log('=== STARTING PHASE 2B.2 STUDENT RUNNER TESTS ===\n');

  const studentId = 'usr-st-01'; // Trần Thị Thu Thảo (enrolled in cls-001)

  // TEST 1: Enrolled student sees published assignment
  const assignments = await studentHomeworkService.getMyAssignments(studentId);
  assert(assignments.length > 0, 'TEST 01: Enrolled student discovers published homework');
  const targetAsgn = assignments.find((a) => a.assignmentId === 'asgn-002');
  assert(Boolean(targetAsgn), 'TEST 02: Student finds asgn-002 in assigned list');

  // TEST 2: Assignment Detail retrieval
  const detail = await studentHomeworkService.getAssignmentDetail('asgn-002', studentId);
  assert(Boolean(detail && detail.title === 'Ngữ pháp câu chữ 把 và 被'), 'TEST 03: Assignment detail returns correct metadata');
  assert(detail?.canStartAttempt === true, 'TEST 04: Eligible student can start attempt');

  // TEST 3: Runner question sanitization (No answer keys exposed)
  const runner = await studentHomeworkService.getAssignmentRunner('asgn-002', studentId);
  assert(Boolean(runner && runner.questions.length > 0), 'TEST 05: Runner package retrieved with sanitized questions');
  
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
  assert(!leakedKeys, 'TEST 06: StudentRunnerQuestionDTO strictly suppresses answers, keys, and explanations');

  // TEST 4: Attempt starting lifecycle
  const attempt = await studentAttemptService.startAttempt('asgn-002', studentId);
  assert(Boolean(attempt && attempt.status === 'IN_PROGRESS'), 'TEST 07: Attempt started with status IN_PROGRESS');
  assert(attempt.attemptNumber === 1, 'TEST 08: First attempt assigned attemptNumber = 1');

  // TEST 5: Active attempt idempotency (starting again returns same active attempt)
  const activeAttempt = await studentAttemptService.getActiveAttempt('asgn-002', studentId);
  assert(activeAttempt?.id === attempt.id, 'TEST 09: getActiveAttempt returns the unique ongoing attempt');
  const resumedAttempt = await studentAttemptService.startAttempt('asgn-002', studentId);
  assert(resumedAttempt.id === attempt.id, 'TEST 10: startAttempt resumes active attempt idempotently');

  // TEST 6: Autosave answers with sequence numbering
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
  assert(saveResult1.saved === true, 'TEST 11: Autosave successfully persists draft with sequence 1');

  // TEST 7: Stale sequence rejection
  const staleSave = await studentAttemptService.saveAttemptAnswers(
    attempt.id,
    {
      'aq-001': {
        questionId: 'aq-001',
        exerciseType: 'multiple-choice',
        value: 0, // Outdated stale answer
        answeredAt: new Date().toISOString(),
      },
    },
    0, // Older sequence
    20
  );
  assert(staleSave.saved === false, 'TEST 12: Stale save request with older sequence is rejected');

  // TEST 8: Submission workflow
  const submitted = await studentAttemptService.submitAttempt(attempt.id, studentId, {
    'aq-001': {
      questionId: 'aq-001',
      exerciseType: 'multiple-choice',
      value: 1,
      answeredAt: new Date().toISOString(),
    },
  }, 120);
  assert(submitted.status === 'SUBMITTED', 'TEST 13: Attempt status transitioned to SUBMITTED');
  assert(Boolean(submitted.submittedAt), 'TEST 14: submittedAt timestamp is recorded');

  // TEST 9: Duplicate submission is idempotent
  const dupeSubmit = await studentAttemptService.submitAttempt(attempt.id, studentId);
  assert(dupeSubmit.status === 'SUBMITTED', 'TEST 15: Re-submitting is idempotent');

  // TEST 10: Editing locked after submission
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
  assert(postSubmitSave.saved === false, 'TEST 16: Editing answers is locked after submission');

  // TEST 11: Submission receipt summary
  const summary = await studentAttemptService.getAttemptSummary(attempt.id, studentId);
  assert(Boolean(summary && summary.attempt.status === 'SUBMITTED'), 'TEST 17: Attempt summary returns submission receipt');
  assert(summary?.answeredCount === 1, 'TEST 18: Summary records exact answered question count');

  // TEST 12: Unsupported question type blocking check
  assert(isExerciseTypeSupported('multiple-choice').supported === true, 'TEST 19: multiple-choice is supported');
  assert(isExerciseTypeSupported('fill-blank').supported === true, 'TEST 20: fill-blank is supported');
  assert(isExerciseTypeSupported('sentence-order').supported === true, 'TEST 21: sentence-order is supported');
  assert(isExerciseTypeSupported('matching').supported === true, 'TEST 22: matching is supported');
  assert(isExerciseTypeSupported('pronunciation').supported === false, 'TEST 23: pronunciation is blocked in runner');
  assert(isExerciseTypeSupported('speaking').supported === false, 'TEST 24: speaking is blocked in runner');
  assert(isExerciseTypeSupported('hanzi-writing').supported === false, 'TEST 25: hanzi-writing is blocked in runner');

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed`);
  }
}

runTests().catch((e) => {
  console.error(e);
  // Process failure
});
