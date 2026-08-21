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
      seed.trip.startDate = '2026-08-20';
      seed.trip.endDate = '2026-09-10';
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
    const festivals = page.locator('#discovery-themes label', { hasText: 'Festivals' });
    await expect(festivals).not.toHaveClass(/is-soon/);
    await expect(festivals.locator('input')).toBeEnabled();
    await expect(festivals.locator('input')).not.toBeChecked();
    await expect(page.locator('#discovery-themes input[value="outlets"]')).toBeChecked();
    await expect(page.locator('#discovery-themes input[value="rando"]')).toBeChecked();

    await page.locator('#discovery-search').click();
    await expect(page.locator('#discovery-results')).toContainText('Village de marques');
    await expect(page.locator('#discovery-results')).toContainText('1,2 km');
  });

  test('festivals search lists date, note and Lien without 0 km', async ({ page }) => {
    await page.route(`**/api/trips/${TRIP_ID}/seed`, (route) => {
      const seed = JSON.parse(JSON.stringify(SEED));
      seed.trip.startDate = '2026-08-20';
      seed.trip.endDate = '2026-09-10';
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
      route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ jobId: 'job-fest-1' }) }),
    );
    await page.route('**/api/leo/jobs/job-fest-1/stream**', (route) => {
      const item = {
        id: 'editorial:festivals:festifoule',
        name: 'Festifoule',
        when: '2026-08-21',
        note: 'Tadoussac',
        url: 'https://festifoule.ca',
        source: 'editorial',
        distKm: 0,
      };
      const body = [
        'event: theme',
        `data: ${JSON.stringify({ text: 'Festivals', tool: { themeId: 'festivals', label: 'Festivals', count: 1, items: [item] } })}`,
        '',
        'event: result',
        `data: ${JSON.stringify({ reply: JSON.stringify({ items: [item] }) })}`,
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
    await page.locator('#discovery-toggle').click();
    await page.locator('#discovery-themes input[value="outlets"]').uncheck();
    await page.locator('#discovery-themes input[value="rando"]').uncheck();
    await page.locator('#discovery-themes input[value="festivals"]').check();
    await page.locator('#discovery-search').click();
    const results = page.locator('#discovery-results');
    await expect(results).toContainText('Festifoule');
    await expect(results).toContainText('2026-08-21');
    await expect(results).toContainText('Tadoussac');
    await expect(results).toContainText('Lien');
    await expect(results).not.toContainText('0 km');
  });

  test('« Retenir » sur un 200 peint « Retenu ✓ »', async ({ page }) => {
    await page.route(`**/api/trips/${TRIP_ID}/seed`, (route) => {
      const seed = JSON.parse(JSON.stringify(SEED));
      seed.trip.startDate = '2026-08-20';
      seed.trip.endDate = '2026-09-10';
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
      route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ jobId: 'job-retain-1' }) }),
    );
    await page.route('**/api/leo/jobs/job-retain-1/stream**', (route) => {
      const item = { id: 'osm:9', name: 'Village de marques', distKm: 1.2, url: 'https://maps.google.com' };
      const body = [
        'event: theme',
        `data: ${JSON.stringify({ text: 'Outlets', tool: { themeId: 'outlets', label: 'Outlets', count: 1, items: [item] } })}`,
        '',
        'event: result',
        `data: ${JSON.stringify({ reply: JSON.stringify({ items: [item] }) })}`,
        '',
        'event: done',
        'data: {}',
        '',
      ].join('\n');
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    await page.route(`**/api/trips/${TRIP_ID}/discovery/retain`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activity: {
            id: 'osm:9',
            name: 'Village de marques',
            theme: 'outlets',
            bookingStatus: 'candidate',
          },
        }),
      }),
    );

    await page.goto('/');
    await page.waitForSelector('#programme-content .day-nav', { timeout: 8000 });
    await page.locator('#discovery-toggle').click();
    await page.locator('#discovery-search').click();
    await expect(page.locator('#discovery-results')).toContainText('Village de marques');

    const retain = page.locator('.discovery-retain-btn').first();
    await expect(retain).toHaveText('Retenir');
    await expect(retain).not.toHaveClass(/deferred/);
    await retain.click();
    await expect(retain).toHaveText('Retenu ✓');
    await expect(retain).toBeDisabled();
  });

  test('travel day : Sur le trajet cherche le corridor et affiche le détour estimé', async ({ page }) => {
    const themes = {
      themes: [
        { id: 'outlets', label: 'Outlets & bons plans', emoji: '🏷️', engine: 'geo', corridor: true },
        { id: 'festivals', label: 'Festivals & saisonnier', emoji: '🎪', engine: 'editorial', corridor: false },
      ],
    };
    let searchBody = null;
    await page.route(`**/api/trips/${TRIP_ID}/seed`, (route) => {
      const seed = JSON.parse(JSON.stringify(SEED));
      seed.trip.startDate = '2026-08-20';
      seed.trip.endDate = '2026-09-10';
      seed.locations.home = { lat: 48.9, lon: 2.25, name: 'Home' };
      seed.days[3].locationId = 'home';
      seed.days[3].to = 'Home';
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
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(themes) }),
    );
    await page.route(`**/api/trips/${TRIP_ID}/discovery/results**`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) }),
    );
    await page.route(`**/api/trips/${TRIP_ID}/discovery/search`, async (route) => {
      searchBody = route.request().postDataJSON();
      return route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ jobId: 'job-corridor-1' }) });
    });
    await page.route('**/api/leo/jobs/job-corridor-1/stream**', (route) => {
      const body = [
        'event: result',
        'data: {"reply":"{\\"items\\":[{\\"id\\":\\"osm:1\\",\\"name\\":\\"Village de marques\\",\\"detourKm\\":18,\\"detourEstimated\\":true,\\"url\\":\\"https://maps.google.com\\"}]}"}',
        '',
        'event: done',
        'data: {}',
        '',
      ].join('\n');
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });

    await page.goto('/');
    await page.waitForSelector('#programme-content .day-nav', { timeout: 8000 });
    await page.locator('#discovery-toggle').click();
    await expect(page.locator('.discovery-mode[data-mode="corridor"]')).toBeVisible();
    await page.locator('.discovery-mode[data-mode="corridor"]').click();
    await expect(page.locator('#discovery-toggle')).toContainText('Sur le trajet');
    await expect(page.locator('#discovery-themes input[value="festivals"]')).toHaveCount(0);
    await page.locator('#discovery-search').click();
    await expect(page.locator('#discovery-results')).toContainText('Village de marques');
    await expect(page.locator('#discovery-results')).toContainText('détour (estimé)');
    expect(searchBody).toBeTruthy();
    expect(searchBody.scope.corridor).toEqual(['city-center', 'home']);
  });
});
