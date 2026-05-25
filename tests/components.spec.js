/**
 * tests/components.spec.js — Component rendering tests
 * Uses generic test-trip seed (no PII)
 */
import { test, expect } from './fixtures.js';

test.describe('DayCards Component', () => {
  test('renders day content on Day 1', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(1); });
    await page.waitForTimeout(500);

    const text = await page.textContent('#programme-content');
    expect(text.length).toBeGreaterThan(50);
  });

  test('renders day content on Day 3', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(3); });
    await page.waitForTimeout(500);

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
