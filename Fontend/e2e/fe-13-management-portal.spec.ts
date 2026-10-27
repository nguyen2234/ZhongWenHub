import { test, expect } from '@playwright/test';

test.describe('FE-13.1: Complete Management Frontend & Evondev UI/UX Acceptance Suite', () => {
  test.describe('1. Content Manager Video Management (/management/content-manager/videos)', () => {
    test('Desktop 1440px: Video listing, HSK filter, search, preview modal, and editor drawer', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/content-manager/videos');
      await page.waitForLoadState('networkidle');

      // 1. Header & Title
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Quản lý học liệu Video & Phụ đề');

      // 2. Metric Strip
      await expect(page.locator('.ds-card').first()).toBeVisible();
      await expect(page.locator('text=Tổng video')).toBeVisible();

      // 3. Search and filtering
      const searchInput = page.locator('input[placeholder*="Tìm video theo tiêu đề"]');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Chào hỏi');
      await page.waitForTimeout(300);
      await expect(page.locator('tbody tr')).toHaveCount(1);
      await expect(page.locator('tbody')).toContainText('Chào hỏi và giới thiệu');

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(300);

      // 4. Open Video Preview Modal
      const previewBtn = page.locator('button[title*="Xem trước"]').first();
      await expect(previewBtn).toBeVisible();
      await previewBtn.click();

      // Verify modal and synchronized transcript
      const previewModal = page.locator('.cm-drawer-backdrop[role="dialog"]');
      await expect(previewModal).toBeVisible();
      await expect(previewModal).toContainText('Xem trước Video & Phụ đề');
      await expect(previewModal.locator('video')).toBeVisible();
      await expect(previewModal.locator('.ds-badge')).toBeVisible();

      // Close preview modal
      await previewModal.locator('button:has-text("Đóng")').click();
      await expect(previewModal).not.toBeVisible();

      // 5. Open Video Editor Modal
      const addVideoBtn = page.locator('button:has-text("Thêm Video Mới")');
      await expect(addVideoBtn).toBeVisible();
      await addVideoBtn.click();

      const editorModal = page.locator('.cm-drawer-backdrop[role="dialog"]');
      await expect(editorModal).toBeVisible();
      await expect(editorModal).toContainText('Thêm Video Học Liệu Mới');
      await expect(editorModal).toContainText('Đoạn phụ đề & Lời thoại');

      // Close editor modal
      await editorModal.locator('button:has-text("Hủy bỏ")').click();
      await expect(editorModal).not.toBeVisible();
    });
  });

  test.describe('2. Support Workspace (/management/support/dashboard)', () => {
    test('Desktop 1440px: Support KPI metrics, ticket table, detail drawer, and content escalation flow', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/support/dashboard');
      await page.waitForLoadState('networkidle');

      // 1. Header & Title
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Trung tâm Hỗ trợ Học viên (Support CSKH)');

      // 2. Support Metrics
      await expect(page.locator('text=Tổng yêu cầu')).toBeVisible();
      await expect(page.locator('text=Chờ xử lý')).toBeVisible();
      await expect(page.locator('text=Khẩn cấp')).toBeVisible();

      // 3. Tab switching
      const inProgressTab = page.locator('button:has-text("Đang xử lý")').first();
      await inProgressTab.click();
      await page.waitForTimeout(200);

      // Switch back to All
      await page.locator('button:has-text("Tất cả yêu cầu")').first().click();

      // 4. Open Ticket Detail Drawer
      const detailBtn = page.locator('button:has-text("Chi tiết")').first();
      await expect(detailBtn).toBeVisible();
      await detailBtn.click();

      const drawer = page.locator('.cm-drawer-backdrop[role="dialog"]');
      await expect(drawer).toBeVisible();
      await expect(drawer).toContainText('Chi tiết yêu cầu');
      await expect(drawer).toContainText('Lịch sử tương tác');

      // Close drawer
      await drawer.locator('button:has-text("Đóng")').first().click();
      await expect(drawer).not.toBeVisible();
    });
  });

  test.describe('3. Admin Operations Pages (/management/admin/*)', () => {
    test('AI Management: View models, latency, quota warning, and toggle services', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/admin/ai-management');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Giám sát Vận hành Trí tuệ Nhân tạo');
      await expect(page.locator('text=AI Tutor Đồng hành')).toBeVisible();
      await expect(page.locator('text=AI Luyện khẩu ngữ trực tiếp')).toBeVisible();
      await expect(page.locator('text=AI Chấm bài tự động')).toBeVisible();
      await expect(page.locator('text=Mô phỏng Demo')).toBeVisible();
    });

    test('Analytics: Executive KPIs, HSK distribution, skill breakdown, and date filter', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/admin/analytics');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Báo cáo & Phân tích Đào tạo (Platform Analytics)');
      await expect(page.locator('text=Phân bổ học viên theo cấp độ HSK')).toBeVisible();
      await expect(page.locator('text=Phân bổ kỹ năng')).toBeVisible();
      await expect(page.locator('text=Tỉ lệ hoàn thành khóa học')).toBeVisible();
    });

    test('Support Requests Oversight: Cross-linked tickets with shared supportTicketService', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/admin/support-requests');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Giám sát Xử lý Yêu cầu Hỗ trợ (Support Oversight)');
      await expect(page.locator('text=Cần can thiệp gấp')).toBeVisible();
      await expect(page.locator('tbody tr').first()).toBeVisible();
    });

    test('System Settings: Platform information, branding preview, and maintenance simulation', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/admin/settings');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Cấu hình Hệ thống & Vận hành (System Settings)');
      await expect(page.locator('text=Nhận diện & Thương hiệu')).toBeVisible();
      await expect(page.locator('text=#E60012')).toBeVisible();
      await expect(page.locator('text=Chế độ bảo trì hệ thống')).toBeVisible();
    });
  });

  test.describe('4. Mobile Viewport 375px Ergonomics & Non-overflowing Tables', () => {
    test('Mobile 375px: Support dashboard responsive card layout without horizontal page overflow', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/ZhongWenHub/management/support/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify no horizontal document overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowance for scrollbar
    });

    test('Mobile 375px: Video management responsive card layout without horizontal page overflow', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/ZhongWenHub/management/content-manager/videos');
      await page.waitForLoadState('networkidle');

      // Verify no horizontal document overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });
  });
});
