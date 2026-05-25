/**
 * tests/tabs.spec.js — Tab navigation tests
 */
import { test, expect } from './fixtures.js';

const TAB_SELECTOR = '.bottom-nav button[data-tab]';

test.describe('Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(TAB_SELECTOR, { timeout: 8000 });
  });

  test('Programme tab shows timeline', async ({ page }) => {
    // Programme tab should be active by default
    await expect(page.locator('#programme-content').first()).toBeVisible({ timeout: 5000 });
  });

  test('Route tab shows route view', async ({ page }) => {
    await page.locator(`${TAB_SELECTOR}[data-tab="route"]`).click();
    await page.waitForTimeout(300);
    await expect(page.locator('#tab-route').first()).toBeVisible();
  });

  test('Culture tab shows culture view', async ({ page }) => {
    await page.locator(`${TAB_SELECTOR}[data-tab="culture"]`).click();
    await page.waitForTimeout(300);
    await expect(page.locator('#tab-culture').first()).toBeVisible();
  });

  test('Hotels tab shows hotels', async ({ page }) => {
    await page.locator(`${TAB_SELECTOR}[data-tab="hotels"]`).click();
    await page.waitForTimeout(300);
    await expect(page.locator('#tab-hotels').first()).toBeVisible();
  });

  test('Plus tab shows settings', async ({ page }) => {
    await page.locator(`${TAB_SELECTOR}[data-tab="plus"]`).click();
    await page.waitForTimeout(300);
    await expect(page.locator('#tab-plus').first()).toBeVisible();
  });
});
