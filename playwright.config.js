// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.{js,ts}',
  // js/dist/*.js est généré : on le régénère avant chaque exécution, y compris
  // quand un serveur écoute déjà sur 4173 et que la commande webServer (qui
  // contient aussi le build) est sautée par reuseExistingServer.
  globalSetup: './scripts/playwright-global-setup.mjs',
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
    // js/dist/*.js is generated and gitignored: the static server serves the repo
    // root as-is, so the bundles must exist on disk before the suite runs.
    command: 'npm run build && npx http-server -p 4173 -s',
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
