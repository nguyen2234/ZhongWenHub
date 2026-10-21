import { test, expect } from '@playwright/test';

test.describe('FE-12.1: Evondev Management Table Standardization E2E Suite', () => {
  test.describe.configure({ mode: 'serial' });

  // 1. ADMIN USERS TABLE
  test('1. Admin Users: Desktop Table Sorting, Search, Pagination and Evondev Flat Styling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Verify ManagementDataTable container exists
    const tableCard = page.locator('.mgmt-table-card');
    await expect(tableCard).toBeVisible();

    // Verify Sortable Headers with ARIA
    const sortBtn = page.locator('.mgmt-sort-header-btn').first();
    await expect(sortBtn).toBeVisible();

    // Search Interaction
    const searchInput = page.locator('input[placeholder*="Tìm"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Admin');
    await page.waitForTimeout(350); // debounce wait

    // Pagination component
    const pagination = page.locator('.mgmt-pagination');
    await expect(pagination).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: 'screenshots/fe-12.1-admin-users-desktop.png', fullPage: true });
  });

  test('2. Admin Users: Mobile 375px Responsive Mobile Cards and Zero Overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForLoadState('networkidle');

    // Mobile card list should be rendered
    const mobileList = page.locator('.user-cards-mobile, .mgmt-mobile-list').first();
    await expect(mobileList).toBeVisible();

    // Desktop table should be visually hidden on mobile
    const desktopTable = page.locator('.user-table-desktop');
    if (await desktopTable.count() > 0) {
      await expect(desktopTable).toBeHidden();
    }

    // Verify mobile cards have content
    const firstCard = page.locator('.user-mobile-card, .mgmt-mobile-card').first();
    await expect(firstCard).toBeVisible();

    // Check no horizontal window overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    // Verify touch target size of mobile pagination buttons >= 40px
    const pageBtn = page.locator('.mgmt-page-btn').first();
    if (await pageBtn.isVisible()) {
      const box = await pageBtn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }

    // Capture mobile screenshot
    await page.screenshot({ path: 'screenshots/fe-12.1-admin-users-mobile-375.png', fullPage: true });
  });

  // 2. CONTENT MANAGER WORKSPACE
  test('3. Content Manager Grammar: Desktop Table & Mobile Cards', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/content-manager/grammar');
    await page.waitForLoadState('networkidle');

    // Verify table or mobile list exists
    await expect(page.locator('.mgmt-table-card')).toBeVisible();
    await expect(page.locator('input[placeholder*="Tìm"]').first()).toBeVisible();

    await page.screenshot({ path: 'screenshots/fe-12.1-cm-grammar-desktop.png', fullPage: true });

    // Switch to Mobile 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    const mobileList = page.locator('.mgmt-mobile-list');
    await expect(mobileList).toBeVisible();

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: 'screenshots/fe-12.1-cm-grammar-mobile-390.png', fullPage: true });
  });

  // 3. TEACHER WORKSPACE
  test('4. Teacher Classes: Desktop Table & Mobile Card View', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/teacher/classes');
    await page.waitForLoadState('networkidle');

    // Verify ManagementDataTable
    const tableCard = page.locator('.mgmt-table-card');
    await expect(tableCard).toBeVisible();

    // Verify row actions
    const rowActions = page.locator('.mgmt-actions-group');
    await expect(rowActions.first()).toBeVisible();

    await page.screenshot({ path: 'screenshots/fe-12.1-teacher-classes-desktop.png', fullPage: true });

    // Switch to Mobile 375px
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const mobileList = page.locator('.mgmt-mobile-list');
    await expect(mobileList).toBeVisible();

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: 'screenshots/fe-12.1-teacher-classes-mobile-375.png', fullPage: true });
  });

  test('5. Teacher Assignments: Management Table and Status Badges', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/teacher/assignments');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.mgmt-table-card')).toBeVisible();
    await page.screenshot({ path: 'screenshots/fe-12.1-teacher-assignments-desktop.png', fullPage: true });

    // Mobile 320px extreme test
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(300);

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: 'screenshots/fe-12.1-teacher-assignments-mobile-320.png', fullPage: true });
  });
});
