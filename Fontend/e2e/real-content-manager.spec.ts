import { test, expect, type Page } from '@playwright/test';

async function loginViaUi(
  page: Page,
  email = 'contentmanager@zhongwenhub.edu.vn',
  password = 'ContentManager123!'
) {
  await page.goto('/ZhongWenHub/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/auth/login') && res.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Real End-to-End Acceptance Test for Content Manager Module - ZhongWenHub (Phase 2)
 *
 * STRICT INTEGRITY CONSTRAINTS:
 * - NO page.route() or route.fulfill() mock intercepts!
 * - Directly exercises ASP.NET Core Backend on port 5000 and SQL Server ZhongWenHub_Dev.
 * - Verifies real Identity, JWT tokens, RBAC policies, and SQL Server EF Core content persistence.
 * - Confirms Student vs Content Manager draft isolation and live publish workflows.
 * - Confirms Unit CRUD with real Guids in SQL Server units table.
 * - Confirms Grammar and Exercise stats and CRUD against SQL Server.
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
    await loginViaUi(page);
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

  test('5. Real Unit CRUD & SQL Server Persistence: Create Unit, link Lesson, verify persistence after page reload', async ({
    page,
    request,
  }) => {
    // 5.1 Login as Content Manager via API
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    const { accessToken: cmToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${cmToken}` };

    // 5.2 Create Unit in SQL Server
    const uniqueNum = Math.floor(Math.random() * 900) + 100;
    const unitTitleZh = `商业交流_${uniqueNum}`;
    const unitTitleVi = `Giao tiếp Thương mại ${uniqueNum}`;

    const createUnitRes = await request.post('/api/v1/content/units', {
      headers: cmHeaders,
      data: {
        courseId: '11111111-1111-1111-1111-111111111111',
        unitNumber: 3,
        titleZh: unitTitleZh,
        titleVi: unitTitleVi,
        description: 'Chủ đề đàm phán và giao tiếp thương mại.',
        orderIndex: 3,
        status: 'PUBLISHED',
      },
    });
    expect([200, 201]).toContain(createUnitRes.status());
    const unit = await createUnitRes.json();
    expect(unit.id).toBeDefined();
    // Verify Guid format (not Date.now())
    expect(unit.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // 5.3 Create a Lesson linked to this Unit via Foreign Key UnitId
    const createLessonRes = await request.post('/api/v1/content/lessons', {
      headers: cmHeaders,
      data: {
        courseId: '11111111-1111-1111-1111-111111111111',
        unitId: unit.id,
        lessonNumber: 6,
        titleZh: `签约会议_${uniqueNum}`,
        titleVi: `Họp ký hợp đồng ${uniqueNum}`,
        durationMinutes: 30,
        xpReward: 60,
        orderIndex: 6,
        status: 'PUBLISHED',
      },
    });
    expect([200, 201]).toContain(createLessonRes.status());
    const lesson = await createLessonRes.json();
    expect(lesson.unitId).toBe(unit.id);

    try {
      // 5.4 Log in via browser UI and view curriculum
      await loginViaUi(page);
      await page.goto('/ZhongWenHub/management/content-manager/curriculum');
      await page.waitForLoadState('networkidle');

      // 5.5 Verify newly created unit and linked lesson appear in UI
      await expect(page.getByText(unitTitleZh)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(unitTitleVi)).toBeVisible();
      await expect(page.getByText(`签约会议_${uniqueNum}`)).toBeVisible();

      // 5.6 Refresh browser page and verify data persists from SQL Server
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(unitTitleZh)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(unitTitleVi)).toBeVisible();
    } finally {
      // 5.7 Cleanup created lesson and unit
      await request.delete(`/api/v1/content/lessons/${lesson.id}`, { headers: cmHeaders });
      await request.delete(`/api/v1/content/units/${unit.id}`, { headers: cmHeaders });
    }
  });

  test('6. Grammar & Exercise Management: Live SQL Server CRUD, Real Aggregation Stats & No Mock Fallback', async ({
    page,
    request,
  }) => {
    // 6.1 Content Manager login
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    const { accessToken: cmToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${cmToken}` };

    // 6.2 Verify real Grammar stats from SQL Server
    const gStatsRes = await request.get('/api/v1/content/grammar/stats', { headers: cmHeaders });
    expect(gStatsRes.status()).toBe(200);
    const gStats = await gStatsRes.json();
    expect(typeof gStats.total).toBe('number');
    expect(typeof gStats.published).toBe('number');
    expect(gStats.byHsk).toBeDefined();

    // 6.3 Verify real Exercise stats from SQL Server
    const exStatsRes = await request.get('/api/v1/content/exercises/stats', { headers: cmHeaders });
    expect(exStatsRes.status()).toBe(200);
    const exStats = await exStatsRes.json();
    expect(typeof exStats.total).toBe('number');
    expect(typeof exStats.published).toBe('number');
    expect(exStats.bySkill).toBeDefined();
    expect(exStats.byType).toBeDefined();

    // 6.4 Open Grammar Management Page in browser UI
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/grammar');
    await page.waitForLoadState('networkidle');

    // Verify page loads without throwing synchronous mock errors
    await expect(page.locator('h1, .page-header-title')).toContainText('Quản lý Ngữ pháp');
    await expect(page.locator('.ds-table, table')).toBeVisible({ timeout: 10000 });

    // 6.5 Open Question Bank in browser UI
    await page.goto('/ZhongWenHub/management/content-manager/question-bank');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, .page-header-title')).toContainText('Ngân hàng Bài tập');
    await expect(page.locator('.ds-table, table')).toBeVisible({ timeout: 10000 });
  });

  test('7. Re-login Verification: State persists across session logout and re-login', async ({
    page,
    request,
    context,
  }) => {
    // 7.1 Login as Content Manager
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await page.waitForLoadState('networkidle');

    // Verify seeded unit 1 exists
    await expect(page.getByText('问候与认识')).toBeVisible({ timeout: 10000 });

    // 7.2 Clear cookies and storage to simulate full logout
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 7.3 Navigate to curriculum -> Redirects to login
    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

    // 7.4 Log back in
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await page.waitForLoadState('networkidle');

    // 7.5 Content re-loads seamlessly from SQL Server
    await expect(page.getByText('问候与认识')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('家庭与朋友')).toBeVisible();
  });

  test('8. Vocabulary Live CRUD: Create -> Update -> Reload -> Delete from SQL Server', async ({
    page,
    request,
  }) => {
    // 8.1 Login as Content Manager
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    const { accessToken: cmToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${cmToken}` };

    const uniqueId = Date.now().toString().slice(-5);
    const hanzi = `电脑_${uniqueId}`;

    // 8.2 Create vocabulary via live API
    const createRes = await request.post('/api/v1/content/vocabularies', {
      headers: cmHeaders,
      data: {
        hskLevel: 1,
        hanzi,
        pinyin: 'diànnǎo',
        meaningVi: 'Máy vi tính test',
        partOfSpeech: 'danh từ',
        status: 'PUBLISHED',
      },
    });
    expect(createRes.status()).toBe(201);
    const createdVocab = await createRes.json();
    expect(createdVocab.id).toBeDefined();

    try {
      // 8.3 Login via browser and navigate to HSK Repository
      await loginViaUi(page);
      await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
      await page.waitForLoadState('networkidle');

      // Verify created word appears in UI
      await expect(page.getByText(hanzi).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Máy vi tính test').first()).toBeVisible();

      // 8.4 Update vocabulary
      const updateRes = await request.put(`/api/v1/content/vocabularies/${createdVocab.id}`, {
        headers: cmHeaders,
        data: {
          hskLevel: 1,
          hanzi,
          pinyin: 'diànnǎo',
          meaningVi: 'Máy tính cập nhật',
          partOfSpeech: 'danh từ',
          status: 'PUBLISHED',
        },
      });
      expect(updateRes.status()).toBe(200);

      // 8.5 Reload browser and verify updated meaning
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Máy tính cập nhật').first()).toBeVisible({ timeout: 10000 });
    } finally {
      // 8.6 Delete vocabulary from SQL Server
      const deleteRes = await request.delete(`/api/v1/content/vocabularies/${createdVocab.id}`, {
        headers: cmHeaders,
      });
      expect(deleteRes.status()).toBe(204);

      // 8.7 Reload browser and verify deleted word is removed
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(hanzi)).not.toBeVisible();
    }
  });

  test('9. Grammar Point Live CRUD: Create -> Update -> Reload -> Delete from SQL Server', async ({
    page,
    request,
  }) => {
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    const { accessToken: cmToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${cmToken}` };

    const uniqueId = Date.now().toString().slice(-5);
    const code = `G_TEST_${uniqueId}`;
    const title = `Câu chữ 把 test ${uniqueId}`;

    // 9.1 Create grammar point
    const createRes = await request.post('/api/v1/content/grammar', {
      headers: cmHeaders,
      data: {
        code,
        title,
        pinyinTitle: 'bǎ',
        hskLevel: 2,
        category: 'STRUCTURE',
        structureFormula: 'S + 把 + O + V',
        explanation: 'Dùng để nhấn mạnh sự tác động của chủ ngữ lên tân ngữ.',
        difficulty: 'MEDIUM',
        status: 'PUBLISHED',
      },
    });
    expect(createRes.status()).toBe(201);
    const createdGrammar = await createRes.json();

    try {
      // 9.2 View in browser UI
      await loginViaUi(page);
      await page.goto('/ZhongWenHub/management/content-manager/grammar');
      await page.waitForLoadState('networkidle');

      await page.fill('input[placeholder*="Tìm kiếm"]', uniqueId);
      await page.waitForTimeout(500);
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });

      // 9.3 Update grammar
      const updatedTitle = `Câu chữ 把 đã sửa ${uniqueId}`;
      const updateRes = await request.put(`/api/v1/content/grammar/${createdGrammar.id}`, {
        headers: cmHeaders,
        data: {
          code,
          title: updatedTitle,
          pinyinTitle: 'bǎ',
          hskLevel: 2,
          category: 'STRUCTURE',
          structureFormula: 'S + 把 + O + V + Kết quả',
          explanation: 'Dùng để nhấn mạnh sự tác động và kết quả.',
          difficulty: 'MEDIUM',
          status: 'PUBLISHED',
        },
      });
      expect(updateRes.status()).toBe(200);

      // 9.4 Reload and verify update
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.fill('input[placeholder*="Tìm kiếm"]', uniqueId);
      await page.waitForTimeout(500);
      await expect(page.getByText(updatedTitle).first()).toBeVisible({ timeout: 10000 });
    } finally {
      // 9.5 Delete grammar point
      const deleteRes = await request.delete(`/api/v1/content/grammar/${createdGrammar.id}`, {
        headers: cmHeaders,
      });
      expect(deleteRes.status()).toBe(204);

      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(title)).not.toBeVisible();
    }
  });

  test('10. Exercise Live CRUD: Create -> Update -> Reload -> Delete from SQL Server', async ({
    page,
    request,
  }) => {
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    const { accessToken: cmToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${cmToken}` };

    const uniqueId = Date.now().toString().slice(-5);
    const title = `Bài tập trắc nghiệm ${uniqueId}`;

    // 10.1 Create exercise
    const createRes = await request.post('/api/v1/content/exercises', {
      headers: cmHeaders,
      data: {
        type: 'MULTIPLE_CHOICE',
        skill: 'READING',
        hskLevel: 1,
        title,
        instruction: 'Chọn đáp án đúng nhất',
        promptHanzi: '这是什么？',
        promptVietnamese: 'Đây là cái gì?',
        optionsJson: JSON.stringify(['A. 苹果', 'B. 香蕉']),
        correctOptionIndex: 0,
        xpReward: 15,
        status: 'PUBLISHED',
      },
    });
    expect(createRes.status()).toBe(201);
    const createdEx = await createRes.json();

    try {
      // 10.2 View in browser UI
      await loginViaUi(page);
      await page.goto('/ZhongWenHub/management/content-manager/question-bank');
      await page.waitForLoadState('networkidle');

      await page.fill('input[placeholder*="Tìm kiếm"]', uniqueId);
      await page.waitForTimeout(500);
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });

      // 10.3 Update exercise
      const updatedTitle = `Bài tập đã cập nhật ${uniqueId}`;
      const updateRes = await request.put(`/api/v1/content/exercises/${createdEx.id}`, {
        headers: cmHeaders,
        data: {
          type: 'MULTIPLE_CHOICE',
          skill: 'READING',
          hskLevel: 1,
          title: updatedTitle,
          instruction: 'Chọn đáp án đúng nhất',
          promptHanzi: '这是什么水果？',
          promptVietnamese: 'Đây là loại quả gì?',
          optionsJson: JSON.stringify(['A. 苹果', 'B. 葡萄']),
          correctOptionIndex: 0,
          xpReward: 20,
          status: 'PUBLISHED',
        },
      });
      expect(updateRes.status()).toBe(200);

      // 10.4 Reload and verify update
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.fill('input[placeholder*="Tìm kiếm"]', uniqueId);
      await page.waitForTimeout(500);
      await expect(page.getByText(updatedTitle).first()).toBeVisible({ timeout: 10000 });
    } finally {
      // 10.5 Delete exercise
      const deleteRes = await request.delete(`/api/v1/content/exercises/${createdEx.id}`, {
        headers: cmHeaders,
      });
      expect(deleteRes.status()).toBe(204);

      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(title)).not.toBeVisible();
    }
  });

  test('11. Lesson Editor Aggregate Persistence: Dialogue and Listening persist to SQL Server', async ({
    page,
    request,
  }) => {
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    const { accessToken: cmToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${cmToken}` };

    const uniqueId = Date.now().toString().slice(-5);
    const titleZh = `会话课_${uniqueId}`;
    const dialogueTitle = `Hội thoại bài học ${uniqueId}`;

    // 11.1 Create lesson with dialogueJson and listeningJson
    const dialogueData = {
      id: `diag-${uniqueId}`,
      lessonId: '',
      title: dialogueTitle,
      situationZh: '在商店购物',
      situationVi: 'Mua sắm tại cửa hàng',
      lines: [
        {
          id: `line-${uniqueId}-1`,
          dialogueId: `diag-${uniqueId}`,
          speakerName: '顾客',
          speakerRole: 'Khách hàng',
          zh: '这个多少钱？',
          pinyin: 'Zhège duōshǎo qián?',
          meaningVi: 'Cái này bao nhiêu tiền?',
          displayOrder: 1,
        },
      ],
    };

    const listeningData = [
      {
        id: `lis-${uniqueId}-1`,
        lessonId: '',
        title: 'Nghe đoạn thoại ngắn',
        audioUrl: 'https://assets.zhongwenhub.com/audio/test.mp3',
        transcriptZh: '你听到了什么？',
        transcriptPinyin: 'Nǐ tīngdào le shénme?',
        transcriptVi: 'Bạn nghe được gì?',
        prompt: 'Lắng nghe đoạn ghi âm sau và chọn đáp án chính xác:',
        options: [
          { id: 1, text: '苹果', isCorrect: true },
          { id: 2, text: '香蕉', isCorrect: false },
        ],
        explanation: 'Đáp án là quả táo.',
        displayOrder: 1,
      },
    ];

    const createRes = await request.post('/api/v1/content/lessons', {
      headers: cmHeaders,
      data: {
        courseId: '11111111-1111-1111-1111-111111111111',
        lessonNumber: 88,
        titleZh,
        titleVi: `Bai hoc hoi thoai ${uniqueId}`,
        dialogueJson: JSON.stringify(dialogueData),
        listeningJson: JSON.stringify(listeningData),
        durationMinutes: 45,
        xpReward: 60,
        status: 'PUBLISHED',
      },
    });
    expect(createRes.status()).toBe(201);
    const lesson = await createRes.json();

    try {
      // 11.2 Verify detail endpoint returns DialogueJson and ListeningJson
      const detailRes = await request.get(`/api/v1/content/lessons/${lesson.id}`, {
        headers: cmHeaders,
      });
      expect(detailRes.status()).toBe(200);
      const detailData = await detailRes.json();
      expect(detailData.dialogueJson).toBeDefined();
      expect(detailData.dialogueJson).toContain('这个多少钱？');
      expect(detailData.listeningJson).toBeDefined();
      expect(detailData.listeningJson).toContain('你听到了什么？');

      // 11.3 Open lesson editor in browser UI
      await loginViaUi(page);
      await page.goto(`/ZhongWenHub/management/content-manager/curriculum/lessons/${lesson.id}/edit`);
      await page.waitForLoadState('networkidle');

      // 11.4 Verify editor loads title and allows navigating sections
      await expect(page.getByText(titleZh).first()).toBeVisible({ timeout: 10000 });

      // Click Dialogue section
      await page.click('button:has-text("Hội thoại")');
      await expect(page.locator('input[placeholder*="Câu Hán tự"]').first()).toHaveValue('这个多少钱？', { timeout: 5000 });

      // Click Listening section
      await page.click('button:has-text("Luyện nghe")');
      await expect(page.getByText('Nghe đoạn thoại ngắn').first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('你听到了什么？').first()).toBeVisible({ timeout: 5000 });

      // 11.5 Reload page to verify persistence across page refresh
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(titleZh).first()).toBeVisible({ timeout: 10000 });
    } finally {
      // 11.6 Clean up lesson
      await request.delete(`/api/v1/content/lessons/${lesson.id}`, { headers: cmHeaders });
    }
  });

  test('12. Error & Access Control: Invalid lesson ID displays not found error; unauthorized cannot access Admin Users', async ({
    page,
    request,
  }) => {
    // 12.1 Log in as Content Manager
    await loginViaUi(page);

    // 12.2 Navigate to nonexistent lesson ID -> Displays error state
    await page.goto(
      '/ZhongWenHub/management/content-manager/curriculum/lessons/00000000-0000-0000-0000-000000000000/edit'
    );
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Không tìm thấy bài học/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Quay lại Giáo trình')).toBeVisible();

    // 12.3 Content Manager attempting to access Admin Users receives 403 Forbidden
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: 'contentmanager@zhongwenhub.edu.vn',
        password: 'ContentManager123!',
      },
    });
    const { accessToken: cmToken } = await cmLogin.json();

    const adminUsersRes = await request.get('/api/v1/admin/users', {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    expect(adminUsersRes.status()).toBe(403);
  });
});
