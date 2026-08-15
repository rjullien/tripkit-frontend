/**
 * tests/plus-refresh.spec.js — pas de « refresh parasite » dans l'onglet Plus
 *
 * Symptôme d'origine : chaque retour dans l'app (bascule d'appli, déverrouillage,
 * focus d'onglet) déclenchait visibilitychange → kick() → API.probe() →
 * refreshFromBackend(), qui repeignait #plus-content même quand la version du
 * backend n'avait pas changé.
 *
 * serviceWorkers: 'block' est indispensable ici : une fois le service worker
 * actif, les fetch passent par lui et échappent au page.route() des fixtures
 * (les /health et /api/* d'après-boot retombent alors sur le serveur statique en
 * 404, et la reprise ne va jamais jusqu'au re-render).
 */
import { test, expect } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

const MARKER = '#plus-content .page-header[data-refresh-marker="1"]';

/** Ouvre l'onglet Plus, attend son rendu complet et estampille un nœud. */
async function openPlusAndStamp(page) {
  await page.locator('.bottom-nav button[data-tab="plus"]').click();
  await page.waitForSelector('#plus-experimental-head', { timeout: 8000 });
  await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
  await page.evaluate(() => {
    document.querySelector('#plus-content .page-header')
      .setAttribute('data-refresh-marker', '1');
  });
  await expect(page.locator(MARKER)).toHaveCount(1);
}

/** Simule un retour dans l'app (bascule d'appli / déverrouillage). */
async function resumeByVisibility(page) {
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
}

/** Simule un retour du réseau (traité en priorité, sans intervalle minimum). */
async function resumeByOnline(page) {
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
}

/** Route /version pilotable par test : la fixture partagée renvoie toujours test-1. */
async function routeVersion(page, getVersion) {
  await page.route('**/api/trips/*/version*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ version: getVersion(), updated_at: new Date().toISOString() }),
  }));
}

