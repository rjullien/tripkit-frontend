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
    expect(text).toContain('edge-chat-stream.js');
    expect(text).toContain('edge-model/engine.js');
    expect(text).toContain('tripkit-103');
    expect(text).toContain("url.origin !== self.location.origin");
    expect(text).not.toContain('/js/components/leo-chat.js');
  });

  // A stray `*/` inside the header comment once ended it early and turned the
  // rest into code, so registration failed and the app had no SW for days.
  test('sw.js actually registers and activates', async ({ page }) => {
    await page.goto('/');
    const state = await page.evaluate(async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e) {
        return 'register-error: ' + e.message;
      }
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(r => setTimeout(() => r(null), 8000)),
      ]);
      return reg && reg.active ? 'active' : 'not-active';
    });
    expect(state).toBe('active');
  });
});

test.describe('Edge model CSP', () => {
  // Without 'wasm-unsafe-eval' the Wllama worker cannot compile its wasm and
  // activation hangs until the 180s timeout with no usable error.
  test('nginx CSP allows WebAssembly compilation', async ({ request }) => {
    const res = await request.get('/nginx.conf');
    if (!res.ok()) test.skip(true, 'nginx.conf not served statically');
    const text = await res.text();
    const csp = text.split('\n').find(l => l.includes('Content-Security-Policy'));
    expect(csp).toBeTruthy();
    expect(csp).toContain("'wasm-unsafe-eval'");
  });
});
