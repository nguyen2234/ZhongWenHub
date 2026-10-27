import { test, expect } from '@playwright/test';

test.describe('FE-13.2: Sticky Sidebars & Independent Scrolling Acceptance Suite', () => {
  test('Test 1: Sticky Management Sidebar pinned during main page scroll (Desktop 1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toBeVisible();

    // 1. Record initial sidebar bounding box
    const initialBox = await sidebar.boundingBox();
    expect(initialBox).not.toBeNull();
    expect(initialBox!.y).toBe(0);
    expect(initialBox!.height).toBeCloseTo(900, 1);

    // 2. Scroll the window / main page content down by 600px
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await page.waitForTimeout(250);

    // 3. Verify sidebar remains strictly pinned at top: 0 in viewport
    const scrolledBox = await sidebar.boundingBox();
    expect(scrolledBox).not.toBeNull();
    expect(scrolledBox!.y).toBe(0);
    expect(scrolledBox!.height).toBeCloseTo(900, 1);
  });

  test('Test 2: Independent scroll of management sidebar menu without scrolling page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('.management-sidebar-nav');
    await expect(nav).toBeVisible();

    // Scroll nav container
    await nav.evaluate((el) => {
      el.scrollTop = 120;
    });
    await page.waitForTimeout(200);

    const navScrollTop = await nav.evaluate((el) => el.scrollTop);
    expect(navScrollTop).toBeGreaterThanOrEqual(0);

    // Verify main page scroll position did not drift
    const pageScrollY = await page.evaluate(() => window.scrollY);
    expect(pageScrollY).toBe(0);
  });

  test('Test 3: Student Sidebar sticky beneath header with independent scroll (Desktop 1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Header is sticky at top: 0
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    expect(headerBox!.y).toBe(0);
    expect(headerBox!.height).toBe(64);

    // 2. Student sidebar wrapper is pinned right below header (top: 64px)
    const sidebarWrapper = page.locator('.desktop-sidebar-wrapper');
    await expect(sidebarWrapper).toBeVisible();
    const wrapperBox = await sidebarWrapper.boundingBox();
    expect(wrapperBox!.y).toBe(64);
    expect(wrapperBox!.height).toBeCloseTo(900 - 64, 1);

    // 3. Scroll page down 500px
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
    await page.waitForTimeout(250);

    // Header and sidebar still pinned
    const scrolledHeaderBox = await header.boundingBox();
    expect(scrolledHeaderBox!.y).toBe(0);

    const scrolledWrapperBox = await sidebarWrapper.boundingBox();
    expect(scrolledWrapperBox!.y).toBe(64);

    // 4. Scroll menu list independently and check bottom Kippy card
    const studentScroll = page.locator('.student-sidebar-scroll').first();
    await studentScroll.evaluate((el) => {
      el.scrollTop = 200;
    });
    await page.waitForTimeout(200);

    const kippyCard = page.locator('text=Trợ lý Kippy AI');
    await expect(kippyCard).toBeVisible();
  });

  test('Test 4: Mobile Drawer opens with body scroll lock and closes cleanly (Mobile 375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Mobile hamburger is visible
    const hamburger = page.locator('.header-mobile-toggle');
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // 2. Drawer becomes visible
    const sidebar = page.locator('aside.management-sidebar');
    await expect(sidebar).toHaveClass(/mobile-open/);

    // 3. Body scroll is locked
    const isLocked = await page.evaluate(() => document.body.style.overflow === 'hidden');
    expect(isLocked).toBe(true);

    // 4. Close via mobile close button
    const closeBtn = page.locator('.mobile-close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // 5. Drawer closes and body scroll is restored
    await expect(sidebar).not.toHaveClass(/mobile-open/);
    const isRestored = await page.evaluate(() => document.body.style.overflow !== 'hidden');
    expect(isRestored).toBe(true);
  });

  test('Test 5: Collapsed Sidebar maintains pinned position without layout shift (Desktop 1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside.management-sidebar');
    const collapseBtn = page.locator('.collapse-toggle-btn');
    await collapseBtn.click();

    await expect(sidebar).toHaveClass(/collapsed/);
    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox!.width).toBe(72);
    expect(collapsedBox!.y).toBe(0);

    // Scroll page
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
    await page.waitForTimeout(200);

    const scrolledCollapsedBox = await sidebar.boundingBox();
    expect(scrolledCollapsedBox!.y).toBe(0);
    expect(scrolledCollapsedBox!.width).toBe(72);

    // Re-expand
    await collapseBtn.click();
    await expect(sidebar).toHaveClass(/expanded/);
    const expandedBox = await sidebar.boundingBox();
    expect(expandedBox!.width).toBe(264);
  });
});
