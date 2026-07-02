// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.{js,ts}',
  testIgnore: ['**/e2e-prod*'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 15_000,

  use: {
    // Tests run against a local static server (no backend needed for seed tests)
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Serve frontend statically for tests
  webServer: {
    command: 'npx http-server -p 4173 -s',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
