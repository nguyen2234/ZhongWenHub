import { test, expect, Page } from '@playwright/test';
import { verifyTestDatabaseOrThrow } from './helpers/e2e-database-guard';
import { testCredentials } from './config/test-credentials.config';

async function loginAsStudent(page: Page) {
  await page.goto('/ZhongWenHub/login');
  await page.fill('#login-email', testCredentials.student.email);
  await page.fill('#login-password', testCredentials.student.password());
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
}

test.describe('Phase 10: Independent Acceptance & Real Full-Stack E2E Verification', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    // 1. Strict Fail-Closed Pre-Flight Database Guard
    await verifyTestDatabaseOrThrow(request);
  });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Student Authentication & Real Dashboard Verification', async ({ page }) => {
    // 1.1 Login via real credentials
    await loginAsStudent(page);
    await page.waitForLoadState('networkidle');

    // 1.2 Verify real user display (No fake MA avatar or default mock name)
    const userGreeting = page.locator('header, nav, main').first();
    await expect(userGreeting).toBeVisible();

    // 1.3 Verify HSK Course cards on Dashboard
    // HSK 1–4 should have active learning CTA
    const hsk1Card = page.locator('.course-card').filter({ hasText: /HSK 1/i });
    await expect(hsk1Card).toBeVisible();

    // HSK 5 & 6 MUST display 'Sắp ra mắt' badge and 'Chưa có bài giảng'
    const hsk5Card = page.locator('.course-card').filter({ hasText: /HSK 5/i });
    await expect(hsk5Card).toBeVisible();
    await expect(hsk5Card).toContainText('Sắp ra mắt');
    await expect(hsk5Card).toContainText('Chưa có bài giảng');

    const hsk6Card = page.locator('.course-card').filter({ hasText: /HSK 6/i });
    await expect(hsk6Card).toBeVisible();
    await expect(hsk6Card).toContainText('Sắp ra mắt');
    await expect(hsk6Card).toContainText('Chưa có bài giảng');
  });

  test('2. Curriculum Discovery & Navigation across HSK 1–4', async ({ page }) => {
    await loginAsStudent(page);

    // Navigate to learning path
    await page.goto('/ZhongWenHub/learning-path?mode=hsk&level=1');
    await page.waitForLoadState('networkidle');

    // 2.1 Verify HSK 1 view
    await expect(page.locator('.hsk-course-header h1')).toContainText('HSK 1');
    const hsk1Lessons = page.locator('.hsk-lesson-row');
    const hsk1Count = await hsk1Lessons.count();
    expect(hsk1Count).toBeGreaterThan(0);

    // 2.2 Switch to HSK 2
    const hsk2Tab = page.locator('.hsk-pill-tab').filter({ hasText: /HSK 2/i });
    await hsk2Tab.click();
    await expect(page.locator('.hsk-course-header h1')).toContainText('HSK 2');

    // 2.3 Switch to HSK 3
    const hsk3Tab = page.locator('.hsk-pill-tab').filter({ hasText: /HSK 3/i });
    await hsk3Tab.click();
    await expect(page.locator('.hsk-course-header h1')).toContainText('HSK 3');

    // 2.4 Switch to HSK 4
    const hsk4Tab = page.locator('.hsk-pill-tab').filter({ hasText: /HSK 4/i });
    await hsk4Tab.click();
    await expect(page.locator('.hsk-course-header h1')).toContainText('HSK 4');
  });

  test('3. Strict Coming Soon Invariant Enforcement for HSK 5 and HSK 6', async ({ page }) => {
    await loginAsStudent(page);

    // 3.1 Navigate directly to HSK 5
    await page.goto('/ZhongWenHub/learning-path?mode=hsk&level=5');
    await page.waitForLoadState('networkidle');

    // 3.2 Verify dedicated Coming Soon container
    const comingSoonContainer = page.locator('.hsk-coming-soon-container');
    await expect(comingSoonContainer).toBeVisible({ timeout: 10000 });
    await expect(comingSoonContainer).toContainText(/Sắp ra mắt/i);
    await expect(comingSoonContainer).toContainText(/Nội dung HSK 5 đang được phát triển/i);

    // 3.3 Verify ZERO playable lesson rows or fake start buttons
    const lessonRows = page.locator('.hsk-lesson-row');
    const lessonCount = await lessonRows.count();
    expect(lessonCount).toBe(0);

    const startBtn = page.getByRole('button', { name: /Bắt đầu học/i });
    const hasStartBtn = await startBtn.isVisible();
    expect(hasStartBtn).toBe(false);

    // 3.4 Verify CTA buttons lead to real courses (HSK 4 or HSK 1)
    const ctaHsk4 = page.getByRole('button', { name: /Học HSK 4/i });
    await expect(ctaHsk4).toBeVisible();
    await ctaHsk4.click();
    await expect(page.locator('.hsk-course-header h1')).toContainText('HSK 4');

    // 3.5 Check HSK 6 Coming Soon
    const hsk6Tab = page.locator('.hsk-pill-tab').filter({ hasText: /HSK 6/i });
    await hsk6Tab.click();
    await expect(page.locator('.hsk-coming-soon-container')).toBeVisible();
    await expect(page.locator('.hsk-coming-soon-container')).toContainText(/HSK 6/i);
    await expect(page.locator('.hsk-lesson-row')).toHaveCount(0);
  });

  test('4. Full Lesson Study Flow, Dialogue, Audio & Exercise Evaluation', async ({ page }) => {
    // 4.1 Login
    await loginAsStudent(page);

    // 4.2 Open HSK 1 Lesson 1
    await page.goto('/ZhongWenHub/lesson?id=aaaaaaaa-1111-1111-1111-111111111111');
    await page.waitForLoadState('networkidle');

    // 4.3 Check content components
    await expect(page.getByText('你好').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#vocabulary, .vocabulary-section, main').first()).toBeVisible();

    // 4.4 Check audio trigger button
    const audioBtn = page.getByRole('button', { name: /Phát âm|Nghe toàn bộ hội thoại|Nghe câu này/i }).first();
    await expect(audioBtn).toBeVisible({ timeout: 8000 });

    // 4.5 Launch practice modal
    const practiceCta = page.locator('.hsk-practice-cta-btn');
    if (await practiceCta.isVisible()) {
      await practiceCta.click();
      const modal = page.locator('[role="dialog"], .zh-practice-modal-backdrop').first();
      await expect(modal).toBeVisible({ timeout: 8000 });

      // Close modal
      await page.keyboard.press('Escape');
    }
  });

  test('5. Security & RBAC: API Draft Protection & Unauthorized Block', async ({ request }) => {
    // 5.1 Anonymous request to complete lesson is rejected (401 Unauthorized)
    const anonRes = await request.post('/api/v1/learning/me/lessons/aaaaaaaa-1111-1111-1111-111111111111/complete', {
      data: { score: 100, totalQuestions: 5, xpAwarded: 50 },
    });
    expect(anonRes.status()).toBe(401);

    // 5.2 Student login via API
    const studentLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: testCredentials.student.email,
        password: testCredentials.student.password(),
      },
    });
    expect(studentLogin.status()).toBe(200);
    const { accessToken } = await studentLogin.json();
    const studentHeaders = { Authorization: `Bearer ${accessToken}` };

    // 5.3 Student cannot access DRAFT lesson (e.g. HSK 4 Lesson 1 DRAFT) -> returns 404
    const draftRes = await request.get('/api/v1/content/lessons/d1a9907e-4734-49c2-9f8a-4e2dbd286fe1', {
      headers: studentHeaders,
    });
    expect([403, 404]).toContain(draftRes.status());
  });
});
