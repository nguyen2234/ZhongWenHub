import { test, expect } from '@playwright/test';

test.describe('Fluid Responsive Layout Acceptance Suite', () => {

  const viewports = [
    { name: '1920x1080-desktop-large', width: 1920, height: 1080, minVocabCols: 2 },
    { name: '1536x864-laptop-15.6', width: 1536, height: 864, minVocabCols: 2 },
    { name: '1440x900-desktop-std', width: 1440, height: 900, minVocabCols: 2 },
    { name: '1366x768-laptop-std', width: 1366, height: 768, minVocabCols: 2 },
    { name: '1280x720-laptop-compact', width: 1280, height: 720, minVocabCols: 2 },
    { name: '1024x768-tablet-landscape', width: 1024, height: 768, minVocabCols: 2 },
    { name: '768x1024-tablet-portrait', width: 768, height: 1024, minVocabCols: 1 },
    { name: '390x844-mobile-phone', width: 390, height: 844, minVocabCols: 1 },
    { name: '375x812-mobile-compact', width: 375, height: 812, minVocabCols: 1 },
  ];

  for (const vp of viewports) {
    test(`Lesson Page on ${vp.name} (${vp.width}x${vp.height}): No overflow & balanced columns`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/ZhongWenHub/lesson?id=les-hsk1-1');
      await page.waitForLoadState('networkidle');

      // 1. Verify no horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 1 // 1px rounding tolerance
        };
      });
      expect(overflow.hasOverflow).toBe(false);

      // 2. Verify Vocabulary Cards
      const vocabCards = page.locator('.hsk-vocab-card');
      const cardCount = await vocabCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(2);

      if (vp.minVocabCols >= 2) {
        // Compare Y position of card 0 and card 1
        const box0 = await vocabCards.nth(0).boundingBox();
        const box1 = await vocabCards.nth(1).boundingBox();
        expect(box0).not.toBeNull();
        expect(box1).not.toBeNull();
        // If 2 columns, box0.y and box1.y should be identical or very close
        expect(Math.abs(box0!.y - box1!.y)).toBeLessThan(15);
      }

      // 3. Verify Desktop Sidebar or Tablet/Mobile Navigation
      if (vp.width >= 1024) {
        const desktopSidebar = page.locator('.desktop-sidebar-wrapper');
        await expect(desktopSidebar).toBeVisible();
        const initialBox = await desktopSidebar.boundingBox();
        expect(initialBox).not.toBeNull();
        expect(initialBox!.y).toBe(64);

        // Scroll page down
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
        await page.waitForTimeout(150);

        // Confirm sticky pinning
        const scrolledBox = await desktopSidebar.boundingBox();
        expect(scrolledBox).not.toBeNull();
        expect(scrolledBox!.y).toBeCloseTo(64, 0);
      } else {
        // Tablet / Mobile: Bottom Nav is active, desktop sidebar is hidden
        const desktopSidebar = page.locator('.desktop-sidebar-wrapper');
        await expect(desktopSidebar).toBeHidden();
        const bottomNav = page.locator('.student-bottom-nav');
        await expect(bottomNav).toBeVisible();
      }

      // 4. Capture key screenshots
      if (['1920x1080-desktop-large', '1536x864-laptop-15.6', '1366x768-laptop-std', '768x1024-tablet-portrait', '390x844-mobile-phone'].includes(vp.name)) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(150);
        await page.screenshot({ path: `screenshots/fluid-lesson-${vp.name}-top.png`, fullPage: false });
      }
    });
  }

  test('Lesson Page: Sidebar Collapse interaction dynamically re-flows content', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/ZhongWenHub/lesson?id=les-hsk1-1');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('.desktop-sidebar-wrapper');
    await expect(sidebar).toBeVisible();

    // Initial sidebar width on 1366px should be 232px
    const initialSidebarBox = await sidebar.boundingBox();
    expect(initialSidebarBox!.width).toBeCloseTo(232, 1);

    const mainContainer = page.locator('.student-main-viewport');
    const initialContentBox = await mainContainer.boundingBox();

    // Toggle collapse button
    const collapseBtn = page.locator('button[title*="sidebar"], button[aria-label*="thanh điều hướng"]').first();
    await collapseBtn.click();
    await page.waitForTimeout(300);

    // Sidebar collapsed width should now be 72px
    const collapsedSidebarBox = await sidebar.boundingBox();
    expect(collapsedSidebarBox!.width).toBeCloseTo(72, 1);

    // Main content width should have increased by ~160px
    const expandedContentBox = await mainContainer.boundingBox();
    expect(expandedContentBox!.width).toBeGreaterThan(initialContentBox!.width + 100);

    // Ensure no horizontal scrollbar after collapse
    const hasOverflowCollapsed = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflowCollapsed).toBe(false);

    // Capture screenshot in collapsed state
    await page.screenshot({ path: 'screenshots/fluid-lesson-1366x768-sidebar-collapsed.png', fullPage: false });

    // Expand sidebar back
    await collapseBtn.click();
    await page.waitForTimeout(300);

    const reExpandedSidebarBox = await sidebar.boundingBox();
    expect(reExpandedSidebarBox!.width).toBeCloseTo(232, 1);
  });

  test('Dashboard on 1366x768 & 1536x864: Fluid layout, no overflow', async ({ page }) => {
    for (const size of [{ width: 1366, height: 768 }, { width: 1536, height: 864 }]) {
      await page.setViewportSize(size);
      await page.goto('/ZhongWenHub/dashboard');
      await page.waitForLoadState('networkidle');

      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hasOverflow).toBe(false);

      const sidebar = page.locator('.desktop-sidebar-wrapper');
      await expect(sidebar).toBeVisible();

      await page.screenshot({ path: `screenshots/fluid-dashboard-${size.width}x${size.height}.png`, fullPage: false });
    }
  });

  test('Learning Path & Practice Center on 1366x768: Fluid layout, no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    // 1. Learning Path Beginner
    await page.goto('/ZhongWenHub/learning-path?mode=beginner');
    await page.waitForLoadState('networkidle');
    let hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: 'screenshots/fluid-learning-path-beginner-1366x768.png', fullPage: false });

    // 2. Learning Path HSK
    await page.goto('/ZhongWenHub/learning-path?mode=hsk');
    await page.waitForLoadState('networkidle');
    hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: 'screenshots/fluid-learning-path-hsk-1366x768.png', fullPage: false });

    // 3. Practice Center
    await page.goto('/ZhongWenHub/practice');
    await page.waitForLoadState('networkidle');
    hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: 'screenshots/fluid-practice-1366x768.png', fullPage: false });
  });

  test('Sidebar Navigation: "Phát âm" removed from KỸ NĂNG, "Luyện nói" preserved & functional', async ({ page }) => {
    // 1. Verify on Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('.desktop-sidebar-wrapper');
    await expect(sidebar).toBeVisible();

    // Verify "Phát âm" is strictly absent from the sidebar
    const pronunciationItem = sidebar.locator('text="Phát âm"');
    await expect(pronunciationItem).toHaveCount(0);

    // Verify "Luyện nói" is present under KỸ NĂNG
    const speakingItem = sidebar.locator('button', { hasText: 'Luyện nói' });
    await expect(speakingItem).toBeVisible();

    // Verify all 4 required skill items exist in KỸ NĂNG
    await expect(sidebar.locator('button', { hasText: 'Luyện nghe' })).toBeVisible();
    await expect(sidebar.locator('button', { hasText: 'Luyện nói' })).toBeVisible();
    await expect(sidebar.locator('button', { hasText: 'Đọc hiểu' })).toBeVisible();
    await expect(sidebar.locator('button', { hasText: 'Luyện viết' })).toBeVisible();

    // Click "Luyện nói" and verify it navigates cleanly to Speaking / Pronunciation page
    await speakingItem.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/skills/speaking');
    await expect(page.locator('text=LUYỆN KỸ NĂNG NÓI & PHÁT ÂM')).toBeVisible();

    // Take screenshot of speaking page
    await page.screenshot({ path: 'screenshots/sidebar-speaking-preserved-desktop.png', fullPage: false });

    // 2. Verify on Laptop 1366px
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('networkidle');
    const laptopSidebar = page.locator('.desktop-sidebar-wrapper');
    await expect(laptopSidebar).toBeVisible();
    await expect(laptopSidebar.locator('text="Phát âm"')).toHaveCount(0);
    await expect(laptopSidebar.locator('button', { hasText: 'Luyện nói' })).toBeVisible();
  });

});
