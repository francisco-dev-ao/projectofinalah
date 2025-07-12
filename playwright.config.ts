import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  reporter: [['list'], ['html', { output: 'test-report.html' }]],
  use: {
    browserName: 'chromium',
    headless: true,
  },
});