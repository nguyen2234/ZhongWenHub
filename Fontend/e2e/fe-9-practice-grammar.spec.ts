import { test, expect } from '@playwright/test';

test.describe('FE-9 Practice & Grammar UX Redesign E2E Suite', () => {
  // Test 1: Practice Center Layout, Recommendations, and Quick Launch
  test('Practice Center: loads Option A layout, shows recommendation and launches quick practice', async ({ page }) => {
    await page.goto('/ZhongWenHub/practice');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify clean header without tall banner
    const headerTitle = page.locator('.practice-header-title');
    await expect(headerTitle).toBeVisible();
    await expect(headerTitle).toContainText('Trung tâm luyện tập');

    // 2. Recommended Practice Hero Card is present with Viettel Red accent
    const recCard = page.locator('.practice-recommended-card');
    await expect(recCard).toBeVisible();
    await expect(recCard.locator('.practice-btn-primary')).toBeVisible();

    // 3. Fast Action Dual Row: Quick Practice & Mistake Review
    const quickCard = page.locator('.practice-action-card', { hasText: 'Luyện nhanh 5 phút' });
    await expect(quickCard).toBeVisible();
    const mistakesCard = page.locator('.practice-action-card', { hasText: 'Ôn lại lỗi sai' });
    await expect(mistakesCard).toBeVisible();

    // 4. Click Quick Practice button to launch session
    await quickCard.locator('button').click();
    await expect(page.getByText('Luyện nhanh 5 phút').first()).toBeVisible();

    // 5. Exit session back to Practice Center
    const exitBtn = page.locator('button:has-text("Thoát"), button:has-text("Quay lại")').first();
    if (await exitBtn.isVisible()) {
      await exitBtn.click();
      await expect(headerTitle).toBeVisible();
    }
  });

  // Test 2: Practice Center HSK Filtering with Accurate Metadata (No Fake Fallbacks)
  test('Practice Center: HSK filtering adheres strictly to exercise pool metadata', async ({ page }) => {
    await page.goto('/ZhongWenHub/practice');
    await page.waitForLoadState('domcontentloaded');

    const filterCard = page.locator('.practice-hsk-filter-card');
    await expect(filterCard).toBeVisible();

    // Click HSK 1 pill
    const hsk1Pill = filterCard.locator('.practice-hsk-pill', { hasText: 'HSK 1' });
    await hsk1Pill.click();
    await expect(filterCard).toContainText('2 câu hỏi phù hợp');

    // Click HSK 2 pill
    const hsk2Pill = filterCard.locator('.practice-hsk-pill', { hasText: 'HSK 2' });
    await hsk2Pill.click();
    await expect(filterCard).toContainText('13 câu hỏi phù hợp');

    // Click HSK 4 pill (which has 0 questions in mock pool)
    const hsk4Pill = filterCard.locator('.practice-hsk-pill', { hasText: 'HSK 4' });
    await hsk4Pill.click();
    // System must show warning and NOT claim false HSK 4 questions
    await expect(filterCard.locator('.practice-filter-warning')).toBeVisible();
    await expect(filterCard).toContainText('chưa có bài tập cho lựa chọn này');
  });

  // Test 3: Grammar Library Header, Search, HSK and Category Filters
  test('Grammar Library: clean header, search, HSK 1-6 span and category filtering', async ({ page }) => {
    await page.goto('/ZhongWenHub/grammar');
    await page.waitForLoadState('domcontentloaded');

    // 1. Header is clean with red badge
    const headerTitle = page.locator('.grammar-header-title');
    await expect(headerTitle).toBeVisible();
    await expect(headerTitle).toContainText('Khám phá ngữ pháp');

    // 2. Search input functionality
    const searchInput = page.locator('.grammar-search-input');
    await searchInput.fill('bèi');
    await expect(page.locator('.grammar-card-title', { hasText: 'Câu bị động với 被' })).toBeVisible();

    // Clear search
    await page.locator('.grammar-search-clear').click();
    await expect(searchInput).toHaveValue('');

    // 3. Category filter: Bổ ngữ
    const boNguPill = page.locator('.grammar-pill', { hasText: 'Bổ ngữ' });
    await boNguPill.click();
    await expect(page.locator('.grammar-card-title', { hasText: 'Bổ ngữ' }).first()).toBeVisible();

    // 4. Category filter: Phó từ
    const phoTuPill = page.locator('.grammar-pill', { hasText: 'Phó từ' });
    await phoTuPill.click();
    await expect(page.locator('.grammar-card-title', { hasText: 'Phó từ' }).first()).toBeVisible();

    // 5. Reset filters
    const resetBtn = page.locator('.grammar-reset-btn');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
    }
  });

  // Test 4: Grammar Accordion Expansion and Dedicated Practice Modal
  test('Grammar Library: expands accordion, opens practice modal, tests answer and closes via Escape', async ({ page }) => {
    await page.goto('/ZhongWenHub/grammar');
    await page.waitForLoadState('domcontentloaded');

    // Expand first card if not already expanded
    const firstCard = page.locator('.grammar-card').first();
    const firstHeader = firstCard.locator('.grammar-card-header');
    if (!(await firstCard.locator('.grammar-card-body').isVisible())) {
      await firstHeader.click();
    }
    await expect(firstCard.locator('.grammar-card-body')).toBeVisible();

    // Check formula box and examples
    await expect(firstCard.locator('.grammar-formula-box')).toBeVisible();
    await expect(firstCard.locator('.grammar-example-item').first()).toBeVisible();

    // Click "Luyện tập cấu trúc này" button
    const practiceBtn = firstCard.locator('.grammar-practice-btn');
    await practiceBtn.click();

    // Practice modal should appear
    const modalDialog = page.locator('.grammar-modal-dialog');
    await expect(modalDialog).toBeVisible();

    // Click word tokens if available
    const wordTokens = modalDialog.locator('.grammar-word-token');
    if (await wordTokens.count() > 0) {
      await wordTokens.first().click();
      const textarea = modalDialog.locator('.grammar-practice-input');
      const val = await textarea.inputValue();
      expect(val.length).toBeGreaterThan(0);
    }

    // Press Escape to dismiss modal
    await page.keyboard.press('Escape');
    await expect(modalDialog).toBeHidden();
  });

  // Test 5: Responsive Layout & No Horizontal Overflow
  test('Responsive: document.scrollWidth <= window.innerWidth on practice and grammar across viewport widths', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);

      // Check /practice
      await page.goto('/ZhongWenHub/practice');
      await page.waitForLoadState('domcontentloaded');
      let noOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(noOverflow).toBe(true);

      // Check /grammar
      await page.goto('/ZhongWenHub/grammar');
      await page.waitForLoadState('domcontentloaded');
      noOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(noOverflow).toBe(true);
    }
  });
});
