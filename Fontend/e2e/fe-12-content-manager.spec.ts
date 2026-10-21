import { test, expect } from '@playwright/test';

test.describe('FE-12: Content Manager Workspace Acceptance Suite', () => {
  test('Content Manager Dashboard: KPI widgets, quick self-publish modal, Evondev layout', async ({ page }) => {
    await page.goto('/ZhongWenHub/management/content-manager/dashboard');
    await page.waitForLoadState('networkidle');

    // Header & Role Context
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.breadcrumb-prefix')).toContainText('CONTENT_MANAGER');

    // On desktop (>= 1024px), verify all 10 academic content features + overview
    const width = page.viewportSize()?.width ?? 1440;
    if (width >= 1024) {
      const sidebar = page.locator('aside.management-sidebar');
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Tổng quan' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Kho HSK' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Giáo trình & Bài học' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Trình biên tập bài học' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Ngữ pháp' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Ngân hàng câu hỏi' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Học liệu video' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: /Kiểm duyệt & Xuất bản/ })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: /Báo cáo lỗi học liệu/ })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Lịch sử phiên bản' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Thống kê chất lượng' })).toBeVisible();
    }

    // Dashboard Metric Cards (Evondev flat card design)
    await expect(page.locator('.cm-metric-card').first()).toBeVisible();
    await expect(page.locator('text=Chờ kiểm duyệt').first()).toBeVisible();

    // Self-Publish Modal Interaction
    const selfPublishBtn = page.locator('button:has-text("Tự xuất bản học liệu"):visible').first();
    await expect(selfPublishBtn).toBeVisible();
    await selfPublishBtn.click();

    // Verify Modal
    const modal = page.locator('.cm-drawer-backdrop[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Tự xuất bản học liệu mới')).toBeVisible();

    // Cancel modal via Hủy button
    const cancelBtn = modal.locator('button:has-text("Hủy")');
    await cancelBtn.click();
    await expect(modal).toBeHidden();
  });

  test('Content Moderation Page: Filter tabs, Preview drawer, and Moderation Controls', async ({ page }) => {
    await page.goto('/ZhongWenHub/management/content-manager/moderation');
    await page.waitForLoadState('networkidle');

    // Tab bar verification
    const tabBar = page.locator('.cm-tab-bar');
    await expect(tabBar).toBeVisible();
    await expect(tabBar.locator('text=Chờ kiểm duyệt')).toBeVisible();
    await expect(tabBar.locator('text=Đã xuất bản')).toBeVisible();

    // Click on preview/inspect button (:visible selects either desktop table or mobile card button)
    const previewBtn = page.locator('button:has-text("Xem trước"):visible').first();
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    const drawer = page.locator('.cm-drawer-panel');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('text=So sánh bản sửa đổi')).toBeVisible();

    // Close drawer via close button
    const closeBtn = drawer.locator('button[aria-label*="Đóng"]').first();
    await closeBtn.click();
    await expect(drawer).toBeHidden();
  });

  test('Content Issues Page: Support Ticket Workflow & Resolution', async ({ page }) => {
    await page.goto('/ZhongWenHub/management/content-manager/issues');
    await page.waitForLoadState('networkidle');

    // Page title and Ticket Code presence
    await expect(page.locator('.cm-page-title')).toContainText('Tiếp nhận & Xử lý báo cáo lỗi');
    await expect(page.getByText('ISS-2026-001').first()).toBeAttached();

    // Open detail drawer
    const viewBtn = page.getByRole('button', { name: /Xử lý/ }).first();
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();

    const drawer = page.locator('.cm-drawer-panel');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('text=Nội dung học viên phản ánh')).toBeVisible();

    // Close drawer
    const closeBtn = drawer.locator('button[aria-label*="Đóng"]').first();
    await closeBtn.click();
    await expect(drawer).toBeHidden();
  });

  test('Admin Console Separation: No academic content or moderation in Admin sidebar', async ({ page }) => {
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const width = page.viewportSize()?.width ?? 1440;
    if (width >= 1024) {
      const sidebar = page.locator('aside.management-sidebar');
      await expect(sidebar).toBeVisible();

      // Confirms content editing and moderation are NOT present in Admin sidebar
      await expect(sidebar.locator('text=HỌC LIỆU & NỘI DUNG')).toHaveCount(0);
      await expect(sidebar.locator('text=Kho chuẩn HSK')).toHaveCount(0);
      await expect(sidebar.locator('text=Duyệt nội dung')).toHaveCount(0);

      // Confirms administrative operations are preserved
      await expect(sidebar.getByRole('link', { name: 'Học viên & Người dùng' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Vai trò & Phân quyền' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Trợ lý AI Tutor' })).toBeVisible();
    }
  });

  test('Legacy Admin Content Route Redirect: Redirects safely to Content Manager workspace', async ({ page }) => {
    // Navigate to legacy admin curriculum route
    await page.goto('/ZhongWenHub/management/admin/curriculum');
    await page.waitForURL('**/management/content-manager/curriculum');
    await page.waitForLoadState('networkidle');

    // Should redirect to Content Manager curriculum route
    expect(page.url()).toContain('/management/content-manager/curriculum');
    await expect(page.locator('text=Giáo trình & Bài học').first()).toBeVisible();
  });

  test('Lesson Editor Workspace Isolation: Back button stays within Content Manager', async ({ page }) => {
    await page.goto('/ZhongWenHub/management/content-manager/curriculum/lessons/les-8/edit');
    await page.waitForLoadState('networkidle');

    // Check editor header
    await expect(page.locator('h2').first()).toBeVisible();

    // Click on Back button ("Giáo trình")
    const backBtn = page.getByRole('button', { name: /Giáo trình/ });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify it stays in /management/content-manager/curriculum and does not leak to /management/admin
    await page.waitForURL('**/management/content-manager/curriculum');
    expect(page.url()).toContain('/management/content-manager/curriculum');
    expect(page.url()).not.toContain('/management/admin');
  });

  test('Responsive Layout: Viewport safety and zero unwanted horizontal overflow', async ({ page }) => {
    await page.goto('/ZhongWenHub/management/content-manager/moderation');
    await page.waitForLoadState('networkidle');

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 2);
  });
});
