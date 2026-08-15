/**
 * tests/construction-checks.spec.js — ActionBar checks in a real browser.
 *
 * Guards the cross-repo contract for SPEC §7 (admin + santé) and §8 (nuisances).
 * The unit tests call the render functions directly; these drive the actual
 * buttons against mocked HTTP responses shaped exactly like the Go backend's,
 * which is the only way to catch the failure mode that shipped: each panel read
 * a key the backend never sends, fell back to `[]`, and rendered a reassuring
 * empty state on every trip.
 */
import { test, expect } from './fixtures.js';

const NAV_BTN = '#nav-construction';
const RESULTS = '#action-bar-results';

/** Payload as marshalled by formalities.AdminCheckResult. */
const ADMIN_PAYLOAD = {
  verdict: 'action_required',
  countries: ['US'],
  summary: 'Rene doit demander un ESTA avant le depart.',
  travelers: [
    {
      id: 'rene',
      name: 'Rene',
      nationalities: ['FR'],
      verdict: 'action_required',
      items: [{
        country: 'US',
        type: 'esta',
        label: 'ESTA (Electronic System for Travel Authorization)',
        status: 'action_required',
        applies_to: ['FR'],
        detail: 'Cout : 21 USD \u00b7 Delai : 72h',
        url: 'https://esta.cbp.dhs.gov',
        cost: '21 USD',
        deadline: '72h',
      }],
    },
    {
      id: 'dinah',
      name: 'Dinah',
      nationalities: ['FR', 'US'],
      verdict: 'ok',
      items: [],
    },
  ],
  items: [{
    country: 'US', type: 'esta', label: 'ESTA', status: 'action_required', detail: '',
  }],
};

/** Payload as marshalled by nuisance.CheckResult (GET returns {results:[...]}). */
const NUISANCE_RESULTS = {
  results: [{
    locationId: 'hotel-port',
    locationName: 'Hotel du Port',
    verdict: 'MODERE',
    verdictEmoji: '\ud83d\udfe1',
    categories: [
      { category: 'trains', level: 'MODERE', emoji: '\ud83d\ude86', distance: 320, detail: 'voie ferree a 320m.' },
      { category: 'nightlife', level: 'FAIBLE', emoji: '\ud83c\udf7a', count: 1, detail: '1 etablissement detecte dans un rayon de 200m.' },
    ],
    recommendation: 'Demande une chambre cote cour.',
    alternatives: ['Hotel Central'],
    analyzedAt: new Date().toISOString(),
  }],
};

/** Enable construction mode and open the tab. */
async function openConstruction(page) {
  await page.goto('/');
  await page.waitForSelector('.bottom-nav button[data-tab]', { timeout: 8000 });
  await page.evaluate(() => {
    Store.set('tk-construction-mode', true);
    App.paintConstructionNav();
  });
  await page.locator(NAV_BTN).click();
  await page.waitForSelector('#construction-action-bar', { timeout: 8000 });
}

