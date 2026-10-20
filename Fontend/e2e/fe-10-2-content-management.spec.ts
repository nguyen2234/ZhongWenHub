import { test, expect } from '@playwright/test';

test.describe('FE-10.2: Admin Content Management - Grammar & Exercise Bank', () => {
  test('Desktop 1440px: Admin Grammar Management, Search, Filters & Student Preview Drawer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/grammar');
    await page.waitForLoadState('networkidle');

    // 1. Header and Page Structure
    await expect(page.locator('h1')).toContainText('Quản lý Ngữ pháp (HSK 1 - 6)');
    await expect(page.locator('text=Lưu ý quản trị')).toBeVisible();

    // 2. Stat Cards
    await expect(page.locator('text=Tổng điểm ngữ pháp')).toBeVisible();
    await expect(page.locator('text=Đã xuất bản (Live)')).toBeVisible();

    // Screenshot of main Grammar Management table
    await page.screenshot({ path: 'screenshots/admin-grammar-management-desktop-1440.png' });

    // 3. Search input
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    await searchInput.fill('是');
    await page.waitForTimeout(400);

    // Should find Câu phán đoán với 是
    await expect(page.locator('text=Câu phán đoán với 是').first()).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(400);

    // 4. Open Detail Drawer & Student Preview
    const firstDetailBtn = page.locator('button[title*="Xem chi tiết & Preview"]').first();
    await firstDetailBtn.click();
    await page.waitForTimeout(500);

    // Drawer tabs should be visible
    const infoTab = page.locator('button:has-text("Thông tin & Công thức")');
    await expect(infoTab).toBeVisible();

    // Switch to Student Preview tab
    const previewTab = page.locator('button:has-text("Xem trước học viên")');
    await expect(previewTab).toBeVisible();
    await previewTab.click();
    await page.waitForTimeout(400);

    // Should show student preview card
    await expect(page.locator('text=Giao diện dưới đây mô phỏng chính xác')).toBeVisible();

    // Screenshot of Grammar Detail Drawer with Live Preview
    await page.screenshot({ path: 'screenshots/admin-grammar-drawer-preview-desktop-1440.png' });

    // Close drawer
    const closeBtn = page.locator('button[aria-label="Đóng drawer"]').first();
    await closeBtn.click();
    await page.waitForTimeout(400);
  });

  test('Desktop 1440px: Admin Exercise Bank, Live Exercise Engine Preview Host & Filters', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/exercises');
    await page.waitForLoadState('networkidle');

    // 1. Header and Metadata HSK Distribution Bar
    await expect(page.locator('h1')).toContainText('Ngân hàng Bài tập & Câu hỏi');
    await expect(page.locator('text=Phân bố HSK thực tế (No Fake Levels):')).toBeVisible();
    await expect(page.locator('text=HSK 1:')).toBeVisible();

    // Screenshot of main Exercise Bank table
    await page.screenshot({ path: 'screenshots/admin-exercise-bank-desktop-1440.png' });

    // 2. Open First Exercise Detail Drawer
    const firstPreviewBtn = page.locator('button[title="Xem trước Live Engine"]').first();
    await firstPreviewBtn.click();
    await page.waitForTimeout(500);

    // Drawer should show the live host
    await expect(page.locator('text=Xem trước học viên (Exercise Engine)')).toBeVisible();
    await expect(page.locator('text=Exercise Engine Live Host')).toBeVisible();
    await expect(page.locator('text=Kiểm tra đáp án')).toBeVisible();

    // Screenshot of Exercise Engine Host
    await page.screenshot({ path: 'screenshots/admin-exercise-engine-preview-desktop-1440.png' });

    // Close drawer
    const closeBtn = page.locator('button[aria-label="Đóng drawer"]').first();
    await closeBtn.click();
    await page.waitForTimeout(400);
  });

  test('Desktop 1440px: Cross-module Deep Linking between HSK Repo, Curriculum, Lesson Editor', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. From HSK Repository -> Grammar Management deep link
    await page.goto('/ZhongWenHub/management/admin/hsk-repo');
    await page.waitForLoadState('networkidle');

    // Switch to Grammar Tab in HSK Repo
    const grammarTab = page.locator('button:has-text("Ngữ pháp")').first();
    if (await grammarTab.isVisible()) {
      await grammarTab.click();
      await page.waitForTimeout(400);

      const mgmtBtn = page.locator('a:has-text("Mở trang Quản lý Ngữ pháp")').first();
      await expect(mgmtBtn).toBeVisible();
      await mgmtBtn.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/management\/admin\/grammar\?hsk=1/);
    }

    // 2. From Curriculum -> Grammar & Exercises navigation buttons
    await page.goto('/ZhongWenHub/management/admin/curriculum');
    await page.waitForLoadState('networkidle');

    const courseGrammarBtn = page.locator('button:has-text("Ngữ pháp khóa học")').first();
    await expect(courseGrammarBtn).toBeVisible();

    const exerciseBankBtn = page.locator('button:has-text("Kho bài tập")').first();
    await expect(exerciseBankBtn).toBeVisible();

    // 3. Direct deep link with ID preserves across refresh
    await page.goto('/ZhongWenHub/management/admin/exercises?id=ex-p1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Exercise Engine Live Host')).toBeVisible();
  });

  test('Mobile 390px: Responsive viewports for Grammar & Exercise Bank', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // 1. Mobile Grammar Management
    await page.goto('/ZhongWenHub/management/admin/grammar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Quản lý Ngữ pháp');
    await page.screenshot({ path: 'screenshots/admin-grammar-mobile-390.png' });

    // 2. Mobile Exercise Bank
    await page.goto('/ZhongWenHub/management/admin/exercises');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Ngân hàng Bài tập');
    await page.screenshot({ path: 'screenshots/admin-exercise-bank-mobile-390.png' });
  });
});
