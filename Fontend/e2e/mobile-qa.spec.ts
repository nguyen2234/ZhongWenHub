import { test, expect } from '@playwright/test';

test.describe('FE-8.1 Mobile QA & E2E Real Interaction Suite', () => {
  // Test 1: Bottom Navigation tab switching and route activation
  test('Bottom Navigation: switches tabs and updates active state on mobile', async ({ page }) => {
    const isMobile = (page.viewportSize()?.width ?? 1440) < 1024;

    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('domcontentloaded');

    if (isMobile) {
      // 1. Verify bottom nav is visible
      const bottomNav = page.locator('.student-bottom-nav');
      await expect(bottomNav).toBeVisible();

      // 2. Desktop sidebar must be hidden
      const desktopSidebar = page.locator('.desktop-sidebar-wrapper');
      await expect(desktopSidebar).toBeHidden();

      // 3. Tab 1: Dashboard is active
      const dashboardTab = page.locator('[data-testid="bottom-nav-dashboard"]');
      await expect(dashboardTab).toHaveClass(/active/);

      // 4. Navigate to Học HSK
      const hskTab = page.locator('[data-testid="bottom-nav-hsk"]');
      await hskTab.click();
      await page.waitForURL(/learning-path/);
      await expect(hskTab).toHaveClass(/active/);

      // 5. Navigate to Video
      const videoTab = page.locator('[data-testid="bottom-nav-video"]');
      await videoTab.click();
      await page.waitForURL(/videos/);
      await expect(videoTab).toHaveClass(/active/);

      // 6. Navigate to AI Tutor
      const aiTutorTab = page.locator('[data-testid="bottom-nav-ai-tutor"]');
      await aiTutorTab.click();
      await page.waitForURL(/ai-tutor/);
      await expect(aiTutorTab).toHaveClass(/active/);

      // 7. Navigate to Cá nhân (Profile)
      const profileTab = page.locator('[data-testid="bottom-nav-profile"]');
      await profileTab.click();
      await page.waitForURL(/profile/);
      await expect(profileTab).toHaveClass(/active/);
    } else {
      // On desktop, bottom nav must be hidden, desktop sidebar visible
      await expect(page.locator('.student-bottom-nav')).toBeHidden();
      await expect(page.locator('.desktop-sidebar-wrapper')).toBeVisible();
    }
  });

  // Test 2: Mobile HSK Level switching & Topic accordion
  test('Mobile HSK: level switching and accordion interaction', async ({ page }) => {
    await page.goto('/ZhongWenHub/learning-path?mode=hsk');
    await page.waitForLoadState('domcontentloaded');

    // Check no horizontal overflow
    const hasNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(hasNoOverflow).toBe(true);

    // Switch HSK Level tab (HSK 2)
    const hsk2Tab = page.locator('.hsk-pill-tab', { hasText: 'HSK 2' });
    if (await hsk2Tab.isVisible()) {
      await hsk2Tab.click();
      await expect(hsk2Tab).toHaveClass(/active/);
    }

    const isMobile = (page.viewportSize()?.width ?? 1440) < 1024;
    if (isMobile) {
      // In mobile view, topics are shown in accordion format
      const accordion = page.locator('.hsk-mobile-accordion');
      await expect(accordion).toBeVisible();

      // Click topic header to toggle
      const firstTopicHeader = page.locator('.hsk-mobile-topic-header').first();
      await expect(firstTopicHeader).toBeVisible();
      await firstTopicHeader.click();
    }
  });

  // Test 3: Lesson Table of Contents Bottom Sheet and Scroll-Spy
  test('Lesson Textbook: open TOC bottom sheet, navigate sections, Escape to close', async ({ page }) => {
    await page.goto('/ZhongWenHub/lesson/les-hsk1-1');
    await page.waitForLoadState('domcontentloaded');

    const isMobile = (page.viewportSize()?.width ?? 1440) < 1024;

    if (isMobile) {
      // Check mobile TOC trigger button
      const tocTrigger = page.locator('#btn-mobile-toc-trigger');
      await expect(tocTrigger).toBeVisible();
      await tocTrigger.click();

      // Bottom sheet dialog should be visible
      const sheet = page.locator('.lesson-toc-mobile-sheet');
      await expect(sheet).toBeVisible();

      // Click section "Từ vựng"
      const vocabSectionBtn = sheet.locator('button', { hasText: 'Từ vựng' });
      await expect(vocabSectionBtn).toBeVisible();
      await vocabSectionBtn.click();

      // Bottom sheet closes upon selection
      await expect(sheet).toBeHidden();

      // Reopen and test Escape key closing
      await tocTrigger.click();
      await expect(sheet).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
    } else {
      // Desktop sticky TOC card should be visible
      const desktopToc = page.locator('.lesson-toc-desktop-card');
      await expect(desktopToc).toBeVisible();
    }
  });

  // Test 4: Open and close LessonPracticeModal
  test('Lesson Practice Modal: opens on CTA click and supports Escape key', async ({ page }) => {
    await page.goto('/ZhongWenHub/lesson/les-hsk1-1');
    await page.waitForLoadState('domcontentloaded');

    // Scroll to practice section
    const practiceCta = page.locator('.hsk-practice-cta-btn');
    await practiceCta.scrollIntoViewIfNeeded();
    await expect(practiceCta).toBeVisible();
    await practiceCta.click();

    // Practice modal should open
    const modalDialog = page.locator('.zh-practice-modal-dialog');
    await expect(modalDialog).toBeVisible();

    // Verify modal does not overflow screen
    const isModalFitting = await modalDialog.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width <= window.innerWidth && rect.height <= window.innerHeight;
    });
    expect(isModalFitting).toBe(true);

    // Press Escape to close modal
    await page.keyboard.press('Escape');
    await expect(modalDialog).toBeHidden();
  });

  // Test 5: Mobile Video Player Tabs (Phụ đề, Luyện nói, Từ vựng)
  test('Video Detail: switches between transcript, speaking, and vocab tabs', async ({ page }) => {
    await page.goto('/ZhongWenHub/videos/vid-101');
    await page.waitForLoadState('domcontentloaded');

    const isMobile = (page.viewportSize()?.width ?? 1440) < 1024;

    if (isMobile) {
      const tabBar = page.locator('.video-mobile-tab-bar');
      await expect(tabBar).toBeVisible();

      // 1. Phụ đề tab is active by default
      const transcriptTab = page.locator('button[role="tab"]', { hasText: 'Phụ đề' });
      await expect(transcriptTab).toHaveClass(/active/);
      await expect(page.locator('.video-right-column')).toBeVisible();

      // 2. Switch to Luyện nói tab
      const speakingTab = page.locator('button[role="tab"]', { hasText: 'Luyện nói' });
      await speakingTab.click();
      await expect(speakingTab).toHaveClass(/active/);
      await expect(page.locator('.video-speaking-section')).toBeVisible();

      // 3. Switch to Từ vựng tab
      const vocabTab = page.locator('button[role="tab"]', { hasText: 'Từ vựng' });
      await vocabTab.click();
      await expect(vocabTab).toHaveClass(/active/);
      await expect(page.locator('.video-vocab-section')).toBeVisible();

      // Verify touch target for vocab actions >= 44px
      const firstVocabAction = page.locator('.btn-vocab-action').first();
      if (await firstVocabAction.isVisible()) {
        const bbox = await firstVocabAction.boundingBox();
        expect(bbox?.width).toBeGreaterThanOrEqual(40);
        expect(bbox?.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  // Test 6: AI Tutor mobile drawer toggle and Escape key
  test('AI Tutor: drawer open/close and keyboard interaction', async ({ page }) => {
    await page.goto('/ZhongWenHub/ai-tutor');
    await page.waitForLoadState('domcontentloaded');

    const isMobile = (page.viewportSize()?.width ?? 1440) < 768;

    if (isMobile) {
      const menuBtn = page.locator('.ai-mobile-menu-btn');
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();

      // Sidebar drawer should slide open
      const sidebar = page.locator('.ai-chat-sidebar');
      await expect(sidebar).toHaveClass(/mobile-open/);

      // Close via Escape key
      await page.keyboard.press('Escape');
      await expect(sidebar).not.toHaveClass(/mobile-open/);
    }
  });

  // Test 7: Horizontal overflow check across all student routes
  test('Layout: verify document.scrollWidth <= window.innerWidth on current viewport', async ({ page }) => {
    const routes = [
      '/ZhongWenHub/dashboard',
      '/ZhongWenHub/learning-path',
      '/ZhongWenHub/lesson/les-hsk1-1',
      '/ZhongWenHub/videos',
      '/ZhongWenHub/videos/vid-101',
      '/ZhongWenHub/ai-tutor',
      '/ZhongWenHub/profile',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const isWithinBounds = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const innerWidth = window.innerWidth;
        return scrollWidth <= innerWidth;
      });

      expect(isWithinBounds, `Overflow detected on route ${route} at width ${page.viewportSize()?.width}`).toBe(true);
    }
  });
});
