import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'e2e/screenshots');

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

test.describe('ZhongWenHub — Hoàn thiện CRUD Admin: Người dùng & Tổ chức', () => {
  test.describe.configure({ mode: 'serial' });

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const testStudentEmail = `e2e_student_${randomSuffix}@zhongwenhub.edu.vn`;
  const testStudentPassword = 'StudentPassword123!';
  const testStudentName = `Học Viên E2E ${randomSuffix}`;

  const testTeacherEmail = `e2e_teacher_${randomSuffix}@zhongwenhub.edu.vn`;
  const testTeacherName = `Giáo Viên E2E ${randomSuffix}`;

  test('01. Đăng nhập Admin thành công vào hệ thống', async ({ page }) => {
    await loginViaUi(page);
    expect(page.url()).toContain('/ZhongWenHub/');
  });

  test('02. Mở Quản lý người dùng, thấy danh sách người dùng thật từ SQL Server', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Kiểm tra tiêu đề trang
    await expect(page.getByText('Quản lý người dùng').first()).toBeVisible();

    // Kiểm tra dải thống kê KPI
    const totalUsersStrip = page.locator('.user-summary-strip').first();
    await expect(totalUsersStrip).toBeVisible();

    // Bảng dữ liệu có hiển thị người dùng thật từ SQL Server
    const userTable = page.locator('.user-table-desktop');
    await expect(userTable).toBeVisible();
    await expect(page.locator('tbody tr')).not.toHaveCount(0);
  });

  test('03. Tìm kiếm người dùng theo tên hoặc email', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Tìm kiếm "admin@zhongwenhub.edu.vn"
    const searchInput = page.locator('.user-search-input').first();
    await searchInput.fill('admin@zhongwenhub.edu.vn');
    await page.waitForTimeout(600);

    // Xác nhận kết quả tìm kiếm chứa admin
    await expect(page.getByText('admin@zhongwenhub.edu.vn').first()).toBeVisible();
  });

  test('04. Lọc theo vai trò (TEACHER, STUDENT...), trạng thái, cấp HSK', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Lọc theo vai trò TEACHER
    const roleSelect = page.locator('select[aria-label="Lọc theo vai trò người dùng"]');
    await expect(roleSelect).toBeVisible();
    await roleSelect.selectOption('TEACHER');
    await page.waitForTimeout(600);

    // Xác nhận có giáo viên hiển thị
    await expect(page.locator('tbody tr')).not.toHaveCount(0);
  });

  test('05. Phân trang hoạt động', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Kiểm tra footer phân trang
    const pagination = page.locator('.mgmt-pagination, nav[aria-label="Phân trang dữ liệu"]');
    await expect(pagination).toBeVisible();
  });

  test('06. Mở Drawer xem chi tiết người dùng', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Click dòng đầu tiên để mở drawer
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(600);

    // Kiểm tra drawer mở ra
    const drawer = page.locator('.user-detail-drawer');
    await expect(drawer).toBeVisible();

    // Đóng drawer bằng phím Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('07. Tạo người dùng mới với vai trò STUDENT, lưu vào SQL Server và đăng nhập thử', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Bấm nút "Thêm người dùng"
    await page.click('button:has-text("Thêm người dùng")');
    await page.waitForSelector('form');

    // Điền form
    await page.fill('input[placeholder*="Lê Hoàng Nam"]', testStudentName);
    await page.fill('input[placeholder*="nam.le@example.com"]', testStudentEmail);
    
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(testStudentPassword);
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Tạo tài khoản")');
    await page.waitForTimeout(1000);

    // Đăng xuất và đăng nhập thử bằng tài khoản vừa tạo
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testStudentEmail);
    await page.fill('#login-password', testStudentPassword);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/login') && res.status() === 200),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 10000 });
    expect(page.url()).toContain('/ZhongWenHub/');
  });

  test('08. Sửa thông tin người dùng và lưu thành công', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Tìm học viên vừa tạo
    const searchInput = page.locator('.user-search-input').first();
    await searchInput.fill(testStudentEmail);
    await page.waitForTimeout(600);

    // Click để mở Drawer
    await page.locator(`text=${testStudentEmail}`).first().click();
    await page.waitForTimeout(500);

    // Click nút "Chỉnh sửa"
    await page.click('button:has-text("Chỉnh sửa")');
    await page.waitForTimeout(300);

    // Cập nhật tên
    const nameInput = page.locator('input.drawer-form-input').first();
    await nameInput.fill(`${testStudentName} (Đã Sửa)`);

    // Click nút "Lưu thay đổi"
    await page.click('button:has-text("Lưu thay đổi")');
    await page.waitForTimeout(800);

    // Kiểm tra tên mới hiển thị
    await expect(page.getByText(`${testStudentName} (Đã Sửa)`).first()).toBeVisible();
  });

  test('09. Khóa tài khoản người dùng, kiểm tra trạng thái đổi thành Bị khóa', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Tìm học viên
    const searchInput = page.locator('.user-search-input').first();
    await searchInput.fill(testStudentEmail);
    await page.waitForTimeout(600);

    // Mở drawer
    await page.locator(`text=${testStudentEmail}`).first().click();
    await page.waitForTimeout(500);

    // Click nút Khóa tài khoản
    await page.click('button:has-text("Khóa tài khoản")');
    await page.waitForTimeout(300);

    // Xác nhận trong ConfirmDialog
    const confirmBtn = page.locator('.ds-modal button:has-text("Khóa tài khoản")').last();
    await confirmBtn.click();
    await page.waitForTimeout(800);

    // Xác nhận trạng thái chuyển sang Bị khóa
    await expect(page.getByText('Tài khoản bị khóa', { exact: false }).first()).toBeVisible();
  });

  test('10. Đăng nhập bằng tài khoản bị khóa -> Bị từ chối', async ({ page }) => {
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testStudentEmail);
    await page.fill('#login-password', testStudentPassword);
    
    // Đăng nhập phải trả về lỗi hoặc bị chặn
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/login')),
      page.click('button[type="submit"]'),
    ]);
    expect([400, 401, 403]).toContain(response.status());
  });

  test('11. Mở khóa tài khoản, đăng nhập lại thành công', async ({ page }) => {
    // Admin mở khóa
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('.user-search-input').first();
    await searchInput.fill(testStudentEmail);
    await page.waitForTimeout(600);

    await page.locator(`text=${testStudentEmail}`).first().click();
    await page.waitForTimeout(500);

    await page.click('button:has-text("Mở khóa tài khoản")');
    await page.waitForTimeout(300);

    const confirmBtn = page.locator('.ds-modal button:has-text("Mở khóa tài khoản")').last();
    await confirmBtn.click();
    await page.waitForTimeout(800);

    // Đăng nhập lại với tài khoản học viên
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testStudentEmail);
    await page.fill('#login-password', testStudentPassword);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/login') && res.status() === 200),
      page.click('button[type="submit"]'),
    ]);
    expect(page.url()).toContain('/ZhongWenHub/');
  });

  test('12. Chuyển sang Quản lý Giáo viên, thấy danh sách giáo viên thật từ SQL Server', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/teachers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Quản lý giáo viên').first()).toBeVisible();
    await expect(page.locator('tbody tr')).not.toHaveCount(0);
  });

  test('13. Thêm giáo viên mới, xuất hiện trong danh sách', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/teachers');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Thêm giáo viên")');
    await page.waitForSelector('form');

    await page.fill('input[placeholder*="Nguyễn Thu Hà"]', testTeacherName);
    await page.fill('input[placeholder*="ha.nguyen@zhongwenhub"]', testTeacherEmail);
    
    const submitBtn = page.locator('button[type="submit"]:has-text("Tạo giáo viên")').first();
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Kiểm tra giáo viên hiển thị
    await expect(page.getByText(testTeacherName).first()).toBeVisible();
  });

  test('14. Chuyển sang Nhân viên hỗ trợ, thấy danh sách và dải thống kê', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/support-staff');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Quản lý nhân viên hỗ trợ').first()).toBeVisible();
    await expect(page.locator('tbody tr')).not.toHaveCount(0);
  });

  test('15. Chuyển sang Vai trò & Phân quyền, kiểm tra các vai trò và số lượng người dùng thật từ SQL Server', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/ZhongWenHub/management/admin/roles');
    await page.waitForLoadState('networkidle');

    // Kiểm tra tiêu đề trang
    await expect(page.getByText('Quản lý vai trò & quyền hạn').first()).toBeVisible();

    // Kiểm tra các vai trò cốt lõi xuất hiện
    await expect(page.getByText('Quản trị viên').first()).toBeVisible();
    await expect(page.getByText('Giáo viên').first()).toBeVisible();
    await expect(page.getByText('Học viên').first()).toBeVisible();
  });

  test('16. Tài khoản ADMIN nhập sai mật khẩu nhiều lần không bị tự động khóa, đăng nhập lại thành công', async ({ page }) => {
    const adminEmail = 'admin@zhongwenhub.edu.vn';
    const correctPass = 'AdminPassword123!';
    const wrongPass = 'IncorrectPassword999!';

    await page.goto('/ZhongWenHub/login');
    await page.waitForLoadState('networkidle');

    // Thử nhập sai mật khẩu 3 lần liên tiếp
    for (let i = 0; i < 3; i++) {
      await page.fill('#login-email', adminEmail);
      await page.fill('#login-password', wrongPass);
      const [res] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/auth/login')),
        page.click('button[type="submit"]'),
      ]);
      expect(res.status()).toBe(401);
      await page.waitForTimeout(300);
    }

    // Lần thứ 4 nhập đúng mật khẩu -> Đăng nhập thành công, không bị lockout
    await page.fill('#login-email', adminEmail);
    await page.fill('#login-password', correctPass);
    const [okRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login')),
      page.click('button[type="submit"]'),
    ]);
    expect(okRes.status()).toBe(200);
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 10000 });
    expect(page.url()).toContain('/ZhongWenHub/');
  });
});
