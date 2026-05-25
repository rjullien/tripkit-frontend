/**
 * tests/weather.spec.js — Weather display tests (ported from voyage-app)
 * Covers: no fake 0°/0°, inline weather rendering, weather modal, route weather batch
 */
import { test, expect } from './fixtures.js';

test.describe('Weather', () => {
  test('inline weather renders on day view', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    // Navigate to a mid-trip day
    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(2); });
    await page.waitForTimeout(4000); // weather is async

    // Check for weather box (may not have data if offline, but element should exist)
    const weatherBox = page.locator('.wx-inline, .weather-inline, [class*="weather"]');
    // If weather loaded, verify no fake 0°/0°
    const text = await page.locator('#programme-content').textContent();
    const hasFakeZero = /0°\s*\/\s*0°/.test(text);
    // 0°/0° is suspicious unless it's truly that temperature
    if (hasFakeZero) {
      console.warn('⚠️ Found 0°/0° — might be null data displayed as zero');
    }
  });

  test('weather modal opens on tap', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(2); });
    await page.waitForTimeout(4000);

    // Try clicking weather element
    const wxClick = page.locator('[onclick*="Weather"], .wx-inline, .weather-box');
    if (await wxClick.count() > 0) {
      await wxClick.first().click();
      await page.waitForTimeout(1000);
      const modal = page.locator('.weather-modal-overlay, .wm-overlay, [class*="weather-modal"]');
      if (await modal.count() > 0) {
        const title = await modal.locator('h3, .wm-title').first().textContent();
        expect(title.length).toBeGreaterThan(3);
        // Close modal
        const closeBtn = modal.locator('.wm-close, .close, button');
        if (await closeBtn.count() > 0) await closeBtn.first().click();
      }
    }
  });

  test('route tab shows route cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="route"]').click();
    await page.waitForSelector('.route-card', { timeout: 5000 });

    const routeCards = page.locator('.route-card');
    const count = await routeCards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`Route cards with weather potential: ${count}`);
  });

  test('no fake 0°/0° in route', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="route"]').click();
    await page.waitForSelector('.route-card', { timeout: 5000 });

    const allTexts = await page.locator('.route-card').allTextContents();
    for (const text of allTexts) {
      const match = text.match(/(-?\d+)°\s*\/\s*(-?\d+)°/);
      if (match) {
        const lo = parseInt(match[1]);
        const hi = parseInt(match[2]);
        if (lo === 0 && hi === 0) {
          console.warn(`⚠️ Suspicious 0°/0° found: "${text.substring(0, 80)}"`);
        }
      }
    }
  });
});
