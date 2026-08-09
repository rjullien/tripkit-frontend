/**
 * tests/route-weather-iso.spec.js — Route outlook uses UTC-safe day dates
 */
import { test, expect } from './fixtures.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '..', 'js', 'components', 'route-view.js'), 'utf8');

test.describe('Route weather ISO dates', () => {
  test('renderWeatherInline prefers _isoDate / DayHelpers.isoDate', () => {
    expect(src).toContain('day._isoDate');
    expect(src).toContain('DayHelpers.isoDate');
    expect(src).not.toMatch(/new Date\(startDate \+ 'T00:00:00'\)/);
  });

  test('route cards get wx from mocked Open-Meteo for in-window days', async ({ page }) => {
    await page.route('**/api.open-meteo.com/**', async (route) => {
      const url = new URL(route.request().url());
      const start = url.searchParams.get('start_date');
      const end = url.searchParams.get('end_date');
      const times = [];
      const tmin = [];
      const tmax = [];
      const rain = [];
      const codes = [];
      const cur = new Date(start + 'T12:00:00Z');
      const last = new Date(end + 'T12:00:00Z');
      while (cur <= last) {
        times.push(cur.toISOString().slice(0, 10));
        tmin.push(12);
        tmax.push(22);
        rain.push(10);
        codes.push(1);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      const one = {
        daily: {
          time: times,
          temperature_2m_min: tmin,
          temperature_2m_max: tmax,
          precipitation_probability_max: rain,
          weathercode: codes,
        },
      };
      // Multi-coord batch → array; single → object. Always array-safe.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([one, one, one, one]),
      });
    });

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.evaluate(() => {
      const tripId = Store.getCurrentTripId();
      const td = Store.getTripData(tripId);
      if (td && td.trip) {
        const soon = new Date();
        soon.setUTCDate(soon.getUTCDate() + 3);
        td.trip.startDate = soon.toISOString().slice(0, 10);
        // Ensure geos for route weather
        td.locations = td.locations || {};
        (td.days || []).forEach((d, i) => {
          d.locationId = d.locationId || 'city';
          td.locations.city = { lat: 45.5, lon: -73.5, tz: 'America/Toronto' };
        });
        Store.setTripData(tripId, td);
      }
    });
    await page.locator('.bottom-nav button[data-tab="route"]').click();
    await page.waitForSelector('.route-card', { timeout: 5000 });
    await page.waitForTimeout(1200);

    const wx = page.locator('.rc-wx').first();
    await expect(wx).toContainText('°');
    await expect(wx).not.toContainText('16j+');
  });
});
