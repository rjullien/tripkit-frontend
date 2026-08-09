/**
 * tests/weather-errors.spec.js — Distinguish too-far vs offline weather messages
 */
import { test, expect } from './fixtures.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const weatherSrc = readFileSync(join(__dirname, '..', 'js', 'components', 'weather.js'), 'utf8');

test.describe('Weather error messages', () => {
  test('source distinguishes too-far from offline', () => {
    expect(weatherSrc).toContain('prévisions 16j max');
    expect(weatherSrc).toContain('isBeyondForecast');
    expect(weatherSrc).toContain('out of allowed range');
    // Catch must not always claim offline
    expect(weatherSrc).toMatch(/errorMessage\(/);
  });

  test('Open-Meteo 400 out-of-range shows 16j message, not hors ligne', async ({ page }) => {
    await page.route('**/api.open-meteo.com/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: true,
          reason: "Parameter 'start_date' is out of allowed range from 2026-05-08 to 2026-08-24",
        }),
      });
    });

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    // Force a near-term day so isBeyondForecast does not short-circuit before fetch
    await page.evaluate(() => {
      const tripId = Store.getCurrentTripId();
      const td = Store.getTripData(tripId);
      if (td && td.trip) {
        const soon = new Date();
        soon.setDate(soon.getDate() + 5);
        td.trip.startDate = soon.toISOString().slice(0, 10);
        Store.setTripData(tripId, td);
      }
      if (App && App.goToDay) App.goToDay(1);
    });
    await page.waitForTimeout(1500);

    const box = page.locator('#weatherBox');
    await expect(box).toBeVisible({ timeout: 5000 });
    await expect(box).toContainText('prévisions 16j max');
    await expect(box).not.toContainText('hors ligne');
  });

  test('day beyond 16j shows 16j message (no hors ligne)', async ({ page }) => {
    let meteoHitsAfter = 0;
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.route('**/api.open-meteo.com/**', async (route) => {
      meteoHitsAfter++;
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.evaluate(() => {
      const tripId = Store.getCurrentTripId();
      const td = Store.getTripData(tripId);
      if (td && td.trip) {
        const far = new Date();
        far.setDate(far.getDate() + 60);
        td.trip.startDate = far.toISOString().slice(0, 10);
        Store.setTripData(tripId, td);
      }
      if (App && App.goToDay) App.goToDay(1);
    });
    await page.waitForTimeout(800);

    const box = page.locator('#weatherBox');
    await expect(box).toContainText('prévisions 16j max');
    await expect(box).not.toContainText('hors ligne');
    // Short-circuit before fetch when date > 16j
    expect(meteoHitsAfter).toBe(0);
  });
});
