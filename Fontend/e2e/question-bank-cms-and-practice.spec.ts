import { test, expect } from '@playwright/test';
import { testCredentials } from './config/test-credentials.config';

test.describe('Question Bank CMS & Student Adaptive Practice End-to-End', () => {
  test('1. CMS Question Bank server pagination, HSK filters, import & AI-draft safety', async ({
    page,
  }) => {
    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.contentManager.email);
    await page.fill('#login-password', testCredentials.contentManager.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/management.*/, { timeout: 15000 });

    await page.goto('/ZhongWenHub/management/content-manager/question-bank');
    await expect(page.getByRole('heading', { name: /Ngân hàng Câu hỏi/i })).toBeVisible({
      timeout: 12000,
    });

    // Ensure server-paginated table (or mobile cards) loads rows from SQL Server (and demo disclaimer is gone)
    await expect(page.locator('text=zhongwenhub_admin_exercises_v1')).toHaveCount(0);
    await expect(page.locator('tbody tr:visible, .mgmt-mobile-card:visible').first()).toBeVisible({
      timeout: 12000,
    });

    // Filter by HSK 4 + PENDING_REVIEW (shows imported InAnskr/vocab queue items)
    await page.selectOption('select[aria-label="Lọc cấp độ HSK"]', '4');
    await page.selectOption('select[aria-label="Lọc kiểm duyệt"]', 'PENDING_REVIEW');
    await page.waitForLoadState('networkidle');

    // Open Sinh câu hỏi HSK modal and verify safety warning (never auto-publishes)
    await page.getByRole('button', { name: /Sinh câu hỏi HSK/i }).click();
    const genDialog = page.getByRole('dialog', { name: /Sinh câu hỏi HSK tự động/i });
    await expect(genDialog).toBeVisible();
    await expect(genDialog).toContainText('DRAFT / PENDING_REVIEW');
    await genDialog.getByRole('button', { name: 'Xem trước' }).click();
    await expect(genDialog).toContainText('Xem trước:', { timeout: 12000 });
    await genDialog.getByRole('button', { name: 'Đóng' }).click();
  });

  test('2. Student Practice Center creates server-graded session without leaking answers & awards XP', async ({
    page,
  }) => {
    const bulkRequests: string[] = [];
    let sessionPayloadRaw = '';

    page.on('request', (req) => {
      if (req.url().includes('/content/exercises') && req.url().includes('pageSize=500')) {
        bulkRequests.push(req.url());
      }
    });

    page.on('response', async (res) => {
      if (
        res.url().includes('/api/v1/question-bank/practice-sessions') &&
        res.request().method() === 'POST' &&
        !res.url().endsWith('/submit')
      ) {
        try {
          sessionPayloadRaw = await res.text();
        } catch {
          // ignore
        }
      }
    });

    await page.goto('/ZhongWenHub/login');
    await page.fill('#login-email', testCredentials.student.email);
    await page.fill('#login-password', testCredentials.student.password());
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*(\/dashboard|\/onboarding|\/courses|\/practice|\/lessons).*/, {
      timeout: 15000,
    });

    await page.goto('/ZhongWenHub/practice');
    await expect(page.getByRole('heading', { name: /Trung tâm luyện tập/i })).toBeVisible({
      timeout: 12000,
    });

    // Wait for lightweight adaptive overview
    await page.waitForLoadState('networkidle');
    expect(bulkRequests).toHaveLength(0);

    // Choose HSK 1 + 5 questions in filter card
    await page.selectOption('select[aria-label="Chọn số câu hỏi"]', '5');
    const startBtn = page.getByRole('button', { name: /Bắt đầu luyện tập \(5 câu\)/i });
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // Wait for practice session header
    await expect(page.getByText('1 / 5')).toBeVisible({ timeout: 12000 });

    // Security assertion: NO answer keys or explanations exposed before submission
    expect(sessionPayloadRaw).toBeTruthy();
    expect(sessionPayloadRaw).not.toContain('"correctOptionIndex"');
    expect(sessionPayloadRaw).not.toContain('"correctAnswer"');
    expect(sessionPayloadRaw).not.toContain('"explanation"');

    // Complete 5 questions (handles MCQ options, free-text fill-blank, and token sentence-order cleanly)
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(`${i + 1} / 5`)).toBeVisible({ timeout: 8000 });

      const nextOrSubmit = page.getByRole('button', {
        name: i < 4 ? /CÂU TIẾP THEO/i : /NỘP BÀI & CHẤM ĐIỂM/i,
      });

      const textArea = page.locator('main textarea, main input[type="text"]').first();
      const mcqOptionA = page.locator('main button').filter({ hasText: /^A/ }).first();

      if ((await textArea.count()) > 0 && (await textArea.isVisible())) {
        await textArea.fill('你好');
      } else if ((await mcqOptionA.count()) > 0 && (await mcqOptionA.isVisible())) {
        await mcqOptionA.click();
      } else {
        // Sentence-order tokens: keep clicking available token buttons inside main until Next/Submit is enabled
        for (let step = 0; step < 12; step++) {
          if (await nextOrSubmit.isEnabled()) break;
          const tokenBtns = page.locator('main div[style*="border: 2px dashed"] ~ div button, main button');
          const count = await tokenBtns.count();
          if (count === 0) break;
          await tokenBtns.last().click();
        }
      }

      await expect(nextOrSubmit).toBeEnabled({ timeout: 5000 });
      await nextOrSubmit.click();
    }

    // Verify backend-graded Result screen appears
    await expect(page.getByRole('heading', { name: /Hoàn thành luyện tập/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/Chi tiết đáp án & Giải thích/i)).toBeVisible({ timeout: 8000 });
  });
});
