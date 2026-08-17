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

// serviceWorkers: 'block' est indispensable ici : le service worker précache
// bundle-edge, il resservirait donc le bundle depuis son cache et masquerait
// l'échec réseau que ce test provoque (c'est exactement le filet de sécurité
// ajouté pour le hors-ligne, cf. tests/sw-offline.test.cjs).
test.describe('bundle-edge indisponible', () => {
  test.use({ serviceWorkers: 'block' });

  test('échec de chargement : état dégradé explicite puis « Réessayer »', async ({ page }) => {
    let failing = true;
    await page.route('**/js/dist/bundle-edge.js*', route => {
      if (failing) return route.abort('failed');
      return route.continue();
    });

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-experimental-head', { timeout: 8000 });

    // Sans état dégradé, les trois <div> restaient vides : onglet « cassé ».
    const fallback = page.locator('#plus-edge-fallback');
    await expect(fallback).toBeVisible({ timeout: 8000 });
    await expect(fallback).toContainText('Assistants indisponibles');

    // Le reste de l'onglet Plus continue de fonctionner.
    await expect(page.locator('#plus-content')).toContainText('Infos app');
    await expect(page.locator('#plus-trip-selector')).not.toBeEmpty();

    // Réessai à la demande : indispensable depuis que la reprise d'app ne
    // repeint plus l'onglet Plus (le bouton est le seul chemin de retour sans
    // ressortir de l'onglet).
    failing = false;
    await page.locator('#plus-edge-retry').click();
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo', { timeout: 8000 });
    await expect(page.locator('#plus-edge-fallback')).toHaveCount(0);
  });

  // Le cas iPhone : réseau capté mais sans sortie (portail WiFi, 3G morte). La
  // requête PEND — elle n'échoue pas. `onerror` ne part donc jamais et, sans
  // plafond, la promesse d'ensureEdgeBundle ne se règle jamais : Léo / Bifrost /
  // Local restent vides pour toujours, sans même le repli « Réessayer ».
  test('requête qui pend : le plafond mène au repli, puis « Réessayer »', async ({ page }) => {
    let hanging = true;
    const pending = [];
    await page.route('**/js/dist/bundle-edge.js*', route => {
      if (!hanging) return route.continue();
      pending.push(route); // jamais résolue : ni onload ni onerror
    });

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-experimental-head', { timeout: 8000 });

    // Le reste de l'onglet ne doit pas attendre le bundle.
    await expect(page.locator('#plus-content')).toContainText('Infos app');

    // EDGE_BUNDLE_TIMEOUT_MS = 5 s : la marge couvre la lenteur du CI.
    const fallback = page.locator('#plus-edge-fallback');
    await expect(fallback).toBeVisible({ timeout: 20000 });
    await expect(fallback).toContainText('Assistants indisponibles');

    hanging = false;
    await page.locator('#plus-edge-retry').click();
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo', { timeout: 8000 });
    await expect(page.locator('#plus-edge-fallback')).toHaveCount(0);

    for (const route of pending) await route.abort('failed').catch(() => {});
  });

  // « Effacer données » promet la suppression du modèle hors-ligne (OPFS). Cette
  // purge passe par EdgeEngine, donc par bundle-edge : quand il ne charge pas, le
  // dialogue mentait et l'effacement partait quand même sans le GGUF.
  test('« Effacer données » sans bundle-edge : deuxième confirmation honnête', async ({ page }) => {
    await page.route('**/js/dist/bundle-edge.js*', route => route.abort('failed'));

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-edge-fallback', { timeout: 20000 });

    const markersOf = () => page.evaluate(() =>
      Object.keys(localStorage).filter(k => k.endsWith('-data-version')));
    const before = await markersOf();
    expect(before.length, 'le scénario a besoin de données locales à effacer').toBeGreaterThan(0);

    // 1er dialogue accepté, 2e refusé : rien ne doit être effacé.
    const messages = [];
    let handler = d => { messages.push(d.message()); messages.length === 1 ? d.accept() : d.dismiss(); };
    page.on('dialog', d => handler(d));

    await page.locator('#plus-content button:has-text("Effacer données")').click();
    await expect.poll(() => messages.length, { timeout: 15000 }).toBe(2);
    expect(messages[0]).toContain('Le modèle hors-ligne (OPFS) sera aussi supprimé');
    expect(messages[1]).toContain('n\'a pas pu être supprimé');
    expect(messages[1]).toContain('Effacer quand même');
    expect(await markersOf(), 'refuser la 2e confirmation ne doit rien effacer').toEqual(before);

    // Même parcours, 2e dialogue accepté cette fois : l'effacement a bien lieu.
    // Il se termine par un location.reload(), donc le témoin posé sur window
    // disparaît (et les marqueurs, eux, sont réécrits par le rechargement).
    await page.evaluate(() => { window.__beforeClearData = 1; });
    messages.length = 0;
    handler = d => { messages.push(d.message()); d.accept(); };
    await page.locator('#plus-content button:has-text("Effacer données")').click();
    await expect.poll(() => page.evaluate(() => window.__beforeClearData), { timeout: 20000 })
      .toBeUndefined();
    expect(messages.length, 'les deux dialogues doivent avoir été présentés').toBe(2);
  });
});

test.describe('bundle-components concaténé', () => {
  // Le `;` de tête du bundle annule le "use strict" de qrcode-svg.min.js, qui
  // tourne donc désormais en mode sloppy : cette lib est la seule source dont la
  // sémantique a changé, et rien n'exerçait son rendu.
  test('QRCode rend un SVG depuis le bundle (mode sloppy)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    const qr = await page.evaluate(() => {
      // Appel identique à js/components/hotel-card.js (QR du WiFi hôtel).
      const svg = QRCode({ msg: 'WIFI:T:WPA;S:Juju;P:secret;;', dim: 160, pad: 2, pal: ['#4ecdc4', '#16213e'] });
      const host = document.createElement('div');
      host.appendChild(svg);
      const modules = host.querySelector('path[transform]');
      return {
        tag: svg.tagName,
        width: svg.getAttribute('width'),
        paths: host.querySelectorAll('path').length,
        d: modules ? modules.getAttribute('d').length : 0,
      };
    });

    expect(qr.tag).toBe('svg');
    expect(qr.width).toBe('160');
    expect(qr.paths).toBeGreaterThan(0);
    expect(qr.d).toBeGreaterThan(100); // vrai tracé de modules, pas un SVG vide
  });

  test('tous les globaux des composants sont exposés après concaténation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    const missing = await page.evaluate(() => [
      'QRCode', 'Timeline', 'Weather', 'HotelCard', 'BookingsView', 'DayCards',
      'ConferenceView', 'DailyView', 'DiscoveryPanel', 'NuisanceStream', 'ConstructionView',
      'ListComponent', 'RouteView',
      'CultureView', 'TripSelector', 'PublishPanel', 'PolarstepsPanel',
      'App', 'API', 'Store', 'SeedMerge', 'DayHelpers', 'TzHelpers', 'PeopleHelpers',
      'DayResolver', 'TripGroups', 'ConstructionContract', 'StepsMap',
    ].filter(name => typeof window[name] === 'undefined'));

    expect(missing).toEqual([]);
  });
});
