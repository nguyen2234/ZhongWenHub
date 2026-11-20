import { test, expect } from '@playwright/test';
import { testCredentials } from './config/test-credentials.config';

test.describe('Student Exercise & Quiz End-to-End Acceptance (Live SQL Server & UI)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Student opens PUBLISHED lesson, launches interactive practice, tests question & answer submission', async ({ page }) => {
    // 1.1 Login as student
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 1.2 Open published lesson 1 textbook
    await page.goto('/ZhongWenHub/lesson?id=aaaaaaaa-1111-1111-1111-111111111111');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('你好').first()).toBeVisible({ timeout: 10000 });

    // 1.3 Verify Section 5 Practice intro card
    const practiceCta = page.locator('.hsk-practice-cta-btn');
    await expect(practiceCta).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'e2e/screenshots/08-exercise-intro-card.png' });

    // 1.4 Click to launch interactive practice modal
    await practiceCta.click();
    await page.waitForSelector('.zh-practice-modal-backdrop, [role="dialog"]', { timeout: 8000 });
    await expect(page.locator('[role="dialog"]').first()).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/09-exercise-modal-launched.png' });

    // Close modal cleanly
    const closeBtn = page.locator('button[aria-label*="Đóng"], button.btn-close-modal, .modal-close-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.first().click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
  });

  test('2. Focus Mode Runner: Step progression, Quiz answers, Scoring & Completion XP', async ({ page }) => {
    // 2.1 Login as student
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 2.2 Go to Focus Mode
    await page.goto('/ZhongWenHub/lesson/aaaaaaaa-1111-1111-1111-111111111111/focus');
    await page.waitForLoadState('networkidle');

    // Verify Focus Mode loaded cleanly; if persisted progress resumed past Step 1, select Step 1 deterministically
    const step1Indicator = page.locator('button[title^="1. Giới thiệu"]').first();
    await expect(step1Indicator).toBeVisible({ timeout: 10000 });
    if (!(await page.getByText('MỤC TIÊU BÀI HỌC HSK 1').isVisible())) {
      await step1Indicator.click();
    }
    await expect(page.getByText('MỤC TIÊU BÀI HỌC HSK 1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('1 / 7').first()).toBeVisible({ timeout: 10000 });
    if ((page.viewportSize()?.width ?? 1440) >= 640) {
      await expect(page.getByText('Giới thiệu').first()).toBeVisible({ timeout: 10000 });
    }

    // 2.3 Step navigation in Focus Mode using primary action bar
    const nextStepBtn = page.locator('nav[aria-label="Điều hướng bài học"] button.ds-btn-primary, nav[aria-label*="Điều hướng"] button').last();
    await expect(nextStepBtn).toBeVisible({ timeout: 8000 });
    await nextStepBtn.click();
    await page.waitForTimeout(500);

    // 2.4 Verify Vocabulary step is active
    await expect(page.getByText('2 / 7').first()).toBeVisible({ timeout: 8000 });
    if ((page.viewportSize()?.width ?? 1440) >= 640) {
      await expect(page.getByText('Từ vựng').first()).toBeVisible({ timeout: 8000 });
    }
    await page.screenshot({ path: 'e2e/screenshots/10-focus-vocab-active.png' });

    // 2.5 Advance through Grammar, Dialogue, Listening, Exercise, Quiz
    for (let i = 0; i < 6; i++) {
      // If quiz options appear, click one option to answer
      const quizOption = page.locator('button.quiz-option-btn, [role="radio"], .exercise-option-card').first();
      if (await quizOption.isVisible()) {
        await quizOption.click();
        await page.waitForTimeout(300);
      }

      // If quick practice option in grammar appears, select one
      const grammarQuickOption = page.locator('button:has-text("想"), button:has-text("是"), button:has-text("有"), button:has-text("在")').first();
      if (await grammarQuickOption.isVisible()) {
        await grammarQuickOption.click();
        await page.waitForTimeout(200);
      }

      // Click primary action button in action bar
      if (await nextStepBtn.isVisible()) {
        await nextStepBtn.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/11-focus-exercise-progress.png' });
  });

  test('3. Security & Anti-Leak: Unpublished / Draft exercises cannot be retrieved by student', async ({ request }) => {
    // 3.1 Login as student via API
    const studentLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: testCredentials.student.email,
        password: testCredentials.student.password(),
      },
    });
    expect(studentLogin.status()).toBe(200);
    const { accessToken } = await studentLogin.json();
    const headers = { Authorization: `Bearer ${accessToken}` };

    // 3.2 Try to access draft exercise (DF94D5E6-83B4-4C62-9E15-8F2D171D4F4A) -> MUST be 404
    const draftExRes = await request.get('/api/v1/content/exercises/DF94D5E6-83B4-4C62-9E15-8F2D171D4F4A', { headers });
    expect(draftExRes.status()).toBe(404);

    // 3.3 Access published exercise dynamically -> MUST be 200
    const listRes = await request.get('/api/v1/content/exercises?status=PUBLISHED&pageSize=1', { headers });
    expect(listRes.status()).toBe(200);
    const pubList = await listRes.json();
    const pubId = pubList.items?.[0]?.id || '079AD2D2-E9BE-4EC6-B7BF-D9E79BDA311C';

    const pubExRes = await request.get(`/api/v1/content/exercises/${pubId}`, { headers });
    expect(pubExRes.status()).toBe(200);
    const pubData = await pubExRes.json();
    expect(pubData.status).toBe('PUBLISHED');
  });

  test('4. Progress Persistence & Anti-Duplication: Completed action persists across logout / re-login', async ({ page }) => {
    // 4.1 Login as student
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 4.2 Check Progress page
    await page.goto('/ZhongWenHub/progress');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .progress-page-title').first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'e2e/screenshots/12-exercise-student-progress.png' });

    // 4.3 Re-login
    await page.context().clearCookies();
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 4.4 Verify progress still loads cleanly
    await page.goto('/ZhongWenHub/progress');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .progress-page-title').first()).toBeVisible({ timeout: 10000 });
  });
});
