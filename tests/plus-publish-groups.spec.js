/**
 * tests/plus-publish-groups.spec.js — GH seeds stay in « Publier depuis git »,
 * grouped by family (not mixed into Voyage actif).
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

test.describe('Plus GH publish section', () => {
  test('Publier depuis git is grouped by family, not folded into Voyage actif', async ({ page }) => {
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
    const panel = page.locator('#plus-publish-panel');
    await expect(panel).toContainText('Publier depuis git', { timeout: 8000 });
    await expect(panel.locator('.publish-family[data-family="jullien"]')).toBeVisible();
    await expect(panel.locator('.publish-family[data-family="jullien"]')).toContainText('Québec 2026');
    await expect(panel.locator('.publish-family[data-family="jullien"]')).toContainText('Road Trip USA 2026');
    await expect(panel.locator('.publish-family[data-family="jullien"]')).toContainText('rjullien/tripkit-seeds');
    await expect(panel.locator('.publish-family[data-family="jullien"] .publish-row').first()).toContainText('Mettre à jour le voyage');

    await expect(page.locator('#plus-trip-selector .publish-row')).toHaveCount(0);

    const others = page.locator('#plus-publish-body-others');
    await expect(page.locator('[data-publish-group="others"]')).toContainText('Autres familles');
    await expect(others).toBeHidden();
    await expect(others).toContainText('Philippines');
    await expect(others).toContainText('Laurine');

    await page.locator('[data-publish-group="others"]').click();
    await expect(others).toBeVisible();
    await expect(others.locator('.publish-row')).toContainText('Mettre à jour le voyage');
  });
});
