const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 0,
  reporter: [['html', { outputFolder: 'reports/e2e' }]],
  use: {
    baseURL: process.env.STAGING_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
