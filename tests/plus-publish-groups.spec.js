/**
 * tests/plus-publish-groups.spec.js — GH seeds grouped like Voyage actif
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
  test('mine current stays open; past and others collapsed', async ({ page }) => {
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
    await page.waitForSelector('.publish-section', { timeout: 8000 });

    const panel = page.locator('#plus-publish-panel');
    await expect(panel).toContainText('Publier depuis git');
    await expect(panel.locator(':scope > .publish-section > .publish-row .publish-name')).toContainText(['Québec 2026']);
    await expect(panel.locator(':scope > .publish-section > .publish-row')).not.toContainText('Road Trip USA 2026');
    await expect(panel.locator(':scope > .publish-section > .publish-row')).not.toContainText('Philippines');

    const pastHead = page.locator('[data-publish-group="past"]');
    await expect(pastHead).toBeVisible();
    await expect(pastHead).toContainText('Seeds passés');
    const pastBody = page.locator('#plus-publish-body-past');
    await expect(pastBody).toBeHidden();
    await expect(pastBody).toContainText('Road Trip USA 2026');

    await pastHead.click();
    await expect(pastBody).toBeVisible();
    await expect(pastBody).toContainText('Road Trip USA 2026');

    const othersHead = page.locator('[data-publish-group="others"]');
    await expect(othersHead).toBeVisible();
    await expect(othersHead).toContainText('Autres seeds');
    const othersBody = page.locator('#plus-publish-body-others');
    await expect(othersBody).toBeHidden();
    await expect(othersBody).toContainText('Philippines');

    await othersHead.click();
    await expect(othersBody).toBeVisible();
    await expect(othersBody).toContainText('Philippines');
  });
});
