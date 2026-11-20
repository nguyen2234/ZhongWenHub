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
  const token = body.token || body.accessToken;
  expect(token).toBeTruthy();
  return token;
}

test.describe('Phase E: Exam Repository (Kho đề thi) End-to-End Verification', () => {
  test.beforeEach(async ({ request }) => {
    await verifyEphemeralDatabaseOrThrow(request);
  });

  test('1. Content Manager creates exam, links/reorders Question Bank items, previews, updates, submits review; Admin publishes & protects attempts/published deletion', async ({
    page,
    request,
  }) => {
    const examCode = `HSK1-E2E-${Date.now().toString().slice(-5)}`;
    const initialTitle = 'Đề thi thử HSK 1 E2E Ephemeral';
    const updatedTitle = 'Đề thi thử HSK 1 E2E Đã Cập Nhật';

    // 1. Login as Content Manager via real UI
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.contentManager.email);
    await page.fill('#login-password', testCredentials.contentManager.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/management.*/, { timeout: 15000 });

    // 2. Navigate to Kho đề thi in Content Manager
    await page.goto('/ZhongWenHub/management/content-manager/exams');
    await expect(page.getByRole('heading', { name: 'Kho đề thi' })).toBeVisible({ timeout: 12000 });

    // 3. Create Exam via Modal
    await page.getByRole('button', { name: 'Tạo đề thi' }).click();
    const formDrawer = page.locator('.lcm-drawer-content');
    await expect(formDrawer).toBeVisible();

    await formDrawer.locator('input[placeholder*="HSK1-MOCK-01"]').fill(examCode);
    await formDrawer.locator('input[placeholder*="Đề thi thử HSK 1"]').fill(initialTitle);
    await formDrawer.locator('textarea[placeholder*="Mô tả phạm vi"]').fill('Mô tả kiểm thử E2E trên DB tạm');
    await formDrawer.locator('textarea[placeholder*="Quy định thời gian"]').fill('Đọc kỹ câu hỏi trước khi chọn đáp án.');
    await formDrawer.getByRole('button', { name: 'Tạo đề thi (Bản nháp)' }).click();

    const row = page.locator('tr', { hasText: examCode });
    await expect(row).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Reload to prove SQL Server persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(row).toBeVisible({ timeout: 10000 });

    // 4. Open Question Bank Linking Modal for this Exam
    await row.getByRole('button', { name: /Câu hỏi/ }).click();

    const qModal = page.locator('.lcm-drawer-content');
    await expect(qModal).toContainText(`Cấu trúc câu hỏi đề thi: ${examCode}`);

    // Wait for Question Bank items and add 2 exercises
    const addButtons = qModal.getByRole('button', { name: 'Thêm' });
    await expect(addButtons.first()).toBeVisible({ timeout: 10000 });
    await addButtons.first().click();
    await addButtons.first().click();

    await expect(qModal).toContainText('Đã chọn 2 câu');

    // Reorder second question UP (title="Di chuyển lên")
    const moveUpButtons = qModal.locator('button[title="Di chuyển lên"]');
    await expect(moveUpButtons).toHaveCount(2);
    const secondTitleBefore = await qModal.locator('text=/Câu #2 ·/').textContent();
    await moveUpButtons.nth(1).click();
    const firstTitleAfter = await qModal.locator('text=/Câu #1 ·/').textContent();
    expect(firstTitleAfter?.replace('Câu #1 ·', '')).toBe(secondTitleBefore?.replace('Câu #2 ·', ''));

    // Save linked questions
    await qModal.getByRole('button', { name: 'Lưu bộ câu hỏi' }).click();
    await expect(row).toContainText('Câu hỏi (2)', { timeout: 10000 });

    // 5. Preview Exam
    await row.locator('button[title="Xem trước đề thi"]').click();
    const previewModal = page.locator('.lcm-drawer-content');
    await expect(previewModal).toContainText(`Xem trước đề thi: ${examCode}`);
    await expect(previewModal).toContainText('2 câu hỏi');
    await previewModal.locator('.lcm-drawer-header button').click();

    // 6. Edit Exam metadata & persist
    await row.locator('button[title="Sửa thông tin đề thi"]').click();
    const editDrawer = page.locator('.lcm-drawer-content');
    await editDrawer.locator('input[placeholder*="Đề thi thử HSK 1"]').fill(updatedTitle);
    await editDrawer.getByRole('button', { name: 'Cập nhật đề thi' }).click();
    await expect(row).toContainText(updatedTitle, { timeout: 10000 });

    // 7. Submit for review (DRAFT -> PENDING_REVIEW -> 'Chờ duyệt')
    await row.locator('button[title="Gửi kiểm duyệt"]').click();
    await expect(row).toContainText('Chờ duyệt', { timeout: 10000 });

    // Lookup exam ID via API
    const cmToken = await loginApi(
      request,
      testCredentials.contentManager.email,
      testCredentials.contentManager.password()
    );
    const listRes = await request.get(`/api/v1/exams?search=${encodeURIComponent(examCode)}`, {
      headers: { Authorization: `Bearer ${cmToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const listBody = await listRes.json();
    const examId = listBody.items[0].id as string;

    // 8. Negative SoD check: Content Manager (same actor) cannot self-publish
    const selfPublishRes = await request.post(`/api/v1/exams/${examId}/review`, {
      headers: { Authorization: `Bearer ${cmToken}` },
      data: { status: 'PUBLISHED', reviewNotes: 'Self-approve test' },
    });
    expect(selfPublishRes.status()).toBe(400);

    // 9. Second person (Admin) logs in via UI and publishes Exam
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.admin.email);
    await page.fill('#login-password', testCredentials.admin.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/management.*/, { timeout: 15000 });

    await page.goto('/ZhongWenHub/management/content-manager/exams');
    const adminRow = page.locator('tr', { hasText: examCode });
    await expect(adminRow).toBeVisible({ timeout: 10000 });
    await adminRow.locator('button[title="Xuất bản đề thi"]').click();
    await expect(adminRow).toContainText('Đã xuất bản', { timeout: 10000 });

    // 10. Negative test: PUBLISHED exam cannot be deleted (both UI & API)
    await adminRow.locator('button[title="Xóa đề thi nháp"]').click();
    await page.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(page.locator('.lcm-page')).toContainText(/lưu trữ|PUBLISHED/i, { timeout: 10000 });

    const adminToken = await loginApi(request, testCredentials.admin.email, testCredentials.admin.password());
    const delPublishedRes = await request.delete(`/api/v1/exams/${examId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delPublishedRes.status()).toBe(400);

    // 11. Archive PUBLISHED exam cleanly via UI
    await adminRow.locator('button[title*="Lưu trữ"]').click();
    await expect(adminRow).toContainText('Lưu trữ', { timeout: 10000 });

    // 12. Create a clean draft exam and delete it cleanly via UI ConfirmDialog
    const draftCode = `HSK1-DEL-${Date.now().toString().slice(-4)}`;
    await page.getByRole('button', { name: 'Tạo đề thi' }).click();
    const draftDrawer = page.locator('.lcm-drawer-content');
    await draftDrawer.locator('input[placeholder*="HSK1-MOCK-01"]').fill(draftCode);
    await draftDrawer.locator('input[placeholder*="Đề thi thử HSK 1"]').fill('Đề nháp xóa E2E');
    await draftDrawer.getByRole('button', { name: 'Tạo đề thi (Bản nháp)' }).click();
    const draftRow = page.locator('tr', { hasText: draftCode });
    await expect(draftRow).toBeVisible({ timeout: 10000 });

    await draftRow.locator('button[title="Xóa đề thi nháp"]').click();
    await page.getByRole('button', { name: 'Xác nhận' }).click();
    await expect(page.locator('tr', { hasText: draftCode })).toHaveCount(0, { timeout: 10000 });
  });
});

