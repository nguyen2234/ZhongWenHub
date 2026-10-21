import { test, expect } from '@playwright/test';

test.describe('FE-10.1: Admin Web Console Redesign E2E', () => {
  test('Desktop 1440px: Complete Admin Shell, Sidebar, Header and Dashboard V2', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Check Header Elements
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(page.locator('.breadcrumb-prefix')).toContainText('Quản trị ADMIN');
    await expect(page.locator('.env-indicator-pill')).toContainText('Mô phỏng Demo');

    // 2. Check 4 Groups in Sidebar (FE-12 separation)
    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('TỔNG QUAN');
    await expect(sidebar).toContainText('NGƯỜI DÙNG & TỔ CHỨC');
    await expect(sidebar).toContainText('TRÍ TUỆ NHÂN TẠO');
    await expect(sidebar).toContainText('VẬN HÀNH & HỆ THỐNG');
    await expect(sidebar).not.toContainText('HỌC LIỆU & NỘI DUNG');

    // 3. Active Nav State for Dashboard
    const activeItem = page.locator('a.nav-item.active');
    await expect(activeItem).toBeVisible();
    await expect(activeItem).toContainText('Dashboard V2');

    // 4. Action Priority Banner
    await expect(page.locator('text=14 chờ duyệt')).toBeVisible();
    await expect(page.locator('text=Mô phỏng vận hành')).toBeVisible();

    // 5. Metric Cards
    await expect(page.locator('text=Học viên trên hệ thống')).toBeVisible();
    await expect(page.locator('.admin-metric-value').first()).toContainText('12,480');

    // 6. Test Sidebar Collapse / Expand
    const collapseBtn = page.locator('.collapse-toggle-btn');
    await collapseBtn.click();
    await expect(sidebar).toHaveClass(/collapsed/);

    // Re-expand
    await collapseBtn.click();
    await expect(sidebar).toHaveClass(/expanded/);

    // 7. Capture Desktop After Screenshot
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/admin-dashboard-after-desktop-1440.png', fullPage: true });
  });

  test('Mobile 390px: Responsive Drawer, Ergonomics and Viewport Safety', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Mobile Hamburger should be visible
    const hamburgerBtn = page.locator('.header-mobile-toggle');
    await expect(hamburgerBtn).toBeVisible();

    // 2. Click Hamburger to Open Drawer
    await hamburgerBtn.click();
    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toHaveClass(/mobile-open/);

    // 3. Close Drawer via Close Button
    const closeBtn = page.locator('.mobile-close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(sidebar).not.toHaveClass(/mobile-open/);

    // 4. Verify No Horizontal Page Overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // 5. Capture Mobile After Screenshot
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/admin-dashboard-after-mobile-390.png', fullPage: true });
  });

  test('Navigation Integrity: Active Module Pages for FE-10.2 & Planned FE-10.3', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to Grammar management (redirects to content-manager workspace)
    await page.goto('/ZhongWenHub/management/admin/grammar');
    await page.waitForURL('**/management/content-manager/grammar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Quản lý Ngữ pháp (HSK 1 - 6)');

    // Navigate to Exercises management (redirects to content-manager workspace)
    await page.goto('/ZhongWenHub/management/admin/exercises');
    await page.waitForURL('**/management/content-manager/question-bank');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Ngân hàng Bài tập & Câu hỏi');

    // Navigate to AI management (Planned for FE-10.3)
    await page.goto('/ZhongWenHub/management/admin/ai-management');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Quản lý & Giám sát Trợ lý AI Tutor');
    await expect(page.locator('text=LỘ TRÌNH FE-10.3')).toBeVisible();
  });
});
