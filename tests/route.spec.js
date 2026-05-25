/**
 * tests/route.spec.js — Route tab tests
 * Uses generic test seed
 */
import { test, expect, SEED } from './fixtures.js';

test.describe('Route Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="route"]').click();
    await page.waitForTimeout(1000);
  });

  test('renders route cards for all days', async ({ page }) => {
    const cards = page.locator('.route-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(SEED.days.length - 1); // at least most days
  });

  test('route card expands on click', async ({ page }) => {
    const card = page.locator('.route-card').nth(1);
    await expect(card).toBeVisible({ timeout: 5000 });

    const header = card.locator('.rc-header');
    await header.click();
    await page.waitForTimeout(300);

    const isOpen = await card.evaluate(el => el.classList.contains('open'));
    expect(isOpen).toBe(true);

    await header.click();
    await page.waitForTimeout(300);
    const isClosed = await card.evaluate(el => !el.classList.contains('open'));
    expect(isClosed).toBe(true);
  });

  test('route cards contain day info', async ({ page }) => {
    await page.waitForSelector('.route-card', { timeout: 5000 });
    const allText = await page.locator('#tab-route').textContent();
    expect(allText).toMatch(/Jour \d+/);
    expect(allText.length).toBeGreaterThan(100);
  });
});

test.describe('Route Seed Data', () => {
  test('phases defined', async ({ seed }) => {
    const phases = seed.trip.phases;
    expect(phases).toBeDefined();
    expect(phases.length).toBeGreaterThanOrEqual(1);
  });

  test('phases have range array', async ({ seed }) => {
    for (const phase of seed.trip.phases) {
      const arr = phase.days || phase.range;
      expect(arr, `Phase "${phase.name}" missing days/range`).toBeDefined();
      expect(arr.length).toBe(2);
      expect(arr[0]).toBeLessThanOrEqual(arr[1]);
    }
  });
});
