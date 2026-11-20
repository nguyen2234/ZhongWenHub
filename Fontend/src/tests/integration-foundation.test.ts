import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { assignmentService } from '../management/teacher/services/assignment.service';
import { studentHomeworkService } from '../features/homework/services/student-homework.service';
import { getCurrentStudentIdentity, setDevStudentIdentity } from '../features/auth/services/student-identity.adapter';
import { isExerciseTypeSupported } from '../features/exercise-engine';
import { resolveHskLevelMeta, hskLevelIdToNumber, hskNumberToLevelId } from '../utils/hsk.utils';
import { authTokenService } from '../core/api/client/auth-token.service';
import { teacherPortalService } from '../management/teacher/services/teacher-portal.service';

describe('Pre-Phase 2B.1 Integration Foundation Tests', () => {
  const originalFetch = globalThis.fetch;
  let publishedId = '';

  beforeEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
    setDevStudentIdentity('usr-st-01');
    teacherPortalService.clearEnrolledClassesCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
    setDevStudentIdentity('usr-st-01');
    teacherPortalService.clearEnrolledClassesCache();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
    setDevStudentIdentity('usr-st-01');
    teacherPortalService.clearEnrolledClassesCache();
  });

  it('TEST 01: Teacher creates and publishes an assignment', async () => {
    const newAsgn = await assignmentService.createAssignment({
      title: 'Bài kiểm tra Ngữ pháp Tổng hợp HSK 3 - K24',
      description: 'Kiểm tra ôn tập các cấu trúc ngữ pháp quan trọng',
      hskLevelId: 'level-hsk-3',
      timeLimitMinutes: 45,
      maxAttempts: 2,
      retakePolicy: 'HIGHEST_SCORE',
      passingPoints: 10,
      allowLateSubmission: true,
      latePenaltyPercent: 15,
      shuffleQuestions: true,
      showCorrectAnswers: true,
      questions: [
        { questionBankId: 4, orderIndex: 0, points: 5 },
        { questionBankId: 6, orderIndex: 1, points: 5 },
      ],
      targets: [
        { classId: 'cls-001', dueDate: '2026-10-30', closeDate: '2026-11-05' },
      ],
    });

    expect(newAsgn.status).toBe('DRAFT');
    expect(newAsgn.questions.length).toBe(2);

    const published = await assignmentService.publishAssignment(newAsgn.id);
    publishedId = published.id;
    expect(published.status).toBe('PUBLISHED');
  });

  it('TEST 02: Student enrolled in the assigned class can discover that assignment', async () => {
    // usr-st-01 is enrolled in cls-001
    const student1Assignments = await studentHomeworkService.getMyAssignments('usr-st-01');
    expect(student1Assignments.length).toBeGreaterThan(0);
    const foundPublished = student1Assignments.find((a) => a.assignmentId === publishedId);
    expect(foundPublished).toBeDefined();
    expect(foundPublished?.className).toContain('HSK 3');
  });

  it('TEST 03: Student outside the assigned class cannot access the assignment', async () => {
    // usr-st-10 is enrolled in cls-002 only, NOT cls-001
    const student10Assignments = await studentHomeworkService.getMyAssignments('usr-st-10');
    const forbiddenAsgn = student10Assignments.find((a) => a.assignmentId === publishedId);
    expect(forbiddenAsgn).toBeUndefined();

    const runnerForbidden = await studentHomeworkService.getAssignmentRunner(publishedId, 'usr-st-10');
    expect(runnerForbidden).toBeUndefined();
  });

  it('TEST 04: Draft assignment is not visible to students', async () => {
    // asgn-003 is a pre-seeded DRAFT assignment
    const student1All = await studentHomeworkService.getMyAssignments('usr-st-01');
    const draftFound = student1All.find((a) => a.status === 'DRAFT' || a.assignmentId === 'asgn-003');
    expect(draftFound).toBeUndefined();

    const draftDetail = await studentHomeworkService.getAssignmentDetail('asgn-003', 'usr-st-01');
    expect(draftDetail).toBeUndefined();
  });

  it('TEST 05: Published assignment snapshots preserve matching and sentence-order data', async () => {
    // asgn-001 has matching (aq-002), asgn-002 has sentence-order (aq-006)
    const asgn1Detail = await assignmentService.getAssignmentById('asgn-001');
    const matchingQ = asgn1Detail?.questions.find((q) => q.exerciseType === 'matching');
    const asgn2Detail = await assignmentService.getAssignmentById('asgn-002');
    const sentenceQ = asgn2Detail?.questions.find((q) => q.exerciseType === 'sentence-order');

    expect(matchingQ?.isSnapshotted).toBe(true);
    expect(sentenceQ?.isSnapshotted).toBe(true);

    // Also check the runner for asgn-002 which contains sentence-order
    const asgn2Runner = await studentHomeworkService.getAssignmentRunner('asgn-002', 'usr-st-01');
    const runnerSentenceQ = asgn2Runner?.questions.find((q) => q.exerciseType === 'sentence-order');
    expect(runnerSentenceQ?.sentenceTokens).toBeDefined();
    expect(runnerSentenceQ?.sentenceTokens!.length).toBeGreaterThan(0);
  });

  it('TEST 06: Student runner DTO contains no answer keys or hidden explanations', async () => {
    const asgn2Runner = await studentHomeworkService.getAssignmentRunner('asgn-002', 'usr-st-01');
    let leakDetected = false;
    asgn2Runner?.questions.forEach((q: any) => {
      if (
        q._correctOptionIndex !== undefined ||
        q._correctSentence !== undefined ||
        q.correctOptionIndex !== undefined ||
        q.correctSentence !== undefined ||
        q.explanation !== undefined
      ) {
        leakDetected = true;
      }
    });
    expect(leakDetected).toBe(false);
  });

  it('TEST 07: Exam mode capabilities & unsupported fallback flags', () => {
    const suppMC = isExerciseTypeSupported('multiple-choice');
    const suppListen = isExerciseTypeSupported('listen-choice');
    const suppPronounce = isExerciseTypeSupported('pronunciation');
    const suppWriting = isExerciseTypeSupported('hanzi-writing');

    expect(suppMC.supported).toBe(true);
    expect(suppListen.supported).toBe(true);
    expect(suppPronounce.supported).toBe(false);
    expect(suppWriting.supported).toBe(false);
    expect(Boolean(suppPronounce.reason)).toBe(true);
  });

  it('TEST 08: Practice mode and Exercise Engine types integrity', () => {
    expect(isExerciseTypeSupported('fill-blank').supported).toBe(true);
    expect(isExerciseTypeSupported('sentence-order').supported).toBe(true);
    expect(isExerciseTypeSupported('matching').supported).toBe(true);
  });

  it('TEST 09: Lesson Player compatibility & normalization', () => {
    const hsk2Meta = resolveHskLevelMeta('level-hsk-2');
    const hsk2Num = hskLevelIdToNumber('level-hsk-2');
    const hsk2Roundtrip = hskNumberToLevelId(hsk2Num);

    expect(hsk2Meta.name).toBe('HSK 2');
    expect(hsk2Num).toBe(2);
    expect(hsk2Roundtrip).toBe('level-hsk-2');
  });

  it('TEST 10: HSK 7–9 remains supported', () => {
    const hsk79Meta = resolveHskLevelMeta('level-hsk-79');
    const hsk79Num = hskLevelIdToNumber('level-hsk-79');
    const hsk79Roundtrip = hskNumberToLevelId(7);

    expect(hsk79Meta.name).toBe('HSK 7–9');
    expect(hsk79Num).toBe(7);
    expect(hsk79Roundtrip).toBe('level-hsk-79');
  });

  it('TEST 11: Existing Teacher Assignment Management continues functioning', async () => {
    const teacherList = await assignmentService.getAssignments(
      { search: '', hskLevelId: 'ALL', classId: 'ALL', status: 'ALL' },
      { page: 1, pageSize: 10 }
    );
    expect(teacherList.totalItems).toBeGreaterThanOrEqual(5);
    expect(teacherList.items.every((a) => a.id.startsWith('asgn-'))).toBe(true);
  });

  it('TEST 12: Student identity adapter allows switching', () => {
    const defaultStudent = getCurrentStudentIdentity();
    setDevStudentIdentity('usr-st-10');
    const switchedStudent = getCurrentStudentIdentity();
    setDevStudentIdentity(defaultStudent.id); // restore

    expect(defaultStudent.id).toBe('usr-st-01');
    expect(switchedStudent.id).toBe('usr-st-10');
  });
});
