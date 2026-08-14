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

  test('Laurine: her trip open, USA collapsed as Autres voyages', async ({ page }) => {
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

    const othersHead = page.locator('[data-trips-group="others"]');
    await expect(othersHead).toBeVisible();
    await expect(othersHead).toContainText('Autres voyages');
    const othersBody = page.locator('#plus-trips-body-others');
    await expect(othersBody).toBeHidden();
    await expect(othersBody).toContainText('Road Trip USA 2026');

    await othersHead.click();
    await expect(othersBody).toBeVisible();
    await expect(othersBody).toContainText('Road Trip USA 2026');
  });
});