test.describe('Onglet Plus — refresh au retour dans l\'app', () => {
  test('version inchangée : #plus-content n\'est pas reconstruit', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await openPlusAndStamp(page);

    await resumeByVisibility(page);
    await page.waitForTimeout(1200); // debounce 400 ms + probe + /version
    await expect(page.locator(MARKER)).toHaveCount(1);

    await resumeByOnline(page);
    await page.waitForTimeout(1200);
    await expect(page.locator(MARKER)).toHaveCount(1);

    // Le contenu est toujours là, simplement pas repeint.
    await expect(page.locator('#plus-content')).toContainText('Plus');
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
  });

  test('version modifiée : l\'onglet se re-render bien', async ({ page }) => {
    let version = 'test-1';
    await routeVersion(page, () => version);

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await openPlusAndStamp(page);

    version = 'test-2';
    await resumeByOnline(page);

    // Le marqueur disparaît avec l'ancien DOM, le header est reconstruit.
    await expect(page.locator(MARKER)).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator('#plus-content .page-header')).toContainText('Plus');
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
  });

  test('reprise sans changement : outbox, sync et préchargement tournent quand même', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await openPlusAndStamp(page);

    await page.evaluate(() => {
      window.__calls = { flushOutbox: 0, backgroundSyncTrip: 0, warmTripAssets: 0 };
      ['flushOutbox', 'backgroundSyncTrip', 'warmTripAssets'].forEach(name => {
        const orig = API[name];
        API[name] = function (...args) {
          window.__calls[name]++;
          return orig.apply(this, args);
        };
      });
    });

    await resumeByOnline(page);
    await page.waitForTimeout(1500);

    const calls = await page.evaluate(() => window.__calls);
    expect(calls.backgroundSyncTrip).toBeGreaterThanOrEqual(1);
    expect(calls.warmTripAssets).toBeGreaterThanOrEqual(1);
    // backgroundSyncTrip enchaîne sur flushOutbox par sa liaison interne
    // (js/api.js), non interceptable depuis la page : c'est backgroundSyncTrip
    // qui garantit le flush de l'outbox à chaque reprise. On ne l'assert donc
    // pas ici : le compteur resterait à 0 même quand le flush a bien lieu.
    // …et toujours aucun repaint parasite
    await expect(page.locator(MARKER)).toHaveCount(1);
  });

  test('rafale de visibilitychange : une seule reprise (intervalle minimum)', async ({ page }) => {
    const probes = [];
    page.on('request', req => {
      if (req.serviceWorker()) return;
      const url = req.url();
      if (url.includes('/health') && !url.includes('/api/')) probes.push(url);
    });

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await openPlusAndStamp(page);
    await page.waitForTimeout(600);
    probes.length = 0;

    await resumeByVisibility(page);
    await page.waitForTimeout(900);
    expect(probes).toHaveLength(1);

    // Deuxième bascule tout de suite après : ignorée (< 10 s).
    await resumeByVisibility(page);
    await page.waitForTimeout(900);
    expect(probes).toHaveLength(1);

    // Le retour du réseau reste prioritaire et immédiat.
    await resumeByOnline(page);
    await page.waitForTimeout(900);
    expect(probes).toHaveLength(2);

    // Aucune de ces reprises n'a repeint l'onglet.
    await expect(page.locator(MARKER)).toHaveCount(1);
  });

  test('« Expérimental » garde son état ouvert à travers un re-render légitime', async ({ page }) => {
    let version = 'test-1';
    await routeVersion(page, () => version);

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await openPlusAndStamp(page);

    const head = page.locator('#plus-experimental-head');
    await expect(head).toHaveAttribute('aria-expanded', 'false'); // replié par défaut
    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');

    version = 'test-3';
    await resumeByOnline(page);
    await expect(page.locator(MARKER)).toHaveCount(0, { timeout: 8000 });

    await expect(page.locator('#plus-experimental-head')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#plus-experimental-body')).toBeVisible();
  });

  test('reprise différée : une bascule dans la fenêtre minimale n\'est pas perdue', async ({ page }) => {
    // L'intervalle minimum ne doit pas JETER la reprise : un vrai retour dans
    // l'app juste avant la fin de la fenêtre (souvent sur un autre réseau) doit
    // finir par resynchroniser. Le test attend donc réellement la fin de la
    // fenêtre — mais via le crochet window.__tripkitResumeMinIntervalMs, qui la
    // raccourcit à 3 s au lieu des 10 s de production. Le mécanisme testé est le
    // même (report armé puis rejoué), seule sa durée change : sans le crochet,
    // ce test coûtait 13 s de sommeil réel.
    test.setTimeout(25_000);

    const WINDOW_MS = 3000;
    await page.addInitScript(ms => { window.__tripkitResumeMinIntervalMs = ms; }, WINDOW_MS);

    const probes = [];
    page.on('request', req => {
      if (req.serviceWorker()) return;
      const url = req.url();
      if (url.includes('/health') && !url.includes('/api/')) probes.push(url);
    });

    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    // La fenêtre doit bien être celle du crochet, sinon le test ne prouve rien.
    expect(await page.evaluate(() => window.__tripkitResumeMinIntervalMs)).toBe(WINDOW_MS);
    await openPlusAndStamp(page);
    await page.waitForTimeout(600);
    probes.length = 0;

    await resumeByVisibility(page);
    await page.waitForTimeout(900);
    expect(probes).toHaveLength(1);

    await resumeByVisibility(page); // ignorée sur le moment (< WINDOW_MS)…
    await page.waitForTimeout(900);
    expect(probes, 'la 2e bascule n\'a pas été différée').toHaveLength(1);

    // …mais rejouée à la fin de la fenêtre : sinon cette reprise était perdue.
    await expect.poll(() => probes.length, {
      message: 'la reprise différée n\'a jamais eu lieu',
      timeout: WINDOW_MS + 4000,
    }).toBe(2);

    // Un seul report est armé à la fois : la reprise différée ne se dédouble pas.
    await page.waitForTimeout(1000);
    expect(probes).toHaveLength(2);

    // Et toujours aucun repaint parasite (la version n'a pas changé).
    await expect(page.locator(MARKER)).toHaveCount(1);
  });

  test('boot à chaud (cache présent, version inchangée) : un seul rendu de l\'onglet Plus', async ({ page }) => {
    // Tous les autres tests démarrent avec un localStorage vide, donc le seul cas
    // exercé était le boot à froid, où le repaint est légitime (firstPaint).
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.waitForFunction(
      () => !!(window.Store && Store.getCurrentTripId() && Store.getTripData(Store.getCurrentTripId())),
      null, { timeout: 8000 }
    );

    // Compte les reconstructions complètes de #plus-content (innerHTML = …).
    await page.addInitScript(() => {
      window.__plusRebuilds = 0;
      document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('plus-content');
        if (!el) return;
        new MutationObserver(muts => {
          // Une affectation innerHTML = 1 enregistrement sur #plus-content ;
          // les sous-panneaux, eux, peignent dans leurs propres <div> enfants.
          muts.forEach(m => { if (m.target === el) window.__plusRebuilds++; });
        }).observe(el, { childList: true });
      });
    });

    // Rechargement AVEC l'onglet Plus comme onglet courant : c'est ce qui rend le
    // refresh de boot observable sur #plus-content (sans hash, il repeindrait
    // « programme » et le cas passerait inaperçu).
    await page.evaluate(() => { window.location.hash = 'plus'; });
    await page.reload();
    await page.waitForSelector('#plus-experimental-head', { timeout: 8000 });
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
    await page.evaluate(() => {
      document.querySelector('#plus-content .page-header').setAttribute('data-refresh-marker', '1');
    });
    await page.waitForTimeout(1500); // probe + /version + repaint éventuel

    await expect(page.locator(MARKER)).toHaveCount(1);
    const rebuilds = await page.evaluate(() => window.__plusRebuilds);
    expect(rebuilds, 'l\'onglet Plus a été reconstruit plus d\'une fois sur un boot à chaud').toBe(1);
    await expect(page.locator('#plus-leo-chat-stream')).toContainText('Léo');
  });

  test('boot à froid (localStorage vide) : le voyage s\'affiche toujours', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    // Aucun cache au démarrage : c'est refreshFromBackend qui peint le premier écran.
    await expect(page.locator('#programme-content')).toContainText('Jour');
    const days = await page.evaluate(() => {
      const id = Store.getCurrentTripId();
      return (Store.getTripData(id) || {}).days?.length || 0;
    });
    expect(days).toBeGreaterThan(0);
  });
});
