/**
 * tests/discovery-panel.spec.js — Jour « Autour de … » (collapsed, scoped to the day).
 */
import { test, expect, SEED } from './fixtures.js';

const TRIP_ID = SEED.trip.id;

const THEMES = {
  themes: [
    { id: 'outlets', label: 'Outlets & bons plans', emoji: '🏷️', engine: 'geo' },
    { id: 'rando', label: 'Rando, nature & montagne', emoji: '🥾', engine: 'geo' },
    { id: 'festivals', label: 'Festivals & saisonnier', emoji: '🎪', engine: 'editorial' },
  ],
};

test.describe('Discovery panel', () => {
  test('hidden when the trip is over', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#programme-content .day-nav', { timeout: 8000 });
    await expect(page.locator('#discovery-wrap')).toHaveCount(0);
  });

  test('collapsed on a live day, expands to themes, search lists results', async ({ page }) => {
    await page.route(`**/api/trips/${TRIP_ID}/seed`, (route) => {
      const seed = JSON.parse(JSON.stringify(SEED));
      seed.trip.startDate = '2026-08-10';
      seed.trip.endDate = '2026-08-20';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trip: {
            id: TRIP_ID,
            name: seed.trip.name,
            emoji: seed.trip.emoji,
            start_date: seed.trip.startDate,
            end_date: seed.trip.endDate,
            data: {
              travelers: seed.trip.travelers,
              locations: seed.locations,
              hotels: seed.hotels,
              homeTz: 'Europe/Paris',
            },
          },
          days: seed.days.map((d) => ({ day_num: d.day, data: d })),
          hotels: [],
          lists: [],
        }),
      });
    });
    await page.route(`**/api/trips/${TRIP_ID}/discovery/themes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(THEMES) }),
    );
    await page.route(`**/api/trips/${TRIP_ID}/discovery/results**`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) }),
    );
    await page.route(`**/api/trips/${TRIP_ID}/discovery/search`, (route) =>
      route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ jobId: 'job-disc-1' }) }),
    );
    await page.route('**/api/leo/jobs/job-disc-1/stream**', (route) => {
      const body = [
        'event: theme',
        'data: {"text":"Outlets","tool":{"themeId":"outlets","label":"Outlets","count":1,"items":[{"id":"osm:1","name":"Village de marques","distKm":1.2,"url":"https://maps.google.com"}]}}',
        '',
        'event: result',
        'data: {"reply":"{\\"items\\":[{\\"id\\":\\"osm:1\\",\\"name\\":\\"Village de marques\\",\\"distKm\\":1.2,\\"url\\":\\"https://maps.google.com\\"}]}"}',
        '',
        'event: done',
        'data: {}',
        '',
      ].join('\n');
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto('/');
    await page.waitForSelector('#programme-content .day-nav', { timeout: 8000 });
    const toggle = page.locator('#discovery-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#discovery-body')).toHaveClass(/hidden/);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#discovery-themes')).toContainText('Outlets');
    await expect(page.locator('#discovery-themes label.is-soon')).toContainText('Festivals');

    await page.locator('#discovery-search').click();
    await expect(page.locator('#discovery-results')).toContainText('Village de marques');
    await expect(page.locator('#discovery-results')).toContainText('1,2 km');
  });
});
