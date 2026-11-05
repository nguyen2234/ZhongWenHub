import { test, expect } from '@playwright/test';

test.describe('Verification: Remove Horizontal Secondary Nav & Fixed Sticky Sidebar', () => {
  // ==========================================
  // 1. DESKTOP VIEWPORT (1440x900)
  // ==========================================
  test('Desktop: Learning Path - No Horizontal Nav, Sticky Sidebar on Scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/learning-path');
    await page.waitForLoadState('networkidle');

    // 1. Verify Secondary Nav ("Học HSK") is completely absent
    const secondaryNav = page.locator('.student-secondary-nav');
    await expect(secondaryNav).toHaveCount(0);
    const navText = page.locator('text="Học HSK:"');
    await expect(navText).toHaveCount(0);

    // 2. Verify Desktop Sidebar is visible and positioned below header
    const sidebar = page.locator('.desktop-sidebar-wrapper');
    await expect(sidebar).toBeVisible();
    const initialBox = await sidebar.boundingBox();
    expect(initialBox).not.toBeNull();
    expect(initialBox!.y).toBe(64);
    expect(initialBox!.width).toBe(256);

    // 3. Take screenshot at top
    await page.screenshot({ path: 'screenshots/verification-learning-path-desktop-top.png' });

    // 4. Scroll to bottom
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(300);

    // 5. Verify Sidebar remains visible and sticky
    await expect(sidebar).toBeVisible();
    const scrolledBox = await sidebar.boundingBox();
    expect(scrolledBox).not.toBeNull();
    expect(scrolledBox!.y).toBeCloseTo(64, 0);
    expect(scrolledBox!.width).toBe(256);

    // 6. Verify no horizontal overflow
    const hasNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(hasNoOverflow).toBe(true);

    // 7. Take screenshot after scroll
    await page.screenshot({ path: 'screenshots/verification-learning-path-desktop-scrolled.png' });
  });

  test('Desktop: Practice Center - No Horizontal Nav, Sticky Sidebar on Scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/practice');
    await page.waitForLoadState('networkidle');

    // 1. Verify Secondary Nav ("Luyện tập") is completely absent
    const secondaryNav = page.locator('.student-secondary-nav');
    await expect(secondaryNav).toHaveCount(0);
    const navText = page.locator('text="Luyện tập:"');
    await expect(navText).toHaveCount(0);

    // 2. Verify Desktop Sidebar is visible and positioned below header
    const sidebar = page.locator('.desktop-sidebar-wrapper');
    await expect(sidebar).toBeVisible();
    const initialBox = await sidebar.boundingBox();
    expect(initialBox).not.toBeNull();
    expect(initialBox!.y).toBe(64);

    // 3. Take screenshot at top
    await page.screenshot({ path: 'screenshots/verification-practice-desktop-top.png' });

    // 4. Scroll to bottom
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(300);

    // 5. Verify Sidebar remains visible and sticky
    await expect(sidebar).toBeVisible();
    const scrolledBox = await sidebar.boundingBox();
    expect(scrolledBox).not.toBeNull();
    expect(scrolledBox!.y).toBeCloseTo(64, 0);

    // 6. Verify no horizontal overflow
    const hasNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(hasNoOverflow).toBe(true);

    // 7. Take screenshot after scroll
    await page.screenshot({ path: 'screenshots/verification-practice-desktop-scrolled.png' });
  });

  test('Desktop: Sidebar Collapse toggle works without layout distortion', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ZhongWenHub/learning-path');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('.desktop-sidebar-wrapper');
    await expect(sidebar).toBeVisible();
    expect((await sidebar.boundingBox())!.width).toBe(256);

    // Click collapse toggle in sidebar
    const collapseBtn = page.locator('button[aria-label="Thu gọn thanh điều hướng"]').first();
    await collapseBtn.click();
    await page.waitForTimeout(350);

    // Verify width collapsed to 72px
    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox!.width).toBe(72);
    expect(collapsedBox!.y).toBeCloseTo(64, 0);

    // Scroll while collapsed
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
    await page.waitForTimeout(200);

    const scrolledCollapsedBox = await sidebar.boundingBox();
    expect(scrolledCollapsedBox!.width).toBe(72);
    expect(scrolledCollapsedBox!.y).toBeCloseTo(64, 0);

    // Restore expanded
    const expandBtn = page.locator('button[aria-label="Mở rộng thanh điều hướng"]').first();
    await expandBtn.click();
    await page.waitForTimeout(350);
    expect((await sidebar.boundingBox())!.width).toBe(256);
  });

  // ==========================================
  // 2. TABLET VIEWPORT (768x1024)
  // ==========================================
  test('Tablet: Learning Path & Practice - No Horizontal Nav, Responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Learning Path
    await page.goto('/ZhongWenHub/learning-path');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.student-secondary-nav')).toHaveCount(0);
    await expect(page.locator('.desktop-sidebar-wrapper')).toBeHidden();
    await expect(page.locator('.student-bottom-nav')).toBeVisible();

    await page.screenshot({ path: 'screenshots/verification-learning-path-tablet-top.png' });
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await expect(page.locator('.student-bottom-nav')).toBeVisible();
    await page.screenshot({ path: 'screenshots/verification-learning-path-tablet-scrolled.png' });

    // Practice Center
    await page.goto('/ZhongWenHub/practice');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.student-secondary-nav')).toHaveCount(0);
    await expect(page.locator('.student-bottom-nav')).toBeVisible();

    await page.screenshot({ path: 'screenshots/verification-practice-tablet-top.png' });
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await expect(page.locator('.student-bottom-nav')).toBeVisible();
    await page.screenshot({ path: 'screenshots/verification-practice-tablet-scrolled.png' });
  });

  // ==========================================
  // 3. MOBILE VIEWPORT (390x844)
  // ==========================================
  test('Mobile: Learning Path & Practice - No Horizontal Nav, Sticky Bottom Nav', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Learning Path
    await page.goto('/ZhongWenHub/learning-path');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.student-secondary-nav')).toHaveCount(0);
    await expect(page.locator('.desktop-sidebar-wrapper')).toBeHidden();
    await expect(page.locator('.student-bottom-nav')).toBeVisible();

    await page.screenshot({ path: 'screenshots/verification-learning-path-mobile-top.png' });
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await expect(page.locator('.student-bottom-nav')).toBeVisible();
    await page.screenshot({ path: 'screenshots/verification-learning-path-mobile-scrolled.png' });

    // Practice Center
    await page.goto('/ZhongWenHub/practice');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.student-secondary-nav')).toHaveCount(0);
    await expect(page.locator('.student-bottom-nav')).toBeVisible();

    await page.screenshot({ path: 'screenshots/verification-practice-mobile-top.png' });
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await expect(page.locator('.student-bottom-nav')).toBeVisible();
    await page.screenshot({ path: 'screenshots/verification-practice-mobile-scrolled.png' });
  });
});
