import { defineConfig } from '@playwright/test';

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'npm run dev -- -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});

