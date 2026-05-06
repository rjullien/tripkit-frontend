/**
 * tests/e2e-prod-route-maps.spec.js — E2E to verify route maps on both Canada trips
 */
import { test, expect } from '@playwright/test';

const PROD_URL = 'https://tripkit.bapttf.com';
const AUTH_USER = process.env.TRIPKIT_USER || 'Rene';
const AUTH_PASS = process.env.TRIPKIT_PASS || '';

async function loginAuthelia(page) {
  await page.goto(PROD_URL);
  if (page.url().includes('auth.bapttf.com')) {
    await page.fill('input[name="username"], #username-textfield', AUTH_USER);
    await page.fill('input[name="password"], #password-textfield', AUTH_PASS);
    await page.click('button[type="submit"], #sign-in-button');
    await page.waitForURL(`${PROD_URL}/**`, { timeout: 15000 });
  }
}

async function switchTrip(page, tripId) {
  await page.locator('.bottom-nav button[data-tab="plus"]').click();
  await page.waitForTimeout(1500);
  const tripItem = page.locator(`[onclick*="${tripId}"]`).first();
  if (await tripItem.isVisible()) {
    await tripItem.click();
    await page.waitForTimeout(3000); // wait for backend fetch
  }
}

async function checkRouteMap(page) {
  await page.locator('.bottom-nav button[data-tab="route"]').click();
  await page.waitForTimeout(2000);

  const mapImg = page.locator('img[alt*="Carte"]');
  const mapVisible = await mapImg.isVisible().catch(() => false);

  const mapsLink = page.locator('a.map-btn-primary');
  const linkVisible = await mapsLink.isVisible().catch(() => false);

  const cards = page.locator('.route-card');
  const cardCount = await cards.count();

  return { mapVisible, linkVisible, cardCount };
}

test.describe('Route Maps — Both Canada Trips', () => {
  test.skip(!AUTH_PASS, 'TRIPKIT_PASS not set');

  test('Canada Ontario has route map + link', async ({ page }) => {
    await loginAuthelia(page);
    await page.waitForSelector('.bottom-nav', { timeout: 15000 });
    await switchTrip(page, 'canada-ontario-2026');
    const result = await checkRouteMap(page);
    console.log('Canada Ontario:', JSON.stringify(result));
    expect(result.mapVisible).toBe(true);
    expect(result.linkVisible).toBe(true);
    expect(result.cardCount).toBeGreaterThan(0);
  });

  test('Canada Maritimes has route map + link', async ({ page }) => {
    await loginAuthelia(page);
    await page.waitForSelector('.bottom-nav', { timeout: 15000 });
    await switchTrip(page, 'canada-2026');
    const result = await checkRouteMap(page);
    console.log('Canada Maritimes:', JSON.stringify(result));
    expect(result.mapVisible).toBe(true);
    expect(result.linkVisible).toBe(true);
    expect(result.cardCount).toBeGreaterThan(0);
  });
});
