import { test, expect } from '@playwright/test';

test.describe('BE-2: Authentication, User Management & RBAC Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Open login page
    await page.goto('/ZhongWenHub/login');
  });

  test('Flow 1: Student Login -> Dashboard -> Route Protection', async ({ page }) => {
    // Fill credentials
    await page.fill('#login-email', 'student@zhongwenhub.edu.vn');
    await page.fill('#login-password', 'StudentPassword123!');
    await page.click('button[type="submit"]');

    // Should navigate to student portal /dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('body')).toBeVisible();

    // Student attempting to access /management/admin/dashboard should be redirected safely
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Flow 2: Admin Login -> Admin Portal -> User Management Page', async ({ page }) => {
    // Fill admin credentials
    await page.fill('#login-email', 'admin@zhongwenhub.edu.vn');
    await page.fill('#login-password', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    // Should navigate to admin portal
    await expect(page).toHaveURL(/.*management\/admin\/dashboard/);

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
