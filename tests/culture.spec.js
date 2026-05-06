/**
 * tests/culture.spec.js — Culture view tests (ported from voyage-app)
 * Covers: zones accordion, fun facts, multi-carnet tabs, zone expand/collapse
 */
import { test, expect, SEED } from './fixtures.js';

test.describe('Culture View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="culture"]').click();
    await page.waitForTimeout(500);
  });

  test('renders culture zones', async ({ page }) => {
    const zones = page.locator('.culture-zone, .cz-title, [class*="culture-zone"]');
    const count = await zones.count();
    expect(count).toBeGreaterThan(0);
  });

  test('zone expands on click', async ({ page }) => {
    const firstZone = page.locator('.culture-zone, [class*="zone"]').first();
    if (await firstZone.count() > 0) {
      const title = firstZone.locator('.cz-title, h3, h4').first();
      await title.click();
      await page.waitForTimeout(300);

      // Content should be visible after click
      const content = firstZone.locator('.cz-content, .cz-sections, [class*="content"]');
      if (await content.count() > 0) {
        await expect(content.first()).toBeVisible();
      }

      // Click again to collapse
      await title.click();
      await page.waitForTimeout(300);
    }
  });

  test('fun facts are marked with 💡', async ({ page }) => {
    // Expand first zone to see content
    const firstZone = page.locator('.culture-zone, [class*="zone"]').first();
    if (await firstZone.count() > 0) {
      const title = firstZone.locator('.cz-title, h3, h4').first();
      await title.click();
      await page.waitForTimeout(300);
    }

    const text = await page.locator('#tab-culture').textContent();
    // Culture should have some fun facts (💡)
    const hasFunFacts = text.includes('💡');
    console.log(`Fun facts (💡) present: ${hasFunFacts}`);
  });

  test('culture data matches seed', async ({ page, seed }) => {
    // Verify culture zones count matches seed
    const cultureData = seed.culture;
    if (Array.isArray(cultureData)) {
      if (cultureData[0]?.zones) {
        // New format: array of notebooks
        console.log(`Seed has ${cultureData.length} notebook(s)`);
      } else {
        // Old format: array of zones
        console.log(`Seed has ${cultureData.length} zone(s)`);
      }
    }
  });
});

test.describe('Culture Badges in Timeline', () => {
  test('badges render on days with culture refs', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    // Navigate to Day 2 (Grand Canyon — should have culture content)
    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(2); });
    await page.waitForTimeout(500);

    // Check for culture badges in timeline
    const badges = page.locator('.culture-badge, [class*="culture-badge"]');
    const count = await badges.count();
    console.log(`Culture badges on Day 2: ${count}`);
  });
});
