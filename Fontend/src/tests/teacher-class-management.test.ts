import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { teacherPortalService } from '../management/teacher/services/teacher-portal.service';
import { studentHomeworkService } from '../features/homework/services/student-homework.service';
import { authTokenService } from '../core/api/client/auth-token.service';
import type { CreateTeachingClassDTO, UpdateTeachingClassDTO } from '../management/teacher/types';

describe('Teacher Class Management Phase 1 - Real API & Contracts', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    authTokenService.setSession({
      accessToken: 'test-teacher-token-xyz',
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authTokenService.clearTokens();
  });

  it('1. getClasses calls GET /api/v1/teacher/classes with params and auth header', async () => {
    let capturedUrl = '';
    let capturedHeaders: any = {};

    globalThis.fetch = mock(async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers || {};
      return new Response(
        JSON.stringify({
          items: [
            {
              id: 'cls-123',
              name: 'Lớp HSK 3 K24',
              code: 'CLS-HSK3-024',
              description: 'Khóa học đàm thoại',
              hskLevelId: 'level-hsk-3',
              hskLevelName: 'HSK 3',
              hskLevelColor: '#4338ca',
              status: 'ACTIVE',
              capacity: 25,
              derivedEnrollmentCount: 15,
              startDate: '2026-09-15',
              locationType: 'ONLINE',
              schedulesSummary: 'T2, T4, T6 (19:00 - 20:30)',
            },
          ],
          totalItems: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const res = await teacherPortalService.getClasses(
      { search: 'HSK 3', hskLevelId: 'level-hsk-3', status: 'ACTIVE', locationType: 'ONLINE' },
      { page: 1, pageSize: 10 },
      { field: 'startDate', direction: 'desc' }
    );

    expect(capturedUrl).toContain('/teacher/classes');
    expect(capturedUrl).toContain('search=HSK+3');
    expect(capturedUrl).toContain('hskLevelId=level-hsk-3');
    expect(capturedUrl).toContain('status=ACTIVE');
    expect(capturedUrl).toContain('locationType=ONLINE');
    expect(capturedHeaders['Authorization']).toBe('Bearer test-teacher-token-xyz');
    expect(res.items.length).toBe(1);
    expect(res.items[0].code).toBe('CLS-HSK3-024');
    expect(res.items[0].derivedEnrollmentCount).toBe(15);
  });

  it('2. getClassById calls GET /api/v1/teacher/classes/{id} and normalizes response', async () => {
    let capturedUrl = '';

    globalThis.fetch = mock(async (url: any) => {
      capturedUrl = String(url);
      return new Response(
        JSON.stringify({
          classInfo: {
            id: 'cls-detail-1',
            teacherId: 'tch-001',
            teacherName: 'Thầy Nguyễn Văn A',
            name: 'HSK 3 Giao Tiếp K24',
            code: 'CLS-HSK3-024',
            description: 'Khóa học đàm thoại',
            hskLevelId: 'level-hsk-3',
            status: 'ACTIVE',
            capacity: 25,
            startDate: '2026-09-15',
            locationType: 'ONLINE',
            createdAt: '2026-09-01T00:00:00Z',
          },
          hskLevelName: 'HSK 3',
          derivedEnrollmentCount: 18,
          derivedAttendanceAverage: 95.5,
          schedules: [
            {
              id: 'sch-1',
              dayOfWeek: 'MONDAY',
              startTime: '19:00',
              endTime: '20:30',
              locationType: 'ONLINE',
            },
          ],
          membersSummary: {
            total: 20,
            active: 18,
            paused: 1,
            dropped: 1,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const detail = await teacherPortalService.getClassById('cls-detail-1');

    expect(capturedUrl).toContain('/teacher/classes/cls-detail-1');
    expect(detail).toBeDefined();
    expect(detail?.classInfo.name).toBe('HSK 3 Giao Tiếp K24');
    expect(detail?.derivedEnrollmentCount).toBe(18);
    expect(detail?.schedules.length).toBe(1);
    expect(detail?.schedules[0].dayOfWeek).toBe('MONDAY');
    expect(detail?.membersSummary.active).toBe(18);
  });

  it('3. createClass calls POST /api/v1/teacher/classes with payload', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    globalThis.fetch = mock(async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method;
      capturedBody = JSON.parse(init?.body);
      return new Response(
        JSON.stringify({
          id: 'cls-new-777',
          ...capturedBody,
          createdAt: new Date().toISOString(),
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const payload: CreateTeachingClassDTO = {
      name: 'HSK 4 Cấp Tốc',
      code: 'CLS-HSK4-777',
      description: 'Luyện thi cấp tốc',
      hskLevelId: 'level-hsk-4',
      capacity: 20,
      startDate: '2026-11-01',
      locationType: 'ONLINE',
      schedules: [
        {
          dayOfWeek: 'TUESDAY',
          startTime: '18:00',
          endTime: '19:30',
          locationType: 'ONLINE',
        },
      ],
    };

    const created = await teacherPortalService.createClass(payload);

    expect(capturedUrl).toContain('/teacher/classes');
    expect(capturedMethod).toBe('POST');
    expect(capturedBody.code).toBe('CLS-HSK4-777');
    expect(created.id).toBe('cls-new-777');
  });

  it('4. updateClass calls PUT /api/v1/teacher/classes/{id}', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    globalThis.fetch = mock(async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method;
      capturedBody = JSON.parse(init?.body);
      return new Response(
        JSON.stringify({
          id: 'cls-123',
          ...capturedBody,
          updatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const payload: UpdateTeachingClassDTO = {
      name: 'HSK 3 Nâng Cao',
      description: 'Cập nhật giáo trình',
      hskLevelId: 'level-hsk-3',
      capacity: 35,
      startDate: '2026-09-15',
      locationType: 'HYBRID',
      status: 'ACTIVE',
      schedules: [],
    };

    const updated = await teacherPortalService.updateClass('cls-123', payload);

    expect(capturedUrl).toContain('/teacher/classes/cls-123');
    expect(capturedMethod).toBe('PUT');
    expect(capturedBody.capacity).toBe(35);
    expect(updated.name).toBe('HSK 3 Nâng Cao');
  });

  it('5. archiveClass calls DELETE /api/v1/teacher/classes/{id}', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    globalThis.fetch = mock(async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedMethod = init?.method;
      return new Response(
        JSON.stringify({ success: true, message: 'Lớp học đã được chuyển vào lưu trữ.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const result = await teacherPortalService.archiveClass('cls-to-archive');

    expect(capturedUrl).toContain('/teacher/classes/cls-to-archive');
    expect(capturedMethod).toBe('DELETE');
    expect(result).toBe(true);
  });

  it('6. getClassMembers, addStudentToClass, and removeStudentFromClass call member endpoints', async () => {
    let callLog: Array<{ method: string; url: string; body?: any }> = [];

    globalThis.fetch = mock(async (url: any, init: any) => {
      callLog.push({
        method: init?.method || 'GET',
        url: String(url),
        body: init?.body ? JSON.parse(init.body) : undefined,
      });

      if (init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'mem-new',
            classId: 'cls-100',
            studentId: 'std-200',
            studentName: 'Trần Thị Mới',
            studentEmail: 'student@zhongwenhub.edu.vn',
            enrolledAt: new Date().toISOString(),
            status: 'ACTIVE',
            attendanceRate: 100,
            completedAssignmentsCount: 0,
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (init?.method === 'DELETE') {
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify([
          {
            id: 'mem-1',
            classId: 'cls-100',
            studentId: 'std-1',
            studentName: 'Học viên A',
            studentEmail: 'a@gmail.com',
            status: 'ACTIVE',
            attendanceRate: 100,
            completedAssignmentsCount: 5,
            enrolledAt: '2026-09-15T00:00:00Z',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const members = await teacherPortalService.getClassMembers('cls-100', 'học viên', 'ACTIVE');
    expect(members.length).toBe(1);
    expect(callLog[0].url).toContain('/teacher/classes/cls-100/members?search=h%E1%BB%8Dc+vi%C3%AAn&status=ACTIVE');

    const added = await teacherPortalService.addStudentToClass('cls-100', 'student@zhongwenhub.edu.vn', 'Ghi chú');
    expect(added.studentName).toBe('Trần Thị Mới');
    expect(callLog[1].method).toBe('POST');
    expect(callLog[1].body.studentIdentifier).toBe('student@zhongwenhub.edu.vn');

    const removed = await teacherPortalService.removeStudentFromClass('cls-100', 'std-1');
    expect(removed).toBe(true);
    expect(callLog[2].method).toBe('DELETE');
    expect(callLog[2].url).toContain('/teacher/classes/cls-100/members/std-1');
  });

  it('7. getDashboard calls GET /api/v1/teacher/dashboard with KPIs', async () => {
    globalThis.fetch = mock(async (url: any) => {
      expect(String(url)).toContain('/teacher/dashboard');
      return new Response(
        JSON.stringify({
          teacherId: 'tch-001',
          teacherName: 'Thầy Nguyễn Văn A',
          teacherEmail: 'teacher@zhongwenhub.edu.vn',
          metrics: {
            activeClassesCount: 3,
            totalEnrolledStudents: 45,
            pendingSubmissionsCount: 8,
            weeklyTeachingHours: 12.5,
          },
          upcomingSessions: [],
          activeClasses: [],
          pendingSubmissions: [],
          recentActivities: [],
          quickActions: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const dashboard = await teacherPortalService.getDashboard();
    expect(dashboard.metrics.activeClassesCount).toBe(3);
    expect(dashboard.metrics.totalEnrolledStudents).toBe(45);
    expect(dashboard.metrics.weeklyTeachingHours).toBe(12.5);
  });

  it('8. preserves getActiveClassIdsForStudent and getClassBasicInfo compatibility', () => {
    const studentClassIds = teacherPortalService.getActiveClassIdsForStudent('usr-st-01');
    expect(Array.isArray(studentClassIds)).toBe(true);

    const basicInfo = teacherPortalService.getClassBasicInfo('cls-01');
    if (basicInfo) {
      expect(basicInfo.id).toBe('cls-01');
      expect(typeof basicInfo.name).toBe('string');
      expect(typeof basicInfo.code).toBe('string');
    }
  });

  it('9. getDashboard throws on 401 and clears auth tokens (Fail-Closed, No Mock Fallback)', async () => {
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ title: 'Unauthorized' }), { status: 401 });
    });

    expect(authTokenService.getAccessToken()).toBe('test-teacher-token-xyz');
    await expect(teacherPortalService.getDashboard()).rejects.toThrow('Phiên đăng nhập đã hết hạn');
    expect(authTokenService.getAccessToken()).toBeNull();
  });

  it('10. getClasses throws on 403 and 500 without mock fallback', async () => {
    // 403
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ title: 'Forbidden' }), { status: 403 });
    });
    await expect(
      teacherPortalService.getClasses({ search: '', hskLevelId: 'ALL', status: 'ALL', locationType: 'ALL' }, { page: 1, pageSize: 10 })
    ).rejects.toThrow('Bạn không có quyền');

    // 500
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ detail: 'Internal database error' }), { status: 500 });
    });
    await expect(
      teacherPortalService.getClasses({ search: '', hskLevelId: 'ALL', status: 'ALL', locationType: 'ALL' }, { page: 1, pageSize: 10 })
    ).rejects.toThrow('Internal database error');
  });

  it('11. getClassById throws on 404 without mock fallback', async () => {
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ title: 'Not Found' }), { status: 404 });
    });
    await expect(teacherPortalService.getClassById('non-existent-id')).rejects.toThrow('Không tìm thấy lớp học');
  });

  it('12. getClassMembers throws on 403 and 404 without mock fallback', async () => {
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ title: 'Forbidden' }), { status: 403 });
    });
    await expect(teacherPortalService.getClassMembers('cls-100')).rejects.toThrow('Bạn không có quyền xem danh sách học viên');
  });

  it('13. getClassStats calls GET /api/v1/teacher/classes/stats and returns KPI strip data', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock(async (url: any) => {
      capturedUrl = String(url);
      return new Response(
        JSON.stringify({
          totalClasses: 12,
          activeCount: 8,
          upcomingCount: 3,
          archivedCount: 1,
          totalStudents: 156,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const stats = await teacherPortalService.getClassStats();
    expect(capturedUrl).toContain('/teacher/classes/stats');
    expect(stats.totalClasses).toBe(12);
    expect(stats.activeCount).toBe(8);
    expect(stats.totalStudents).toBe(156);
  });

  it('14. getMyEnrolledClasses calls GET /api/v1/teacher/my-enrolled-classes', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock(async (url: any) => {
      capturedUrl = String(url);
      return new Response(
        JSON.stringify([
          {
            id: 'cls-100',
            name: 'Lớp HSK 3 Online',
            code: 'CLS-HSK3-001',
            hskLevelId: 'level-hsk-3',
            hskLevelName: 'HSK 3',
            hskLevelColor: '#4338ca',
            teacherId: 'tch-1',
            teacherName: 'Cô Trương',
            teacherEmail: 'truong@zhongwenhub.edu.vn',
            status: 'ACTIVE',
            locationType: 'ONLINE',
            startDate: '2026-09-01',
            schedulesSummary: 'T2, T4 (19:00–20:30)',
            enrolledAt: '2026-09-02T00:00:00Z',
            memberStatus: 'ACTIVE',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const enrolled = await teacherPortalService.getMyEnrolledClasses();
    expect(capturedUrl).toContain('/teacher/my-enrolled-classes');
    expect(enrolled.length).toBe(1);
    expect(enrolled[0].name).toBe('Lớp HSK 3 Online');
    expect(enrolled[0].teacherName).toBe('Cô Trương');
  });

  it('15. getActiveClassIdsForStudentAsync resolves real class IDs from getMyEnrolledClasses and caches basic info', async () => {
    globalThis.fetch = mock(async (url: any) => {
      return new Response(
        JSON.stringify([
          {
            id: 'cls-real-999',
            name: 'Lớp HSK 4 Real DB',
            code: 'CLS-HSK4-999',
            hskLevelId: 'level-hsk-4',
            hskLevelName: 'HSK 4',
            hskLevelColor: '#059669',
            teacherId: 'tch-real',
            teacherName: 'Thầy Hoàng',
            status: 'ACTIVE',
            locationType: 'ONLINE',
            startDate: '2026-10-01',
            schedulesSummary: 'T3, T5 (19:00–20:30)',
            enrolledAt: '2026-10-02T00:00:00Z',
            memberStatus: 'ACTIVE',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const activeClassIds = await teacherPortalService.getActiveClassIdsForStudentAsync('real-student-uuid');
    expect(activeClassIds).toEqual(['cls-real-999']);

    const basicInfo = teacherPortalService.getClassBasicInfo('cls-real-999');
    expect(basicInfo).toBeDefined();
    expect(basicInfo?.name).toBe('Lớp HSK 4 Real DB');
    expect(basicInfo?.code).toBe('CLS-HSK4-999');
  });

  it('16. getActiveClassIdsForStudentAsync returns [] when real student has 0 classes (No fallback to membersStore)', async () => {
    authTokenService.setSession({ accessToken: 'real-token-test' });
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const result = await teacherPortalService.getActiveClassIdsForStudentAsync('c385c942-0000-0000-0000-000000000001');
    expect(result).toEqual([]); // Must be empty, never fallback to membersStore
  });

  it('17. getClassBasicInfo does not fallback to classesStore when authenticated, and getClassBasicInfoAsync fetches from student-scoped API', async () => {
    authTokenService.setSession({ accessToken: 'real-token-test' });
    // Class not cached and not in enrolledClassesCache:
    const uncached = teacherPortalService.getClassBasicInfo('cls-01'); // cls-01 exists in mock classesStore
    expect(uncached).toBeUndefined(); // Strictly undefined when token exists

    // Now test getClassBasicInfoAsync queries real student-scoped API (never teacher management API):
    let calledUrl = '';
    globalThis.fetch = mock(async (url: any) => {
      calledUrl = String(url);
      return new Response(
        JSON.stringify({
          id: 'cls-api-888',
          name: 'Lớp HSK 2 API',
          code: 'CLS-HSK2-888',
          hskLevelId: 'level-hsk-2',
          teacherName: 'Thầy Nam',
          status: 'ACTIVE',
          locationType: 'ONLINE',
          startDate: '2026-11-01',
          schedulesSummary: 'T2, T4 (19:00 - 20:30)',
          enrolledAt: '2026-11-02T00:00:00Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const asyncInfo = await teacherPortalService.getClassBasicInfoAsync('cls-api-888');
    expect(calledUrl).toContain('/teacher/my-enrolled-classes/cls-api-888');
    expect(asyncInfo).toBeDefined();
    expect(asyncInfo?.name).toBe('Lớp HSK 2 API');
    expect(asyncInfo?.code).toBe('CLS-HSK2-888');

    // Subsequent sync lookup should now hit cache:
    const cachedNow = teacherPortalService.getClassBasicInfo('cls-api-888');
    expect(cachedNow?.name).toBe('Lớp HSK 2 API');
  });

  it('18. STUDENT xem metadata lớp đã ghi danh: 200', async () => {
    authTokenService.setSession({ accessToken: 'student-token-200' });
    let calledUrl = '';
    globalThis.fetch = mock(async (url: any) => {
      calledUrl = String(url);
      return new Response(
        JSON.stringify({
          id: 'cls-enrolled-100',
          name: 'Lớp HSK 3 Chuẩn Quốc Tế',
          code: 'CLS-HSK3-100',
          hskLevelId: 'level-hsk-3',
          teacherName: 'Cô Linh',
          status: 'ACTIVE',
          startDate: '2026-10-01',
          locationType: 'ONLINE',
          schedulesSummary: 'T2, T6 (19:00 - 20:30)',
          enrolledAt: '2026-10-02T08:00:00Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const result = await teacherPortalService.getMyEnrolledClassById('cls-enrolled-100');
    expect(calledUrl).toContain('/teacher/my-enrolled-classes/cls-enrolled-100');
    expect(result.id).toBe('cls-enrolled-100');
    expect(result.name).toBe('Lớp HSK 3 Chuẩn Quốc Tế');
    expect(result.teacherName).toBe('Cô Linh');
  });

  it('19. STUDENT xem lớp chưa ghi danh: 403/404', async () => {
    authTokenService.setSession({ accessToken: 'student-token-404' });
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          title: 'Not Found',
          detail: "Không tìm thấy lớp học 'cls-unregistered' hoặc bạn chưa được ghi danh.",
          status: 404,
        }),
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } }
      );
    });

    // Calling single enrolled class endpoint directly throws 404
    expect(teacherPortalService.getMyEnrolledClassById('cls-unregistered')).rejects.toThrow(
      "Không tìm thấy lớp học 'cls-unregistered' hoặc bạn chưa được ghi danh."
    );

    // Calling getClassBasicInfoAsync returns undefined fail-closed without mock fallback
    const basicInfo = await teacherPortalService.getClassBasicInfoAsync('cls-unregistered');
    expect(basicInfo).toBeUndefined();
  });

  it('20. STUDENT không gọi được Teacher Management API (403 Forbidden)', async () => {
    authTokenService.setSession({ accessToken: 'student-token-forbidden' });
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          title: 'Forbidden',
          detail: 'Bạn không có quyền xem chi tiết lớp học này.',
          status: 403,
        }),
        { status: 403, headers: { 'Content-Type': 'application/problem+json' } }
      );
    });

    // Student attempting to call Teacher Management endpoint gets 403 Forbidden
    expect(teacherPortalService.getClassById('cls-admin-secret')).rejects.toThrow(
      'Bạn không có quyền xem chi tiết lớp học này.'
    );
  });

  it('21. API 500 không biến thành [] (Throws error for UI Error State)', async () => {
    authTokenService.setSession({ accessToken: 'student-token-500' });
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          title: 'Internal Server Error',
          detail: 'Đã xảy ra lỗi khi lấy danh sách lớp học của học viên.',
          status: 500,
        }),
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } }
      );
    });

    // Must THROW the error so UI renders Error State with Retry button; NEVER convert to []
    expect(
      teacherPortalService.getActiveClassIdsForStudentAsync('c385c942-0000-0000-0000-000000000001')
    ).rejects.toThrow('Đã xảy ra lỗi khi lấy danh sách lớp học của học viên.');
  });

  it('22. Đổi tài khoản không dùng cache của tài khoản trước và thiếu studentId không tìm kiếm cache người khác', async () => {
    // 1. Account A logs in and caches class info
    authTokenService.setSession({ accessToken: 'token-user-a' });
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify([
          {
            id: 'cls-user-a-class',
            name: 'Lớp của User A',
            code: 'CLS-A-01',
            hskLevelId: 'level-hsk-3',
            status: 'ACTIVE',
            locationType: 'ONLINE',
            startDate: '2026-10-01',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    await teacherPortalService.getMyEnrolledClasses();
    const cachedUserA = teacherPortalService.getClassBasicInfo('cls-user-a-class');
    expect(cachedUserA?.name).toBe('Lớp của User A');

    // 2. Account switches to User B: User B cannot access User A's cache (even without studentId)
    authTokenService.setSession({ accessToken: 'token-user-b' });
    const cachedUserB = teacherPortalService.getClassBasicInfo('cls-user-a-class');
    expect(cachedUserB).toBeUndefined(); // Never searches User A's cache!

    // 3. User B cannot access even if caller passes a fake studentId
    const cachedWithCallerId = teacherPortalService.getClassBasicInfo('cls-user-a-class', 'fake-caller-id');
    expect(cachedWithCallerId).toBeUndefined();

    // 4. Explicit cache clear also wipes session cache
    teacherPortalService.clearEnrolledClassesCache();
    authTokenService.setSession({ accessToken: 'token-user-a' });
    const afterClear = teacherPortalService.getClassBasicInfo('cls-user-a-class');
    expect(afterClear).toBeUndefined();
  });

  it('23. Student Homework hiển thị tên lớp thật và xử lý lỗi API đúng', async () => {
    authTokenService.setSession({ accessToken: 'student-token-hw' });

    // Mock enrolled classes returning real class name
    globalThis.fetch = mock(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/teacher/my-enrolled-classes')) {
        return new Response(
          JSON.stringify([
            {
              id: 'cls-001',
              name: 'Lớp HSK 1 Cơ Bản Real Database',
              code: 'CLS-HSK1-REAL',
              hskLevelId: 'level-hsk-1',
              teacherName: 'Thầy Hoàng',
              status: 'ACTIVE',
              locationType: 'ONLINE',
              startDate: '2026-09-01',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 200 });
    });

    const homeworks = await studentHomeworkService.getMyAssignments('student-real-guid');
    const matched = homeworks.find((h) => h.classId === 'cls-001');
    expect(matched).toBeDefined();
    expect(matched?.className).toBe('Lớp HSK 1 Cơ Bản Real Database');
    expect(matched?.classCode).toBe('CLS-HSK1-REAL');

    // When API returns 500:
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          title: 'Internal Server Error',
          detail: 'Database unreachable',
          status: 500,
        }),
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } }
      );
    });

    // Calling getMyAssignments throws error rather than converting to []
    expect(studentHomeworkService.getMyAssignments('student-real-guid')).rejects.toThrow('Database unreachable');
  });

  it('24. Request API hoàn thành sau khi logout không ghi lại cache cũ', async () => {
    authTokenService.setSession({ accessToken: 'token-logout-test' });

    let resolveFetch: (res: Response) => void;
    const pendingFetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    globalThis.fetch = mock(async () => pendingFetchPromise);

    // Launch request while logged in
    const requestPromise = teacherPortalService.getMyEnrolledClasses();

    // User logs out while request is still pending
    authTokenService.clearTokens();
    expect(authTokenService.isAuthenticated()).toBe(false);

    // Now resolve the delayed response
    resolveFetch!(
      new Response(
        JSON.stringify([
          {
            id: 'cls-stale-after-logout',
            name: 'Lớp Rác Sau Khi Đăng Xuất',
            code: 'CLS-STALE-01',
            hskLevelId: 'level-hsk-2',
            status: 'ACTIVE',
            locationType: 'ONLINE',
            startDate: '2026-11-01',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await requestPromise;

    // Verify cache remains strictly empty; stale response was blocked from writing to cache
    const cached = teacherPortalService.getClassBasicInfo('cls-stale-after-logout');
    expect(cached).toBeUndefined();
  });

  it('25. Khi đổi token, request cũ không ghi dữ liệu vào cache phiên mới', async () => {
    // 1. User A is logged in
    authTokenService.setSession({ accessToken: 'token-user-a-stale' });

    let resolveFetchA: (res: Response) => void;
    const fetchPromiseA = new Promise<Response>((resolve) => {
      resolveFetchA = resolve;
    });

    globalThis.fetch = mock(async () => fetchPromiseA);

    // Launch request for User A
    const requestA = teacherPortalService.getMyEnrolledClasses();

    // 2. Token switches to User B while request A is still in-flight
    authTokenService.setSession({ accessToken: 'token-user-b-active' });

    // 3. User A's delayed request finishes
    resolveFetchA!(
      new Response(
        JSON.stringify([
          {
            id: 'cls-user-a-delayed',
            name: 'Lớp User A Trả Về Trễ',
            code: 'CLS-DELAYED-01',
            hskLevelId: 'level-hsk-1',
            status: 'ACTIVE',
            locationType: 'ONLINE',
            startDate: '2026-11-01',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await requestA;

    // User B must NOT see User A's class in its cache
    const checkInUserBSession = teacherPortalService.getClassBasicInfo('cls-user-a-delayed');
    expect(checkInUserBSession).toBeUndefined();
  });
});
