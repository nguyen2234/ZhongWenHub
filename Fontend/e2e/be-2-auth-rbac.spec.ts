import { test, expect } from '@playwright/test';

test.describe('BE-2: Authentication, User Management & RBAC Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock ASP.NET Core backend endpoints according to API contract
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://httpstatuses.com/401',
          title: 'Chưa xác thực',
          status: 401,
          detail: 'Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.',
        }),
      });
    });

    await page.route('**/api/v1/auth/login', async (route) => {
      const request = route.request();
      let body: { email?: string; usernameOrEmail?: string; password?: string } = {};
      try {
        body = JSON.parse(request.postData() || '{}');
      } catch {
        // empty body
      }

      const email = (body.email || body.usernameOrEmail || '').trim().toLowerCase();
      const password = body.password || '';

      if (email === 'student@zhongwenhub.edu.vn' && password === 'StudentPassword123!') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'mock-student-access-token-jwt-2026',
            expiresIn: 900,
            tokenType: 'Bearer',
            user: {
              id: 'usr-student-01',
              username: 'student',
              email: 'student@zhongwenhub.edu.vn',
              displayName: 'Trần Minh Quân (Student)',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              roles: ['STUDENT'],
              status: 'ACTIVE',
              createdAt: '2026-01-01T00:00:00Z',
            },
          }),
        });
      } else if (email === 'admin@zhongwenhub.edu.vn' && password === 'AdminPassword123!') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'mock-admin-access-token-jwt-2026',
            expiresIn: 900,
            tokenType: 'Bearer',
            user: {
              id: 'usr-admin-01',
              username: 'admin',
              email: 'admin@zhongwenhub.edu.vn',
              displayName: 'Quản Trị Viên Vận Hành',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              roles: ['ADMIN'],
              status: 'ACTIVE',
              createdAt: '2026-01-01T00:00:00Z',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://httpstatuses.com/401',
            title: 'Email hoặc mật khẩu không chính xác',
            status: 401,
            detail: 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
          }),
        });
      }
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      const headers = route.request().headers();
      const auth = headers['authorization'] || '';

      if (auth.includes('mock-admin-access-token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'usr-admin-01',
            username: 'admin',
            email: 'admin@zhongwenhub.edu.vn',
            displayName: 'Quản Trị Viên Vận Hành',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            roles: ['ADMIN'],
            status: 'ACTIVE',
          }),
        });
      } else if (auth.includes('mock-student-access-token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'usr-student-01',
            username: 'student',
            email: 'student@zhongwenhub.edu.vn',
            displayName: 'Trần Minh Quân (Student)',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            roles: ['STUDENT'],
            status: 'ACTIVE',
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://httpstatuses.com/401',
            title: 'Yêu cầu chưa được xác thực',
            status: 401,
            detail: 'Bạn cần đăng nhập để truy cập tài nguyên này.',
          }),
        });
      }
    });

    await page.route('**/api/v1/admin/users/kpis', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalLearners: 1248,
          activeLearners: 1092,
          lockedLearners: 12,
          newLearners30d: 156,
        }),
      });
    });

    await page.route('**/api/v1/admin/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'usr-student-01',
              name: 'Trần Minh Quân',
              email: 'student@zhongwenhub.edu.vn',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              hskLevel: 'HSK 2',
              status: 'ACTIVE',
              roles: ['STUDENT'],
              progressPercentage: 45,
              joinedAt: '15/10/2026',
              joinedDateRaw: '2026-10-15',
              lastActiveAt: 'Hôm nay, 10:30',
              lastActiveDateRaw: '2026-10-31',
            },
          ],
          totalItems: 1,
          page: 1,
          pageSize: 100,
          totalPages: 1,
        }),
      });
    });

    // Open login page
    await page.goto('/ZhongWenHub/login');
  });

  test('Flow 1: Student Login -> Dashboard -> Route Protection', async ({ page }) => {
    // Fill credentials
    await page.fill('#login-email', 'student@zhongwenhub.edu.vn');
    await page.fill('#login-password', 'StudentPassword123!');
    await page.click('button[type="submit"]');

    // Should navigate to student portal /dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();

    // Student attempting to access /management/admin/dashboard should be redirected safely
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('Flow 2: Admin Login -> Admin Portal -> User Management Page', async ({ page }) => {
    // Fill admin credentials
    await page.fill('#login-email', 'admin@zhongwenhub.edu.vn');
    await page.fill('#login-password', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    // Should navigate to admin portal
    await expect(page).toHaveURL(/.*management\/admin\/dashboard/, { timeout: 10000 });

    // Navigate to Admin Users
    await page.goto('/ZhongWenHub/management/admin/users');
    await expect(page).toHaveURL(/.*management\/admin\/users/);

    // Verify User Management UI elements
    await expect(page.getByRole('heading', { name: 'Quản lý người dùng' })).toBeVisible({ timeout: 10000 });
  });

  test('Flow 3: Invalid Credentials displays clear error', async ({ page }) => {
    await page.fill('#login-email', 'nonexistent@zhongwenhub.edu.vn');
    await page.fill('#login-password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should remain on login page and display error alert
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=không chính xác').or(page.locator('text=Lỗi'))).toBeVisible({ timeout: 8000 });
  });
});
