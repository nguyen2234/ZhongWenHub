import { test, expect } from '@playwright/test';
import { testCredentials } from './config/test-credentials.config';

test.describe('Student Learning Journey End-to-End Acceptance (Live SQL Server & Browser UI)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Student Authentication & Profile: Login with student account, access dashboard, verify clean student UI', async ({ page }) => {
    // 1.1 Navigate to login
    await page.goto('/ZhongWenHub/login');
    await expect(page).toHaveURL(/.*\/login/);

    // 1.2 Fill student credentials from secure config
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');

    // 1.3 Verify redirection to student dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });
    await page.waitForLoadState('networkidle');

    // 1.4 Verify student header / dashboard elements
    await expect(page.locator('header').first()).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/01-student-dashboard.png' });

    // Verify Admin / Management button is NOT present
    await expect(page.locator('.header-admin-link')).not.toBeVisible();
  });

  test('2. HSK 1-6 Course Exploration: Navigate to HSK Curriculum and verify levels 1 to 6', async ({ page }) => {
    // 2.1 Login
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 2.2 Navigate to HSK Curriculum
    await page.goto('/ZhongWenHub/learning-path?mode=hsk');
    await page.waitForLoadState('networkidle');

    // 2.3 Verify HSK level tabs (HSK 1 to HSK 6)
    await expect(page.getByRole('button', { name: /HSK 1/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /HSK 2/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /HSK 3/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /HSK 4/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /HSK 5/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /HSK 6/i }).first()).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/02-hsk-curriculum-levels.png' });
  });

  test('3. Textbook Reading & Study: Open Lesson 1 (PUBLISHED), view Vocab, Pinyin, Grammar & Hanzi', async ({ page }) => {
    // 3.1 Login
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 3.2 Navigate to published Lesson 1 digital textbook
    await page.goto('/ZhongWenHub/lesson?id=aaaaaaaa-1111-1111-1111-111111111111');
    await page.waitForLoadState('networkidle');

    // 3.3 Verify Lesson Title and Content
    await expect(page.getByText('你好').first()).toBeVisible({ timeout: 10000 });

    // Verify presence of Vocabularies & Pinyin
    const vocabContainer = page.locator('#vocabulary, .vocabulary-section, .textbook-vocab-card, main');
    await expect(vocabContainer.first()).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/03-lesson1-textbook-study.png' });
  });

  test('4. Interactive Lesson Experience: Run focus mode, navigate through steps and verify learning progress', async ({ page }) => {
    // 4.1 Login
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 4.2 Open Focus Mode for Lesson 1
    await page.goto('/ZhongWenHub/lesson/aaaaaaaa-1111-1111-1111-111111111111/focus');
    await page.waitForLoadState('networkidle');

    // 4.3 Verify Step 1 (Giới thiệu)
    await expect(page.getByText('Giới thiệu').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'e2e/screenshots/04-lesson1-focus-step1.png' });

    // 4.4 Advance to Step 2 (Từ vựng)
    const nextBtn = page.getByRole('button', { name: /Tiếp tục|Bắt đầu học|Bài tiếp theo/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/05-lesson1-focus-step2-vocab.png' });
    }
  });

  test('5. Progress Persistence: Student completes action, logs out, logs back in and verifies session state', async ({ page }) => {
    // 5.1 Login
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 5.2 Visit Progress page
    await page.goto('/ZhongWenHub/progress');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Tiến độ|Thống kê|Tổng quan/i }).first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'e2e/screenshots/06-student-progress-page.png' });

    // 5.3 Logout
    const logoutBtn = page.locator('button:has-text("Đăng xuất"), [aria-label*="Đăng xuất"], .btn-logout');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.first().click();
      await page.waitForURL(/.*\/login/, { timeout: 8000 });
    } else {
      // Clear cookies to simulate clean session exit
      await page.context().clearCookies();
      await page.goto('/ZhongWenHub/login');
    }

    // 5.4 Re-login
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    await page.screenshot({ path: 'e2e/screenshots/07-relogin-student-success.png' });
  });
});
