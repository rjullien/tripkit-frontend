/**
 * tests/plus-publish-groups.spec.js — GH seeds share Voyage actif's 2 groups
 */
import { test, expect } from './fixtures.js';

const SOURCES = [
  {
    sourceId: 'jullien', repo: 'rjullien/tripkit-seeds', ref: 'main', enabled: true,
    family: 'jullien', tripId: 'quebec-2026', seedPath: 'quebec-2026.js',
    title: 'Québec 2026', operation: 'update', inProd: true,
    ownerLogins: ['rene', 'nicole'], publisherLogins: ['rene', 'nicole'],
  },
  {
    sourceId: 'jullien', repo: 'rjullien/tripkit-seeds', ref: 'main', enabled: true,
    family: 'jullien', tripId: 'usa-2026', seedPath: 'usa-2026.js',
    title: 'Road Trip USA 2026', operation: 'update', inProd: true,
    ownerLogins: ['rene', 'nicole'], publisherLogins: ['rene', 'nicole'],
  },
  {
    sourceId: 'laurine', repo: 'rjullien/tripkit-seeds-laurine', ref: 'main', enabled: true,
    family: 'laurine', tripId: 'philippines-2027', seedPath: 'philippines-2027.js',
    title: 'Philippines', operation: 'update', inProd: true,
    ownerLogins: ['laurine'], publisherLogins: ['laurine'],
  },
];

test.describe('Plus GH seed groups', () => {
  test('seeds sit in the same Voyages passés / Autres voyages groups', async ({ page }) => {
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: 'rjullien' }),
      }),
    );
    await page.route('**/publish/sources', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SOURCES),
      }),
    );
    await page.route(/\/api\/trips\/?(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { id: 'test-trip-2026', name: 'Test Trip 2026' },
            { id: 'quebec-2026', name: 'Québec 2026' },
            { id: 'usa-2026', name: 'Road Trip USA 2026' },
            { id: 'philippines-2027', name: 'Philippines' },
          ],
        }),
      }),
    );

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => {
      Store.setTripData('quebec-2026', {
        trip: {
          id: 'quebec-2026',
          name: 'Québec 2026',
          startDate: '2026-08-14',
          endDate: '2026-09-01',
          travelers: [{ personId: 'rene', role: 'owner' }],
          users: { rjullien: { defaultConf: 'rene' } },
        },
      });
      Store.registerTrip('quebec-2026');
      Store.setTripData('usa-2026', {
        trip: {
          id: 'usa-2026',
          name: 'Road Trip USA 2026',
          startDate: '2026-04-16',
          endDate: '2026-05-06',
          travelers: [{ personId: 'rene', role: 'owner' }],
          users: { rjullien: { defaultConf: 'rene' } },
        },
      });
      Store.registerTrip('usa-2026');
      Store.setTripData('philippines-2027', {
        trip: {
          id: 'philippines-2027',
          name: 'Philippines',
          startDate: '2027-02-25',
          endDate: '2027-03-11',
          travelers: [{ personId: 'laurine', role: 'owner' }],
        },
      });
      Store.registerTrip('philippines-2027');
    });

    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-trip-selector .publish-row', { timeout: 8000 });

    const plus = page.locator('#plus-content');
    await expect(plus).not.toContainText('Seeds passés');
    await expect(plus).not.toContainText('Autres seeds');
    await expect(page.locator('[data-trips-group]')).toHaveCount(2);
    await expect(page.locator('[data-trips-group="past"]')).toContainText('Voyages passés');
    await expect(page.locator('[data-trips-group="others"]')).toContainText('Autres voyages');

    const openSeeds = page.locator('#plus-trip-selector > .publish-row .publish-name');
    await expect(openSeeds).toContainText(['Québec 2026']);
    await expect(page.locator('#plus-trip-selector > .publish-row')).not.toContainText('Road Trip USA 2026');
    await expect(page.locator('#plus-trip-selector > .publish-row')).not.toContainText('Philippines');

    const pastBody = page.locator('#plus-trips-body-past');
    await expect(pastBody).toBeHidden();
    await expect(pastBody).toContainText('Road Trip USA 2026');
    await expect(pastBody.locator('.publish-row')).toContainText('Mettre à jour le voyage');

    await page.locator('[data-trips-group="past"]').click();
    await expect(pastBody).toBeVisible();

    const othersBody = page.locator('#plus-trips-body-others');
    await expect(othersBody).toBeHidden();
    await expect(othersBody).toContainText('Philippines');
    await expect(othersBody.locator('.publish-row')).toContainText('Mettre à jour le voyage');
  });
});
