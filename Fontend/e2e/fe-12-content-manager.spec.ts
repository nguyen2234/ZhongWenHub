import { test, expect } from '@playwright/test';

test.describe('FE-12: Content Manager Workspace Acceptance Suite', () => {
  test('Content Manager Dashboard: KPI widgets, quick self-publish modal, Evondev layout', async ({ page }) => {
    await page.goto('/ZhongWenHub/management/content-manager/dashboard');
    await page.waitForLoadState('networkidle');

    // Header & Role Context
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.breadcrumb-prefix')).toContainText('CONTENT_MANAGER');

    // On desktop (>= 1024px), verify 9 sidebar navigation items
    const width = page.viewportSize()?.width ?? 1440;
    if (width >= 1024) {
      const sidebar = page.locator('aside.management-sidebar');
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Tổng quan' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Kho học liệu HSK' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Giáo trình & Bài học' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Ngữ pháp' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: 'Ngân hàng câu hỏi' })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: /Kiểm duyệt & Xuất bản/ })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: /Báo cáo lỗi nội dung/ })).toBeVisible();
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

  test('Responsive Layout: Viewport safety and zero unwanted horizontal overflow', async ({ page }) => {
    await page.goto('/ZhongWenHub/management/content-manager/moderation');
    await page.waitForLoadState('networkidle');

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 2);
  });
});
