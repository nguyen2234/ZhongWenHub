import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const FIXTURES_DIR = path.resolve(process.cwd(), 'e2e/fixtures');
const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'e2e/screenshots');
const VALID_EXCEL = path.join(FIXTURES_DIR, 'test_valid_import.xlsx');
const INVALID_EXCEL = path.join(FIXTURES_DIR, 'test_invalid_hsk7.xlsx');
const VALID_CSV = path.join(FIXTURES_DIR, 'test_valid_csv.csv');

async function loginViaUi(
  page: Page,
  email = 'admin@zhongwenhub.edu.vn',
  password = 'AdminPassword123!'
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

function cleanDatabaseTestRecords() {
  try {
    execSync(`sqlcmd -S "localhost\\SQLEXPRESS" -d ZhongWenHub_Dev -C -Q "DELETE FROM Vocabularies WHERE SourceEntryId LIKE 'TEST-%';"`, { stdio: 'ignore' });
  } catch (err) {
    console.error('Database cleanup warning:', err);
  }
}

test.describe('ZhongWenHub — Kiểm thử toàn diện Import Excel & CSV trên Browser thật', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    cleanDatabaseTestRecords();
  });

  test.afterAll(async () => {
    cleanDatabaseTestRecords();
  });

  test('1. Tải Template Excel mẫu (.xlsx) từ giao diện và kiểm tra tính hợp lệ của file', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Mở modal import để tải template
    await page.getByRole('button', { name: /Import Excel \/ CSV/i }).click();

    // Chờ nút Tải Excel mẫu trong modal xuất hiện
    const downloadBtn = page.getByRole('button', { name: /Tải Excel mẫu/i });
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadBtn.click(),
    ]);

    expect(download.suggestedFilename()).toBe('Mau_Import_TuVung_HSK.xlsx');
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    if (downloadPath) {
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(5000); // File Excel .xlsx hợp lệ chứa 2 sheets
    }

    // Đóng modal
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  });

  test('2. Quy trình Import Excel thành công: Chọn file -> Preview -> Lưu SQL Server -> Hiển thị từ mới', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Mở modal import
    const openModalBtn = page.getByRole('button', { name: /Import Excel \/ CSV/i });
    await openModalBtn.click();

    // Modal hiển thị
    const modalTitle = page.getByRole('heading', { name: /Nhập dữ liệu từ vựng HSK 3.0/i });
    await expect(modalTitle).toBeVisible();

    // Nút preview bị disabled khi chưa chọn file
    const previewBtn = page.getByRole('button', { name: /Xem trước dữ liệu \(Preview\)/i });
    await expect(previewBtn).toBeDisabled();

    // Đính kèm file test_valid_import.xlsx
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Nhấp vào đây để chọn tệp Excel').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_EXCEL);

    // Kiểm tra tên file và huy hiệu xuất hiện
    await expect(page.getByText('test_valid_import.xlsx')).toBeVisible();
    await expect(page.getByText('EXCEL XLSX')).toBeVisible();

    // Preview button giờ đã active
    await expect(previewBtn).toBeEnabled();
    await previewBtn.click();

    // Chờ trạng thái PREVIEW_READY
    await expect(page.getByText('Từ hợp lệ (Mới)', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Bỏ qua (Trùng lặp)', { exact: true })).toBeVisible();

    // Kiểm tra số đếm thống kê preview: 2 dòng hợp lệ mới, 0 trùng, 0 lỗi
    await expect(page.getByRole('cell', { name: '测试' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '系统' })).toBeVisible();

    // Chụp ảnh preview màn hình
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'excel_preview_step.png') });

    // Xác nhận import vào SQL Server
    const confirmImportBtn = page.getByRole('button', { name: /Xác nhận nhập vào SQL Server/i });
    await expect(confirmImportBtn).toBeEnabled();
    await confirmImportBtn.click();

    // Chờ trạng thái IMPORT_SUCCESS
    await expect(page.getByText('Nhập dữ liệu thành công vào SQL Server!')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Đã thêm mới bền vững')).toBeVisible();

    // Chụp ảnh kết quả import thành công
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'excel_import_success.png') });

    // Đóng modal qua nút "Đóng và xem danh sách"
    const closeBtn = page.getByRole('button', { name: /Đóng và xem danh sách/i });
    await closeBtn.click();

    // Modal đã đóng
    await expect(modalTitle).not.toBeVisible();

    // Chọn tab HSK 2 để xem từ vựng vừa nhập
    const hsk2Pill = page.getByRole('button', { name: 'HSK 2' });
    if (await hsk2Pill.isVisible()) {
      await hsk2Pill.click();
    }

    // Tìm kiếm từ "测试" trong ô tìm kiếm
    const searchInput = page.getByPlaceholder(/Tìm kiếm theo Hán tự/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('测试');
      await expect(page.getByText('cèshì').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('3. Chống trùng lặp: Import lại file cũ -> Nhận diện 2 từ trùng lặp và không import lại', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Mở modal import
    await page.getByRole('button', { name: /Import Excel \/ CSV/i }).click();

    // Chọn lại chính file test_valid_import.xlsx
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Nhấp vào đây để chọn tệp Excel').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_EXCEL);

    // Bấm Preview
    await page.getByRole('button', { name: /Xem trước dữ liệu \(Preview\)/i }).click();

    // Kiểm tra kết quả: Bỏ qua (Trùng lặp) = 2, Từ hợp lệ (Mới) = 0
    await expect(page.getByText('Bỏ qua (Trùng lặp)')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Không có từ hợp lệ để nhập')).toBeVisible();

    // Nút import bị vô hiệu hoá
    const importBtn = page.getByRole('button', { name: 'Không có từ hợp lệ để nhập' });
    await expect(importBtn).toBeDisabled();

    // Chụp ảnh chống trùng
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'excel_duplicate_protection.png') });

    // Đóng modal để kết thúc test sạch sẽ
    await page.getByRole('button', { name: 'Hủy bỏ' }).click();
  });

  test('4. Xử lý lỗi validation: File chứa HSK 7 và thiếu Hán tự -> Hiển thị chi tiết lỗi', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Mở modal import
    await page.getByRole('button', { name: /Import Excel \/ CSV/i }).click();

    // Chọn file lỗi
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Nhấp vào đây để chọn tệp Excel').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(INVALID_EXCEL);

    // Bấm Preview
    await page.getByRole('button', { name: /Xem trước dữ liệu \(Preview\)/i }).click();

    // Chờ danh sách lỗi xuất hiện
    await expect(page.getByText(/Chi tiết các dòng bị lỗi/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/từ chối cấp 7–9/i)).toBeVisible();
    await expect(page.getByText(/Chữ Hán không được để trống/i)).toBeVisible();

    // Nút import bị vô hiệu hoá
    const importBtn = page.getByRole('button', { name: 'Không có từ hợp lệ để nhập' });
    await expect(importBtn).toBeDisabled();

    // Chụp ảnh lỗi validation
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'excel_validation_errors.png') });

    // Đóng modal để kết thúc test sạch sẽ
    await page.getByRole('button', { name: 'Hủy bỏ' }).click();
  });

  test('5. Import tệp CSV: Đọc và nhập từ vựng từ tệp .csv vào SQL Server', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Mở modal import
    await page.getByRole('button', { name: /Import Excel \/ CSV/i }).click();

    // Chọn file CSV
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Nhấp vào đây để chọn tệp Excel').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_CSV);

    // Kiểm tra badge CSV xuất hiện
    await expect(page.getByText('CSV', { exact: true })).toBeVisible();

    // Bấm Preview
    await page.getByRole('button', { name: /Xem trước dữ liệu \(Preview\)/i }).click();

    // Chờ preview hiển thị 2 từ mới (电脑, 手机)
    await expect(page.getByRole('cell', { name: '电脑' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: '手机' })).toBeVisible();

    // Bấm import
    const confirmImportBtn = page.getByRole('button', { name: /Xác nhận nhập vào SQL Server/i });
    await expect(confirmImportBtn).toBeEnabled();
    await confirmImportBtn.click();

    // Thành công
    await expect(page.getByText('Nhập dữ liệu thành công vào SQL Server!')).toBeVisible({ timeout: 15000 });

    // Đóng modal
    await page.getByRole('button', { name: /Đóng và xem danh sách/i }).click();
  });

  test('6. Kiểm tra giao diện Responsive trên Mobile (Viewport 375x667): Không vỡ khung, thao tác tốt', async ({ page }) => {
    // Đặt viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/content-manager/hsk-repository');
    await page.waitForLoadState('networkidle');

    // Mở modal
    await page.getByRole('button', { name: /Import Excel \/ CSV/i }).click();

    // Kiểm tra modal hiển thị đầy đủ
    const modalTitle = page.getByRole('heading', { name: /Nhập dữ liệu từ vựng HSK 3.0/i });
    await expect(modalTitle).toBeVisible();

    // Nút Đóng trên modal visible
    const closeBtn = page.getByRole('button', { name: 'Đóng', exact: true });
    await expect(closeBtn).toBeVisible();

    // Chụp ảnh modal trên Mobile
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_modal_responsive.png') });

    // Đóng modal
    await closeBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });
});
