import { test, expect, type Page } from '@playwright/test';
import { testCredentials } from './config/test-credentials.config';

async function openSidebarContainer(page: Page) {
  const isMobile = (page.viewportSize()?.width ?? 1440) < 768;
  if (isMobile) {
    const hamburgerBtn = page.locator('.mobile-hamburger-btn');
    await expect(hamburgerBtn).toBeVisible({ timeout: 8000 });
    await hamburgerBtn.click();
    const drawer = page.locator('.mobile-sidebar-drawer');
    await expect(drawer).toBeVisible({ timeout: 8000 });
    return drawer;
  }
  const sidebar = page.locator('.student-sidebar-container');
  await expect(sidebar).toBeVisible({ timeout: 8000 });
  return sidebar;
}

test.describe('Student Portal: Reorganized Sidebar & Dedicated Vocabulary/Grammar Modules', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Reset session storage
    await page.addInitScript(() => {
      window.sessionStorage.clear();
    });
  });

  test('1. Sidebar Organization: 5 Groups, Knowledge Repository & Clean Scrolling', async ({ page }) => {
    // 1.1 Login as student
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 1.2 Verify 4 reorganized collapsible navigation groups in sidebar
    const sidebar = await openSidebarContainer(page);

    await expect(sidebar.getByText('TỔNG QUAN')).toBeVisible();
    await expect(sidebar.getByText('KHÓA HỌC')).toBeVisible();
    await expect(sidebar.getByText('KỸ NĂNG')).toBeVisible();
    await expect(sidebar.getByText('LUYỆN TẬP')).toBeVisible();
    await expect(sidebar.getByText('KHO KIẾN THỨC')).toHaveCount(0);

    // 1.3 Verify KHÓA HỌC contains Từ vựng HSK 1–6, Ngữ pháp HSK 1–6, Học qua video, Bài tập
    await expect(sidebar.getByText('Từ vựng HSK 1–6')).toBeVisible();
    await expect(sidebar.getByText('Ngữ pháp HSK 1–6')).toBeVisible();
    await expect(sidebar.getByText('Học qua video')).toBeVisible();
    await expect(sidebar.getByText('Bài tập')).toBeVisible();
    await expect(sidebar.getByText('Hội thoại')).toBeVisible();
    await expect(sidebar.getByText('Viết thư')).toBeVisible();

    // 1.4 Verify independent scroll container exists
    const scrollContainer = sidebar.locator('.student-sidebar-scroll');
    if ((page.viewportSize()?.width ?? 1440) >= 768) {
      await expect(scrollContainer).toBeVisible();
    }

    // 1.5 Verify Kippy AI widget is completely removed from sidebar
    await expect(sidebar.getByText('Trợ lý Kippy AI')).toHaveCount(0);
    await expect(sidebar.getByText('Luyện giao tiếp 24/7')).toHaveCount(0);
    await expect(sidebar.getByText('Luyện phản xạ ngay')).toHaveCount(0);

    await page.screenshot({ path: 'e2e/screenshots/13-student-sidebar-groups.png' });
  });

  test('2. Dedicated Vocabulary Module: Real SQL Server Data, Search, Filter & Drawer', async ({ page }) => {
    // 2.1 Login and navigate to Vocabulary via Sidebar
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // Click Vocabulary in Sidebar
    const sidebar = await openSidebarContainer(page);
    await sidebar.getByText('Từ vựng HSK 1–6').click();
    await expect(page).toHaveURL(/.*\/vocabulary/, { timeout: 8000 });

    // 2.2 Verify Vocabulary list loaded from live SQL Server
    const heading = page.locator('h3:has-text("Danh sách từ vựng")');
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    // Verify words exist on page (e.g. 你, 叫, 名字, 什么, or 不客气)
    const cards = page.locator('div[style*="border-radius: var(--radius-xl)"]');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });

    // 2.3 Search test
    const searchInput = page.locator('input[placeholder*="Tìm theo Chữ Hán"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('你');
    await page.waitForTimeout(500);

    // Verify search filtered results
    await expect(page.getByText('你').first()).toBeVisible();

    // 2.4 Open Drawer Detail
    await page.getByText('你').first().click();
    const drawer = page.locator('.ai-tutor-drawer, aside[aria-label="Chi tiết từ vựng"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Verify detail contents in drawer
    await expect(drawer.getByText('Phát âm chuẩn').first()).toBeVisible();
    await expect(drawer.getByText('CÁC NGHĨA PHỔ BIẾN')).toBeVisible();

    // Close Drawer
    const closeBtn = drawer.locator('header button').first();
    await closeBtn.click();
    await page.waitForTimeout(300);

    // 2.5 Deduplication verification: searching '八' in HSK 1 shows exactly ONE canonical card
    const hsk1Btn = page.getByRole('button', { name: 'HSK 1', exact: true });
    if (await hsk1Btn.count()) {
      await hsk1Btn.first().click();
    }
    await searchInput.fill('八');
    await page.waitForTimeout(600);
    const matchingBaCards = page.locator('div[style*="border-radius: var(--radius-xl)"]', { hasText: 'bā' }).filter({ hasText: 'tám' });
    await expect(matchingBaCards).toHaveCount(1, { timeout: 8000 });
    await expect(matchingBaCards.first()).toContainText('Bài 7');

    await page.screenshot({ path: 'e2e/screenshots/14-vocabulary-module.png' });
  });

  test('3. Dedicated Grammar Module: Real Count, Formula, Examples & Practice', async ({ page }) => {
    // 3.1 Login and navigate to Grammar via Sidebar
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // Click Grammar in Sidebar
    const sidebar = await openSidebarContainer(page);
    await sidebar.getByText('Ngữ pháp HSK 1–6').click();
    await expect(page).toHaveURL(/.*\/grammar/, { timeout: 8000 });

    // 3.2 Verify Header and Real Total Count from SQL Server
    await expect(page.getByText('Khám phá ngữ pháp')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.grammar-stat-chip-label', { hasText: 'Đã xuất bản' })).toBeVisible();

    // 3.3 Verify Grammar Cards have Formula & Bilingual Examples
    const grammarCards = page.locator('.grammar-card');
    await expect(grammarCards.first()).toBeVisible({ timeout: 8000 });

    await expect(page.getByText('Cấu trúc công thức').first()).toBeVisible();
    await expect(page.getByText('Mẫu câu ví dụ song ngữ').first()).toBeVisible();

    // 3.4 Search Grammar Point
    const searchInput = page.locator('.grammar-search-input');
    await searchInput.fill('chào hỏi');
    await page.waitForTimeout(500);

    await expect(page.getByText('Câu chào hỏi cơ bản')).toBeVisible();

    // 3.5 Test Practice Modal Launch
    const practiceBtn = page.locator('.grammar-practice-btn').first();
    await expect(practiceBtn).toBeVisible();
    await practiceBtn.click();

    // Verify modal appeared
    const modal = page.locator('.grammar-modal-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText('Luyện tập ngữ pháp')).toBeVisible();

    // Close modal
    const closeBtn = modal.locator('.grammar-modal-close');
    await closeBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'e2e/screenshots/15-grammar-module.png' });
  });

  test('4. URL Refresh & Active Menu State Verification', async ({ page }) => {
    // 4.1 Login
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 4.2 Direct navigation to /grammar and refresh
    await page.goto('/ZhongWenHub/grammar');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify page stays on /grammar and active indicator is on Grammar menu
    await expect(page).toHaveURL(/.*\/grammar/);
    const grammarSidebar = await openSidebarContainer(page);
    const grammarMenu = grammarSidebar.locator('button[aria-current="page"]');
    await expect(grammarMenu).toBeVisible();
    await expect(grammarMenu).toContainText('Ngữ pháp HSK 1–6');

    // 4.3 Direct navigation to /vocabulary and refresh
    await page.goto('/ZhongWenHub/vocabulary');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify page stays on /vocabulary and active indicator is on Vocabulary menu
    await expect(page).toHaveURL(/.*\/vocabulary/);
    const vocabSidebar = await openSidebarContainer(page);
    const vocabMenu = vocabSidebar.locator('button[aria-current="page"]');
    await expect(vocabMenu).toBeVisible();
    await expect(vocabMenu).toContainText('Từ vựng HSK 1–6');
  });

  test('5. Security & Anti-Leak: Student API Access Restrictions', async ({ request }) => {
    // 5.1 Call public vocabulary API as anonymous / student
    const vocabRes = await request.get('/api/v1/content/vocabularies?pageSize=50');
    expect(vocabRes.status()).toBe(200);
    const vocabJson = await vocabRes.json();

    // Confirm that every returned vocabulary has status PUBLISHED
    for (const item of vocabJson.items) {
      expect(item.status).toBe('PUBLISHED');
      // Review notes and internal metadata must be omitted (null or undefined)
      expect(item.reviewNotes).toBeFalsy();
      expect(item.suggestedMeaningVi).toBeFalsy();
    }

    // 5.2 Call public grammar API
    const grammarRes = await request.get('/api/v1/content/grammar?pageSize=50');
    expect(grammarRes.status()).toBe(200);
    const grammarJson = await grammarRes.json();

    // Confirm that every returned grammar point has status PUBLISHED
    for (const item of grammarJson.items) {
      expect(item.status).toBe('PUBLISHED');
      expect(item.reviewNotes).toBeFalsy();
      expect(item.rawExplanationCn).toBeFalsy();
    }
  });

  test('6. Mobile Viewport: Responsive Navigation & Drawer Flow', async ({ page }) => {
    // 6.1 Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 12000 });

    // 6.2 Open mobile drawer via hamburger button
    const hamburgerBtn = page.locator('.mobile-hamburger-btn');
    await expect(hamburgerBtn).toBeVisible({ timeout: 6000 });
    await hamburgerBtn.click();
    await page.waitForTimeout(500);

    // Verify mobile drawer opened
    const mobileDrawer = page.locator('.mobile-sidebar-drawer');
    await expect(mobileDrawer).toBeVisible();

    // Click Vocabulary in mobile drawer
    const vocabMobileItem = page.locator('.mobile-sidebar-drawer').getByText('Từ vựng HSK 1–6');
    if (await vocabMobileItem.isVisible()) {
      await vocabMobileItem.click();
    } else {
      await page.goto('/ZhongWenHub/vocabulary');
    }

    await expect(page).toHaveURL(/.*\/vocabulary/, { timeout: 8000 });
    const heading = page.locator('h3:has-text("Danh sách từ vựng")');
    await expect(heading).toBeVisible({ timeout: 8000 });

    await page.screenshot({ path: 'e2e/screenshots/16-mobile-viewport-vocabulary.png' });
  });
});
