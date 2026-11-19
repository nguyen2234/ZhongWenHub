// @ts-ignore
import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { assignmentService } from '../management/teacher/services/assignment.service';
import { studentHomeworkService } from '../features/homework/services/student-homework.service';
import { studentAttemptService } from '../features/homework/services/student-attempt.service';
import { authTokenService } from '../core/api/client/auth-token.service';
import type { CreateAssignmentDTO } from '../management/teacher/types/assignment.types';

describe('Teacher & Student Homework Real API Flow Contracts', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    authTokenService.setTokens({ accessToken: 'test-real-flow-token' });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  it('1. assignmentService.createAssignment posts real payload with enriched questions to backend', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    globalThis.fetch = mock(async (url: any, options: any) => {
      const urlStr = String(url);
      if (options?.method === 'POST') {
        capturedUrl = urlStr;
        capturedMethod = options.method;
        capturedBody = JSON.parse(options.body || '{}');

        return new Response(
          JSON.stringify({
            id: 'asgn-new-123',
            title: capturedBody.title,
            description: capturedBody.description,
            hskLevelId: capturedBody.hskLevelId,
            status: 'DRAFT',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // GET by id
      return new Response(
        JSON.stringify({
          id: 'asgn-new-123',
          teacherId: 'tch-curr',
          title: 'Bài tập ngữ pháp HSK 2',
          description: 'Hoàn thành trước hạn',
          hskLevelId: 'level-hsk-2',
          status: 'DRAFT',
          timeLimitMinutes: 45,
          maxAttempts: 3,
          retakePolicy: 'HIGHEST_SCORE',
          passingPoints: 60,
          allowLateSubmission: false,
          totalPoints: 20,
          questions: [
            {
              id: 'q-1',
              assignmentId: 'asgn-new-123',
              prompt: 'Chọn từ đúng điền vào chỗ trống',
              type: 'MULTIPLE_CHOICE',
              points: 10,
              orderIndex: 0,
              options: ['看', '听', '说', '写'],
              correctOptionIndex: 0,
            },
          ],
          targets: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const dto: CreateAssignmentDTO = {
      title: 'Bài tập ngữ pháp HSK 2',
      description: 'Hoàn thành trước hạn',
      hskLevelId: 'level-hsk-2',
      timeLimitMinutes: 45,
      maxAttempts: 3,
      retakePolicy: 'HIGHEST_SCORE',
      passingPoints: 60,
      allowLateSubmission: false,
      questions: [
        {
          questionId: 'q-bank-001',
          questionBankId: 'q-bank-001',
          prompt: 'Chọn từ đúng điền vào chỗ trống',
          questionType: 'MULTIPLE_CHOICE',
          order: 1,
          points: 10,
          options: ['看', '听', '说', '写'],
          correctAnswer: '看',
          explanation: 'Dựa vào ngữ cảnh câu',
        },
      ],
      classAssignments: [
        {
          classId: 'class-001',
          dueDate: '2026-12-01T23:59:59Z',
          startDate: '2026-11-20T00:00:00Z',
        },
      ],
    };

    const result = await assignmentService.createAssignment(dto);

    expect(capturedUrl).toContain('/teacher/assignments');
    expect(capturedMethod).toBe('POST');
    expect(capturedBody.title).toBe('Bài tập ngữ pháp HSK 2');
    expect(capturedBody.questions.length).toBe(1);
    expect(capturedBody.questions[0].prompt).toBe('Chọn từ đúng điền vào chỗ trống');
    expect(capturedBody.questions[0].options).toEqual(['看', '听', '说', '写']);
    expect(capturedBody.questions[0].correctAnswer).toBe('看');
    expect(result.id).toBe('asgn-new-123');
  });

  it('2. assignmentService.gradeSubmission posts score and feedback to real grading endpoint', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    globalThis.fetch = mock(async (url: any, options: any) => {
      capturedUrl = String(url);
      capturedMethod = options?.method;
      capturedBody = JSON.parse(options?.body || '{}');

      return new Response(
        JSON.stringify({
          id: 'sub-456',
          status: 'GRADED',
          score: capturedBody.score,
          teacherFeedback: capturedBody.teacherFeedback,
          gradedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const result = await assignmentService.gradeSubmission('sub-456', {
      score: 95,
      teacherFeedback: 'Làm bài rất tốt, phát âm và ngữ pháp chuẩn xác!',
    });

    expect(capturedUrl).toContain('/teacher/submissions/sub-456/grade');
    expect(capturedMethod).toBe('POST');
    expect(capturedBody.score).toBe(95);
    expect(capturedBody.teacherFeedback).toContain('Làm bài rất tốt');
    expect(result.status).toBe('GRADED');
  });

  it('3. assignmentService publish and close invoke real lifecycle endpoints', async () => {
    const calledEndpoints: string[] = [];

    globalThis.fetch = mock(async (url: any) => {
      const urlStr = String(url);
      calledEndpoints.push(urlStr);

      if (urlStr.endsWith('/publish')) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (urlStr.endsWith('/close')) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Mock getAssignmentById
      return new Response(
        JSON.stringify({
          id: 'asgn-life-1',
          teacherId: 'tch-1',
          title: 'Bài tập chu kỳ sống',
          hskLevelId: 'level-hsk-1',
          status: 'PUBLISHED',
          questions: [],
          targets: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    await assignmentService.publishAssignment('asgn-life-1');
    await assignmentService.closeAssignment('asgn-life-1');

    expect(calledEndpoints.some((url) => url.includes('/teacher/assignments/asgn-life-1/publish'))).toBe(true);
    expect(calledEndpoints.some((url) => url.includes('/teacher/assignments/asgn-life-1/close'))).toBe(true);
  });

  it('4. studentHomeworkService interacts with student assignment endpoints', async () => {
    let capturedListUrl = '';
    let capturedStartUrl = '';

    globalThis.fetch = mock(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/student/homework/asgn-s1/start')) {
        capturedStartUrl = urlStr;
        return new Response(
          JSON.stringify({
            submissionId: 'att-s1',
            assignmentId: 'asgn-s1',
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      capturedListUrl = urlStr;
      return new Response(
        JSON.stringify([
          {
            assignmentId: 'asgn-s1',
            title: 'Bài tập về nhà 1',
            dueDate: '2026-11-30T00:00:00Z',
            status: 'NOT_STARTED',
            maxScore: 100,
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const list = await studentHomeworkService.getMyAssignments();
    expect(capturedListUrl).toContain('/student/homework');
    expect(list.length).toBe(1);
    expect(list[0].assignmentId).toBe('asgn-s1');

    const attempt = await studentHomeworkService.startAttempt('asgn-s1');
    expect(capturedStartUrl).toContain('/student/homework/asgn-s1/start');
    expect(attempt.submissionId).toBe('att-s1');
  });

  it('5. studentAttemptService submits mapped answers to student submission endpoint', async () => {
    let capturedSubmitUrl = '';
    let capturedBody: any = null;

    globalThis.fetch = mock(async (url: any, options: any) => {
      capturedSubmitUrl = String(url);
      capturedBody = JSON.parse(options?.body || '{}');

      return new Response(
        JSON.stringify({
          submissionId: 'sub-std-99',
          score: 85,
          earnedPoints: 85,
          totalPoints: 100,
          passed: true,
          status: 'GRADED',
          feedback: 'Khá tốt',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const result = await studentAttemptService.submitAttempt(
      'sub-std-99',
      'student-curr',
      {
        'q-1': {
          questionId: 'q-1',
          value: 'B',
        },
        'q-2': {
          questionId: 'q-2',
          value: 2,
        },
      },
      320
    );

    expect(capturedSubmitUrl).toContain('/student/homework/submissions/sub-std-99/submit');
    expect(capturedBody.timeSpentSeconds).toBe(320);
    expect(capturedBody.answers.length).toBe(2);
    expect(capturedBody.answers[0].questionId).toBe('q-1');
    expect(capturedBody.answers[0].selectedOption).toBe('B');
    expect(capturedBody.answers[1].questionId).toBe('q-2');
    expect(capturedBody.answers[1].selectedOption).toBe('C'); // 2 -> index 2 -> C
    expect(result.totalScore).toBe(85);
    expect(result.isPassed).toBe(true);
    expect(result.status).toBe('SUBMITTED');
  });

  it('6. ClassCurriculumTab is cleanly exported and ready for teacher class detail routing', async () => {
    const { ClassCurriculumTab } = await import(
      '../management/teacher/components/class-detail/ClassCurriculumTab'
    );
    expect(typeof ClassCurriculumTab).toBe('function');
  });
});
