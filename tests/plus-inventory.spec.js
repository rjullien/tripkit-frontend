/**
 * tests/plus-inventory.spec.js — régression UI de l'onglet Plus
 *
 * Verrouille les landmarks visibles ( Polarsteps, Publier, Léo, Expérimental )
 * pour qu'un « nettoyage » de renderPlus casse CI au lieu de livrer un Plus
 * amputé. Polarsteps est gated par GET /polarsteps/status : les fixtures
 * génériques le cachent (enabled:false). Ici on force enabled:true.
 */
import { test, expect } from './fixtures.js';

async function stubPolarstepsEnabled(page, extra = {}) {
  await page.route('**/api/trips/*/polarsteps/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        enabled: true,
        ready: true,
        seedEnabled: true,
        active: true,
        opsEnabled: true,
        tripUrl: 'https://www.polarsteps.com/test/quebec/',
        ...extra,
      }),
    }),
  );
}

async function openPlus(page) {
  await page.goto('/');
  await page.waitForSelector('.bottom-nav', { timeout: 8000 });
  await page.locator('.bottom-nav button[data-tab="plus"]').click();
  await page.waitForSelector('#plus-content', { timeout: 8000 });
}

test.describe('Plus inventory — Polarsteps visible', () => {
  test.beforeEach(async ({ page }) => {
    await stubPolarstepsEnabled(page);
  });

  test('box Polarsteps visible, hors Expérimental, entre Voyage actif et Léo', async ({ page }) => {
    await openPlus(page);
    const section = page.locator('#plus-polarsteps-panel .polarsteps-section');
    await expect(section).toBeVisible({ timeout: 8000 });
    await expect(section.locator('.section-title')).toHaveText('Polarsteps');
    await expect(page.locator('#polarsteps-generate')).toBeVisible();

    await expect(page.locator('#plus-experimental-body #plus-polarsteps-panel')).toHaveCount(0);
    await expect(page.locator('#plus-experimental-head')).toContainText('Expérimental');

    const text = await page.locator('#plus-content').innerText();
    const iVoyage = text.indexOf('Voyage actif');
    const iPolar = text.indexOf('Polarsteps');
    const iLeo = text.indexOf('Léo');
    const iExp = text.indexOf('Expérimental');
    expect(iVoyage).toBeGreaterThanOrEqual(0);
    expect(iPolar).toBeGreaterThan(iVoyage);
    expect(iLeo).toBeGreaterThan(iPolar);
    expect(iExp).toBeGreaterThan(iLeo);
  });

  test('les autres landmarks Plus sont toujours là', async ({ page }) => {
    await page.route('**/publish/sources', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          sourceId: 'jullien', repo: 'rjullien/tripkit-seeds', ref: 'main', enabled: true,
          family: 'jullien', tripId: 'quebec-2026', seedPath: 'quebec-2026.js',
          title: 'Québec 2026', operation: 'update', inProd: true,
        }]),
      }),
    );
    await openPlus(page);
    await expect(page.locator('#plus-trip-selector')).not.toBeEmpty();
    await expect(page.locator('#plus-publish-panel')).toContainText('Publier depuis git', { timeout: 8000 });
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
    await expect(page.locator('#plus-experimental-head')).toContainText('Expérimental');
    await expect(page.locator('#plus-content')).toContainText('Infos app');
  });
});

test.describe('Plus inventory — Polarsteps seed fallback', () => {
  test('un status 5xx ne vire pas la box si le seed a polarsteps.enabled', async ({ page }) => {
    await page.route('**/api/trips/*/polarsteps/status', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'boom' }),
      }),
    );
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.waitForFunction(() => {
      const id = typeof Store !== 'undefined' && Store.getCurrentTripId && Store.getCurrentTripId();
      return !!(id && Store.getTripData(id) && Store.getTripData(id).trip);
    });
    await page.evaluate(() => {
      const id = Store.getCurrentTripId();
      const td = Store.getTripData(id);
      td.trip.polarsteps = { enabled: true, tripUrl: 'https://www.polarsteps.com/test/' };
      Store.setTripData(id, td);
    });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    const section = page.locator('#plus-polarsteps-panel .polarsteps-section');
    await expect(section).toBeVisible({ timeout: 8000 });
    await expect(section.locator('.section-title')).toHaveText('Polarsteps');
    await expect(page.locator('#polarsteps-generate')).toBeDisabled();
  });
});
