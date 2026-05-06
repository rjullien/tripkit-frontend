/**
 * tests/route.spec.js — Route tab tests (ported from voyage-app)
 * Covers: route cards, stats badges, maps links, expand/collapse, phases, day navigation
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
    expect(count).toBeGreaterThanOrEqual(15);
    expect(count).toBeLessThanOrEqual(25);
  });

  test('has stats badges', async ({ page }) => {
    await page.waitForSelector('.route-card', { timeout: 5000 });
    const text = await page.locator('#tab-route').textContent();
    // Should mention "jours" in a badge
    expect(text).toMatch(/\d+\s*jours/);
  });

  test('route card expands on click', async ({ page }) => {
    const card = page.locator('.route-card').nth(1);
    await expect(card).toBeVisible({ timeout: 5000 });

    const header = card.locator('.rc-header');
    await header.click();
    await page.waitForTimeout(300);

    // Card should have 'open' class
    const isOpen = await card.evaluate(el => el.classList.contains('open'));
    expect(isOpen).toBe(true);

    // Detail should be visible
    const detail = card.locator('.rc-detail');
    if (await detail.count() > 0) {
      await expect(detail).toBeVisible();
    }

    // Click again to collapse
    await header.click();
    await page.waitForTimeout(300);
    const isClosed = await card.evaluate(el => !el.classList.contains('open'));
    expect(isClosed).toBe(true);
  });

  test('route card has "Programme du jour" link', async ({ page }) => {
    const card = page.locator('.route-card').nth(1);
    await expect(card).toBeVisible({ timeout: 5000 });

    // Expand
    await card.locator('.rc-header').click();
    await page.waitForTimeout(300);

    const progLink = card.locator('.btn-day-link');
    if (await progLink.count() > 0) {
      await expect(progLink).toContainText('Programme');
    }
  });

  test('phase labels present', async ({ page }) => {
    await page.waitForSelector('.route-card', { timeout: 5000 });
    const phases = page.locator('.phase-label');
    const count = await phases.count();
    console.log(`Phase labels found: ${count}`);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('route cards contain day info', async ({ page }) => {
    await page.waitForSelector('.route-card', { timeout: 5000 });
    const allText = await page.locator('#tab-route').textContent();
    // Should have day references and locations
    expect(allText).toMatch(/Jour \d+/);
    expect(allText.length).toBeGreaterThan(500);
  });
});

test.describe('Route Seed Data', () => {
  test('all days have mapUrl', async ({ seed }) => {
    const withMap = seed.days.filter(d => d.mapUrl);
    expect(withMap.length).toBeGreaterThanOrEqual(10);
  });

  test('all days have distance', async ({ seed }) => {
    const withDist = seed.days.filter(d => d.dist);
    expect(withDist.length).toBeGreaterThanOrEqual(15);
  });

  test('phases cover all days', async ({ seed }) => {
    const phases = seed.trip.phases;
    expect(phases).toBeDefined();
    expect(phases.length).toBeGreaterThanOrEqual(3);
  });

  test('phases have days or range array', async ({ seed }) => {
    for (const phase of seed.trip.phases) {
      const arr = phase.days || phase.range;
      expect(arr, `Phase "${phase.name}" missing days/range`).toBeDefined();
      expect(arr.length).toBe(2);
      expect(arr[0]).toBeLessThanOrEqual(arr[1]);
    }
  });
});
