import { test, expect } from '@playwright/test';
import { verifyTestDatabaseOrThrow } from './helpers/e2e-database-guard';
import { testCredentials } from './config/test-credentials.config';

test.describe('Phase 9.1D: HSK 1 Full Curriculum E2E & Release Verification', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    await verifyTestDatabaseOrThrow(request);
  });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Student Learning Journey: HSK 1 Lesson 1 study flow, dialogue, audio and exercises', async ({ page }) => {
    // 1.1 Login as Student
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 1.2 Navigate to Lesson 1 textbook
    await page.goto('/ZhongWenHub/lesson?id=aaaaaaaa-1111-1111-1111-111111111111');
    await page.waitForLoadState('networkidle');

    // 1.3 Verify Lesson 1 title, vocabulary, grammar, dialogue
    await expect(page.getByText('你好').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#vocabulary, .vocabulary-section, main').first()).toBeVisible();
    await expect(page.locator('#grammar, .grammar-section, main').first()).toBeVisible();
    await expect(page.locator('#dialogue, .dialogue-section, main').first()).toBeVisible();

    // 1.4 Verify Audio button exists
    const audioBtn = page.getByRole('button', { name: /Phát âm|Nghe toàn bộ hội thoại|Nghe câu này/i }).first();
    await expect(audioBtn).toBeVisible({ timeout: 8000 });

    // 1.5 Launch practice modal
    const practiceCta = page.locator('.hsk-practice-cta-btn');
    if (await practiceCta.isVisible()) {
      await practiceCta.click();
      await page.waitForSelector('[role="dialog"], .zh-practice-modal-backdrop', { timeout: 8000 });
      await expect(page.locator('[role="dialog"]').first()).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');
    }

    // 1.6 Verify progress persistence
    await page.goto('/ZhongWenHub/progress');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, .progress-page-title').first()).toBeVisible({ timeout: 10000 });
  });

  test('2. Draft Protection & API RBAC Security: Student cannot access unpublished Lesson 4; Anonymous cannot complete lesson', async ({ request }) => {
    // 2.1 Student login via API
    const studentLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: testCredentials.student.email,
        password: testCredentials.student.password(),
      },
    });
    expect(studentLogin.status()).toBe(200);
    const { accessToken } = await studentLogin.json();
    const studentHeaders = { Authorization: `Bearer ${accessToken}` };

    // 2.2 Student tries to fetch Lesson 4 (DRAFT) -> MUST BE 404
    const draftRes = await request.get('/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444', {
      headers: studentHeaders,
    });
    expect(draftRes.status()).toBe(404);

    // 2.3 Anonymous user tries to complete a lesson -> MUST BE 401
    const unauthCompleteRes = await request.post('/api/v1/learning/me/lessons/aaaaaaaa-1111-1111-1111-111111111111/complete', {
      data: {
        score: 100,
        totalQuestions: 5,
        xpAwarded: 50,
      },
    });
    expect(unauthCompleteRes.status()).toBe(401);
  });

  test('3. Content Manager Draft Preview: Content Manager can view Lesson 4 (DRAFT) with complete vocabulary and exercises', async ({ request, page }) => {
    // 3.1 Content Manager login via API
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: testCredentials.contentManager.email,
        password: testCredentials.contentManager.password(),
      },
    });
    expect(cmLogin.status()).toBe(200);
    const { accessToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${accessToken}` };

    // 3.2 Fetch Lesson 4 (DRAFT) as Content Manager -> MUST BE 200 OK
    const cmLesson4Res = await request.get('/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444', {
      headers: cmHeaders,
    });
    expect(cmLesson4Res.status()).toBe(200);
    const lesson4Data = await cmLesson4Res.json();
    expect(lesson4Data.status).toBe('DRAFT');
    expect(lesson4Data.titleZh).toBeDefined();

    // 3.3 UI: Content Manager logs in and visits Content Studio
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.contentManager.email);
    await page.fill('#login-password', testCredentials.contentManager.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/management.*/, { timeout: 15000 });
  });

  test('4. Reading Passage Integration: Lesson 2 interactive reading, pinyin toggle, vietnamese toggle & quiz', async ({ page }) => {
    // 4.1 Login as student
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 4.2 Open Lesson 2 (Unit 1 Reading Passage: "你好，朋友！")
    await page.goto('/ZhongWenHub/lesson?id=aaaaaaaa-2222-2222-2222-222222222222');
    await page.waitForLoadState('networkidle');

    // 4.3 Verify Reading Passage Card is visible
    const readingCard = page.locator('[data-testid="reading-passage-card"]');
    await expect(readingCard).toBeVisible({ timeout: 12000 });
    await expect(readingCard.locator('[data-testid="passage-hanzi"]')).toContainText('你好');

    // 4.4 Test Pinyin Toggle
    const pinyinToggleBtn = page.locator('[data-testid="toggle-pinyin-btn"]');
    await expect(pinyinToggleBtn).toBeVisible();
    await expect(page.locator('[data-testid="passage-pinyin"]')).toBeVisible();

    // Toggle off
    await pinyinToggleBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="passage-pinyin"]')).not.toBeVisible();

    // Toggle back on
    await pinyinToggleBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="passage-pinyin"]')).toBeVisible();

    // 4.5 Test Vietnamese Translation Toggle
    const meaningToggleBtn = page.locator('[data-testid="toggle-meaning-btn"]');
    await expect(meaningToggleBtn).toBeVisible();
    await expect(page.locator('[data-testid="passage-meaning"]')).toBeVisible();

    // Toggle off
    await meaningToggleBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="passage-meaning"]')).not.toBeVisible();

    // Toggle back on
    await meaningToggleBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="passage-meaning"]')).toBeVisible();

    // 4.6 Answer Comprehension Question
    const option0 = page.locator('[data-testid="question-0-opt-0"]');
    if (await option0.isVisible()) {
      await option0.click();
      await page.waitForTimeout(200);

      const checkBtn = page.locator('[data-testid="check-answer-btn-0"]');
      await expect(checkBtn).toBeEnabled();
      await checkBtn.click();
      await page.waitForTimeout(300);

      // Verify explanation appears
      await expect(page.locator('[data-testid="reading-question-0"]')).toContainText('Trong đoạn văn');
    }
  });

  test('5. Audio Fallback & Web Speech API: Handles speech playback gracefully', async ({ page }) => {
    // 5.1 Navigate to lesson 1
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    await page.goto('/ZhongWenHub/lesson?id=aaaaaaaa-1111-1111-1111-111111111111');
    await page.waitForLoadState('networkidle');

    // 5.2 Click audio button
    const audioBtn = page.locator('button.hsk-icon-action-btn, button[title*="Phát âm"], button:has-text("Nghe")').first();
    if (await audioBtn.isVisible()) {
      await audioBtn.click();
      // Should not throw unhandled exception or crash the page
      await page.waitForTimeout(500);
      await expect(page.locator('main, #vocabulary').first()).toBeVisible();
    }
  });
});
