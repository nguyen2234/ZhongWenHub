import { assignmentService } from '../management/teacher/services/assignment.service';
import { studentHomeworkService } from '../features/homework/services/student-homework.service';
import { getCurrentStudentIdentity, setDevStudentIdentity } from '../features/auth/services/student-identity.adapter';
import { isExerciseTypeSupported } from '../features/exercise-engine';
import { resolveHskLevelMeta, hskLevelIdToNumber, hskNumberToLevelId } from '../utils/hsk.utils';

async function runTests() {
  console.log('=== STARTING PRE-PHASE 2B.1 INTEGRATION FOUNDATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 01: Teacher creates and publishes an assignment
    // -------------------------------------------------------------
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

    assert(newAsgn.status === 'DRAFT', 'TEST 01A: Created assignment is in DRAFT status');
    assert(newAsgn.questions.length === 2, 'TEST 01B: Assignment has 2 questions');

    const published = await assignmentService.publishAssignment(newAsgn.id);
    assert(published.status === 'PUBLISHED', 'TEST 01: Teacher creates and publishes an assignment');

    // -------------------------------------------------------------
    // TEST 02: Student enrolled in the assigned class can discover that assignment
    // usr-st-01 is enrolled in cls-001
    // -------------------------------------------------------------
    const student1Assignments = await studentHomeworkService.getMyAssignments('usr-st-01');
    const foundPublished = student1Assignments.find((a) => a.assignmentId === published.id);
    assert(
      foundPublished !== undefined && foundPublished.className.includes('HSK 3'),
      'TEST 02: Student enrolled in the assigned class can discover that assignment'
    );

    // -------------------------------------------------------------
    // TEST 03: Student outside the assigned class cannot access the assignment
    // usr-st-10 is enrolled in cls-002 only, NOT cls-001
    // -------------------------------------------------------------
    const student10Assignments = await studentHomeworkService.getMyAssignments('usr-st-10');
    const foundByStudent10 = student10Assignments.find((a) => a.assignmentId === published.id);
    assert(foundByStudent10 === undefined, 'TEST 03A: Outside student list excludes assignment');

    const runnerForbidden = await studentHomeworkService.getAssignmentRunner(published.id, 'usr-st-10');
    assert(runnerForbidden === undefined, 'TEST 03: Student outside the assigned class cannot access the assignment');

    // -------------------------------------------------------------
    // TEST 04: Draft assignment is not visible to students
    // asgn-003 is a pre-seeded DRAFT assignment
    // -------------------------------------------------------------
    const student1All = await studentHomeworkService.getMyAssignments('usr-st-01');
    const draftFound = student1All.find((a) => a.status === 'DRAFT' || a.assignmentId === 'asgn-003');
    assert(draftFound === undefined, 'TEST 04A: Draft assignments never listed for student');

    const draftDetail = await studentHomeworkService.getAssignmentDetail('asgn-003', 'usr-st-01');
    assert(draftDetail === undefined, 'TEST 04: Draft assignment is not visible to students');

    // -------------------------------------------------------------
    // TEST 05: Published assignment snapshots preserve matching and sentence-order data
    // asgn-001 has matching (aq-002), asgn-002 has sentence-order (aq-006)
    // -------------------------------------------------------------
    const asgn1Detail = await assignmentService.getAssignmentById('asgn-001');
    const matchingQ = asgn1Detail?.questions.find((q) => q.exerciseType === 'matching');
    const asgn2Detail = await assignmentService.getAssignmentById('asgn-002');
    const sentenceQ = asgn2Detail?.questions.find((q) => q.exerciseType === 'sentence-order');

    const matchingSnapshotValid = Boolean(matchingQ?.isSnapshotted);
    const sentenceSnapshotValid = Boolean(sentenceQ?.isSnapshotted);

    // Also check the runner for asgn-002 which contains sentence-order
    const asgn2Runner = await studentHomeworkService.getAssignmentRunner('asgn-002', 'usr-st-01');
    const runnerSentenceQ = asgn2Runner?.questions.find((q) => q.exerciseType === 'sentence-order');
    const hasTokens = Boolean(runnerSentenceQ?.sentenceTokens && runnerSentenceQ.sentenceTokens.length > 0);

    assert(
      matchingSnapshotValid && sentenceSnapshotValid && hasTokens,
      'TEST 05: Published assignment snapshots preserve matching and sentence-order data'
    );

    // -------------------------------------------------------------
    // TEST 06: Student runner DTO contains no answer keys or hidden explanations
    // -------------------------------------------------------------
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
    assert(!leakDetected, 'TEST 06: Student runner DTO contains no answer keys or hidden explanations');

    // -------------------------------------------------------------
    // TEST 07: Exam mode capabilities & unsupported fallback flags
    // -------------------------------------------------------------
    const suppMC = isExerciseTypeSupported('multiple-choice');
    const suppListen = isExerciseTypeSupported('listen-choice');
    const suppPronounce = isExerciseTypeSupported('pronunciation');
    const suppWriting = isExerciseTypeSupported('hanzi-writing');

    assert(
      suppMC.supported &&
        suppListen.supported &&
        !suppPronounce.supported &&
        !suppWriting.supported &&
        Boolean(suppPronounce.reason),
      'TEST 07: Exam mode unsupported capability flags operate cleanly'
    );

    // -------------------------------------------------------------
    // TEST 08: Practice mode and Exercise Engine types integrity
    // -------------------------------------------------------------
    assert(
      isExerciseTypeSupported('fill-blank').supported &&
        isExerciseTypeSupported('sentence-order').supported &&
        isExerciseTypeSupported('matching').supported,
      'TEST 08: Practice mode exercise types maintain compatibility'
    );

    // -------------------------------------------------------------
    // TEST 09: Lesson Player compatibility & normalization
    // -------------------------------------------------------------
    const hsk2Meta = resolveHskLevelMeta('level-hsk-2');
    const hsk2Num = hskLevelIdToNumber('level-hsk-2');
    const hsk2Roundtrip = hskNumberToLevelId(hsk2Num);

    assert(
      hsk2Meta.name === 'HSK 2' && hsk2Num === 2 && hsk2Roundtrip === 'level-hsk-2',
      'TEST 09: Lesson Player HSK level normalization operates bidirectionally'
    );

    // -------------------------------------------------------------
    // TEST 10: HSK 7–9 remains supported
    // -------------------------------------------------------------
    const hsk79Meta = resolveHskLevelMeta('level-hsk-79');
    const hsk79Num = hskLevelIdToNumber('level-hsk-79');
    const hsk79Roundtrip = hskNumberToLevelId(7);

    assert(
      hsk79Meta.name === 'HSK 7–9' && hsk79Num === 7 && hsk79Roundtrip === 'level-hsk-79',
      'TEST 10: HSK 7–9 remains supported across repository and normalizers'
    );

    // -------------------------------------------------------------
    // TEST 11: Existing Teacher Assignment Management continues functioning
    // -------------------------------------------------------------
    const teacherList = await assignmentService.getAssignments(
      { search: '', hskLevelId: 'ALL', classId: 'ALL', status: 'ALL' },
      { page: 1, pageSize: 10 }
    );
    assert(
      teacherList.totalItems >= 5 && teacherList.items.every((a) => a.id.startsWith('asgn-')),
      'TEST 11: Existing Teacher Assignment Management continues functioning with full CRUD'
    );

    // -------------------------------------------------------------
    // TEST 12: Student identity adapter allows switching
    // -------------------------------------------------------------
    const defaultStudent = getCurrentStudentIdentity();
    setDevStudentIdentity('usr-st-10');
    const switchedStudent = getCurrentStudentIdentity();
    setDevStudentIdentity(defaultStudent.id); // restore
    assert(
      defaultStudent.id === 'usr-st-01' && switchedStudent.id === 'usr-st-10',
      'TEST 12: Student identity adapter cleanly manages dev student identities'
    );

  } catch (error) {
    console.error('Test execution threw an unexpected error:', error);
    failed++;
  }

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    throw new Error(`Test suite completed with ${failed} failures.`);
  }
}

runTests();
