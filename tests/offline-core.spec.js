/**
 * tests/offline-core.spec.js — Jour / Route / Résa usable without network
 * (seed already in localStorage via fixtures; browser goes offline).
 */
import { test, expect } from './fixtures.js';

test.describe('Offline core tabs', () => {
  test.beforeEach(async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.waitForSelector('#programme-content .day-nav, #programme-content .timeline', { timeout: 8000 });
    await context.setOffline(true);
  });

  test('Jour renders from cache without weather', async ({ page }) => {
    await page.locator('.bottom-nav button[data-tab="programme"]').click();
    await page.waitForTimeout(300);
    const prog = page.locator('#programme-content');
    await expect(prog).toBeVisible();
    await expect(prog).not.toContainText('Impossible de charger le voyage');
    await expect(prog).not.toContainText('Chargement météo');
    await expect(page.locator('#weatherBox')).toHaveCount(0);
    await expect(prog.locator('.day-nav')).toBeVisible();
  });

  test('Route renders itinerary offline', async ({ page }) => {
    await page.locator('.bottom-nav button[data-tab="route"]').click();
    await page.waitForTimeout(400);
    const route = page.locator('#route-content');
    await expect(route).toContainText('Itinéraire');
    await expect(route).toContainText('jours');
    await expect(route.locator('.route-card').first()).toBeVisible();
  });

  test('Résa renders bookings offline', async ({ page }) => {
    await page.locator('.bottom-nav button[data-tab="hotels"]').click();
    await page.waitForTimeout(400);
    const resa = page.locator('#hotels-content');
    await expect(resa).toContainText('Réservations');
    await expect(resa).toContainText('Vols');
    await expect(resa).toContainText('TESTPNR');
  });
});

test.describe('SW precache list', () => {
  test('precache includes leo-chat-stream.js', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain('leo-chat-stream.js');
    expect(text).toContain('plus-chat-stream.js');
    expect(text).toContain('edge-model/engine.js');
    expect(text).toContain('tripkit-85');
    expect(text).toContain('huggingface.co');
    expect(text).not.toContain('/js/components/leo-chat.js');
  });
});
