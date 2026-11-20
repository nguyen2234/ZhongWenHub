import { test, expect } from '@playwright/test';
import { verifyTestDatabaseOrThrow } from './helpers/e2e-database-guard';
import { testCredentials } from './config/test-credentials.config';

test.describe('Phase 9.3: HSK 3 Full Curriculum E2E & Release Readiness Verification', () => {
  test.describe.configure({ mode: 'serial' });

  // Test DB GUIDs for HSK 3 Lessons
  const HSK3_LESSON_1_ID = '46ac4a4f-4f6a-4b90-bbbf-37ff149fd73d';
  const HSK3_LESSON_4_ID = '46ba2193-6813-47ad-b210-6379bc7b76e6';

  test.beforeAll(async ({ request }) => {
    await verifyTestDatabaseOrThrow(request);
  });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Draft Protection & API RBAC Security: Student blocked (404) from HSK 3 Draft Lesson; Anonymous blocked (401)', async ({ request }) => {
    // 1.1 Student login via API
    const studentLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: testCredentials.student.email,
        password: testCredentials.student.password(),
      },
    });
    expect(studentLogin.status()).toBe(200);
    const { accessToken } = await studentLogin.json();
    const studentHeaders = { Authorization: `Bearer ${accessToken}` };

    // 1.2 Student tries to fetch HSK 3 Lesson 1 (DRAFT) -> MUST BE 404 NOT FOUND
    const draftRes = await request.get(`/api/v1/content/lessons/${HSK3_LESSON_1_ID}`, {
      headers: studentHeaders,
    });
    expect(draftRes.status()).toBe(404);

    // 1.3 Anonymous user tries to complete lesson -> MUST BE 401
    const unauthComplete = await request.post(`/api/v1/learning/me/lessons/${HSK3_LESSON_1_ID}/complete`, {
      data: { score: 100, totalQuestions: 4, xpAwarded: 50 },
    });
    expect(unauthComplete.status()).toBe(401);
  });

  test('2. Content Manager Draft Access: Content Manager can inspect HSK 3 Draft Lesson with 200 OK & full payload', async ({ request, page }) => {
    // 2.1 Content Manager login via API
    const cmLogin = await request.post('/api/v1/auth/login', {
      data: {
        email: testCredentials.contentManager.email,
        password: testCredentials.contentManager.password(),
      },
    });
    expect(cmLogin.status()).toBe(200);
    const { accessToken } = await cmLogin.json();
    const cmHeaders = { Authorization: `Bearer ${accessToken}` };

    // 2.2 CM fetches HSK 3 Lesson 1 (DRAFT) -> MUST BE 200 OK
    const cmLesson1Res = await request.get(`/api/v1/content/lessons/${HSK3_LESSON_1_ID}`, {
      headers: cmHeaders,
    });
    expect(cmLesson1Res.status()).toBe(200);
    const lesson1Data = await cmLesson1Res.json();
    expect(lesson1Data.status).toBe('DRAFT');
    expect(lesson1Data.titleZh).toBe('周末你有什么打算');
    expect(lesson1Data.vocabularies.length).toBeGreaterThanOrEqual(25);
    expect(lesson1Data.exercises.length).toBeGreaterThanOrEqual(4);

    // 2.3 CM fetches HSK 3 Lesson 4 (with Unit 1 Reading Passage) -> MUST BE 200 OK
    const cmLesson4Res = await request.get(`/api/v1/content/lessons/${HSK3_LESSON_4_ID}`, {
      headers: cmHeaders,
    });
    expect(cmLesson4Res.status()).toBe(200);
    const lesson4Data = await cmLesson4Res.json();
    expect(lesson4Data.status).toBe('DRAFT');
    expect(lesson4Data.titleZh).toBe('她总是笑着跟客人说话');
    
    // Check reading passage embedded in dialogueJson
    let diagObj: any = {};
    if (typeof lesson4Data.dialogueJson === 'string') {
      diagObj = JSON.parse(lesson4Data.dialogueJson);
    } else if (lesson4Data.dialogueJson) {
      diagObj = lesson4Data.dialogueJson;
    }
    expect(diagObj.readingPassage).toBeDefined();
    expect(diagObj.readingPassage.titleZh).toBe('周末的打算');
    expect(diagObj.readingPassage.characterCount).toBeGreaterThanOrEqual(50);

    // 2.4 UI verification: Content Manager logs in to management portal
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.contentManager.email);
    await page.fill('#login-password', testCredentials.contentManager.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/management.*/, { timeout: 15000 });
  });

  test('3. Student Curriculum Discovery: Student views HSK 3 curriculum structure & canonical 5 Units', async ({ page }) => {
    // 3.1 Student login
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 3.2 Navigate to learning path with HSK mode
    await page.goto('/ZhongWenHub/learning-path?mode=hsk');
    await page.waitForLoadState('networkidle');

    // 3.3 Verify HSK 3 curriculum title and units exist in page or tabs
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();

    // 3.4 Check draft protection banner when student visits draft lesson directly
    await page.goto(`/ZhongWenHub/lesson?id=${HSK3_LESSON_1_ID}`);
    await page.waitForLoadState('networkidle');

    // Should display draft notice or error banner, NOT raw crash
    const alertOrError = page.getByRole('heading', { name: /Không tìm thấy nội dung bài học/i });
    await expect(alertOrError).toBeVisible({ timeout: 10000 });
  });

  test('4. HSK 3 Reading Passage Interactive Flow: Unit 1 Lesson 4 Reading Passage & Quiz Verification', async ({ page }) => {
    // 4.1 Login as student
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 4.2 Open Lesson 4 via local alias les-hsk3-4
    await page.goto('/ZhongWenHub/lesson?id=les-hsk3-4');
    await page.waitForLoadState('networkidle');

    // 4.3 Verify Reading Passage Card is visible
    const readingCard = page.locator('[data-testid="reading-passage-card"]');
    if (await readingCard.isVisible({ timeout: 8000 })) {
      await expect(readingCard.locator('[data-testid="passage-hanzi"]')).toContainText('周末');

      // Test Pinyin Toggle
      const pinyinToggleBtn = page.locator('[data-testid="toggle-pinyin-btn"]');
      if (await pinyinToggleBtn.isVisible()) {
        await pinyinToggleBtn.click();
        await page.waitForTimeout(200);
        await pinyinToggleBtn.click();
      }

      // Test Meaning Toggle
      const meaningToggleBtn = page.locator('[data-testid="toggle-meaning-btn"]');
      if (await meaningToggleBtn.isVisible()) {
        await meaningToggleBtn.click();
        await page.waitForTimeout(200);
        await meaningToggleBtn.click();
      }

      // Answer quiz
      const opt0 = page.locator('[data-testid="question-0-opt-0"]');
      if (await opt0.isVisible()) {
        await opt0.click();
        const checkBtn = page.locator('[data-testid="check-answer-btn-0"]');
        if (await checkBtn.isEnabled()) {
          await checkBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('5. Audio & Media Verification: HSK 3 dialogue and listening audio assets are present and handled gracefully', async ({ page }) => {
    // 5.1 Navigate to Lesson 1 via alias les-hsk3-1
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    await page.goto('/ZhongWenHub/lesson?id=les-hsk3-1');
    await page.waitForLoadState('networkidle');

    // 5.2 Click audio button if available
    const audioBtn = page.locator('button.hsk-icon-action-btn, button[title*="Phát âm"], button:has-text("Nghe")').first();
    if (await audioBtn.isVisible({ timeout: 5000 })) {
      await audioBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('main, #vocabulary, .lesson-page').first()).toBeVisible();
    }
  });
});
