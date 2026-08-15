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
});
