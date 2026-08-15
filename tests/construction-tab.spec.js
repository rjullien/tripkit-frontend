/**
 * tests/construction-tab.spec.js — Construction tab tests
 * Validates toggle visibility, nav button show/hide, hash guard, and content rendering.
 */
import { test, expect } from './fixtures.js';

const NAV_BTN = '#nav-construction';
const TAB_SELECTOR = '.bottom-nav button[data-tab]';

test.describe('Construction Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(TAB_SELECTOR, { timeout: 8000 });
  });

  test('toggle ON -> construction button appears in nav', async ({ page }) => {
    // Initially hidden
    await expect(page.locator(NAV_BTN)).toBeHidden();

    // Enable construction mode via Store
    await page.evaluate(() => {
      Store.set('tk-construction-mode', true);
      App.paintConstructionNav();
    });

    // Button should now be visible
    await expect(page.locator(NAV_BTN)).toBeVisible();
  });

  test('toggle OFF -> button hidden, only 5 visible tabs', async ({ page }) => {
    // Ensure mode is OFF
    await page.evaluate(() => {
      Store.set('tk-construction-mode', false);
      App.paintConstructionNav();
    });

    await expect(page.locator(NAV_BTN)).toBeHidden();

    // Count visible nav buttons
    const visibleButtons = await page.locator('.bottom-nav button[data-tab]:visible').count();
    expect(visibleButtons).toBe(5);
  });

  test('deep link #construction with toggle OFF -> redirects to programme', async ({ page }) => {
    // Ensure mode is OFF
    await page.evaluate(() => {
      Store.set('tk-construction-mode', false);
      App.paintConstructionNav();
    });

    // Navigate to #construction
    await page.evaluate(() => { window.location.hash = 'construction'; });
    await page.waitForTimeout(300);

    // Should redirect to #programme
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toBe('#programme');
  });

  test('toggle ON + click construction -> shows construction content', async ({ page }) => {
    // Enable construction mode
    await page.evaluate(() => {
      Store.set('tk-construction-mode', true);
      App.paintConstructionNav();
    });

    await expect(page.locator(NAV_BTN)).toBeVisible();

    // Click the construction tab button
    await page.locator(NAV_BTN).click();
    await page.waitForTimeout(300);

    // Tab view should be visible and contain construction content
    await expect(page.locator('#tab-construction')).toBeVisible();
    await expect(page.locator('#construction-content')).toContainText('Mode Construction');
  });

  test('loading a trip syncs construction data without flipping the toggle', async ({ page }) => {
    await page.route('**/api/trips/*/construction', (route) => {
      const url = route.request().url();
      if (url.includes('/qa') || url.includes('/phase')) return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ phase: 5, dates: { startDate: '2026-08-14', days: 19 } }),
      });
    });
    await page.evaluate(() => {
      Store.set('tk-construction-mode', false);
      App.paintConstructionNav();
    });
    await expect(page.locator(NAV_BTN)).toBeHidden();

    await page.evaluate(async () => {
      await App.syncConstructionData(Store.getCurrentTripId());
    });

    await expect(page.locator(NAV_BTN)).toBeHidden();
    const phase = await page.evaluate(() => {
      const td = Store.getTripData(Store.getCurrentTripId());
      return td && td.trip && td.trip.construction && td.trip.construction.phase;
    });
    expect(phase).toBe(5);
  });

  test('checkbox ON keeps the Plus toggle visible so OFF is possible', async ({ page }) => {
    await page.route('**/publish/sources', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          sourceId: 'jullien', repo: 'rjullien/tripkit-seeds', ref: 'main', enabled: true,
          family: 'jullien', tripId: 'quebec-2026', seedPath: 'quebec-2026.js',
          title: 'Québec 2026', operation: 'update', inProd: true,
        }]),
      }),
    );
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    const wrap = page.locator('#construction-mode-toggle-wrap');
    const checkbox = page.locator('#construction-toggle');
    await expect(wrap).toBeVisible({ timeout: 8000 });

    await checkbox.check();
    await expect(page.locator(NAV_BTN)).toBeVisible();
    await expect(wrap).toBeVisible();
    await expect(checkbox).toBeChecked();

    await checkbox.uncheck();
    await expect(page.locator(NAV_BTN)).toBeHidden();
    await expect(wrap).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  });

  test('toggle stays visible when mode is already ON even without sources', async ({ page }) => {
    await page.route('**/publish/sources', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );
    await page.evaluate(() => {
      Store.set('tk-construction-mode', true);
    });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await expect(page.locator('#construction-mode-toggle-wrap')).toBeVisible();
    await expect(page.locator('#construction-toggle')).toBeChecked();

    await page.locator('#construction-toggle').uncheck();
    await expect(page.locator(NAV_BTN)).toBeHidden();
    await expect(page.locator('#construction-toggle')).not.toBeChecked();
  });

  test('Quitter le mode on the Construction tab turns the toggle OFF', async ({ page }) => {
    await page.evaluate(() => {
      Store.set('tk-construction-mode', true);
      App.paintConstructionNav();
    });
    await page.locator(NAV_BTN).click();
    await expect(page.locator('#construction-quit-mode')).toBeVisible();
    await page.locator('#construction-quit-mode').click();
    await expect(page.locator(NAV_BTN)).toBeHidden();
    const on = await page.evaluate(() => !!Store.get('tk-construction-mode'));
    expect(on).toBe(false);
  });

  test('Leo mode follows construction phase', async ({ page }) => {
    const modes = await page.evaluate(() => ({
      p0: ConstructionView.leoModeForPhase(0),
      p1: ConstructionView.leoModeForPhase(1),
      p2: ConstructionView.leoModeForPhase(2),
      p3: ConstructionView.leoModeForPhase(3),
      p4: ConstructionView.leoModeForPhase(4),
    }));
    expect(modes).toEqual({
      p0: 'construction:ideation',
      p1: 'construction:ideation',
      p2: 'construction:route',
      p3: 'construction:activities',
      p4: 'construction:activities',
    });
  });
});
