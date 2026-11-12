import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local ignored test credentials if present
const envLocalPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

export default defineConfig({
  testDir: './e2e',
  testMatch: [
    '**/exam-repository-e2e.spec.ts',
    '**/hsk1-published-student-and-cms.spec.ts',
    '**/curriculum-create-and-counts.spec.ts',
  ],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5179',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
