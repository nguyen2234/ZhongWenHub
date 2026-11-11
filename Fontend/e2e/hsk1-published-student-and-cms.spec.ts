import { test, expect, type APIRequestContext } from '@playwright/test';
import { testCredentials } from './config/test-credentials.config';

async function verifyEphemeralDatabaseOrThrow(request: APIRequestContext) {
  const res = await request.get('/api/v1/system/database-environment');
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  const dbName = String(data.databaseName || '').trim().toLowerCase();
  if (!dbName.startsWith('zhongwenhub_ephemeral_')) {
    throw new Error(
      `[FATAL] Refusing ephemeral E2E run against non-ephemeral DB '${data.databaseName}'.`
    );
  }
  return data;
}

async function loginApi(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post('/api/v1/auth/login', {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return (body.token || body.accessToken) as string;
}

test.describe('Phase F: Full HSK 1 Publication (15/15) + Student Learning + Content Manager Curriculum E2E', () => {
  test.beforeEach(async ({ request }) => {
    await verifyEphemeralDatabaseOrThrow(request);
  });

  test('1. Content Manager checks Giáo trình, edits & persists Lesson 4 intro, submits ready lessons -> Admin batch-publishes to 15/15', async ({
    page,
    request,
  }) => {
    // Login as Content Manager
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.contentManager.email);
    await page.fill('#login-password', testCredentials.contentManager.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/management.*/, { timeout: 15000 });

    // Visit Giáo trình menu (confirm renamed title and no standalone lesson editor menu item)
    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await expect(page.getByRole('heading', { name: 'Giáo trình' })).toBeVisible({ timeout: 12000 });
    await expect(page.locator('aside')).not.toContainText('Trình biên tập bài học');

    // Open Lesson 4 editor directly from Giáo trình row "Sửa" button
    const lesson4Row = page.locator('.lcm-lesson-item', { hasText: '#4' }).first();
    await expect(lesson4Row).toBeVisible({ timeout: 10000 });
    await lesson4Row.getByRole('button', { name: 'Sửa', exact: true }).click();

    await expect(page).toHaveURL(/.*\/curriculum\/lessons\/.*\/edit/, { timeout: 10000 });
    const summaryBox = page.locator('textarea[placeholder*="Mô tả ngắn gọn"]');
    await expect(summaryBox).toBeVisible({ timeout: 10000 });
    const origSummary = await summaryBox.inputValue();
    const updatedSummary = `${origSummary} [E2E Verified]`;
    await summaryBox.fill(updatedSummary);
    await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
    await expect(page.getByText('Đã lưu bản nháp thành công!')).toBeVisible({ timeout: 10000 });

    // Reload editor and confirm persisted from SQL Server
    await page.waitForLoadState('networkidle');
    await page.reload();
    await expect(page.locator('textarea[placeholder*="Mô tả ngắn gọn"]')).toHaveValue(updatedSummary, {
      timeout: 10000,
    });
    // Restore original clean summary
    await page.locator('textarea[placeholder*="Mô tả ngắn gọn"]').fill(origSummary);
    await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
    await expect(page.getByText('Đã lưu bản nháp thành công!')).toBeVisible({ timeout: 10000 });

    // Return to Giáo trình -> Open Readiness Gate Panel -> Submit 12 DRAFT ready lessons to PENDING_REVIEW
    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await page.getByRole('button', { name: /Kiểm duyệt xuất bản HSK 1/ }).click();
    await expect(page.locator('text=/Kiểm tra sẵn sàng xuất bản — HSK 1 \\(15 bài\\)/')).toBeVisible({
      timeout: 12000,
    });
    await expect(page.locator('text=/Bị chặn:\\s*0/')).toBeVisible();

    await page.getByRole('button', { name: /Gửi duyệt bài đủ điều kiện/ }).click();
    await expect(page.locator('text=/Đã gửi duyệt 12 bài/')).toBeVisible({ timeout: 12000 });

    // Negative SoD check via API: Content Manager (same actor) cannot batch-publish own submissions
    const cmToken = await loginApi(
      request,
      testCredentials.contentManager.email,
      testCredentials.contentManager.password()
    );
    const readinessRes = await request.get('/api/v1/content/lessons/readiness?hskLevel=1', {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    const readinessJson = await readinessRes.json();
    const pendingIds = readinessJson.lessons
      .filter((l: any) => l.currentStatus === 'PENDING_REVIEW')
      .map((l: any) => l.lessonId);
    expect(pendingIds.length).toBe(12);

    const sodRes = await request.post('/api/v1/content/lessons/batch-review', {
      headers: { Authorization: `Bearer ${cmToken}` },
      data: { ids: pendingIds, status: 'PUBLISHED', reviewNotes: 'Negative SoD check' },
    });
    expect(sodRes.ok()).toBeTruthy();
    const sodJson = await sodRes.json();
    expect(sodJson.processedCount).toBe(0);
    expect(sodJson.skippedCount).toBe(12);

    // Second person (Admin) logs in via UI and executes Batch Publish -> 15/15 PUBLISHED
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.admin.email);
    await page.fill('#login-password', testCredentials.admin.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/management.*/, { timeout: 15000 });

    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await page.getByRole('button', { name: /Kiểm duyệt xuất bản HSK 1/ }).click();
    await page.getByRole('button', { name: /Xuất bản bài đã duyệt/ }).click();
    await expect(page.locator('text=/Đã xuất bản 12 bài/')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('text=/Đã xuất bản:\\s*15/')).toBeVisible();
  });

  test('2. Student sees all 15 HSK 1 lessons live, studies Lesson 4 & Lesson 8, completes Lesson 4 with persistent progress & zero duplicate XP, and HSK 5/6 stay Coming Soon', async ({
    page,
    request,
  }) => {
    const studentToken = await loginApi(
      request,
      testCredentials.student.email,
      testCredentials.student.password()
    );

    // Verify public/student lessons API returns 15 published HSK 1 lessons
    const coursesRes = await request.get('/api/v1/content/courses', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const courses = await coursesRes.json();
    const hsk1Course = courses.find((c: any) => c.hskLevel === 1);
    const lessonsRes = await request.get(`/api/v1/content/lessons?courseId=${hsk1Course.id}&pageSize=100`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const lessonsJson = await lessonsRes.json();
    const pubLessons = (lessonsJson.items || []).filter((l: any) => l.status === 'PUBLISHED');
    expect(pubLessons.length).toBe(15);

    const lesson4 = pubLessons.find((l: any) => l.lessonNumber === 4);
    const lesson8 = pubLessons.find((l: any) => l.lessonNumber === 8);
    expect(lesson4).toBeTruthy();
    expect(lesson8).toBeTruthy();

    // Login as Student via UI
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // Navigate to Learning Path -> switch to HSK 1 tab -> check live HSK 1 shows 15 lessons, and HSK 5-6 Coming Soon
    await page.goto('/ZhongWenHub/learning-path?mode=hsk');
    await page.waitForLoadState('networkidle');
    await page.locator('.hsk-pill-tab', { hasText: 'HSK 1' }).click();
    await expect(page.locator('.student-main-viewport')).toContainText(/Tổng bài:\s*15/, { timeout: 10000 });

    // Click HSK 5 and verify Coming Soon (no leaked lessons)
    await page.locator('.hsk-pill-tab', { hasText: 'HSK 5' }).click();
    await expect(page.locator('.hsk-coming-soon-container')).toContainText(/Sắp ra mắt|Coming Soon/i);
    // Switch back to HSK 1
    await page.locator('.hsk-pill-tab', { hasText: 'HSK 1' }).click();

    // Open Lesson 4 and verify live DB content renders without "(Bản thảo)" or placeholder grammar
    await page.goto(`/ZhongWenHub/lesson?id=${lesson4.id}`);
    await page.waitForLoadState('networkidle');
    const bodyTextL4 = await page.locator('body').innerText();
    expect(bodyTextL4).not.toContain('(Bản thảo)');
    expect(bodyTextL4).not.toContain('在中文交流中，我们经常使用');
    expect(bodyTextL4).toContain(lesson4.titleZh);
    await expect(page.locator('[data-testid="reading-passage-card"]')).toBeVisible({ timeout: 10000 });

    // Record student XP before completion via API
    const summaryBeforeRes = await request.get('/api/v1/learning/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(summaryBeforeRes.ok()).toBeTruthy();
    const summaryBefore = await summaryBeforeRes.json();
    const xpBefore = Number(summaryBefore.xpTotal ?? summaryBefore.totalXp ?? 0);

    // Open Practice Modal on Lesson 4 -> walk through steps cleanly
    await page.getByRole('button', { name: /Bắt đầu luyện tập ngay|Luyện tập lại bài học/ }).click();
    const modalFooter = page.locator('.zh-practice-modal-footer');
    await expect(modalFooter).toBeVisible({ timeout: 10000 });

    for (let i = 0; i < 4; i++) {
      await modalFooter.getByRole('button', { name: 'Tiếp tục' }).click();
      await page.waitForTimeout(100);
    }

    // Complete Lesson 4 via Backend API and verify idempotency (second call awards zero duplicate XP)
    const complete1 = await request.post(`/api/v1/learning/me/lessons/${lesson4.id}/complete`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: { quizScore: 4, totalQuizQuestions: 5, xpEarned: 50 },
    });
    expect(complete1.ok()).toBeTruthy();

    const summaryAfter1Res = await request.get('/api/v1/learning/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(summaryAfter1Res.ok()).toBeTruthy();
    const summaryAfter1 = await summaryAfter1Res.json();
    const xpAfter1 = Number(summaryAfter1.xpTotal ?? summaryAfter1.totalXp ?? 0);
    expect(xpAfter1).toBeGreaterThanOrEqual(xpBefore);

    // Re-submitting completion MUST NOT award duplicate XP
    const complete2 = await request.post(`/api/v1/learning/me/lessons/${lesson4.id}/complete`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: { quizScore: 5, totalQuizQuestions: 5, xpEarned: 50 },
    });
    expect(complete2.ok()).toBeTruthy();
    const summaryAfter2Res = await request.get('/api/v1/learning/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(summaryAfter2Res.ok()).toBeTruthy();
    const summaryAfter2 = await summaryAfter2Res.json();
    const xpAfter2 = Number(summaryAfter2.xpTotal ?? summaryAfter2.totalXp ?? 0);
    expect(xpAfter2).toBe(xpAfter1);
    expect(summaryAfter2.completedLessonIds).toContain(lesson4.id);

    // Refresh Lesson 4 UI and confirm completed badge persists from SQL Server
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#complete')).toContainText('Bạn đã hoàn thành bài học này!', {
      timeout: 12000,
    });

    // Also open Lesson 8 to confirm live HSK 2.0 title ("我想喝茶") overrides static BLCUP fallback
    await page.goto(`/ZhongWenHub/lesson?id=${lesson8.id}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(lesson8.titleZh, { timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('在中文交流中，我们经常使用');
  });
});

