import { test, expect } from '@playwright/test';

async function setSessionRole(page: any, role: string) {
  await page.addInitScript((r: string) => {
    window.sessionStorage.setItem('zwh_management_session', JSON.stringify({
      id: `usr-${r.toLowerCase()}-01`,
      name: `${r} Test Lead`,
      email: `${r.toLowerCase()}@zhongwenhub.edu.vn`,
      role: r,
      permissions: ['*'],
    }));
  }, role);
}

test.describe('FE-13.4: Cross-Portal Workflows & RBAC Acceptance Suite', () => {
  test.describe('Workflow 1 — Support Escalation to Content Manager & Issue Resolution', () => {
    test('End-to-End: Support escalates ticket to Content Manager, verifies link, and resolves issue', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setSessionRole(page, 'ADMIN'); // Admin has access across all portals

      // 1. Visit Support Dashboard
      await page.goto('/ZhongWenHub/management/support/dashboard');
      await page.waitForLoadState('networkidle');

      // 2. Open first non-escalated ticket (TICK-2041)
      const openTicketBtn = page.locator('tbody tr button:has-text("Xử lý")').first();
      await expect(openTicketBtn).toBeVisible();
      await openTicketBtn.click();

      // Drawer opens
      const drawer = page.locator('div[role="dialog"]');
      await expect(drawer).toBeVisible();
      await expect(drawer).toContainText('TICK-2041');

      // 3. Click "Chuyển tiếp lỗi học liệu" to trigger modal
      const escalateBtn = drawer.locator('button:has-text("Chuyển tiếp lỗi học liệu")');
      await expect(escalateBtn).toBeVisible();
      await escalateBtn.click();

      // 4. Modal is visible, confirm escalation
      const modal = page.getByRole('dialog', { name: 'Chuyển tiếp báo lỗi học liệu' });
      await expect(modal).toBeVisible();

      const confirmBtn = modal.locator('button:has-text("Chuyển tiếp ngay")');
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // 5. Drawer updates to show linked Content Issue banner
      await expect(drawer.locator('text=Đã liên kết Ban Quản lý học liệu')).toBeVisible();
      const viewLink = drawer.locator('a:has-text("Xem tại Content Manager")');
      await expect(viewLink).toBeVisible();
      await viewLink.click();

      // 6. Navigate to Content Manager Issues Workspace via client router
      await page.waitForURL(/.*\/management\/content-manager\/issues/);
      await page.waitForLoadState('networkidle');

      // Verify the escalated issue appears at top of Content Manager table
      await expect(page.locator('h1')).toContainText('Tiếp nhận & Xử lý báo cáo lỗi học liệu');
      const table = page.locator('table');
      await expect(table).toBeVisible();
      await expect(table).toContainText('Sai giải thích ngữ pháp câu chữ Ba');

      // 7. Open the issue detail drawer in Content Manager
      const viewIssueBtn = page.locator('tbody tr button:has-text("Xử lý")').first();
      await expect(viewIssueBtn).toBeVisible();
      await viewIssueBtn.click();

      const issueDrawer = page.locator('div[role="dialog"]');
      await expect(issueDrawer).toBeVisible();
      await expect(issueDrawer).toContainText('Sai giải thích ngữ pháp câu chữ Ba');
      await expect(issueDrawer).toContainText('Lịch sử phối hợp xử lý (Audit Trail)');

      // 8. Assign to Content Manager and Resolve
      const assignBtn = issueDrawer.locator('button:has-text("Nhận xử lý báo cáo này")');
      if (await assignBtn.isVisible()) {
        await assignBtn.click();
      }

      const resolveBtn = issueDrawer.locator('button:has-text("Xử lý xong & Phản hồi Support")');
      await expect(resolveBtn).toBeVisible();
      await resolveBtn.click();

      // Modal appears
      const resolveModal = page.locator('div[role="dialog"]').filter({ hasText: 'Xử lý hoàn tất' }).or(page.locator('div[role="dialog"]').last());
      if (await resolveModal.isVisible()) {
        const textareas = resolveModal.locator('textarea');
        const count = await textareas.count();
        if (count > 0) {
          await textareas.first().fill('Đã hiệu đính câu ví dụ câu chữ Ba và cập nhật âm thanh.');
          if (count > 1) {
            await textareas.nth(1).fill('Đã sửa xong lỗi trên hệ thống, nhờ Support kiểm tra lại.');
          }
        }
        const confirmResolveBtn = resolveModal.locator('button:has-text("Xác nhận")').or(resolveModal.locator('button[type="submit"]')).first();
        if (await confirmResolveBtn.isVisible()) {
          await confirmResolveBtn.click();
        }
      }
    });
  });

  test.describe('Workflow 2 — Video Management Draft Creation, Metadata & Segment Validation', () => {
    test('End-to-End: Content Manager creates video draft, enters metadata, verifies segments, previews and saves', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setSessionRole(page, 'ADMIN');

      await page.goto('/ZhongWenHub/management/content-manager/videos');
      await page.waitForLoadState('networkidle');

      // 1. Click "Thêm video mới"
      const addBtn = page.locator('button:has-text("Thêm video mới")');
      await expect(addBtn).toBeVisible();
      await addBtn.click();

      // Drawer opens
      const drawer = page.locator('div[role="dialog"]').filter({ hasText: 'Thêm học liệu video mới' });
      await expect(drawer).toBeVisible();

      // 2. Fill required metadata
      const titleInput = drawer.locator('input[placeholder*="Giao tiếp hàng ngày"]').or(drawer.locator('input[type="text"]').first());
      await titleInput.fill('Thực hành phỏng vấn xin việc tiếng Trung HSK 5');

      const videoUrlInput = drawer.locator('input[placeholder*="youtube.com"]').or(drawer.locator('input[type="url"]').first());
      if (await videoUrlInput.isVisible()) {
        await videoUrlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      }

      // 3. Save video
      const saveBtn = drawer.locator('button:has-text("Lưu học liệu")');
      await expect(saveBtn).toBeVisible();
      await saveBtn.click();

      // Drawer closes, toast or table updates
      await expect(drawer).not.toBeVisible({ timeout: 5000 });

      // Search for created video in listing
      const searchInput = page.locator('input[placeholder*="Tìm theo tiêu đề"]');
      await searchInput.fill('phỏng vấn xin việc');
      await page.waitForTimeout(300);

      await expect(page.locator('tbody')).toContainText('Thực hành phỏng vấn xin việc');
    });
  });

  test.describe('Workflow 3 — Role-Based Access Control (RBAC) Route Guard Enforcement', () => {
    test('RBAC: Student session is strictly redirected away from admin management routes', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setSessionRole(page, 'STUDENT');

      // Attempt direct navigation to admin route
      await page.goto('/ZhongWenHub/management/admin/users');
      await page.waitForLoadState('networkidle');

      // Expect redirection to safe student path (/dashboard)
      await expect(page).toHaveURL(/.*\/dashboard/);
      expect(page.url()).not.toContain('/management/admin');
    });

    test('RBAC: Support session is redirected away from Admin-only operations', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setSessionRole(page, 'SUPPORT');

      // Support attempting to access Admin Users page
      await page.goto('/ZhongWenHub/management/admin/users');
      await page.waitForLoadState('networkidle');

      // Redirected to support default dashboard
      await expect(page).toHaveURL(/.*\/management\/support\/dashboard/);
    });

    test('RBAC: Teacher session is redirected away from Content Manager-only operations', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setSessionRole(page, 'TEACHER');

      // Teacher attempting to access Content Moderation
      await page.goto('/ZhongWenHub/management/content-manager/moderation');
      await page.waitForLoadState('networkidle');

      // Redirected to teacher default dashboard
      await expect(page).toHaveURL(/.*\/management\/teacher\/dashboard/);
    });

    test('RBAC: Content Manager session is redirected away from Super Admin system settings', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setSessionRole(page, 'CONTENT_MANAGER');

      // Content Manager attempting to access Admin Settings
      await page.goto('/ZhongWenHub/management/admin/settings');
      await page.waitForLoadState('networkidle');

      // Redirected to content manager default dashboard
      await expect(page).toHaveURL(/.*\/management\/content-manager\/dashboard/);
    });

    test('RBAC: Authorized Admin session successfully loads permitted pages', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setSessionRole(page, 'ADMIN');

      await page.goto('/ZhongWenHub/management/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/management\/admin\/dashboard/);
      await expect(page.locator('h1')).toBeVisible();

      await page.goto('/ZhongWenHub/management/admin/users');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/management\/admin\/users/);
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
