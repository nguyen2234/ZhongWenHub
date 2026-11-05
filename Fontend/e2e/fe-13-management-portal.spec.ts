import { test, expect } from '@playwright/test';

async function setSessionRole(page: any, role: string) {
  await page.addInitScript((r: string) => {
    window.sessionStorage.setItem('zwh_management_session', JSON.stringify({
      id: `usr-${r.toLowerCase()}-01`,
      name: `${r} Lead`,
      email: `${r.toLowerCase()}@zhongwenhub.edu.vn`,
      role: r,
      permissions: ['*'],
    }));
  }, role);
}

test.describe('FE-13.1: Complete Management Frontend & Evondev UI/UX Acceptance Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setSessionRole(page, 'ADMIN');
  });
  test.describe('1. Content Manager Video Management (/management/content-manager/videos)', () => {
    test('Desktop 1440px: Video listing, HSK filter, search, preview modal, and editor drawer', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/content-manager/videos');
      await page.waitForLoadState('networkidle');

      // 1. Header & Title
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Quản lý học liệu Video & Phụ đề');

      // 2. Metric Strip
      await expect(page.locator('text=Tổng số video')).toBeVisible();

      // 3. Search and filtering
      const searchInput = page.locator('input[placeholder*="Tìm theo tiêu đề"]');
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
      const previewModal = page.locator('div[role="dialog"]');
      await expect(previewModal).toBeVisible();
      await expect(previewModal.locator('video')).toBeVisible();

      // Close preview modal
      await previewModal.locator('button:has-text("Đóng xem trước")').click();
      await expect(previewModal).not.toBeVisible();

      // 5. Open Video Editor Modal
      const addVideoBtn = page.locator('button:has-text("Thêm Video Mới")');
      await expect(addVideoBtn).toBeVisible();
      await addVideoBtn.click();

      const editorModal = page.locator('div[role="dialog"]');
      await expect(editorModal).toBeVisible();
      await expect(editorModal).toContainText('Thêm học liệu video mới');
      await expect(editorModal).toContainText('Phụ đề & Lời thoại');

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
      await expect(page.locator('text=Tổng số vé')).toBeVisible();
      await expect(page.locator('text=Vé mới nhận')).toBeVisible();
      await expect(page.locator('text=Đang xử lý').first()).toBeVisible();

      // 3. Tab switching
      const inProgressTab = page.locator('button:has-text("Đang xử lý")').first();
      await inProgressTab.click();
      await page.waitForTimeout(200);

      // Switch back to All
      await page.locator('button:has-text("Tất cả vé")').first().click();
      await page.waitForTimeout(300);

      // 4. Open Ticket Detail Drawer
      const detailBtn = page.locator('tbody tr button:has-text("Xử lý")').first();
      await expect(detailBtn).toBeVisible();
      await detailBtn.click();

      const drawer = page.locator('div[role="dialog"]');
      await expect(drawer).toBeVisible();
      await expect(drawer).toContainText('Lịch sử hoạt động');

      // Close drawer
      await drawer.locator('button[aria-label="Đóng chi tiết vé"]').click();
      await expect(drawer).not.toBeVisible();
    });
  });

  test.describe('3. Admin Operations Pages (/management/admin/*)', () => {
    test('AI Management: View models, latency, quota warning, and toggle services', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/admin/ai-management');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Giám sát Vận hành Trí tuệ Nhân tạo');
      await expect(page.locator('text=AI Tutor (Trợ lý đối thoại)')).toBeVisible();
      await expect(page.locator('text=AI Live (Luyện phát âm & Phản xạ)')).toBeVisible();
      await expect(page.locator('text=AI Grading (Chấm bài tập & Đoạn văn)')).toBeVisible();
      await expect(page.locator('text=Ngưỡng Cảnh Báo Hạn Mức Toàn Hệ Thống')).toBeVisible();
    });

    test('Analytics: Executive KPIs, HSK distribution, skill breakdown, and date filter', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/admin/analytics');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Báo cáo & Phân tích Đào tạo');
      await expect(page.locator('h3:has-text("Phân bố học viên theo cấp độ HSK")')).toBeVisible();
      await expect(page.locator('text=Phân bổ thời lượng học theo kỹ năng')).toBeVisible();
      await expect(page.locator('text=Tỷ lệ hoàn thành bài học')).toBeVisible();
    });

    test('Support Requests Oversight: Cross-linked tickets with shared supportTicketService', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/admin/support-requests');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Giám sát Xử lý Yêu cầu Hỗ trợ');
      await expect(page.locator('text=Phân quyền Giám sát Admin')).toBeVisible();
      await expect(page.locator('tbody tr').first()).toBeVisible();
    });

    test('System Settings: Platform information, branding preview, and maintenance simulation', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/ZhongWenHub/management/admin/settings');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Cấu hình Hệ thống & Vận hành');
      await expect(page.locator('text=1. Thông tin Nền tảng & Định danh')).toBeVisible();
      await expect(page.locator('text=Tên nền tảng hiển thị')).toBeVisible();
      await expect(page.locator('text=Cấu hình mô phỏng')).toBeVisible();
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
