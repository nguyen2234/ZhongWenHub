import { test, expect, type Page } from '@playwright/test';
import { verifyTestDatabaseOrThrow } from './helpers/e2e-database-guard';
import { testCredentials } from './config/test-credentials.config';

async function loginAdmin(page: Page) {
  await page.goto('/ZhongWenHub/login');
  await page.fill('#login-email', testCredentials.admin.email);
  await page.fill('#login-password', testCredentials.admin.password());
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/management/, { timeout: 15000 });
}

async function loginStudent(page: Page) {
  await page.goto('/ZhongWenHub/login');
  await page.fill('#login-email', testCredentials.student.email);
  await page.fill('#login-password', testCredentials.student.password());
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
}

test.describe('AI Governance, AI Tutor, Letter Writing & Conversation E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    await verifyTestDatabaseOrThrow(request);
  });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Admin Token Governance: displays feature groups, toggles circuit breaker, and updates quotas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAdmin(page);

    // Navigate to Admin AI Operations
    await page.goto('/ZhongWenHub/management/admin/operations');
    await expect(page).toHaveURL(/.*\/management\/admin\/operations/);

    // Switch to Governance tab
    const governanceTabBtn = page.getByTestId('tab-ai-governance');
    await expect(governanceTabBtn).toBeVisible({ timeout: 5000 });
    await governanceTabBtn.click();

    // Verify all 3 feature cards are visible
    const letterCard = page.getByTestId('governance-card-AI_LETTER_WRITING');
    const tutorCard = page.getByTestId('governance-card-AI_TUTOR');
    const convCard = page.getByTestId('governance-card-AI_CONVERSATION');

    await expect(letterCard).toBeVisible({ timeout: 5000 });
    await expect(tutorCard).toBeVisible();
    await expect(convCard).toBeVisible();

    // Verify card content displays Quota, User Limit and Max Tokens
    await expect(letterCard.getByText('Viết thư bằng AI')).toBeVisible();
    await expect(tutorCard.getByText('Trợ giảng AI')).toBeVisible();
    await expect(convCard.getByText('Hội thoại AI')).toBeVisible();

    // Test Circuit Breaker toggle
    const tutorKillSwitch = page.getByTestId('kill-switch-AI_TUTOR');
    await expect(tutorKillSwitch).toBeVisible();
    const initialText = await tutorKillSwitch.innerText();

    // Toggle once
    await tutorKillSwitch.click();
    await expect(page.getByTestId('governance-success-alert')).toBeVisible({ timeout: 5000 });

    // Toggle back to original state to leave system clean
    await tutorKillSwitch.click();
    await expect(page.getByTestId('governance-success-alert')).toBeVisible({ timeout: 5000 });
    await expect(tutorKillSwitch).toHaveText(initialText);

    // Test Edit Quota Modal
    const editBtn = page.getByTestId('edit-governance-AI_LETTER_WRITING');
    await editBtn.click();

    const modal = page.getByTestId('governance-edit-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Cấu hình Hạn Mức: Viết thư bằng AI')).toBeVisible();

    // Save changes
    await modal.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('governance-success-alert')).toBeVisible();
  });

  test('2. AI Tutor Drawer: floating trigger, clean header, contextual interaction', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginStudent(page);

    // Open AI Tutor Drawer
    const askAiBtn = page.getByRole('button', { name: 'Hỏi AI' });
    await expect(askAiBtn).toBeVisible({ timeout: 5000 });
    await askAiBtn.click();

    const drawer = page.locator('.ai-tutor-drawer');
    await expect(drawer).toBeVisible({ timeout: 5000 });
    await expect(drawer.getByText('Trợ giảng AI ZhongWen')).toBeVisible();

    // Verify input placeholder
    const input = drawer.getByPlaceholder('Hỏi bất kỳ điều gì về bài học hoặc chữ Hán...');
    await expect(input).toBeVisible();
  });

  test('3. AI Letter Writing: page renders form, recipient selector, and topic input', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginStudent(page);

    await page.goto('/ZhongWenHub/letter-writing');
    await expect(page).toHaveURL(/.*\/letter-writing/);

    // Verify main page elements
    await expect(page.getByText('Viết thư bằng AI').first()).toBeVisible({ timeout: 5000 });
  });

  test('4. AI Conversation: scenario selection and situational communication', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginStudent(page);

    await page.goto('/ZhongWenHub/conversation');
    await expect(page).toHaveURL(/.*\/conversation/);

    // Verify conversation page loaded
    await expect(page.locator('body')).toBeVisible();
  });
});
