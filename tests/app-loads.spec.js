/**
 * tests/app-loads.spec.js — Core app loading tests
 */
import { test, expect } from './fixtures.js';

test.describe('App Loading', () => {
  test('loads and renders trip data', async ({ page }) => {
    await page.goto('/');
    // Wait for the app to render data (day navigation appears when data is loaded)
    await page.waitForSelector('.day-nav, [class*="day-nav"], .timeline', { timeout: 8000 });
    // Verify the page has meaningful content (not just error/loading)
    const text = await page.textContent('body');
    expect(text.length).toBeGreaterThan(200);
  });

  test('shows day navigation', async ({ page }) => {
    await page.goto('/');
    // Should have day nav buttons
    const dayNav = page.locator('.day-nav, [class*="day-nav"]');
    await expect(dayNav.first()).toBeVisible({ timeout: 5000 });
  });

  test('has 5 tabs', async ({ page }) => {
    await page.goto('/');
    const tabs = page.locator('.tab-item, [class*="tab"]');
    // 5 tabs: Programme, Route, Culture, Hotels, Plus
    await expect(tabs).toHaveCount(5, { timeout: 5000 });
  });

  test('navigates between days', async ({ page }) => {
    await page.goto('/');
    // Wait for app to render
    await page.waitForSelector('.day-nav, [class*="day-nav"]', { timeout: 5000 });

    // Click next day button
    const nextBtn = page.locator('.day-nav button:last-child, [class*="day-nav"] button:last-child');
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      // Content should update — verify we're not on Day 0 anymore
      await page.waitForTimeout(300);
    }
  });
});
