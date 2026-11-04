import { test, expect } from '@playwright/test';

/**
 * Real End-to-End Acceptance Test for ZhongWenHub
 * 
 * STRICT INTEGRITY CONSTRAINTS:
 * - NO page.route() or route.fulfill() for authentication or user management!
 * - Directly exercises ASP.NET Core Backend on port 5000 and SQL Server ZhongWenHub_Dev.
 * - Verifies real JWT, real SQL Server users, and real RBAC (Guest: 401, Student: 403, Admin: 200).
 */
test.describe('Real Admin & RBAC Acceptance Tests (Live Backend & SQL Server - No Mock API)', () => {
  // Use serial mode so concurrent worker threads don't collide on identical DB account updates
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    // Clear cookies and storage for clean isolation between test cases
    await context.clearCookies();
  });

  test('1. Guest RBAC: Unauthenticated user is blocked by API (401) and redirected from Admin Portal', async ({ page, request }) => {
    // 1.1 Direct API verification: Guest must receive 401 Unauthorized from Admin Users API
    const apiRes = await request.get('/api/v1/admin/users');
    expect(apiRes.status()).toBe(401);

    // 1.2 Route protection: Navigating to Admin Dashboard without session redirects to /login
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

    // 1.3 Student layout inspection: Guest sees Login/Register, NO "Quản trị" button, NO demo "MA" avatar
    await page.goto('/ZhongWenHub/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);

    const loginBtn = page.getByRole('button', { name: 'Đăng nhập' });
    const registerBtn = page.getByRole('button', { name: 'Đăng ký' });
    await expect(loginBtn).toBeVisible();
    await expect(registerBtn).toBeVisible();

    // Verify "Quản trị" link/button is NOT visible for guests
    const adminLink = page.locator('.header-admin-link');
    await expect(adminLink).not.toBeVisible();
    await expect(page.locator('text=Quản trị').first()).not.toBeVisible();
  });

  test('2. Student RBAC: Real Student is rejected by Admin API (403) and forbidden from Admin Portal', async ({ page, request }) => {
    // 2.1 Register a new real student account via live Backend API
    const uniqueId = Date.now().toString().slice(-6);
    const studentUsername = `student_acc_${uniqueId}`;
    const studentEmail = `student_acc_${uniqueId}@zhongwenhub.edu.vn`;
    const studentPassword = 'StudentPassword123';

    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        username: studentUsername,
        email: studentEmail,
        fullName: `Học Viên Nghiệm Thu ${uniqueId}`,
        password: studentPassword,
        confirmPassword: studentPassword,
      },
    });
    expect([200, 201]).toContain(regRes.status());
    const regData = await regRes.json();
    expect(regData.accessToken).toBeTruthy();
    expect(regData.user.roles).toContain('STUDENT');

    const studentToken = regData.accessToken;

    // 2.2 Direct API verification: Student must receive 403 Forbidden from Admin Users API
    const adminApiRes = await request.get('/api/v1/admin/users', {
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    expect(adminApiRes.status()).toBe(403);

    // 2.3 Browser login with real student credentials
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', studentEmail);
    await page.fill('#login-password', studentPassword);
    await page.click('button[type="submit"]');

    // Should navigate to student /dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

    // Student Header must show real student name and NO Admin button
    await expect(page.getByText(`Học Viên Nghiệm Thu ${uniqueId}`).first()).toBeVisible();
    const adminLink = page.locator('.header-admin-link');
    await expect(adminLink).not.toBeVisible();

    // 2.4 Route protection: Student attempting to access /management/admin/dashboard gets redirected to /dashboard
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('3. Real Admin Login: admin@gmail.com / admin receives real JWT (200), accesses Admin Dashboard', async ({ page, request }) => {
    // 3.1 Direct Backend login API verification
    const loginApiRes = await request.post('/api/v1/auth/login', {
      data: {
        usernameOrEmail: 'admin@gmail.com',
        password: 'admin',
      },
    });
    expect(loginApiRes.status()).toBe(200);
    const loginData = await loginApiRes.json();
    expect(loginData.accessToken).toBeTruthy();
    expect(loginData.user.roles).toContain('ADMIN');
    expect(loginData.user.email).toBe('admin@gmail.com');

    // Direct Admin Users API check with real admin token: Must be 200 OK
    const usersApiRes = await request.get('/api/v1/admin/users', {
      headers: {
        Authorization: `Bearer ${loginData.accessToken}`,
      },
    });
    expect(usersApiRes.status()).toBe(200);
    const usersData = await usersApiRes.json();
    expect(usersData.totalItems).toBeGreaterThan(0);

    // 3.2 Real browser login on LoginPage
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', 'admin@gmail.com');
    await page.fill('#login-password', 'admin');
    await page.click('button[type="submit"]');

    // Should automatically route to /management/admin/dashboard
    await expect(page).toHaveURL(/.*management\/admin\/dashboard/, { timeout: 12000 });

    // Verify Admin Header Elements
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(page.locator('.breadcrumb-prefix')).toContainText('Quản trị ADMIN');

    // Verify Admin Sidebar Navigation Groups
    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('TỔNG QUAN');
    await expect(sidebar).toContainText('NGƯỜI DÙNG & TỔ CHỨC');
    await expect(sidebar).toContainText('TRÍ TUỆ NHÂN TẠO');
    await expect(sidebar).toContainText('VẬN HÀNH & HỆ THỐNG');
  });

  test('4. Real Admin Users Page: Loads live SQL Server users and handles table operations', async ({ page }) => {
    // Login as Admin
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', 'admin@gmail.com');
    await page.fill('#login-password', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*management\/admin\/dashboard/, { timeout: 12000 });

    // Navigate to Admin Users page
    await page.goto('/ZhongWenHub/management/admin/users');
    await expect(page).toHaveURL(/.*management\/admin\/users/);

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Quản lý người dùng' })).toBeVisible({ timeout: 10000 });

    // Verify table renders real SQL Server users: admin@gmail.com must be visible in table
    const tableContainer = page.locator('.user-table-desktop');
    await expect(tableContainer.getByText('admin@gmail.com')).toBeVisible({ timeout: 10000 });

    // Verify search functionality on real user data
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin@gmail.com');
      await page.waitForTimeout(400);
      await expect(tableContainer.getByText('admin@gmail.com')).toBeVisible();
    }
  });

  test('5. Anti-Tamper Security: Modifying sessionStorage alone does NOT grant access without backend JWT', async ({ page }) => {
    await page.goto('/ZhongWenHub/login');

    // Malicious attempt to elevate privileges by writing fake admin session into storage
    await page.evaluate(() => {
      sessionStorage.setItem(
        'zhongwenhub_mgmt_session',
        JSON.stringify({
          id: 'fake-admin-id',
          name: 'Hacker Tampered Admin',
          email: 'hacker@malicious.com',
          role: 'ADMIN',
          permissions: ['*'],
        })
      );
    });

    // Attempt to open Admin Dashboard with tampered storage
    await page.goto('/ZhongWenHub/management/admin/dashboard');

    // Without valid backend authentication / memory JWT, system MUST kick out to /login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

});
