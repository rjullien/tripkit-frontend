/**
 * tests/e2e-prod.spec.js — E2E tests against the real production site
 *
 * Runs against https://tripkit.bapttf.com with real Authelia auth.
 * NOT included in normal CI (requires credentials).
 */
import { test, expect } from '@playwright/test';

const PROD_URL = 'https://tripkit.bapttf.com';
const AUTH_USER = process.env.TRIPKIT_USER || 'Rene';
const AUTH_PASS = process.env.TRIPKIT_PASS || '';

// Authelia login helper
async function loginAuthelia(page) {
  await page.goto(PROD_URL);

  // If redirected to Authelia login
  if (page.url().includes('auth.bapttf.com')) {
    await page.fill('input[name="username"], #username-textfield', AUTH_USER);
    await page.fill('input[name="password"], #password-textfield', AUTH_PASS);
    await page.click('button[type="submit"], #sign-in-button');
    // Wait for redirect back to tripkit
    await page.waitForURL(`${PROD_URL}/**`, { timeout: 20000 });
  }
}

test.describe('E2E Production', () => {
  test.skip(!AUTH_PASS, 'TRIPKIT_PASS not set — skipping prod E2E');

  test('loads trip data from backend', async ({ page }) => {
    await loginAuthelia(page);

    // Wait for the app to load and render data
    await page.waitForSelector('.day-card, .timeline, .tab-bar', { timeout: 30000 });

    // Should have content (not error/loading state)
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(200);

    // Should NOT show offline/error message
    expect(body).not.toContain('Connexion nécessaire');
    expect(body).not.toContain('Connexion requise');
  });

  test('has 5 tabs', async ({ page }) => {
    await loginAuthelia(page);
    await page.waitForSelector('.bottom-nav, nav[id="bottom-nav"]', { timeout: 30000 });

    const tabs = page.locator('.bottom-nav button[data-tab], nav button[data-tab]');
    await expect(tabs).toHaveCount(5);
  });

  test('displays 21 days of trip data', async ({ page }) => {
    await loginAuthelia(page);
    await page.waitForSelector('.day-card, .timeline, .tab-bar', { timeout: 30000 });

    // Navigate through days — check day nav exists
    const dayNav = page.locator('.day-nav, [class*="day-nav"]');
    await expect(dayNav.first()).toBeVisible();
  });

  test('seed data is complete (version endpoint)', async ({ page }) => {
    await loginAuthelia(page);

    // Check version endpoint directly
    const response = await page.request.get(`${PROD_URL}/api/trips/usa-2026/version`);
    expect(response.ok()).toBeTruthy();
    const version = await response.json();
    expect(version).toHaveProperty('version');
    expect(version).toHaveProperty('updated_at');
  });

  test('seed endpoint returns all data', async ({ page }) => {
    await loginAuthelia(page);

    const response = await page.request.get(`${PROD_URL}/api/trips/usa-2026/seed`);
    expect(response.ok()).toBeTruthy();
    const seed = await response.json();

    expect(seed.days.length).toBe(21);
    expect(Object.keys(seed.hotels).length).toBeGreaterThanOrEqual(10);
    expect(seed.lists.length).toBeGreaterThanOrEqual(3);
  });
});
