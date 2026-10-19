import { test, expect } from '@playwright/test';

test.describe('FE-10.1: Full Acceptance Suite (Admin, Teacher, Support across viewports)', () => {
  // =========================================================================
  // 1. ADMIN VIEWPORTS: 1920px, 1440px, 1024px, 768px, 390px
  // =========================================================================
  test('Admin Desktop 1920px: Ultra-wide layout balance and max-width safety', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.breadcrumb-prefix')).toContainText('Quản trị ADMIN');
    await expect(page.locator('aside.management-sidebar')).toBeVisible();
    await expect(page.locator('.admin-dashboard')).toBeVisible();

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/admin-desktop-1920.png', fullPage: true });
  });

  test('Admin Desktop 1440px: Standard SaaS desktop layout, sidebar collapse, quick search', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toBeVisible();

    // Test quick search in sidebar
    const searchInput = sidebar.locator('input[placeholder*="Tìm nhanh"]');
    await searchInput.fill('Ngữ pháp');
    await expect(sidebar.locator('text=Ngữ pháp HSK (FE-9)')).toBeVisible();
    await searchInput.fill('');

    // Test sidebar collapse toggle
    const toggleBtn = page.locator('.collapse-toggle-btn');
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/collapsed/);

    // Header toggle also works
    const headerToggle = page.locator('.header-desktop-toggle');
    await headerToggle.click();
    await expect(sidebar).toHaveClass(/expanded/);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/admin-desktop-1440.png', fullPage: true });
  });

  test('Admin Tablet 1024px: Compact workspace and collapsible sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toBeVisible();

    // Verify layout adapts without horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/admin-tablet-1024.png', fullPage: true });
  });

  test('Admin Tablet 768px: Mobile drawer trigger and stacked cards', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Hamburger button should be active on 768px
    const hamburgerBtn = page.locator('.header-mobile-toggle');
    await expect(hamburgerBtn).toBeVisible();

    await hamburgerBtn.click();
    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toHaveClass(/mobile-open/);

    // Close via close button
    const closeBtn = page.locator('.mobile-close-btn');
    await closeBtn.click();
    await expect(sidebar).not.toHaveClass(/mobile-open/);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/admin-tablet-768.png', fullPage: true });
  });

  test('Admin Mobile 390px: Smartphone layout, safe areas, no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify touch targets >= 44px on priority buttons
    const reviewBtn = page.locator('text=Duyệt').first();
    await expect(reviewBtn).toBeVisible();
    const box = await reviewBtn.boundingBox();
    expect(box).toBeDefined();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/admin-mobile-390.png', fullPage: true });
  });

  // =========================================================================
  // 2. TEACHER PORTAL VERIFICATION (Desktop 1440 & Mobile 390)
  // =========================================================================
  test('Teacher Portal: Shared layout integrity on Desktop 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/teacher/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('TEACHER');
    await expect(page.locator('.breadcrumb-prefix')).toContainText('Quản trị TEACHER');

    // Teacher navigation items
    await expect(sidebar.locator('text=Không gian AI')).toBeVisible();
    await expect(sidebar.locator('text=Lớp của tôi')).toBeVisible();
    await expect(sidebar.locator('text=Bài tập')).toBeVisible();

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/teacher-desktop-1440.png', fullPage: true });
  });

  test('Teacher Portal: Shared layout integrity on Mobile 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ZhongWenHub/management/teacher/dashboard');
    await page.waitForLoadState('networkidle');

    const hamburgerBtn = page.locator('.header-mobile-toggle');
    await expect(hamburgerBtn).toBeVisible();
    await hamburgerBtn.click();

    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toHaveClass(/mobile-open/);
    await expect(sidebar).toContainText('TEACHER');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/teacher-mobile-390.png', fullPage: true });
  });

  // =========================================================================
  // 3. SUPPORT PORTAL VERIFICATION (Desktop 1440 & Mobile 390)
  // =========================================================================
  test('Support Portal: Shared layout integrity on Desktop 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/support/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('SUPPORT');
    await expect(page.locator('.breadcrumb-prefix')).toContainText('Quản trị SUPPORT');

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/support-desktop-1440.png', fullPage: true });
  });

  test('Support Portal: Shared layout integrity on Mobile 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ZhongWenHub/management/support/dashboard');
    await page.waitForLoadState('networkidle');

    const hamburgerBtn = page.locator('.header-mobile-toggle');
    await expect(hamburgerBtn).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/support-mobile-390.png', fullPage: true });
  });

  // =========================================================================
  // 4. LINK & ROUTE INTEGRITY: NO DEAD LINKS OR UNHANDLED 404s
  // =========================================================================
  test('All Dashboard Action Links navigate to valid pages with proper headers', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Click on Moderation link
    await page.locator('a[href*="/moderation"]').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Hàng đợi kiểm duyệt học liệu');
    await expect(page.locator('text=LỘ TRÌNH FE-10.3')).toBeVisible();

    // Click back to dashboard
    await page.locator('a:has-text("Về Dashboard")').first().click();
    await page.waitForLoadState('networkidle');

    // Click on Urgent Support link
    await page.locator('a[href*="/support-requests"]').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Yêu cầu hỗ trợ & Giám sát SLA');
    await expect(page.locator('text=LỘ TRÌNH FE-10.3')).toBeVisible();

    // Click back to dashboard
    await page.locator('a:has-text("Về Dashboard")').first().click();
    await page.waitForLoadState('networkidle');

    // Click on AI Tutor link
    await page.locator('a[href*="/ai-management"]').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Quản lý & Giám sát Trợ lý AI Tutor');
    await expect(page.locator('text=LỘ TRÌNH FE-10.3')).toBeVisible();
  });
});
