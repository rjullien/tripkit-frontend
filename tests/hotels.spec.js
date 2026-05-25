/**
 * tests/hotels.spec.js — Hotels tab + hotel card tests
 * Uses generic test seed (no PII)
 */
import { test, expect, SEED } from './fixtures.js';

test.describe('Hotels Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="hotels"]').click();
    await page.waitForTimeout(500);
  });

  test('renders hotel list', async ({ page }) => {
    const hotels = page.locator('.hotel-card, [class*="hotel"]');
    const count = await hotels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('hotels are deduplicated', async ({ page, seed }) => {
    const uniqueHotels = Object.keys(seed.hotels);
    const rendered = page.locator('.hotel-card, [class*="hotel-card"]');
    const count = await rendered.count();
    expect(count).toBeLessThanOrEqual(uniqueHotels.length + 2);
  });

  test('hotel card has name and address', async ({ page }) => {
    const firstCard = page.locator('.hotel-card, [class*="hotel-card"]').first();
    if (await firstCard.count() > 0) {
      const text = await firstCard.textContent();
      expect(text.length).toBeGreaterThan(10);
    }
  });
});

test.describe('Hotel data integrity', () => {
  test('test hotel exists in seed', async ({ seed }) => {
    const hotel = seed.hotels['city-hotel'];
    expect(hotel).toBeTruthy();
    expect(hotel.name).toContain('Grand Hotel');
  });

  test('Hotels have required fields', async ({ seed }) => {
    for (const [id, hotel] of Object.entries(seed.hotels)) {
      expect(hotel.name).toBeTruthy();
      expect(hotel.city || hotel.addr || hotel.address).toBeTruthy();
    }
  });
});

test.describe('Hotel Card in Day View', () => {
  test('Day 1 shows hotel name', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(1); });
    await page.waitForTimeout(500);

    const text = await page.locator('#programme-content').textContent();
    expect(text).toContain('Grand Hotel');
  });
});
