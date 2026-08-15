/**
 * tests/plus-experimental.spec.js — Bifrost + Local LLM collapsed under Expérimental
 */
import { test, expect } from './fixtures.js';

test.describe('Plus Expérimental', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-experimental-head', { timeout: 8000 });
  });

  test('collapsed by default; Léo stays visible', async ({ page }) => {
    const body = page.locator('#plus-experimental-body');
    await expect(body).toBeHidden();
    await expect(page.locator('#plus-experimental-head')).toContainText('Expérimental');
    await expect(page.locator('#plus-experimental-head')).toHaveAttribute('aria-expanded', 'false');

    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
    await expect(page.locator('#plus-chat-stream')).not.toBeVisible();
    await expect(page.locator('#plus-edge-chat-stream')).not.toBeVisible();
  });

  test('expand shows Bifrost and Local; collapse again', async ({ page }) => {
    const body = page.locator('#plus-experimental-body');
    await expect(body).toBeHidden();

    await page.locator('#plus-experimental-head').click();
    await expect(body).toBeVisible();
    await expect(page.locator('#plus-experimental-head')).toHaveAttribute('aria-expanded', 'true');
    await expect(body).toContainText('Assistant Bifrost');
    await expect(body).toContainText('Local (appareil)');

    await page.locator('#plus-experimental-head').click();
    await expect(body).toBeHidden();
    await expect(page.locator('#plus-experimental-head')).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('bundle-edge chargé à la demande', () => {
  test('aucune requête au boot, exactement une à l\'ouverture de l\'onglet Plus', async ({ page }) => {
    const edgeRequests = [];
    page.on('request', req => {
      // Ignore the service worker's precache: what is measured here is the boot
      // path of the page itself.
      if (req.serviceWorker()) return;
      let pathname;
      try {
        pathname = new URL(req.url()).pathname;
      } catch (_) {
        return;
      }
      if (pathname === '/js/dist/bundle-edge.js') edgeRequests.push(req.url());
    });

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await expect(page.locator('#programme-content')).toBeVisible();
    expect(edgeRequests).toHaveLength(0);

    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
    expect(edgeRequests).toHaveLength(1);

    // Re-rendering the Plus tab must not re-fetch the bundle.
    await page.locator('.bottom-nav button[data-tab="programme"]').click();
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
    expect(edgeRequests).toHaveLength(1);
  });
});
