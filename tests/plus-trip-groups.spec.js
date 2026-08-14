/**
 * tests/plus-trip-groups.spec.js — Plus trip list: past + others collapsed
 */
import { test, expect } from './fixtures.js';

test.describe('Plus trip groups', () => {
  test('past trip is under a collapsed Voyages passés title', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-trip-selector', { timeout: 8000 });

    const pastHead = page.locator('[data-trips-group="past"]');
    await expect(pastHead).toBeVisible();
    await expect(pastHead).toContainText('Voyages passés');
    const pastBody = page.locator('#plus-trips-body-past');
    await expect(pastBody).toBeHidden();
    await expect(pastBody).toContainText('Test Trip 2026');

    await pastHead.click();
    await expect(pastBody).toBeVisible();
    await expect(pastBody).toContainText('Test Trip 2026');

    await pastHead.click();
    await expect(pastBody).toBeHidden();
  });

  test('Laurine: her trip open, USA collapsed as Voyages passés', async ({ page }) => {
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: 'laurine-rol' }),
      }),
    );
    await page.route(/\/api\/trips\/?(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { id: 'test-trip-2026', name: 'Test Trip 2026' },
            { id: 'philippines-2027', name: 'Philippines' },
            { id: 'usa-2026', name: 'Road Trip USA 2026' },
          ],
        }),
      }),
    );
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => {
      Store.setTripData('philippines-2027', {
        trip: {
          id: 'philippines-2027',
          name: 'Philippines',
          emoji: '🇵🇭',
          startDate: '2027-02-25',
          endDate: '2027-03-11',
          travelers: [{ personId: 'laurine', role: 'owner' }, { personId: 'carl' }],
        },
        people: { laurine: { id: 'laurine', name: 'Laurine', login: 'laurine' } },
      });
      Store.registerTrip('philippines-2027');
      Store.setTripData('usa-2026', {
        trip: {
          id: 'usa-2026',
          name: 'Road Trip USA 2026',
          emoji: '🇺🇸',
          startDate: '2026-04-16',
          endDate: '2026-05-06',
          travelers: [
            { personId: 'rene', role: 'owner' },
            { personId: 'laurine', leaveDate: '2026-04-27' },
          ],
          users: {
            rjullien: { defaultConf: 'rene' },
            'laurine-rol': { defaultConf: 'laurine' },
          },
        },
      });
      Store.registerTrip('usa-2026');
    });

    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-trip-selector', { timeout: 8000 });
    await expect(page.locator('#plus-trip-selector')).toContainText('Philippines');

    const openNames = page.locator('#plus-trip-selector > .trip-item .trip-name');
    await expect(openNames).toContainText(['Philippines']);
    await expect(page.locator('#plus-trip-selector > .trip-item')).not.toContainText('Road Trip USA 2026');

    const pastHead = page.locator('[data-trips-group="past"]');
    await expect(pastHead).toBeVisible();
    await expect(pastHead).toContainText('Voyages passés');
    const pastBody = page.locator('#plus-trips-body-past');
    await expect(pastBody).toBeHidden();
    await expect(pastBody).toContainText('Road Trip USA 2026');

    await pastHead.click();
    await expect(pastBody).toBeVisible();
    await expect(pastBody).toContainText('Road Trip USA 2026');
  });

  test('Nicole: Québec stays in Voyage actif', async ({ page }) => {
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: 'Nicole' }),
      }),
    );
    await page.route(/\/api\/trips\/?(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { id: 'test-trip-2026', name: 'Test Trip 2026' },
            {
              id: 'quebec-2026',
              name: 'Boucle Québec 2026',
              start_date: '2026-08-14',
              end_date: '2026-09-01',
              data: {
                travelers: [
                  { personId: 'rene', role: 'owner' },
                  { personId: 'nicole' },
                  { personId: 'baptiste' },
                ],
                users: {
                  rjullien: { defaultConf: 'rene' },
                  Nicole: { city: 'Nice' },
                  BaptTF: { city: 'Montréal' },
                },
              },
            },
            {
              id: 'philippines-2027',
              name: 'Philippines',
              start_date: '2027-02-25',
              end_date: '2027-03-11',
              data: { travelers: [{ personId: 'laurine', role: 'owner' }] },
            },
          ],
        }),
      }),
    );
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-trip-selector', { timeout: 8000 });

    const openNames = page.locator('#plus-trip-selector > .trip-item .trip-name');
    await expect(openNames).toContainText(['Boucle Québec 2026']);
    await expect(page.locator('#plus-trip-selector > .trip-item')).not.toContainText('Philippines');

    const othersBody = page.locator('#plus-trips-body-others');
    await expect(page.locator('[data-trips-group="others"]')).toContainText('Autres voyages');
    await expect(othersBody).toContainText('Philippines');
    await expect(othersBody).not.toContainText('Boucle Québec 2026');
  });

  test('GET /trips list payload is enough to bucket (no local seed)', async ({ page }) => {
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: 'rjullien' }),
      }),
    );
    await page.route(/\/api\/trips\/?(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'quebec-2026',
            name: 'Québec 2026',
            start_date: '2026-08-14',
            end_date: '2026-09-01',
            data: {
              travelers: [{ personId: 'rene', role: 'owner' }],
              users: { rjullien: { defaultConf: 'rene' } },
            },
          },
          {
            id: 'usa-2026',
            name: 'Road Trip USA 2026',
            start_date: '2026-04-16',
            end_date: '2026-05-06',
            data: {
              travelers: [{ personId: 'rene', role: 'owner' }],
              users: { rjullien: { defaultConf: 'rene' } },
            },
          },
          {
            id: 'philippines-2027',
            name: 'Philippines',
            start_date: '2027-02-25',
            end_date: '2027-03-11',
            data: {
              travelers: [{ personId: 'laurine', role: 'owner' }],
            },
          },
        ]),
      }),
    );

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-trip-selector', { timeout: 8000 });

    const openNames = page.locator('#plus-trip-selector > .trip-item .trip-name');
    await expect(openNames).toContainText(['Québec 2026']);
    await expect(page.locator('#plus-trip-selector > .trip-item')).not.toContainText('Road Trip USA 2026');
    await expect(page.locator('#plus-trip-selector > .trip-item')).not.toContainText('Philippines');

    const pastBody = page.locator('#plus-trips-body-past');
    await expect(page.locator('[data-trips-group="past"]')).toContainText('Voyages passés');
    await expect(pastBody).toBeHidden();
    await expect(pastBody).toContainText('Road Trip USA 2026');

    const othersBody = page.locator('#plus-trips-body-others');
    await expect(page.locator('[data-trips-group="others"]')).toContainText('Autres voyages');
    await expect(othersBody).toBeHidden();
    await expect(othersBody).toContainText('Philippines');
  });
});
