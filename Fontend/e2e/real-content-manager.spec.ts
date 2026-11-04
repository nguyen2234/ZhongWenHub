import { test, expect } from '@playwright/test';

/**
 * Real End-to-End Acceptance Test for Content Manager Module - ZhongWenHub (Phase 2)
 *
 * STRICT INTEGRITY CONSTRAINTS:
 * - NO page.route() or route.fulfill() mock intercepts!
 * - Directly exercises ASP.NET Core Backend on port 5000 and SQL Server ZhongWenHub_Dev.
 * - Verifies real Identity, JWT tokens, RBAC policies, and SQL Server EF Core content persistence.
 * - Confirms Student vs Content Manager draft isolation and live publish workflows.
 */
test.describe('Phase 2 Content Manager & Student Integration Acceptance (Live SQL Server)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Guest RBAC: Anonymous user is blocked from modifying content (401) and cannot see Drafts (404)', async ({
    page,
    request,
  }) => {
    // 1.1 Anonymous POST to create course returns 401
    const createCourseRes = await request.post('/api/v1/content/courses', {
      data: {
        code: 'TEST_UNAUTH',
        title: 'Khóa Học Hack',
        hskLevel: 1,
      },
    });
    expect(createCourseRes.status()).toBe(401);

    // 1.2 Anonymous GET on published lessons returns only published lessons
    const getLessonsRes = await request.get('/api/v1/content/lessons');
    expect(getLessonsRes.status()).toBe(200);
    const lessonsJson = await getLessonsRes.json();
    expect(Array.isArray(lessonsJson.items)).toBe(true);
    // None of the returned lessons should have status DRAFT
    const hasDraft = lessonsJson.items.some((item: any) => item.status === 'DRAFT');
    expect(hasDraft).toBe(false);

    // 1.3 Anonymous GET on a known draft lesson returns 404 Not Found
    const draftLessonRes = await request.get(
      '/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444'
    );
    expect(draftLessonRes.status()).toBe(404);

    // 1.4 Anonymous navigation to Content Manager curriculum redirects to login
    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

  test('2. Student RBAC: Real Student is rejected from modifying content (403) and draft content is strictly hidden', async ({
    page,
    request,
  }) => {
    // 2.1 Log in as seeded student
    const studentLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'student@zhongwenhub.edu.vn',
        password: 'StudentPassword123!',
      },
    });
    expect(studentLogin.status()).toBe(200);
    const { accessToken: studentToken } = await studentLogin.json();
    const authHeaders = { Authorization: `Bearer ${studentToken}` };

    // 2.2 Student attempting to create content receives 403 Forbidden
    const createRes = await request.post('/api/v1/content/lessons', {
      headers: authHeaders,
      data: {
        courseId: '11111111-1111-1111-1111-111111111111',
        lessonNumber: 99,
        titleZh: '非法测试',
        titleVi: 'Hack Bai Hoc',
      },
    });
    expect(createRes.status()).toBe(403);

    // 2.3 Student attempting to access draft lesson receives 404 Not Found
    const draftRes = await request.get(
      '/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444',
      { headers: authHeaders }
    );
    expect(draftRes.status()).toBe(404);

    // 2.4 Student can successfully view a published lesson with vocabulary & exercises
    const pubRes = await request.get(
      '/api/v1/content/lessons/aaaaaaaa-1111-1111-1111-111111111111',
      { headers: authHeaders }
    );
    expect(pubRes.status()).toBe(200);
    const pubData = await pubRes.json();
    expect(pubData.titleZh).toBe('你好');
    expect(pubData.status).toBe('PUBLISHED');
    expect(pubData.vocabularies.length).toBeGreaterThan(0);
    expect(pubData.grammarPoints.length).toBeGreaterThan(0);
    expect(pubData.exercises.length).toBeGreaterThan(0);

    // 2.5 Student attempting to access Content Manager UI in browser is blocked by route guard
    await page.addInitScript(
      ({ token, email }) => {
        localStorage.setItem(
          'zhongwenhub_auth_session',
          JSON.stringify({
            token,
            user: {
              id: 'stu-seeded-id',
              email,
              displayName: 'Học Viên Demo',
              role: 'STUDENT',
            },
          })
        );
        localStorage.setItem('auth_token', token);
      },
      { token: studentToken, email: 'student@zhongwenhub.edu.vn' }
    );

    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    // Guard redirects non-staff user to login or dashboard
    await expect(page).not.toHaveURL(/.*\/management\/content-manager\/curriculum/);
  });

  test('3. Content Manager RBAC: Real Content Manager can access content tools, view drafts, but is blocked from Admin Users', async ({
    page,
    request,
  }) => {
    // 3.1 Content Manager login
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    expect(cmLogin.status()).toBe(200);
    const { accessToken: cmToken, user: cmUser } = await cmLogin.json();
    expect(cmUser.roles).toContain('CONTENT_MANAGER');
    const authHeaders = { Authorization: `Bearer ${cmToken}` };

    // 3.2 Content Manager CANNOT access Admin Users API (RBAC isolation -> 403 Forbidden)
    const adminUsersRes = await request.get('/api/v1/admin/users', {
      headers: authHeaders,
    });
    expect(adminUsersRes.status()).toBe(403);

    // 3.3 Content Manager CAN see both published and draft lessons
    const allLessonsRes = await request.get('/api/v1/content/lessons', {
      headers: authHeaders,
    });
    expect(allLessonsRes.status()).toBe(200);
    const allLessons = await allLessonsRes.json();
    const draftFound = allLessons.items.some((l: any) => l.status === 'DRAFT');
    expect(draftFound).toBe(true);

    // 3.4 Content Manager CAN fetch the draft lesson detail
    const draftDetailRes = await request.get(
      '/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444',
      { headers: authHeaders }
    );
    expect(draftDetailRes.status()).toBe(200);
    const draftDetail = await draftDetailRes.json();
    expect(draftDetail.status).toBe('DRAFT');
    expect(draftDetail.titleZh).toBe('他是我的汉语老师');

    // 3.5 Content Manager logs into UI and views the Curriculum page
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', 'contentmanager@zhongwenhub.edu.vn');
    await page.fill('#login-password', 'ContentManager123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);
    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await expect(page).toHaveURL(/.*\/management\/content-manager\/curriculum/, { timeout: 10000 });
    await expect(page.locator('.lcm-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Giáo trình & Bài học' })).toBeVisible();
  });

  test('4. Full Content Lifecycle: Create Draft -> Student Cannot See -> Publish -> Student Can See -> Cleanup', async ({
    request,
  }) => {
    // 4.1 Content Manager login
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    const { accessToken: cmToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${cmToken}` };

    // 4.2 Content Manager creates a new DRAFT lesson
    const uniqueSuffix = Date.now().toString().slice(-5);
    const createRes = await request.post('/api/v1/content/lessons', {
      headers: cmHeaders,
      data: {
        courseId: '11111111-1111-1111-1111-111111111111',
        lessonNumber: 10 + Math.floor(Math.random() * 50),
        titleZh: `测试课程_${uniqueSuffix}`,
        titleVi: `Bài học kiểm thử ${uniqueSuffix}`,
        pinyin: `Cèshì Kèchéng ${uniqueSuffix}`,
        summary: 'Bài học nháp được tạo để kiểm thử tính năng xuất bản và phân quyền.',
        durationMinutes: 25,
        xpReward: 40,
        orderIndex: 99,
        status: 'DRAFT',
      },
    });
    expect([200, 201]).toContain(createRes.status());
    const createdLesson = await createRes.json();
    const lessonId = createdLesson.id;
    expect(lessonId).toBeDefined();

    try {
      // 4.3 Student (or anonymous) CANNOT access this new draft lesson (404)
      const studentAttemptRes = await request.get(`/api/v1/content/lessons/${lessonId}`);
      expect(studentAttemptRes.status()).toBe(404);

      // 4.4 Content Manager publishes the lesson
      const publishRes = await request.put(`/api/v1/content/lessons/${lessonId}/status`, {
        headers: cmHeaders,
        data: {
          status: 'PUBLISHED',
        },
      });
      expect(publishRes.status()).toBe(200);
      const updated = await publishRes.json();
      expect(updated.status).toBe('PUBLISHED');

      // 4.5 Student CAN NOW immediately view the published lesson!
      const studentSuccessRes = await request.get(`/api/v1/content/lessons/${lessonId}`);
      expect(studentSuccessRes.status()).toBe(200);
      const studentView = await studentSuccessRes.json();
      expect(studentView.id).toBe(lessonId);
      expect(studentView.status).toBe('PUBLISHED');
      expect(studentView.titleVi).toBe(`Bài học kiểm thử ${uniqueSuffix}`);
    } finally {
      // 4.6 Cleanup test lesson from SQL Server
      const deleteRes = await request.delete(`/api/v1/content/lessons/${lessonId}`, {
        headers: cmHeaders,
      });
      expect([200, 204]).toContain(deleteRes.status());
    }
  });
});
