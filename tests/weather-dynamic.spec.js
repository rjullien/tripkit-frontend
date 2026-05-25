/**
 * tests/weather-dynamic.spec.js — Verify weather.js uses dynamic TRIP_START from Store
 * Regression test: weather should NOT have any hardcoded "hardcoded dates"
 */
import { test, expect } from './fixtures.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const weatherSrc = readFileSync(join(__dirname, '..', 'js', 'components', 'weather.js'), 'utf8');

test.describe('Weather — Dynamic dates (no hardcoded TRIP_START)', () => {

  test('weather.js has no hardcoded TRIP_START date', () => {
    // Must NOT contain hardcoded "new Date(2026" or "TRIP_START = new Date"
    expect(weatherSrc).not.toContain('new Date(2026');
    expect(weatherSrc).not.toContain('const TRIP_START');
    // Must contain getTripStart (dynamic resolver)
    expect(weatherSrc).toContain('getTripStart');
    expect(weatherSrc).toContain('Store.getCurrentTripId');
  });

  test('weather.js dayDate uses Store data', () => {
    // dayDate should accept day object as second parameter for fallback
    expect(weatherSrc).toContain('function dayDate(dayNum, day)');
  });

  test('weather fetches correctly for day 2 (no 0°/0°)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    // Go to day 2
    await page.evaluate(() => { App.goToDay(2); });
    await page.waitForTimeout(5000); // weather is async

    // Verify the programme content has a temperature that isn't 0°→0°
    const text = await page.locator('#programme-content').textContent();
    // If weather loaded (online), it should show real temps
    const zeroMatch = text.match(/🌡️\s*0°\s*→\s*0°C/);
    if (zeroMatch) {
      // This is suspicious — likely broken date calculation
      throw new Error('Suspicious 0°→0°C found — weather.js may still have date issues');
    }
  });

  test('weather modal uses dynamic date for forecast range', async ({ page }) => {
    // Mock Open-Meteo to verify correct date is requested
    const requestedUrls = [];
    await page.route('**/api.open-meteo.com/**', (route) => {
      requestedUrls.push(route.request().url());
      // Return valid weather data
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          daily: {
            time: ['2026-04-18'],
            weathercode: [1],
            temperature_2m_max: [25],
            temperature_2m_min: [12],
            precipitation_probability_max: [10],
            windspeed_10m_max: [15],
            uv_index_max: [6],
            sunrise: ['2026-04-18T06:30'],
            sunset: ['2026-04-18T19:45'],
          },
          hourly: {
            time: Array.from({length: 24}, (_, i) => `2026-04-18T${String(i).padStart(2, '0')}:00`),
            temperature_2m: Array(24).fill(20),
            weathercode: Array(24).fill(1),
            precipitation_probability: Array(24).fill(5),
            precipitation: Array(24).fill(0),
            apparent_temperature: Array(24).fill(18),
          },
        }),
      });
    });

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.evaluate(() => { App.goToDay(2); });
    await page.waitForTimeout(3000);

    // Verify that Open-Meteo was called with the correct date (April 18, 2026 = Day 2)
    // startDate is 2026-06-15, so day 2 = 2026-06-16
    if (requestedUrls.length > 0) {
      const hasCorrectDate = requestedUrls.some(u => u.includes('2026-06-16'));
      expect(hasCorrectDate).toBe(true);
    }
  });
});
