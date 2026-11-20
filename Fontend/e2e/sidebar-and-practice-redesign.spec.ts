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

  const sidebar = page.locator('aside.student-sidebar-container').first();
  await expect(sidebar).toBeVisible({ timeout: 10000 });
  return sidebar;
}

async function loginStudent(page: Page) {
  await page.goto('/ZhongWenHub/login');
  await page.fill('#login-email', testCredentials.student.email);
  await page.fill('#login-password', testCredentials.student.password());
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
}

test.describe('Sidebar Reorganization & Practice Exercises Redesign', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Desktop: Reorganized 4-group sidebar, active states & non-regression routes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginStudent(page);

    const sidebar = await openSidebarContainer(page);

    // Group titles match exact requirement and "Kho kiến thức" is absent
    await expect(sidebar.getByText('TỔNG QUAN')).toBeVisible();
    await expect(sidebar.getByText('KHÓA HỌC')).toBeVisible();
    await expect(sidebar.getByText('KỸ NĂNG')).toBeVisible();
    await expect(sidebar.getByText('LUYỆN TẬP')).toBeVisible();
    await expect(sidebar.getByText('KHO KIẾN THỨC')).toHaveCount(0);

    // Bài tập navigates to /practice and highlights active state
    await sidebar.getByRole('button', { name: /^Bài tập$/i }).click();
    await expect(page).toHaveURL(/.*\/practice/);
    await expect(
      sidebar.locator('button[aria-current="page"]', { hasText: 'Bài tập' })
    ).toBeVisible();

    // Check KỸ NĂNG & LUYỆN TẬP active menu isolation (Hội thoại vs Viết thư vs AI Tutor)
    await sidebar.getByRole('button', { name: /^Hội thoại$/i }).click();
    await expect(page).toHaveURL(/.*\/ai-live/);
    await expect(
      sidebar.locator('button[aria-current="page"]')
    ).toHaveCount(1);
    await expect(
      sidebar.locator('button[aria-current="page"]', { hasText: 'Hội thoại' })
    ).toBeVisible();

    await sidebar.getByRole('button', { name: /^Viết thư$/i }).click();
    await expect(page).toHaveURL(/.*\/ai-grading/);
    await expect(
      sidebar.locator('button[aria-current="page"]')
    ).toHaveCount(1);
    await expect(
      sidebar.locator('button[aria-current="page"]', { hasText: 'Viết thư' })
    ).toBeVisible();

    await sidebar.getByRole('button', { name: /^AI Tutor/i }).click();
    await expect(page).toHaveURL(/.*\/ai-tutor/);
    await expect(
      sidebar.locator('button[aria-current="page"]')
    ).toHaveCount(1);
    await expect(
      sidebar.locator('button[aria-current="page"]', { hasText: 'AI Tutor' })
    ).toBeVisible();

    // Non-regression: Vocabulary & Grammar remain accessible
    await sidebar.getByRole('button', { name: /Từ vựng HSK 1–6/i }).click();
    await expect(page).toHaveURL(/.*\/vocabulary/);
    await sidebar.getByRole('button', { name: /Ngữ pháp HSK 1–6/i }).click();
    await expect(page).toHaveURL(/.*\/grammar/);
  });

  test('2. /practice Redesign: Real counts, 5 cards, BẮT ĐẦU launches strictly typed session, unavailable cards disabled', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginStudent(page);

    await page.goto('/ZhongWenHub/practice');
    await expect(
      page.getByRole('heading', { level: 1, name: /Bài tập luyện tiếng Trung/i })
    ).toBeVisible({ timeout: 12000 });

    // Wait for recommendations metadata response so real counts render
    await page.waitForLoadState('networkidle');

    // Stats strip visible
    const stats = page.locator('.practice-intro-stats');
    await expect(stats.getByText('Dạng bài', { exact: true })).toBeVisible();
    await expect(stats.getByText('Cấp độ', { exact: true })).toBeVisible();
    await expect(stats.getByText('Luyện lại', { exact: true })).toBeVisible();

    // Dynamic HSK strip should contain server-returned levels
    await expect(page.getByRole('button', { name: 'Tất cả cấp độ' })).toBeVisible();
    await expect(
      page.locator('.practice-level-pills').getByRole('button', { name: 'HSK 1', exact: true })
    ).toBeVisible();

    // Desktop grid has 3 columns
    const grid = page.locator('.practice-formats-grid');
    await expect(grid).toBeVisible();
    const cards = grid.locator('article.practice-format-card');
    await expect(cards).toHaveCount(5);

    const gridColsDesktop = await grid.evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length
    );
    expect(gridColsDesktop).toBe(3);

    // Verify 01 & 02 are available and 03..05 are honestly marked Chưa khả dụng
    await expect(grid.locator('article[data-format-type="sentence-order"]')).toHaveAttribute(
      'data-available',
      'true'
    );
    await expect(grid.locator('article[data-format-type="fill-blank"]')).toHaveAttribute(
      'data-available',
      'true'
    );
    for (const unsupportedType of ['listen-fill-blank', 'listen-order', 'reading-cloze']) {
      const card = grid.locator(`article[data-format-type="${unsupportedType}"]`);
      await expect(card).toHaveAttribute('data-available', 'false');
      await expect(card.locator('button')).toBeDisabled();
    }

    // Bottom practice guide visible
    await expect(
      page.getByRole('heading', { name: /Hướng dẫn luyện tập/i })
    ).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/15-practice-redesign-desktop.png' });

    // Click BẮT ĐẦU on Card 01 (Sắp xếp từ thành câu hoàn chỉnh) & verify backend session request
    const sessionPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/question-bank/practice-sessions') &&
        res.request().method() === 'POST' &&
        !res.url().endsWith('/submit')
    );

    await page
      .getByRole('button', { name: /BẮT ĐẦU Sắp xếp từ thành câu hoàn chỉnh/i })
      .click();

    const sessionResponse = await sessionPromise;
    expect(sessionResponse.status()).toBe(201);
    const sessionData = (await sessionResponse.json()) as {
      questions: Array<{ type: string }>;
    };
    expect(sessionData.questions.length).toBeGreaterThan(0);
    for (const q of sessionData.questions) {
      expect(['sentence-ordering', 'sentence-order', 'sentence_order']).toContain(q.type);
    }

    await expect(page).toHaveURL(/.*\/practice\?type=sentence-order/);
    await expect(page.getByText(/1 \/ \d+/)).toBeVisible({ timeout: 10000 });

    // Deep link to unavailable format shows explicit notice instead of faking questions
    await page.goto('/ZhongWenHub/practice?type=listen-fill-blank');
    await expect(
      page.getByRole('status').filter({ hasText: /Nghe điền từ còn thiếu/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('3. Tablet & Mobile responsive grids and zero horizontal overflow on /practice', async ({
    page,
  }) => {
    await loginStudent(page);

    // Tablet (768px) -> 2 columns
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/ZhongWenHub/practice');
    await expect(
      page.getByRole('heading', { level: 1, name: /Bài tập luyện tiếng Trung/i })
    ).toBeVisible({ timeout: 12000 });
    const grid = page.locator('.practice-formats-grid');
    const tabletCols = await grid.evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length
    );
    expect(tabletCols).toBe(2);
    const tabletOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(tabletOverflow).toBe(false);

    // Mobile (390px) -> 1 column
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(grid).toBeVisible();
    const mobileCols = await grid.evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length
    );
    expect(mobileCols).toBe(1);
    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(mobileOverflow).toBe(false);

    await page.screenshot({ path: 'e2e/screenshots/16-practice-redesign-mobile.png' });
  });

  test('4. Sidebar removes Kippy AI widget, supports independent scroll, group toggle & active item auto-scroll', async ({
    page,
  }) => {
    // Use a shorter desktop viewport so the full menu naturally requires vertical scrolling
    await page.setViewportSize({ width: 1280, height: 500 });
    await loginStudent(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const sidebar = await openSidebarContainer(page);

    // 4.1 Verify Kippy AI widget & texts are completely removed from sidebar
    await expect(sidebar.getByText('Trợ lý Kippy AI')).toHaveCount(0);
    await expect(sidebar.getByText('Luyện giao tiếp 24/7')).toHaveCount(0);
    await expect(sidebar.getByText('Luyện phản xạ ngay')).toHaveCount(0);

    // Also verify no empty footer block exists after .student-sidebar-scroll
    const scrollBox = sidebar.locator('.student-sidebar-scroll');
    const isLastChild = await scrollBox.evaluate((el) => el.nextElementSibling === null);
    expect(isLastChild).toBe(true);

    // Check collapsed mode also has zero Kippy AI compact widget
    const collapseBtn = sidebar.getByRole('button', { name: /Thu gọn thanh điều hướng/i });
    await collapseBtn.click();
    await expect(sidebar.locator('button[title="Luyện nói AI Live Kippy"]')).toHaveCount(0);
    const expandBtn = sidebar.getByRole('button', { name: /Mở rộng thanh điều hướng/i });
    await expandBtn.click();

    // 4.2 Group expand/collapse works properly
    const skillsGroupBtn = sidebar.locator('button[aria-expanded]', { hasText: 'KỸ NĂNG' });
    await expect(skillsGroupBtn).toHaveAttribute('aria-expanded', 'true');
    await skillsGroupBtn.click();
    await expect(skillsGroupBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(sidebar.getByRole('button', { name: /^Luyện nghe$/i })).toHaveCount(0);
    await skillsGroupBtn.click();
    await expect(skillsGroupBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar.getByRole('button', { name: /^Luyện nghe$/i })).toBeVisible();

    // 4.3 Sidebar scrolls independently from main content
    const overflowMetrics = await scrollBox.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(overflowMetrics.scrollHeight).toBeGreaterThan(overflowMetrics.clientHeight);

    // Navigate via sidebar SPA click to /practice (tall page) and verify sidebar scrollTop stays put when main scrolls
    await sidebar.getByRole('button', { name: /^Bài tập$/i }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: /Bài tập luyện tiếng Trung/i })
    ).toBeVisible({ timeout: 10000 });

    const mainScroll = page.locator('.student-main-scroll');
    const beforeMainScrollSidebarTop = await scrollBox.evaluate((el) => el.scrollTop);
    const mainOverflow = await mainScroll.evaluate((el) => {
      el.scrollTop = 450;
      return {
        mainScrollTop: el.scrollTop,
        windowScrollY: window.scrollY,
      };
    });
    await page.waitForTimeout(150);
    const afterMainScrollSidebarTop = await scrollBox.evaluate((el) => el.scrollTop);
    expect(mainOverflow.mainScrollTop).toBeGreaterThan(0);
    expect(mainOverflow.windowScrollY).toBe(0);
    expect(afterMainScrollSidebarTop).toBe(beforeMainScrollSidebarTop);

    // Reset sidebar to top, scroll sidebar manually to bottom, confirm main & window scroll stay untouched
    const mainScrollBefore = await mainScroll.evaluate((el) => el.scrollTop);
    await scrollBox.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(100);
    const sidebarScrollAfter = await scrollBox.evaluate((el) => el.scrollTop);
    const mainScrollAfter = await mainScroll.evaluate((el) => el.scrollTop);
    expect(sidebarScrollAfter).toBeGreaterThan(0);
    expect(mainScrollAfter).toBe(mainScrollBefore);

    // 4.4 Reset sidebar scroll to top and navigate via Quick Search SPA transition to /ai-tutor
    // -> StudentSidebar auto-scroll brings active item into view without clicking the sidebar directly
    await scrollBox.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.locator('header button', { hasText: /Tìm kiếm/i }).click();
    await page.getByText('AI Tutor Trò chuyện thông minh').click();
    await expect(page).toHaveURL(/.*\/ai-tutor/);
    await page.waitForTimeout(400);

    const activeVisibility = await scrollBox.evaluate((container) => {
      const activeEl = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (!activeEl) return null;
      const cRect = container.getBoundingClientRect();
      const aRect = activeEl.getBoundingClientRect();
      return {
        topOk: aRect.top >= cRect.top - 2,
        bottomOk: aRect.bottom <= cRect.bottom + 2,
        scrollTop: container.scrollTop,
      };
    });
    expect(activeVisibility).not.toBeNull();
    expect(activeVisibility?.topOk).toBe(true);
    expect(activeVisibility?.bottomOk).toBe(true);
    expect(activeVisibility?.scrollTop).toBeGreaterThan(0);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('5. Fixed App Shell (Grid header + sidebar + scrollable main) across 500/768/1080, Vocabulary, AI Live & mobile', async ({
    page,
  }) => {
    await loginStudent(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate via sidebar click to /practice
    const isInitiallyMobile = (page.viewportSize()?.width ?? 1440) < 768;
    if (!isInitiallyMobile) {
      await page.locator('aside.student-sidebar-container').first().getByRole('button', { name: /^Bài tập$/i }).click();
    } else {
      await page.locator('.mobile-hamburger-btn').click();
      await page.locator('.mobile-sidebar-drawer').getByRole('button', { name: /^Bài tập$/i }).click();
    }
    await expect(
      page.getByRole('heading', { level: 1, name: /Bài tập luyện tiếng Trung/i })
    ).toBeVisible({ timeout: 10000 });

    // Check CSS Grid Fixed App Shell at 500px, 768px, and 1080px heights (no body scrollbar, no fixed hacks)
    for (const height of [500, 768, 1080]) {
      await page.setViewportSize({ width: 1440, height });
      await page.waitForTimeout(350);

      const shellMetrics = await page.evaluate(() => {
        const shell = document.querySelector<HTMLElement>('.student-app-shell');
        const wrapper = document.querySelector<HTMLElement>('.desktop-sidebar-wrapper');
        const header = document.querySelector<HTMLElement>('.student-app-header');
        const mainPane = document.querySelector<HTMLElement>('.student-main-scroll');
        const brandHeader = wrapper?.querySelector<HTMLElement>('.student-sidebar-brand-header');
        if (!shell || !wrapper || !header || !mainPane || !brandHeader) return null;

        const shellStyle = getComputedStyle(shell);
        const wrapperStyle = getComputedStyle(wrapper);
        const headerStyle = getComputedStyle(header);
        const mainStyle = getComputedStyle(mainPane);
        const wRect = wrapper.getBoundingClientRect();
        const hRect = header.getBoundingClientRect();
        const mRect = mainPane.getBoundingClientRect();

        return {
          shellDisplay: shellStyle.display,
          shellOverflow: shellStyle.overflow,
          shellHeight: Math.round(shell.getBoundingClientRect().height),
          wrapperPosition: wrapperStyle.position,
          wrapperTop: Math.round(wRect.top),
          wrapperLeft: Math.round(wRect.left),
          wrapperWidth: Math.round(wRect.width),
          wrapperHeight: Math.round(wRect.height),
          headerPosition: headerStyle.position,
          headerTop: Math.round(hRect.top),
          headerLeft: Math.round(hRect.left),
          headerHeight: Math.round(hRect.height),
          mainOverflowY: mainStyle.overflowY,
          mainTop: Math.round(mRect.top),
          mainLeft: Math.round(mRect.left),
          brandTop: Math.round(brandHeader.getBoundingClientRect().top),
          innerHeight: window.innerHeight,
          docScrollHeight: document.documentElement.scrollHeight,
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });

      expect(shellMetrics).not.toBeNull();
      expect(shellMetrics?.shellDisplay).toBe('grid');
      expect(shellMetrics?.shellOverflow).toBe('hidden');
      expect(Math.abs((shellMetrics?.shellHeight ?? 0) - (shellMetrics?.innerHeight ?? 0))).toBeLessThanOrEqual(1);
      expect(shellMetrics?.docScrollHeight).toBeLessThanOrEqual((shellMetrics?.innerHeight ?? 0) + 1);
      expect(shellMetrics?.overflowX).toBe(false);

      expect(shellMetrics?.wrapperPosition).not.toBe('fixed');
      expect(shellMetrics?.wrapperTop).toBe(0);
      expect(shellMetrics?.wrapperLeft).toBe(0);
      expect(shellMetrics?.wrapperWidth).toBe(256);
      expect(Math.abs((shellMetrics?.wrapperHeight ?? 0) - (shellMetrics?.innerHeight ?? 0))).toBeLessThanOrEqual(1);
      expect(shellMetrics?.brandTop).toBe(0);

      expect(shellMetrics?.headerTop).toBe(0);
      expect(shellMetrics?.headerLeft).toBeGreaterThanOrEqual(255);
      expect(shellMetrics?.headerHeight).toBe(64);
      expect(shellMetrics?.mainOverflowY).toBe('auto');
      expect(shellMetrics?.mainTop).toBe(64);
      expect(shellMetrics?.mainLeft).toBeGreaterThanOrEqual(255);

      const sidebar = page.locator('.desktop-sidebar-wrapper');
      await expect(sidebar.getByText('ZhongWenHub')).toBeVisible();
      await expect(sidebar.getByText('Học tiếng Trung dễ dàng')).toBeVisible();
      await expect(page.locator('header .mobile-header-left')).toBeHidden();
    }

    // Scroll /practice top-to-bottom inside .student-main-scroll and confirm header & sidebar stay fixed at top=0
    await page.setViewportSize({ width: 1440, height: 768 });
    const practiceScroll = await page.evaluate(() => {
      const mainPane = document.querySelector<HTMLElement>('.student-main-scroll')!;
      mainPane.scrollTop = mainPane.scrollHeight;
      const header = document.querySelector<HTMLElement>('.student-app-header')!;
      const wrapper = document.querySelector<HTMLElement>('.desktop-sidebar-wrapper')!;
      return {
        scrollHeight: mainPane.scrollHeight,
        clientHeight: mainPane.clientHeight,
        mainScrollTop: mainPane.scrollTop,
        windowScrollY: window.scrollY,
        headerTop: Math.round(header.getBoundingClientRect().top),
        wrapperTop: Math.round(wrapper.getBoundingClientRect().top),
      };
    });
    expect(practiceScroll.scrollHeight).toBeGreaterThan(practiceScroll.clientHeight);
    expect(practiceScroll.mainScrollTop).toBeGreaterThan(0);
    expect(practiceScroll.windowScrollY).toBe(0);
    expect(practiceScroll.headerTop).toBe(0);
    expect(practiceScroll.wrapperTop).toBe(0);

    await page.screenshot({ path: 'e2e/screenshots/17-fixed-sidebar-unified-logo-desktop.png' });

    // Collapse/expand sidebar and confirm Grid automatically syncs both header & main content widths (256 <-> 72)
    const sidebar = page.locator('.desktop-sidebar-wrapper aside.student-sidebar-container');
    await sidebar.getByRole('button', { name: /Thu gọn thanh điều hướng/i }).click();
    await page.waitForTimeout(300);

    const collapsedMetrics = await page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>('.desktop-sidebar-wrapper')!;
      const mainPane = document.querySelector<HTMLElement>('.student-main-scroll')!;
      const header = document.querySelector<HTMLElement>('.student-app-header')!;
      return {
        sidebarWidth: Math.round(wrapper.getBoundingClientRect().width),
        mainLeft: Math.round(mainPane.getBoundingClientRect().left),
        headerLeft: Math.round(header.getBoundingClientRect().left),
        headerWidth: Math.round(header.getBoundingClientRect().width),
        expectedRightWidth: window.innerWidth - 72,
      };
    });
    expect(collapsedMetrics.sidebarWidth).toBe(72);
    expect(collapsedMetrics.mainLeft).toBeGreaterThanOrEqual(71);
    expect(collapsedMetrics.headerLeft).toBeGreaterThanOrEqual(71);
    expect(Math.abs(collapsedMetrics.headerWidth - collapsedMetrics.expectedRightWidth)).toBeLessThanOrEqual(2);
    await expect(sidebar.getByText('ZhongWenHub')).toBeHidden();
    await expect(sidebar.getByRole('button', { name: /Mở rộng thanh điều hướng/i })).toBeVisible();

    await sidebar.getByRole('button', { name: /Mở rộng thanh điều hướng/i }).click();
    await page.waitForTimeout(300);

    // Compact desktop (1024x768) -> 216px sidebar, header & main pane flush without clipping toggle button
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(350);
    const compactDesktopMetrics = await page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>('.desktop-sidebar-wrapper')!;
      const mainPane = document.querySelector<HTMLElement>('.student-main-scroll')!;
      const header = document.querySelector<HTMLElement>('.student-app-header')!;
      const collapseBtn = wrapper.querySelector<HTMLElement>('button[aria-label="Thu gọn thanh điều hướng"]');
      return {
        sidebarWidth: Math.round(wrapper.getBoundingClientRect().width),
        mainLeft: Math.round(mainPane.getBoundingClientRect().left),
        headerLeft: Math.round(header.getBoundingClientRect().left),
        collapseBtnRight: collapseBtn ? Math.round(collapseBtn.getBoundingClientRect().right) : 999,
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    expect(compactDesktopMetrics.sidebarWidth).toBe(216);
    expect(compactDesktopMetrics.mainLeft).toBeGreaterThanOrEqual(215);
    expect(compactDesktopMetrics.headerLeft).toBeGreaterThanOrEqual(215);
    expect(compactDesktopMetrics.collapseBtnRight).toBeLessThanOrEqual(216);
    expect(compactDesktopMetrics.overflowX).toBe(false);

    // Scroll Vocabulary from top to bottom and verify header + sidebar stay fixed at 0 & main scroll resets cleanly
    await page.setViewportSize({ width: 1440, height: 768 });
    await sidebar.getByRole('button', { name: /Từ vựng HSK/i }).click();
    await expect(page).toHaveURL(/.*\/vocabulary/);
    await expect(page.locator('.student-main-scroll')).toBeVisible();
    await page.waitForTimeout(600);
    const vocabScrollMetrics = await page.evaluate(() => {
      const mainPane = document.querySelector<HTMLElement>('.student-main-scroll')!;
      const initialTop = mainPane.scrollTop;
      mainPane.scrollTop = mainPane.scrollHeight;
      return {
        initialTop,
        scrolledTop: mainPane.scrollTop,
        windowScrollY: window.scrollY,
        headerTop: Math.round(document.querySelector<HTMLElement>('.student-app-header')!.getBoundingClientRect().top),
        wrapperTop: Math.round(document.querySelector<HTMLElement>('.desktop-sidebar-wrapper')!.getBoundingClientRect().top),
      };
    });
    expect(vocabScrollMetrics.initialTop).toBe(0);
    expect(vocabScrollMetrics.scrolledTop).toBeGreaterThan(0);
    expect(vocabScrollMetrics.windowScrollY).toBe(0);
    expect(vocabScrollMetrics.headerTop).toBe(0);
    expect(vocabScrollMetrics.wrapperTop).toBe(0);

    // Navigate through key student pages including Hội thoại AI Live (/ai-live)
    await sidebar.getByRole('button', { name: /^Giáo trình HSK$/i }).click();
    await expect(page).toHaveURL(/.*mode=hsk/);
    await sidebar.getByRole('button', { name: /^Ngữ pháp HSK/i }).click();
    await expect(page).toHaveURL(/.*\/grammar/);

    await sidebar.getByRole('button', { name: /^Hội thoại$/i }).click();
    await expect(page).toHaveURL(/.*\/ai-live/);
    await expect(page.getByText('Hội Thoại AI Live (Kippy)')).toBeVisible({ timeout: 10000 });
    const micBtn = page.locator('button[title="Nhấn để nói"], button[title="Đang bật Mic"]');
    await expect(micBtn).toBeVisible();
    const aiLiveMetrics = await page.evaluate(() => {
      const mainPane = document.querySelector<HTMLElement>('.student-main-scroll')!;
      mainPane.scrollTop = mainPane.scrollHeight;
      return {
        windowScrollY: window.scrollY,
        docScrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
        headerTop: Math.round(document.querySelector<HTMLElement>('.student-app-header')!.getBoundingClientRect().top),
        wrapperTop: Math.round(document.querySelector<HTMLElement>('.desktop-sidebar-wrapper')!.getBoundingClientRect().top),
      };
    });
    expect(aiLiveMetrics.windowScrollY).toBe(0);
    expect(aiLiveMetrics.docScrollHeight).toBeLessThanOrEqual(aiLiveMetrics.innerHeight + 1);
    expect(aiLiveMetrics.headerTop).toBe(0);
    expect(aiLiveMetrics.wrapperTop).toBe(0);
    await micBtn.scrollIntoViewIfNeeded();
    await expect(micBtn).toBeVisible();

    // Check tablet portrait (768x1024) and mobile (390x844): fixed header, scrollable main, single-logo drawer
    for (const vp of [
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(350);
      const mobileLayout = await page.evaluate(() => {
        const wrapper = document.querySelector<HTMLElement>('.desktop-sidebar-wrapper')!;
        const mainPane = document.querySelector<HTMLElement>('.student-main-scroll')!;
        const header = document.querySelector<HTMLElement>('.student-app-header')!;
        mainPane.scrollTop = 200;
        return {
          desktopSidebarDisplay: getComputedStyle(wrapper).display,
          mainLeft: Math.round(mainPane.getBoundingClientRect().left),
          mainScrollTop: mainPane.scrollTop,
          headerTop: Math.round(header.getBoundingClientRect().top),
          windowScrollY: window.scrollY,
        };
      });
      expect(mobileLayout.desktopSidebarDisplay).toBe('none');
      expect(mobileLayout.mainLeft).toBe(0);
      expect(mobileLayout.headerTop).toBe(0);
      expect(mobileLayout.windowScrollY).toBe(0);
      await expect(page.locator('header .mobile-header-left')).toBeVisible();

      await page.locator('.mobile-hamburger-btn').click();
      const drawer = page.locator('.mobile-sidebar-drawer');
      const drawerSidebar = drawer.locator('aside.student-sidebar-container');
      await expect(drawerSidebar).toBeVisible();
      await expect(drawer.getByText('ZhongWenHub')).toHaveCount(1);
      await page.getByRole('button', { name: 'Đóng thanh điều hướng' }).click();
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

