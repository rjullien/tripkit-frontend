/**
 * tests/offline-core.spec.js — Jour / Route / Résa usable without network
 * (seed already in localStorage via fixtures; browser goes offline).
 */
import { existsSync, readFileSync } from 'node:fs';
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
    await expect(resa).toContainText('Transport principal');
    await expect(resa).toContainText('TESTPNR');
  });
});

test.describe('SW precache list', () => {
  test('precache includes the three generated bundles', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain('/js/dist/bundle-core.js');
    expect(text).toContain('/js/dist/bundle-components.js');
    expect(text).toContain('/js/dist/bundle-edge.js');
    expect(text).toContain('tripkit-132');
    expect(text).toContain("url.origin !== self.location.origin");
    // Le shell est demandé avec ?v=<cache> alors qu'ASSETS précache les chemins
    // nus : sans ce repli, bundle-edge (jamais demandé au boot) serait perdu hors
    // ligne. Détail et régression : tests/sw-offline.test.cjs.
    expect(text).toContain('ignoreSearch: true');
    expect(text).not.toContain('/js/components/leo-chat.js');
    // Wllama runtime (~300 Ko) is opt-in: it must NOT be in the install precache.
    expect(text).not.toContain("'/js/lib/wllama/index.min.js'");
  });

  // The old test listed every shell script by name; the real invariant behind that
  // list is "no source silently dropped from the shell". bundles.json is now that
  // list, so it is what gets checked — plus the fact that each source is on disk.
  test('every source in bundles.json exists on disk', () => {
    const manifest = JSON.parse(
      readFileSync(new URL('../bundles.json', import.meta.url), 'utf8')
    );
    const names = Object.keys(manifest).filter(k => !k.startsWith('_'));
    expect(names).toEqual(['bundle-core', 'bundle-components', 'bundle-edge']);

    const sources = names.flatMap(n => manifest[n]);
    expect(sources.length).toBe(34);
    for (const rel of sources) {
      expect(existsSync(new URL('../' + rel, import.meta.url)), `missing ${rel}`).toBe(true);
    }
    // config.js is envsubst-generated at container start and js/components/leo-chat.js
    // is dead code: neither belongs in a bundle.
    expect(sources).not.toContain('config.js');
    expect(sources).not.toContain('js/components/leo-chat.js');
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

test.describe('bundle-edge hors ligne', () => {
  // Scénario réel de la régression : boot en ligne, l'utilisateur ne va JAMAIS
  // dans l'onglet Plus (donc bundle-edge n'est jamais demandé), puis il perd le
  // réseau. Seul le précache peut alors le servir — et l'URL demandée porte le
  // cache-buster que la liste de précache n'a pas.
  test('servi depuis le précache après un boot sans ouvrir Plus', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    const cached = await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      // Attendre la fin du précache (install → cache.add un par un).
      for (let i = 0; i < 80; i++) {
        const hit = await caches.match('/js/dist/bundle-edge.js');
        // Le worker doit aussi contrôler la page, sinon le fetch hors ligne
        // partirait sur le réseau sans passer par lui.
        if (hit && navigator.serviceWorker.controller) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      return false;
    });
    expect(cached, 'bundle-edge n\'est pas arrivé dans le précache').toBe(true);

    await context.setOffline(true);

    const res = await page.evaluate(async () => {
      // Exactement ce qu'injecte App.ensureEdgeBundle : chemin + cache-buster.
      const cache = await fetch('/version.json').then(r => r.json()).then(v => v.cache).catch(() => 163);
      const r = await fetch('js/dist/bundle-edge.js?v=' + cache);
      const body = r.status === 200 ? await r.text() : '';
      return {
        status: r.status,
        head: body.slice(0, 120),
        hasEdgeChat: body.includes('var EdgeChatStream'),
        hasEngine: body.includes('js/edge-model/engine.js'),
      };
    });

    expect(res.status, 'bundle-edge est injoignable hors ligne : Léo / Bifrost / Local seraient vides').toBe(200);
    // …et c'est bien bundle-edge qui est servi, pas un autre bundle.
    expect(res.head).toContain('bundle-edge.js');
    expect(res.hasEngine).toBe(true);
    expect(res.hasEdgeChat).toBe(true);
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
