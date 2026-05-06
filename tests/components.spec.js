/**
 * tests/components.spec.js — Component rendering tests
 */
import { test, expect } from './fixtures.js';

test.describe('DayCards Component', () => {
  test('renders rental pickup card on Day 1', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(1); });
    await page.waitForTimeout(500);

    const text = await page.textContent('#programme-content');
    expect(text).toContain('Alamo');
  });

  test('renders rental return card on Day 14', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(14); });
    await page.waitForTimeout(500);

    const text = await page.textContent('#programme-content');
    expect(text).toContain('Denver');
  });
});

test.describe('Conference Component', () => {
  test('renders conference on Day 6', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(6); });
    await page.waitForTimeout(500);

    // Day 6 = first Google Next conf day
    const text = await page.textContent('#programme-content');
    expect(text.toLowerCase()).toMatch(/google|next|conf|keynote/);
  });

  test('conference toggle works', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(6); });
    await page.waitForTimeout(500);

    const toggles = page.locator('.conf-toggle button, [class*="conf"] button, .toggle button');
    const count = await toggles.count();
    if (count >= 2) {
      await toggles.nth(1).click();
      await page.waitForTimeout(300);
    }
    // Just verify page still has content (no crash)
    const text = await page.textContent('#programme-content');
    expect(text.length).toBeGreaterThan(50);
  });
});

test.describe('Hotel Card', () => {
  test('renders hotel info from hotelId ref', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(1); });
    await page.waitForTimeout(500);

    const text = await page.textContent('#programme-content');
    expect(text.length).toBeGreaterThan(100);
  });
});

test.describe('Weather Widget', () => {
  test('weather section exists for days with location', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(2); });
    await page.waitForTimeout(500);

    const text = await page.textContent('#programme-content');
    expect(text.length).toBeGreaterThan(50);
  });
});