/** Mock one check endpoint. Registered after the fixture route, so it wins. */
async function mockCheck(page, path, body, status = 200) {
  await page.route(`**/api/trips/**/${path}`, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

/**
 * Click a check button and wait until its handler has finished rendering.
 *
 * Waiting on the response alone is not enough, and neither is clicking and
 * asserting: an assertion about something being *absent* would otherwise pass
 * against the still-empty container before the handler ever ran, which makes
 * the silence-rule test vacuous. The handler renders synchronously once its
 * fetch resolves, so response + one settled frame is the real barrier.
 */
async function runCheck(page, buttonId, urlPart) {
  await Promise.all([
    page.waitForResponse((r) => r.url().includes(urlPart)),
    page.locator(buttonId).click(),
  ]);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
  await expect(page.locator(buttonId)).not.toHaveText('...');
}

test.describe('Construction checks — Admin (SPEC §7.1)', () => {
  test('renders a checklist per traveler, not an empty state', async ({ page }) => {
    await mockCheck(page, 'admin-check', ADMIN_PAYLOAD);
    await openConstruction(page);

    await runCheck(page, '#action-admin', 'admin-check');
    await expect(page.locator('.action-results-admin')).toBeVisible();

    // Both travelers appear, including the one with nothing to do.
    await expect(page.locator(RESULTS)).toContainText('Rene');
    await expect(page.locator(RESULTS)).toContainText('Dinah');
    await expect(page.locator('.admin-traveler')).toHaveCount(2);
  });

  test('shows the ESTA that applies to the FR-only traveler', async ({ page }) => {
    await mockCheck(page, 'admin-check', ADMIN_PAYLOAD);
    await openConstruction(page);

    await runCheck(page, '#action-admin', 'admin-check');
    await expect(page.locator(RESULTS)).toContainText('ESTA');
    // Échéance et lien officiel (§7.1).
    await expect(page.locator(RESULTS)).toContainText('72h');
    await expect(page.locator('.admin-url a')).toHaveAttribute('href', 'https://esta.cbp.dhs.gov');
  });

  test('the bi-national traveler is shown as having nothing to file', async ({ page }) => {
    await mockCheck(page, 'admin-check', ADMIN_PAYLOAD);
    await openConstruction(page);

    await runCheck(page, '#action-admin', 'admin-check');
    const dinah = page.locator('.admin-traveler').filter({ hasText: 'Dinah' });
    await expect(dinah).toContainText('Aucune formalite requise');
    await expect(dinah).not.toContainText('ESTA');
  });

  test('renders the LLM summary separately from the computed rows', async ({ page }) => {
    await mockCheck(page, 'admin-check', ADMIN_PAYLOAD);
    await openConstruction(page);

    await runCheck(page, '#action-admin', 'admin-check');
    await expect(page.locator('.action-result-summary')).toContainText('ESTA avant le depart');
  });

  test('an empty backend response does not claim everything is fine', async ({ page }) => {
    // This is what the fixture catch-all returns for an unmocked /api/ call, and
    // what the panel used to receive for every real trip.
    await mockCheck(page, 'admin-check', {});
    await openConstruction(page);

    await runCheck(page, '#action-admin', 'admin-check');
    await expect(page.locator(RESULTS)).not.toContainText('voyageur');
    await expect(page.locator('.admin-traveler')).toHaveCount(0);
  });
});

test.describe('Construction checks — Santé (SPEC §7.2 règle de silence)', () => {
  test('verdict "none" renders no section at all', async ({ page }) => {
    await mockCheck(page, 'health-check', { verdict: 'none', countries: ['US'], items: null });
    await openConstruction(page);

    await runCheck(page, '#action-sante', 'health-check');
    // The results container must stay strictly empty: a health check that talks
    // to say nothing ends up ignored, including when it matters.
    await expect(page.locator(RESULTS)).toBeEmpty();
    await expect(page.locator('.action-results-health')).toHaveCount(0);
  });

  test('real advisories are rendered from items', async ({ page }) => {
    await mockCheck(page, 'health-check', {
      verdict: 'action_required',
      countries: ['TH'],
      summary: 'Traitement antipaludeen a discuter avec un medecin.',
      items: [
        { country: 'TH', type: 'malaria', label: 'Paludisme', status: 'warning', detail: 'Zones rurales' },
        { country: 'TH', type: 'water', label: 'Eau', status: 'action_required', detail: 'Eau en bouteille' },
      ],
    });
    await openConstruction(page);

    await runCheck(page, '#action-sante', 'health-check');
    await expect(page.locator('.action-results-health')).toBeVisible();
    await expect(page.locator(RESULTS)).toContainText('Paludisme');
    await expect(page.locator(RESULTS)).toContainText('Eau');
    await expect(page.locator('.health-item')).toHaveCount(2);
  });
});

test.describe('Construction checks — Nuisances (SPEC §8)', () => {
  test('renders the location name, categories and Bifrost synthesis', async ({ page }) => {
    // POST returns a jobId; the panel then subscribes to SSE and refetches.
    await mockCheck(page, 'nuisance-check', NUISANCE_RESULTS);
    await openConstruction(page);

    await page.evaluate((data) => {
      ConstructionView.renderNuisanceResults(data);
    }, NUISANCE_RESULTS);

    // The name must come from locationName, not fall back to the technical id.
    await expect(page.locator('.nuisance-loc-name')).toContainText('Hotel du Port');
    await expect(page.locator(RESULTS)).not.toContainText('hotel-port');
    await expect(page.locator('.nuisance-cat')).toHaveCount(2);
    await expect(page.locator('.nuisance-reco')).toContainText('cote cour');
    await expect(page.locator('.nuisance-alts')).toContainText('Hotel Central');
  });

  test('an indeterminate verdict is never shown as a green light', async ({ page }) => {
    await openConstruction(page);

    await page.evaluate(() => {
      ConstructionView.renderNuisanceResults({
        results: [{
          locationId: 'h1',
          locationName: 'Hotel Test',
          verdict: 'INDETERMINE',
          partial: true,
          categories: [
            { category: 'trains', level: 'INDETERMINE', emoji: '\u2753', detail: 'Source de donnees indisponible (Overpass) : verification impossible.' },
          ],
        }],
      });
    });

    const results = page.locator(RESULTS);
    await expect(results).toContainText('Analyse incomplete');
    await expect(results).toContainText('INDETERMINE');
    // 🟢 would mean "quiet place" on a check that never got its data.
    await expect(results).not.toContainText('\ud83d\udfe2');
    await expect(page.locator('.nuisance-cat-unknown')).toHaveCount(1);
  });

  test('an empty result list does not report the trip as quiet', async ({ page }) => {
    await openConstruction(page);

    await page.evaluate(() => {
      ConstructionView.renderNuisanceResults({ results: [] });
    });

    await expect(page.locator(RESULTS)).not.toContainText('Aucune nuisance detectee');
  });
});
