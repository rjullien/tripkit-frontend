/**
 * tests/bookings.spec.js — Onglet Résa (ex-Hotels)
 */
import { test, expect } from './fixtures.js';

test.describe('Résa tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="hotels"]').click();
    await page.waitForTimeout(400);
  });

  test('nav label is Résa', async ({ page }) => {
    const btn = page.locator('.bottom-nav button[data-tab="hotels"]');
    await expect(btn).toContainText('Résa');
  });

  test('shows flights, car, ferry, events and hotels', async ({ page }) => {
    const content = page.locator('#hotels-content');
    await expect(content).toContainText('Réservations');
    await expect(content).toContainText('Transport principal');
    await expect(content).toContainText('TESTPNR');
    await expect(content).toContainText('Location de voiture');
    await expect(content).toContainText('RENT123');
    await expect(content).toContainText('Traversier');
    await expect(content).toContainText('FERRY1');
    await expect(content).toContainText('Événements');
    await expect(content).toContainText('Test Show');
    await expect(content).toContainText('Grand Hotel');
  });

  test('renders cancellation and content badge tags', async ({ page }) => {
    const badges = page.locator('#hotels-content .badge');
    expect(await badges.count()).toBeGreaterThan(3);
    const text = await page.locator('#hotels-content').textContent();
    expect(text).toMatch(/Non remboursable|Flexible|À vérifier/);
    expect(text).toContain('Front row');
  });

  test('deep link #hotels still opens the tab', async ({ page }) => {
    await page.goto('/#hotels');
    await page.waitForTimeout(400);
    await expect(page.locator('#tab-hotels')).toBeVisible();
    await expect(page.locator('#hotels-content')).toContainText('Réservations');
  });
});

test.describe('Résa — flux nuisances par hôtel', () => {
  /**
   * Stub un flux nuisances par hôtel dont le `done` n'arrive qu'après 1,2 s, et
   * compte les GET du résultat final : ce GET est la preuve observable qu'un flux
   * a survécu à ce qui devait le couper.
   * @returns {() => number} lecture du compteur de GET finaux
   */
  async function stubSlowHotelNuisanceStream(page) {
    const counter = { finalFetches: 0 };

    await page.route('**/nuisance-check', route => {
      if (route.request().method() !== 'GET') {
        return route.fulfill({ status: 202, contentType: 'application/json', body: '{"jobId":"job-hotel-nuis"}' });
      }
      counter.finalFetches++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"results":[]}' });
    });
    await page.route('**/leo/jobs/job-hotel-nuis/stream**', async route => {
      await new Promise(r => setTimeout(r, 1200));
      try {
        await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'event: done\ndata: {}\n\n' });
      } catch (_) { /* client parti : c'est exactement l'abandon attendu */ }
    });

    return () => counter.finalFetches;
  }

  async function startHotelNuisanceStream(page) {
    await page.locator('.bottom-nav button[data-tab="hotels"]').click();
    const btn = page.locator('#hotels-content .hotel-nuisance-btn').first();
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator('#hotels-content .nuisance-progress').first()).toBeVisible();
  }

  // Le contrôleur d'abandon d'un flux par hôtel vivait uniquement sur son bouton,
  // et `BookingsView.render()` reconstruit `hotels-content` au retour sur
  // l'onglet : le flux abandonné n'était alors plus annulable par personne et
  // finissait par repeindre un nœud détaché. Preuve de la coupure : le GET du
  // résultat final n'est jamais émis.
  test("quitter l'onglet coupe le flux nuisances d'un hôtel", async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav button[data-tab]', { timeout: 8000 });
    const finalFetches = await stubSlowHotelNuisanceStream(page);

    await startHotelNuisanceStream(page);
    expect(finalFetches()).toBe(0);

    await page.locator('.bottom-nav button[data-tab="programme"]').click();
    await page.waitForTimeout(2200);

    expect(finalFetches(), "un flux d'hôtel abandonné ne doit plus aller chercher le résultat final").toBe(0);
  });

  // La sortie d'onglet n'est pas le seul ré-affichage : `App.refreshFromBackend()`
  // appelle `renderCurrentTab()` sans changer d'onglet (kick `visibilitychange` /
  // `online` : verrouiller puis déverrouiller un téléphone pendant l'analyse).
  // `hotels-content` est reconstruit sous le flux vivant, donc la ligne de
  // progression visible ne se résolvait plus jusqu'à la sortie d'onglet.
  test('un ré-affichage sur place coupe aussi le flux nuisances', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav button[data-tab]', { timeout: 8000 });
    const finalFetches = await stubSlowHotelNuisanceStream(page);

    await startHotelNuisanceStream(page);
    expect(finalFetches()).toBe(0);

    // reloadAllViews() == renderCurrentTab(), le chemin exact de refreshFromBackend.
    await page.evaluate(() => App.reloadAllViews());
    await expect(page.locator('#tab-hotels')).toBeVisible();
    // Le nœud qui portait la progression a disparu avec le ré-affichage : plus
    // personne n'attend un résultat, donc le bouton est de nouveau actionnable.
    await expect(page.locator('#hotels-content .nuisance-progress')).toHaveCount(0);
    await expect(page.locator('#hotels-content .hotel-nuisance-btn').first()).toBeEnabled();

    await page.waitForTimeout(2200);
    expect(finalFetches(), 'un flux coupé par le ré-affichage ne va pas chercher le résultat final').toBe(0);
  });
});
