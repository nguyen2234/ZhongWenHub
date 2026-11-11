import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'e2e/screenshots');

async function loginViaUi(
  page: Page,
  email = 'contentmanager@zhongwenhub.edu.vn',
  password = 'ContentManager123!'
) {
  await page.goto('/ZhongWenHub/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/auth/login') && res.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test.describe('ZhongWenHub — Tinh chỉnh Giao diện Content Manager & Export Excel Acceptance', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Kiểm tra Header: Nhãn "Mô phỏng Demo" đã được xóa bỏ hoàn toàn', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Xác nhận không còn xuất hiện "Mô phỏng Demo" trên header
    const demoIndicator = page.locator('text=Mô phỏng Demo');
    await expect(demoIndicator).not.toBeVisible();
  });

  test('2. Kiểm tra Branding Logo: Đã xóa nhãn CONTENT_MANAGER cạnh tên thương hiệu', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Logo ZhongWenHub và dòng subtitle vẫn hiển thị
    await expect(page.getByText('ZhongWenHub').first()).toBeVisible();
    await expect(page.getByText('Quản lý học liệu & Kiểm duyệt').first()).toBeVisible();

    // Nhãn đỏ CONTENT_MANAGER cạnh logo không còn tồn tại trong sidebar header
    const brandHeader = page.locator('.management-sidebar a').first();
    await expect(brandHeader).toBeVisible();
    await expect(brandHeader.locator('span:has-text("CONTENT_MANAGER")')).toHaveCount(0);
  });

  test('3. Kiểm tra Sidebar: Đã xóa toàn bộ khu vực "Không gian quản trị"', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Xác nhận không còn mục "Không gian quản trị" và các nút switch Admin/Content/Teacher/Support
    await expect(page.locator('text=Không gian quản trị:')).toHaveCount(0);
    await expect(page.locator('text=Không gian quản trị')).toHaveCount(0);

    // Cổng Học Viên vẫn tồn tại
    await expect(page.getByRole('link', { name: /Cổng Học Viên/i })).toBeVisible();

    // Không còn khối "Chuyển cổng" nằm ngoài sidebar hay trên thanh header
    await expect(page.locator('text=Chuyển cổng (')).toHaveCount(0);

    // Chuyển cổng nằm gọn trong menu dropdown của profile góc phải trên
    const profileTrigger = page.getByTestId('profile-menu-trigger');
    await expect(profileTrigger).toBeVisible();
    await profileTrigger.click();
    await expect(page.getByTestId('profile-portal-switcher')).toBeVisible();
  });

  test('4. Kiểm tra nút nổi "Hỏi AI": Ẩn trên cổng quản lý (/management/*), hiện trên cổng học viên', async ({ page }) => {
    await loginViaUi(page);

    // 4.1 Truy cập cổng quản lý: Không có nút Hỏi AI
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');
    const floatingBtnOnManagement = page.locator('button:has-text("Hỏi AI")');
    await expect(floatingBtnOnManagement).toHaveCount(0);

    // 4.2 Truy cập cổng học viên: Nút Hỏi AI xuất hiện
    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('networkidle');
    const floatingBtnOnStudent = page.locator('button:has-text("Hỏi AI")');
    await expect(floatingBtnOnStudent).toBeVisible({ timeout: 10000 });
  });

  test('5. Kiểm tra nút "Export Excel": Nằm đúng vị trí phía trên bảng từ vựng và xuất file .xlsx thật', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Nút "Tải Excel mẫu" trên top header đã bị xóa
    const topDownloadBtn = page.locator('.lcm-header').getByRole('button', { name: /Tải Excel mẫu/i });
    await expect(topDownloadBtn).toHaveCount(0);

    // Nút "Export Excel" hiển thị ngay cạnh "Hiển thị ... từ vựng chuẩn"
    const exportBtn = page.getByRole('button', { name: /Export Excel/i });
    await expect(exportBtn).toBeVisible({ timeout: 10000 });

    // Chụp ảnh giao diện sau khi tinh chỉnh
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'content_manager_refined_ui.png') });

    // Click Export Excel và chờ sự kiện download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    // Kiểm tra tên file export chuẩn
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/ZhongWenHub_TuVung_HSK.*\.xlsx/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    if (downloadPath) {
      const stats = fs.statSync(downloadPath);
      // File Excel chứa 300 từ HSK 1 thật từ SQL Server, kích thước khoảng ~27KB
      expect(stats.size).toBeGreaterThan(15000);
    }
  });

  test('6. Kiểm tra Responsive Mobile (375x667): Bố cục tinh chỉnh gọn gàng, nút Export Excel thao tác tốt', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Kiểm tra nút Export Excel vẫn hiển thị và bấm được trên mobile
    const exportBtn = page.getByRole('button', { name: /Export Excel/i });
    await expect(exportBtn).toBeVisible();

    // Chụp ảnh giao diện mobile sau tinh chỉnh
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'content_manager_mobile_refined.png') });
  });
});
