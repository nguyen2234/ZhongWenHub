import { test, expect, type Page } from '@playwright/test';

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/ZhongWenHub/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/auth/login') && res.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function registerStudentViaApi(page: Page, uniqueSuffix: string) {
  const email = `e2e_hsk1_${uniqueSuffix}@zhongwenhub.edu.vn`;
  const password = 'E2eStudent123!';
  const fullName = `Hoc Vien ${uniqueSuffix}`;
  const resp = await page.request.post('/api/v1/auth/register', {
    data: {
      fullName,
      email,
      password,
      confirmPassword: password,
    },
  });
  expect(resp.status()).toBe(201);
  const body = await resp.json();
  const accessToken = body.accessToken || body.data?.accessToken;
  expect(accessToken).toBeTruthy();
  return { email, password, fullName, accessToken };
}

test.describe('ZhongWenHub — HSK 1 15/15, Progress Percentage Sync & Profile Portal Switcher', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Student sees 0% initially, 15/15 HSK 1 lessons, and completes Lesson 4 -> 7% synced across pages & reload', async ({ page }, testInfo) => {
    const unique = `${Date.now()}_${testInfo.project.name.replace(/[^a-z0-9]/gi, '')}`;
    const student = await registerStudentViaApi(page, unique);

    await loginViaUi(page, student.email, student.password);
    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify no sidebar or standalone "Chuyển cổng (x)" widget exists
    await expect(page.locator('text=/Chuyển cổng \\(/')).toHaveCount(0);

    // Verify Dashboard HSK 1 card starts at 0% with zero "Đang học" / "Chưa học" badges
    const hsk1Card = page.getByTestId('dashboard-hsk-card-1');
    await expect(hsk1Card).toBeVisible();
    await expect(page.getByTestId('dashboard-hsk-percent-1')).toHaveText('0%');
    await expect(hsk1Card).toContainText('Hoàn thành: 0% (0/15 bài)');
    await expect(hsk1Card.locator('text=Đang học')).toHaveCount(0);
    await expect(hsk1Card.locator('text=/Chưa học •/')).toHaveCount(0);

    // Open Learning Path HSK 1 and confirm 15 published lessons are available
    await page.goto('/ZhongWenHub/learning-path?mode=hsk&level=1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Tổng bài:\\s*15/')).toBeVisible();
    await expect(page.locator('text=/Đã học:\\s*0/')).toBeVisible();

    // Open previously-unpublished Lesson 4 via slug -> verify real HSK 1 content renders
    await page.goto('/ZhongWenHub/lesson?id=les-hsk1-4');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/giáo viên tiếng Trung/i').first()).toBeVisible();

    // Complete Lesson 4 via real Learning API (testing Backend slug resolution les-hsk1-4)
    const completeResp = await page.request.post('/api/v1/learning/me/lessons/les-hsk1-4/complete', {
      headers: { Authorization: `Bearer ${student.accessToken}` },
      data: { quizScore: 4, totalQuizQuestions: 4, xpEarned: 999 },
    });
    expect(completeResp.status()).toBe(200);
    const completedState = await completeResp.json();
    const hsk1Summary = (completedState.hskProgress || []).find((p: any) => p.hskLevel === 1);
    expect(hsk1Summary).toBeTruthy();
    expect(hsk1Summary.totalLessons).toBe(15);
    expect(hsk1Summary.completedLessons).toBe(1);
    expect(hsk1Summary.percent).toBe(7);

    // Dashboard reflects 7% (1/15 bài) and persists across full page reload
    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('dashboard-hsk-percent-1')).toHaveText('7%');
    await expect(page.getByTestId('dashboard-hsk-card-1')).toContainText('Hoàn thành: 7% (1/15 bài)');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('dashboard-hsk-percent-1')).toHaveText('7%');

    // HskCurriculumView also shows 1 completed and 7% synchronized
    await page.goto('/ZhongWenHub/learning-path?mode=hsk&level=1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Tổng bài:\\s*15/')).toBeVisible();
    await expect(page.locator('text=/Đã học:\\s*1/')).toBeVisible();
    await expect(page.locator('text=7%').first()).toBeVisible();

    // Student cannot see management portals in profile dropdown and is blocked by RBAC guard
    await page.getByTestId('profile-menu-trigger').click();
    const dropdown = page.getByTestId('profile-menu-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown.getByTestId('profile-portal-switcher')).toHaveCount(0);

    await page.goto('/ZhongWenHub/management/admin/dashboard');
    await page.waitForURL((url) => url.pathname.endsWith('/dashboard') && !url.pathname.includes('/management/'), { timeout: 10000 });
  });

  test('2. Content Manager switches portals via top-right Profile Dropdown only, with RBAC enforced', async ({ page }) => {
    await loginViaUi(page, 'contentmanager@zhongwenhub.edu.vn', 'ContentManager123!');

    // Go to Student Dashboard first
    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('networkidle');

    // Confirm zero sidebar portal switcher widget
    await expect(page.locator('text=/Chuyển cổng \\(/')).toHaveCount(0);

    // Open Profile Dropdown -> see permitted portals inside profile menu
    await page.getByTestId('profile-menu-trigger').click();
    const portalSwitcher = page.getByTestId('profile-portal-switcher');
    await expect(portalSwitcher).toBeVisible();
    await expect(portalSwitcher.locator('[data-portal-id="STUDENT"]')).toBeVisible();
    await expect(portalSwitcher.locator('[data-portal-id="CONTENT_MANAGER"]')).toBeVisible();
    await expect(portalSwitcher.locator('[data-portal-id="ADMIN"]')).toHaveCount(0);

    // Switch to Content Manager Portal
    await portalSwitcher.locator('[data-portal-id="CONTENT_MANAGER"]').click();
    await page.waitForURL((url) => url.pathname.includes('/management/content-manager'), { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Open Management Header Profile Dropdown -> switch back to Student Portal seamlessly
    await page.getByTestId('profile-menu-trigger').click();
    const mgmtPortalSwitcher = page.getByTestId('profile-portal-switcher');
    await expect(mgmtPortalSwitcher).toBeVisible();
    await mgmtPortalSwitcher.locator('[data-portal-id="STUDENT"]').click();
    await page.waitForURL((url) => url.pathname.endsWith('/dashboard') && !url.pathname.includes('/management/'), { timeout: 10000 });

    // RBAC blocks CM from accessing Admin portal
    await page.goto('/ZhongWenHub/management/admin/users');
    await page.waitForURL((url) => !url.pathname.includes('/management/admin/users'), { timeout: 10000 });
  });

  test('3. Admin sees all permitted portals inside Profile Dropdown & switches without errors', async ({ page }) => {
    await loginViaUi(page, 'admin@gmail.com', 'admin');
    await page.goto('/ZhongWenHub/dashboard');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('profile-menu-trigger').click();
    const switcher = page.getByTestId('profile-portal-switcher');
    await expect(switcher).toBeVisible();
    await expect(switcher.locator('[data-portal-id="STUDENT"]')).toBeVisible();
    await expect(switcher.locator('[data-portal-id="TEACHER"]')).toBeVisible();
    await expect(switcher.locator('[data-portal-id="CONTENT_MANAGER"]')).toBeVisible();
    await expect(switcher.locator('[data-portal-id="ADMIN"]')).toBeVisible();

    await switcher.locator('[data-portal-id="ADMIN"]').click();
    await page.waitForURL((url) => url.pathname.includes('/management/admin'), { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Chuyển cổng \\(/')).toHaveCount(0);
  });
});

