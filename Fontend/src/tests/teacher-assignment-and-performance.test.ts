// @ts-ignore
import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { teacherPortalService } from '../management/teacher/services/teacher-portal.service';
import { assignmentService } from '../management/teacher/services/assignment.service';
import { authTokenService } from '../core/api/client/auth-token.service';

describe('Teacher Module Phase 2: Assignment, Performance & Attendance Contracts', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Set a dummy access token for testing real API flow
    authTokenService.setTokens({ accessToken: 'mock-teacher-token' });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  it('1. getClassCurriculum makes GET request to /api/v1/teacher/classes/:classId/curriculum', async () => {
    const classId = 'cls-test-123';
    let requestedUrl = '';
    let requestedHeaders: any = {};

    globalThis.fetch = mock(async (url: any, options: any) => {
      requestedUrl = String(url);
      requestedHeaders = options?.headers || {};
      return new Response(
        JSON.stringify({
          classId,
          className: 'HSK 1 Lớp A',
          courseId: 'crs-1',
          courseTitle: 'Giáo trình HSK 1 Chuẩn',
          hskLevelId: 'level-hsk-1',
          units: [
            {
              id: 'unit-1',
              unitNumber: 1,
              title: 'Bài 1: Xin chào',
              lessons: [
                {
                  id: 'les-1',
                  lessonNumber: 1,
                  title: '你好',
                  pinyinTitle: 'nǐ hǎo',
                  vietnameseTitle: 'Xin chào',
                  isPublished: true,
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const curriculum = await teacherPortalService.getClassCurriculum(classId);

    expect(requestedUrl).toContain(`/teacher/classes/${classId}/curriculum`);
    expect(requestedHeaders['Authorization']).toBe('Bearer mock-teacher-token');
    expect(curriculum.classId).toBe(classId);
    expect(curriculum.units.length).toBe(1);
    expect(curriculum.units[0].lessons[0].title).toBe('你好');
  });

  it('2. setClassCurriculum makes PUT request to /api/v1/teacher/classes/:classId/curriculum with courseId', async () => {
    const classId = 'cls-test-123';
    const courseId = 'crs-target-456';
    let requestedMethod = '';
    let requestedBody: any = {};

    globalThis.fetch = mock(async (_url: any, options: any) => {
      requestedMethod = options?.method;
      requestedBody = JSON.parse(options?.body || '{}');
      return new Response(
        JSON.stringify({ success: true, message: 'Đã cập nhật giáo trình' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const success = await teacherPortalService.setClassCurriculum(classId, courseId);

    expect(requestedMethod).toBe('PUT');
    expect(requestedBody.courseId).toBe(courseId);
    expect(success).toBe(true);
  });

  it('3. getClassPerformance makes GET request and returns structured KPI and student summaries', async () => {
    const classId = 'cls-test-123';
    let requestedUrl = '';

    globalThis.fetch = mock(async (url: any) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          classId,
          className: 'HSK 2 Nâng cao',
          classCode: 'HSK2-ADV',
          totalStudents: 15,
          averageAttendanceRate: 88.5,
          totalAssignmentsAssigned: 5,
          averageAssignmentScore: 82.0,
          submissionRate: 90.0,
          gradeDistribution: {
            excellentCount: 6,
            goodCount: 5,
            averageCount: 3,
            poorCount: 1,
          },
          studentSummaries: [
            {
              studentId: 'std-1',
              studentName: 'Trần Văn B',
              studentEmail: 'b@hub.vn',
              attendanceRate: 95.0,
              assignmentsCompleted: 5,
              totalAssignments: 5,
              averageScore: 92.5,
              status: 'ACTIVE',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const performance = await teacherPortalService.getClassPerformance(classId);

    expect(requestedUrl).toContain(`/teacher/classes/${classId}/performance`);
    expect(performance.totalStudents).toBe(15);
    expect(performance.averageAttendanceRate).toBe(88.5);
    expect(performance.gradeDistribution.excellentCount).toBe(6);
    expect(performance.studentSummaries.length).toBe(1);
    expect(performance.studentSummaries[0].averageScore).toBe(92.5);
  });

  it('4. recordClassAttendance makes POST request with student records and date', async () => {
    const classId = 'cls-test-123';
    let requestedUrl = '';
    let requestedMethod = '';
    let requestedBody: any = {};

    globalThis.fetch = mock(async (url: any, options: any) => {
      requestedUrl = String(url);
      requestedMethod = options?.method;
      requestedBody = JSON.parse(options?.body || '{}');
      return new Response(
        JSON.stringify([
          {
            id: 'att-1',
            classId,
            studentId: 'std-1',
            studentName: 'Học viên A',
            studentEmail: 'a@hub.vn',
            attendanceDate: '2026-11-19',
            status: 'PRESENT',
            recordedByTeacherId: 'tch-1',
            createdAt: '2026-11-19T10:00:00Z',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const payload = {
      attendanceDate: '2026-11-19',
      records: [{ studentId: 'std-1', status: 'PRESENT' as const, notes: 'Có mặt đúng giờ' }],
    };

    const records = await teacherPortalService.recordClassAttendance(classId, payload);

    expect(requestedUrl).toContain(`/teacher/classes/${classId}/attendance`);
    expect(requestedMethod).toBe('POST');
    expect(requestedBody.attendanceDate).toBe('2026-11-19');
    expect(requestedBody.records.length).toBe(1);
    expect(records.length).toBe(1);
    expect(records[0].status).toBe('PRESENT');
  });

  it('5. getClassAttendanceSummary makes GET request to summary endpoint', async () => {
    const classId = 'cls-test-123';
    let requestedUrl = '';

    globalThis.fetch = mock(async (url: any) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          classId,
          className: 'HSK 1 Lớp A',
          totalSessionsHeld: 12,
          averageAttendanceRate: 91.2,
          students: [
            {
              studentId: 'std-1',
              studentName: 'Nguyễn Văn A',
              studentEmail: 'a@hub.vn',
              totalSessions: 12,
              presentCount: 11,
              lateCount: 1,
              absentCount: 0,
              excusedCount: 0,
              attendanceRate: 95.8,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const summary = await teacherPortalService.getClassAttendanceSummary(classId);

    expect(requestedUrl).toContain(`/teacher/classes/${classId}/attendance/summary`);
    expect(summary.totalSessionsHeld).toBe(12);
    expect(summary.averageAttendanceRate).toBe(91.2);
    expect(summary.students.length).toBe(1);
    expect(summary.students[0].presentCount).toBe(11);
  });

  it('6. assignmentService.getAssignments calls backend API and parses paginated summary', async () => {
    let requestedUrl = '';

    globalThis.fetch = mock(async (url: any) => {
      requestedUrl = String(url);
      return new Response(
        JSON.stringify({
          items: [
            {
              id: 'asgn-api-1',
              title: 'Bài tập tuần 1',
              description: 'Mô tả bài tập',
              hskLevelId: 'level-hsk-1',
              hskLevelName: 'HSK 1',
              hskLevelColor: '#4338ca',
              status: 'PUBLISHED',
              timeLimitMinutes: 30,
              maxAttempts: 2,
              retakePolicy: 'HIGHEST_SCORE',
              passingPoints: 60,
              allowLateSubmission: true,
              questionsCount: 10,
              totalPoints: 100,
              assignedClassNames: ['HSK 1 Lớp A'],
              firstDueDate: '2026-11-25T00:00:00Z',
              publishedAt: '2026-11-19T00:00:00Z',
              createdAt: '2026-11-19T00:00:00Z',
            },
          ],
          totalItems: 1,
          pageNumber: 1,
          pageSize: 10,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const res = await assignmentService.getAssignments(
      { search: 'tuần 1', hskLevelId: 'ALL', classId: 'ALL', status: 'ALL' },
      { page: 1, pageSize: 10 }
    );

    expect(requestedUrl).toContain('/teacher/assignments');
    expect(requestedUrl).toContain('search=tu%E1%BA%A7n+1');
    expect(res.items.length).toBe(1);
    expect(res.items[0].id).toBe('asgn-api-1');
    expect(res.items[0].questionCount).toBe(10);
    expect(res.items[0].totalPoints).toBe(100);
    expect(res.items[0].status).toBe('PUBLISHED');
  });
});
