import { test, expect, type APIRequestContext } from '@playwright/test';
import { testCredentials } from './config/test-credentials.config';

async function verifyEphemeralDatabaseOrThrow(request: APIRequestContext) {
  const res = await request.get('/api/v1/system/database-environment');
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  const dbName = String(data.databaseName || '').trim().toLowerCase();
  if (!dbName.startsWith('zhongwenhub_ephemeral_')) {
    throw new Error(
      `[FATAL] Refusing ephemeral E2E run against non-ephemeral DB '${data.databaseName}'.`
    );
  }
  return data;
}

async function loginApi(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post('/api/v1/auth/login', {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return (body.token || body.accessToken) as string;
}

test.describe('Phase D: Curriculum Create Lesson, Live SQL Counts & Readiness 404 Guard E2E', () => {
  test.beforeEach(async ({ request }) => {
    await verifyEphemeralDatabaseOrThrow(request);
  });

  test('Full Create Unit + Add DRAFT Lesson + Reload + Edit + Delete + Live Counts + Readiness 404 + HSK 1-4 Regression', async ({
    page,
    request,
  }) => {
    const cmToken = await loginApi(
      request,
      testCredentials.contentManager.email,
      testCredentials.contentManager.password()
    );
    const studentToken = await loginApi(
      request,
      testCredentials.student.email,
      testCredentials.student.password()
    );

    // 0. Login as Content Manager and open Giáo trình
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.contentManager.email);
    await page.fill('#login-password', testCredentials.contentManager.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/management.*/, { timeout: 15000 });

    await page.goto('/ZhongWenHub/management/content-manager/curriculum');
    await expect(page.getByRole('heading', { name: 'Giáo trình' })).toBeVisible({ timeout: 12000 });

    // Confirm initial live SQL stats on HSK 1 (6 Units, 15 Lessons, 3 PUBLISHED, 12 DRAFT)
    await expect(page.getByTestId('stat-unit-count')).toHaveText('6', { timeout: 10000 });
    await expect(page.getByTestId('stat-total-lessons')).toHaveText('15');
    await expect(page.getByTestId('stat-published-count')).toHaveText('3');
    await expect(page.getByTestId('stat-draft-count')).toHaveText('12');

    // 1. Create Test Unit
    await page.getByRole('button', { name: /Thêm Unit mới/ }).click();
    await page.locator('input[placeholder="e.g. 饮食与餐厅"]').fill('测试单元十六');
    await page.locator('input[placeholder="e.g. Ẩm thực & Nhà hàng"]').fill('E2E Test Unit 16');
    await page.locator('textarea[placeholder="Mô tả nội dung trọng tâm của Unit..."]').fill('Unit phục vụ kiểm thử E2E');

    const unitPostPromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/content/units') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Lưu Unit' }).click();
    const unitPostRes = await unitPostPromise;
    expect(unitPostRes.status()).toBe(201);
    const createdUnit = await unitPostRes.json();
    expect(createdUnit.id).toBeTruthy();

    await expect(page.getByTestId('stat-unit-count')).toHaveText('7', { timeout: 10000 });

    // Backend negative API checks on POST /content/lessons
    const hsk1CourseId = createdUnit.courseId as string;
    const hsk2CourseId = '22222222-2222-2222-2222-222222222222';

    const studentAttempt = await request.post('/api/v1/content/lessons', {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: {
        courseId: hsk1CourseId,
        unitId: createdUnit.id,
        lessonNumber: 16,
        titleZh: 'Forbidden',
        titleVi: 'Forbidden',
        status: 'DRAFT',
      },
    });
    expect(studentAttempt.status()).toBe(403);

    const directPublishAttempt = await request.post('/api/v1/content/lessons', {
      headers: { Authorization: `Bearer ${cmToken}` },
      data: {
        courseId: hsk1CourseId,
        unitId: createdUnit.id,
        lessonNumber: 16,
        titleZh: '测试课',
        titleVi: 'Bài test',
        status: 'PUBLISHED',
        allowExceedStandardLimit: true,
      },
    });
    expect(directPublishAttempt.status()).toBe(400);

    const mismatchedUnitAttempt = await request.post('/api/v1/content/lessons', {
      headers: { Authorization: `Bearer ${cmToken}` },
      data: {
        courseId: hsk2CourseId,
        unitId: createdUnit.id,
        lessonNumber: 16,
        titleZh: '错单元',
        titleVi: 'Sai unit',
        status: 'DRAFT',
        allowExceedStandardLimit: true,
      },
    });
    expect(mismatchedUnitAttempt.status()).toBe(400);

    const unconfirmedLimitAttempt = await request.post('/api/v1/content/lessons', {
      headers: { Authorization: `Bearer ${cmToken}` },
      data: {
        courseId: hsk1CourseId,
        unitId: createdUnit.id,
        lessonNumber: 16,
        titleZh: '超限课',
        titleVi: 'Vượt giới hạn chưa xác nhận',
        status: 'DRAFT',
        allowExceedStandardLimit: false,
      },
    });
    expect(unconfirmedLimitAttempt.status()).toBe(400);

    // 2. Click "+ Thêm bài" on our newly created Test Unit
    const testUnitCard = page.locator('.lcm-unit-card', { hasText: 'E2E Test Unit 16' });
    await expect(testUnitCard).toBeVisible({ timeout: 10000 });
    await testUnitCard.getByRole('button', { name: /Thêm bài/ }).click();

    const drawer = page.locator('.lcm-drawer-content');
    await expect(drawer).toBeVisible({ timeout: 5000 });
    await expect(drawer.getByRole('heading', { name: 'Thêm bài học mới' })).toBeVisible();
    await expect(drawer.getByText(/Mặc định DRAFT/)).toBeVisible();

    // Check editor button is disabled while unsaved fake ID
    await expect(drawer.getByRole('button', { name: /Mở trình soạn bài/ })).toBeDisabled();

    // Validate duplicate lessonNumber (1) in UI
    const lessonNumberInput = drawer.locator('input[type="number"]').first();
    await lessonNumberInput.fill('1');
    await drawer.locator('input[placeholder="Ví dụ: 我想喝茶"]').fill('重复课程');
    await drawer.locator('input[placeholder="Ví dụ: Tôi muốn uống trà"]').fill('Bài trùng số');
    await drawer.getByRole('button', { name: /Tạo bài học \(DRAFT\)/ }).click();
    await expect(drawer.getByRole('alert')).toContainText('Không được tạo bài trùng số');

    // Validate HSK 2.0 15/15 cap confirmation warning when entering 16 without checking box
    await lessonNumberInput.fill('16');
    await drawer.getByRole('button', { name: /Tạo bài học \(DRAFT\)/ }).click();
    await expect(drawer.getByRole('alert')).toContainText('15/15');

    // 3. Enter valid fields, tick confirmation checkbox, and save -> POST 201
    await drawer.locator('input[type="checkbox"]').check();
    await drawer.locator('input[placeholder="Ví dụ: Wǒ xiǎng hē chá"]').fill('Cèshì shíliù kè');
    await drawer.locator('input[placeholder="Ví dụ: 我想喝茶"]').fill('测试十六课');
    await drawer.locator('input[placeholder="Ví dụ: Tôi muốn uống trà"]').fill('Bài kiểm thử số 16');
    await drawer.locator('input[type="number"]').nth(1).fill('25'); // durationMinutes
    await drawer.locator('input[type="number"]').nth(2).fill('75'); // xpReward
    await drawer.locator('textarea').fill('Tóm tắt kiểm thử tạo bài học DRAFT');

    const lessonPostPromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/content/lessons') && res.request().method() === 'POST'
    );
    await drawer.getByRole('button', { name: /Tạo bài học \(DRAFT\)/ }).click();
    const lessonPostRes = await lessonPostPromise;
    expect(lessonPostRes.status()).toBe(201);
    const createdLesson = await lessonPostRes.json();

    // 5-8. Assert real SQL Guid ID (never les-new-*), status DRAFT, and editor button enabled
    expect(createdLesson.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(createdLesson.status).toBe('DRAFT');
    expect(createdLesson.pinyin).toBe('Cèshì shíliù kè');
    await expect(drawer.getByRole('button', { name: /Mở trình soạn bài/ })).toBeEnabled({ timeout: 10000 });

    // Close drawer, check incremented live SQL stats
    await drawer.getByRole('button', { name: 'Đóng' }).click();
    await expect(page.getByTestId('stat-total-lessons')).toHaveText('16', { timeout: 10000 });
    await expect(page.getByTestId('stat-draft-count')).toHaveText('13');
    await expect(page.getByTestId('stat-published-count')).toHaveText('3');

    // 6-8. Reload page and verify persisted in SQL Server with DRAFT badge
    await page.reload();
    await expect(page.getByTestId('stat-total-lessons')).toHaveText('16', { timeout: 12000 });
    const reloadedLessonRow = page.locator('.lcm-lesson-item', { hasText: 'Bài kiểm thử số 16' });
    await expect(reloadedLessonRow).toBeVisible({ timeout: 10000 });
    await expect(reloadedLessonRow).toContainText('Bản nháp');

    const apiVerifyRes = await request.get(`/api/v1/content/lessons/${createdLesson.id}`, {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    expect(apiVerifyRes.status()).toBe(200);
    const apiLessonBody = await apiVerifyRes.json();
    expect(apiLessonBody.status).toBe('DRAFT');
    expect(apiLessonBody.titleZh).toBe('测试十六课');

    // 9. Edit lesson metadata and verify persistence after reload
    await reloadedLessonRow.locator('button[title="Xem và sửa thông tin bài học"]').click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: /Sửa siêu dữ liệu/ }).click();
    await drawer.locator('input[placeholder="Ví dụ: Tôi muốn uống trà"]').fill('Bài kiểm thử số 16 (Đã sửa)');
    await drawer.locator('textarea').fill('Tóm tắt đã cập nhật bền vững');

    const lessonPutPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/v1/content/lessons/${createdLesson.id}`) && res.request().method() === 'PUT'
    );
    await drawer.getByRole('button', { name: /Lưu thay đổi/ }).click();
    const lessonPutRes = await lessonPutPromise;
    expect(lessonPutRes.status()).toBe(200);

    await page.reload();
    await expect(page.locator('.lcm-lesson-item', { hasText: 'Bài kiểm thử số 16 (Đã sửa)' })).toBeVisible({
      timeout: 12000,
    });

    // 10-11. Delete clean test lesson, then delete empty test Unit, verify counts drop back cleanly
    await page.locator('.lcm-lesson-item', { hasText: 'Bài kiểm thử số 16 (Đã sửa)' }).locator('button[title="Xem và sửa thông tin bài học"]').click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: /^Xóa bài$/ }).click();
    const lessonDelPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/v1/content/lessons/${createdLesson.id}`) && res.request().method() === 'DELETE'
    );
    await drawer.getByRole('button', { name: /Xác nhận xóa bài/ }).click();
    const lessonDelRes = await lessonDelPromise;
    expect(lessonDelRes.status()).toBe(204);

    await expect(page.getByTestId('stat-total-lessons')).toHaveText('15', { timeout: 10000 });
    await expect(page.getByTestId('stat-draft-count')).toHaveText('12');

    const emptyTestUnitCard = page.locator('.lcm-unit-card', { hasText: 'E2E Test Unit 16' });
    await emptyTestUnitCard.locator('button[title="Xóa Unit rỗng"]').click();
    const unitDelPromise = page.waitForResponse(
      (res) => res.url().includes(`/api/v1/content/units/${createdUnit.id}`) && res.request().method() === 'DELETE'
    );
    await emptyTestUnitCard.getByRole('button', { name: /Xác nhận xóa Unit/ }).click();
    const unitDelRes = await unitDelPromise;
    expect(unitDelRes.status()).toBe(204);
    await expect(page.getByTestId('stat-unit-count')).toHaveText('6', { timeout: 10000 });

    // 12. Simulate Readiness API returning 404 -> verify no fake "0 bài", exact Vietnamese message & disabled buttons
    await page.route('**/api/v1/content/lessons/readiness*', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not Found' }),
      })
    );
    await page.getByRole('button', { name: /Kiểm duyệt xuất bản HSK 1/ }).click();
    await expect(page.getByTestId('readiness-error-banner')).toHaveText(
      'Không thể tải dữ liệu kiểm duyệt. Vui lòng kiểm tra kết nối Backend.',
      { timeout: 10000 }
    );
    await expect(page.locator('h4', { hasText: 'Kiểm tra sẵn sàng xuất bản — HSK 1' })).not.toContainText('0 bài');
    await expect(page.getByRole('button', { name: /Gửi duyệt bài đủ điều kiện/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Xuất bản bài đã duyệt/ })).toBeDisabled();
    await expect(page.getByTestId('stat-blocked-count')).toHaveText('Lỗi tải');

    // 13. Restore real Readiness API and confirm live counts return cleanly
    await page.unroute('**/api/v1/content/lessons/readiness*');
    await page.getByRole('button', { name: /Kiểm tra lại/ }).click();
    await expect(page.locator('h4', { hasText: 'Kiểm tra sẵn sàng xuất bản — HSK 1 (15 bài)' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: /Gửi duyệt bài đủ điều kiện/ })).toBeEnabled();
    await expect(page.getByRole('button', { name: /Xuất bản bài đã duyệt/ })).toBeEnabled();

    // 14. Regression HSK 1-4: switching pills loads corresponding SQL Units & lesson counts
    await page.getByRole('button', { name: 'HSK 2', exact: true }).click();
    await expect(page.getByTestId('stat-total-lessons')).toHaveText('15', { timeout: 8000 });
    await page.getByRole('button', { name: 'HSK 3', exact: true }).click();
    await expect(page.getByTestId('stat-total-lessons')).toHaveText('20', { timeout: 8000 });
    await page.getByRole('button', { name: 'HSK 4', exact: true }).click();
    await expect(page.getByTestId('stat-total-lessons')).toHaveText('20', { timeout: 8000 });
    await page.getByRole('button', { name: 'HSK 1', exact: true }).click();
    await expect(page.getByTestId('stat-total-lessons')).toHaveText('15', { timeout: 8000 });
    await expect(page.getByTestId('curriculum-live-stats')).toContainText('HSK 1–4 thực tế: 70/70');
  });
});
