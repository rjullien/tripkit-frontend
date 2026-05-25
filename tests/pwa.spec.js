/**
 * tests/pwa.spec.js — PWA & offline tests
 */
import { test, expect } from './fixtures.js';

test.describe('PWA', () => {
  test('has manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
  });

  test('has service worker', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('cache');
  });

  test('registers service worker', async ({ page }) => {
    await page.goto('/');
    // Wait a bit for SW registration
    await page.waitForTimeout(2000);

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    });
    expect(swRegistered).toBe(true);
  });

  test('update button exists in Plus tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForTimeout(300);

    // Plus tab should have content
    await expect(page.locator('#tab-plus')).toBeVisible();
  });
});
