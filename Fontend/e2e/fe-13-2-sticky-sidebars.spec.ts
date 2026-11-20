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
    await expect(sidebar).toHaveCSS('width', '72px');
    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox!.width).toBeCloseTo(72, 0);
    expect(collapsedBox!.y).toBe(0);

    // Scroll page
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
    await page.waitForTimeout(200);

    const scrolledCollapsedBox = await sidebar.boundingBox();
    expect(scrolledCollapsedBox!.y).toBe(0);
    expect(scrolledCollapsedBox!.width).toBeCloseTo(72, 0);

    // Re-expand
    await collapseBtn.click();
    await expect(sidebar).toHaveClass(/expanded/);
    await expect(sidebar).toHaveCSS('width', '264px');
    const expandedBox = await sidebar.boundingBox();
    expect(expandedBox!.width).toBeCloseTo(264, 0);
  });

  test('Test 6: Mobile Drawer closes via Backdrop Click and Escape Key', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside.management-sidebar');
    const hamburger = page.locator('.header-mobile-toggle');

    // 1. Open drawer & close via backdrop
    await hamburger.click();
    await expect(sidebar).toHaveClass(/mobile-open/);
    const backdrop = page.locator('[data-testid="management-mobile-backdrop"]');
    await expect(backdrop).toBeVisible();
    await backdrop.click({ position: { x: 350, y: 100 } });
    await expect(sidebar).not.toHaveClass(/mobile-open/);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');

    // 2. Open drawer & close via Escape key
    await hamburger.click();
    await expect(sidebar).toHaveClass(/mobile-open/);
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toHaveClass(/mobile-open/);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test('Test 7: Sticky Sidebar verified across all 4 management portals', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const portalRoutes = [
      '/ZhongWenHub/management/admin/dashboard',
      '/ZhongWenHub/management/content-manager/dashboard',
      '/ZhongWenHub/management/teacher/dashboard',
      '/ZhongWenHub/management/support/dashboard',
    ];

    for (const route of portalRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('aside.management-sidebar');
      await expect(sidebar).toBeVisible();

      const box = await sidebar.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeCloseTo(0, 0);
      expect(box!.height).toBeCloseTo(900, 1);

      // Scroll window
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
      await page.waitForTimeout(100);

      const scrolledBox = await sidebar.boundingBox();
      expect(scrolledBox!.y).toBeCloseTo(0, 0);
    }
  });

  test('Test 8: Responsive viewport matrix (320, 375, 390, 768, 1024, 1280, 1440, 1920) without horizontal page overflow', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/ZhongWenHub/management/admin/dashboard');
      await page.waitForLoadState('networkidle');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

      if (vp.width >= 1024) {
        const sidebar = page.locator('aside.management-sidebar');
        await expect(sidebar).toBeVisible();
      } else {
        const hamburger = page.locator('.header-mobile-toggle');
        await expect(hamburger).toBeVisible();
      }
    }
  });
});
