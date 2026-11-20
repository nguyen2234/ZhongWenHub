import { test, expect, type Page } from '@playwright/test';
import { testCredentials } from './config/test-credentials.config';

const WELCOME_TEXT =
  'Chào bạn! Mình là Trợ giảng AI ZhongWen.';

async function loginStudent(page: Page) {
  await page.goto('/ZhongWenHub/login');
  await page.fill('#login-email', testCredentials.student.email);
  await page.fill('#login-password', testCredentials.student.password());
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
}

test.describe('AI Tutor Minimalist Chat UI Redesign', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Unified Drawer UI: minimalist header, no tabs/HSK badges, single welcome, smart scroll & Shift+Enter/Enter', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginStudent(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1. Open AI Tutor Drawer from floating trigger
    await page.getByRole('button', { name: 'Hỏi AI' }).click();
    const drawer = page.locator('.ai-tutor-drawer');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // 2. Verify header elements, preserved AI icon, and absence of HSK 1-6 / Gia sư toàn diện
    const header = drawer.locator('.ai-tutor-drawer-header');
    await expect(header.getByText('Trợ giảng AI ZhongWen')).toBeVisible();
    await expect(header.getByText('AI Contextual Tutor')).toBeVisible();
    await expect(header.locator('img, svg').first()).toBeVisible();
    await expect(drawer.getByText(/HSK 1[–-]6/i)).toHaveCount(0);
    await expect(drawer.getByText('Gia sư toàn diện')).toHaveCount(0);

    // 3. Verify two old tabs are gone (exact tab labels)
    await expect(drawer.getByRole('button', { name: 'Hỏi đáp & Giải thích', exact: true })).toHaveCount(0);
    await expect(drawer.getByRole('button', { name: /💬 Luyện hội thoại/i })).toHaveCount(0);

    // 4. Verify welcome message shown once + <= 3 initial contextual suggestions
    await expect(drawer.getByText(WELCOME_TEXT)).toHaveCount(1);
    const suggestionButtons = drawer.locator('.ai-tutor-initial-suggestions button');
    expect(await suggestionButtons.count()).toBeLessThanOrEqual(3);
    expect(await suggestionButtons.count()).toBeGreaterThan(0);

    // 5. Verify input composer placeholder, Shift+Enter newline, and Enter submit
    const input = drawer.getByPlaceholder('Hỏi bất kỳ điều gì về bài học hoặc chữ Hán...');
    await expect(input).toBeVisible();
    await input.click();
    await input.type('Xin chào');
    await page.keyboard.press('Shift+Enter');
    await input.type('Phân biệt 想 và 要 giúp mình');
    expect(await input.inputValue()).toContain('\n');

    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('');

    // Initial suggestions disappear once conversation starts & AI response appears with Copy / Like / Dislike
    await expect(drawer.locator('.ai-tutor-initial-suggestions')).toHaveCount(0);
    await expect(drawer.locator('.ai-tutor-message-user')).toHaveCount(1);
    await expect(drawer.getByRole('button', { name: 'Sao chép phản hồi' }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(drawer.getByRole('button', { name: 'Phản hồi hữu ích' }).first()).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/18-ai-tutor-drawer-redesign.png' });

    // 6. Send additional messages to create vertical scroll & confirm header/input stay fixed without background scroll
    for (const q of ['Cho ví dụ câu với 想', 'Khi nào dùng 要?', 'Giải thích ngữ pháp chữ 的']) {
      await input.fill(q);
      await page.keyboard.press('Enter');
      await expect(drawer.getByRole('status')).toHaveCount(0, { timeout: 5000 });
    }

    const scrollMetrics = await drawer.evaluate((el) => {
      const scrollBox = el.querySelector<HTMLElement>('.ai-tutor-messages-scroll')!;
      const headerEl = el.querySelector<HTMLElement>('.ai-tutor-drawer-header')!;
      const inputEl = el.querySelector<HTMLElement>('.ai-tutor-input-bar')!;
      const headerTopBefore = Math.round(headerEl.getBoundingClientRect().top);
      const inputBottomBefore = Math.round(inputEl.getBoundingClientRect().bottom);
      scrollBox.scrollTop = 0;
      const headerTopAfter = Math.round(headerEl.getBoundingClientRect().top);
      const inputBottomAfter = Math.round(inputEl.getBoundingClientRect().bottom);
      return {
        scrollHeight: scrollBox.scrollHeight,
        clientHeight: scrollBox.clientHeight,
        headerTopBefore,
        headerTopAfter,
        inputBottomBefore,
        inputBottomAfter,
        windowScrollY: window.scrollY,
      };
    });
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
    expect(scrollMetrics.headerTopBefore).toBe(0);
    expect(scrollMetrics.headerTopAfter).toBe(0);
    expect(scrollMetrics.inputBottomBefore).toBe(900);
    expect(scrollMetrics.inputBottomAfter).toBe(900);
    expect(scrollMetrics.windowScrollY).toBe(0);

    // 7. Close drawer and reopen -> welcome message NOT duplicated
    await drawer.getByRole('button', { name: 'Đóng Trợ giảng AI' }).click();
    await expect(drawer).toBeHidden();
    await page.getByRole('button', { name: 'Hỏi AI' }).click();
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(WELCOME_TEXT)).toHaveCount(1);

    await drawer.getByRole('button', { name: 'Đóng Trợ giảng AI' }).click();
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('2. Opens AI Tutor from Vocabulary "HỎI AI VỀ TỪ NÀY", preserves context, and keeps /ai-live & mobile intact', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginStudent(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Navigate via SPA sidebar to Vocabulary & click word 你 -> HỎI AI VỀ TỪ NÀY
    await page.locator('aside.student-sidebar-container').first().getByRole('button', { name: /Từ vựng HSK/i }).click();
    await expect(page).toHaveURL(/.*\/vocabulary/);
    const searchInput = page.locator('input[placeholder*="Tìm theo Chữ Hán"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('你');
    await page.waitForTimeout(500);
    await page.getByText('你').first().click();

    const askAiVocabBtn = page.getByRole('button', { name: /HỎI AI VỀ TỪ NÀY/i });
    await expect(askAiVocabBtn).toBeVisible({ timeout: 5000 });
    await askAiVocabBtn.click();

    const drawer = page.locator('.ai-tutor-drawer');
    await expect(drawer).toBeVisible({ timeout: 5000 });
    await expect(drawer.locator('.ai-tutor-vocab-context-pill')).toContainText('你');
    await expect(drawer.locator('.ai-tutor-drawer-header').getByText(/HSK 1/i)).toHaveCount(0);
    await expect(drawer.getByRole('status')).toHaveCount(0, { timeout: 6000 });
    await expect(drawer.getByText(WELCOME_TEXT)).toHaveCount(1);
    await expect(drawer.getByRole('button', { name: 'Sao chép phản hồi' }).first()).toBeVisible({
      timeout: 5000,
    });

    // Check Mobile responsiveness (390x844): drawer fits viewport without horizontal overflow & close/send reachable
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    const mobileMetrics = await page.evaluate(() => {
      const aside = document.querySelector<HTMLElement>('.ai-tutor-drawer')!;
      const sendBtn = aside.querySelector<HTMLElement>('button[type="submit"]')!;
      return {
        drawerWidth: Math.round(aside.getBoundingClientRect().width),
        innerWidth: window.innerWidth,
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        sendBottom: Math.round(sendBtn.getBoundingClientRect().bottom),
        innerHeight: window.innerHeight,
      };
    });
    expect(mobileMetrics.drawerWidth).toBeLessThanOrEqual(390);
    expect(mobileMetrics.overflowX).toBe(false);
    expect(mobileMetrics.sendBottom).toBeLessThanOrEqual(mobileMetrics.innerHeight);

    await page.screenshot({ path: 'e2e/screenshots/19-ai-tutor-drawer-mobile.png' });
    await drawer.getByRole('button', { name: 'Đóng Trợ giảng AI' }).click();

    // Verify /ai-tutor workspace & /ai-live remain completely intact via SPA menu navigation
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    const sidebar = page.locator('aside.student-sidebar-container').first();
    await sidebar.getByRole('button', { name: /^AI Tutor$/i }).click();
    await expect(page).toHaveURL(/.*\/ai-tutor/);
    await expect(page.getByText(WELCOME_TEXT)).toBeVisible({ timeout: 8000 });

    await sidebar.getByRole('button', { name: /^Hội thoại$/i }).click();
    await expect(page).toHaveURL(/.*\/ai-live/);
    await expect(page.getByText('Hội Thoại AI Live (Kippy)')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('button[title="Nhấn để nói"], button[title="Đang bật Mic"]')).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

