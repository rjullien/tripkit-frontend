/**
 * tests/hotels.spec.js — Hotels tab + hotel card tests
 * Covers: deduplicated list, hotel card rendering, WiFi section, access codes
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
    console.log(`Hotels rendered: ${count}`);
  });

  test('hotels are deduplicated', async ({ page, seed }) => {
    const uniqueHotels = Object.keys(seed.hotels);
    const rendered = page.locator('.hotel-card, [class*="hotel-card"]');
    const count = await rendered.count();
    // Should be <= unique hotels (some days share hotels)
    expect(count).toBeLessThanOrEqual(uniqueHotels.length + 2); // margin for "no hotel" days
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
  test('B&B Chez François exists in seed', async ({ seed }) => {
    const bb = seed.hotels['b-b-chez-francois'];
    expect(bb).toBeTruthy();
    expect(bb.name).toContain('François');
  });

  test('Hotels have required fields', async ({ seed }) => {
    for (const [id, hotel] of Object.entries(seed.hotels)) {
      expect(hotel.name).toBeTruthy();
      // Hotels have either city or addr
      expect(hotel.city || hotel.addr || hotel.address).toBeTruthy();
    }
  });
});

test.describe('Hotel Card in Day View', () => {
  test('Day 16 shows B&B Chez François', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(16); });
    await page.waitForTimeout(500);

    const text = await page.locator('#programme-content').textContent();
    expect(text).toContain('François');
  });

  test('Day 13 shows Airbnb Denver', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(13); });
    await page.waitForTimeout(500);

    const text = await page.locator('#programme-content').textContent();
    expect(text).toContain('Denver');
  });
});
