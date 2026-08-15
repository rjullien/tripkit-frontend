/**
 * tests/construction-checks.spec.js — ActionBar et PhaseBar du mode Construction.
 *
 * Les charges utiles servies par page.route sont les fixtures dorées du backend
 * (tests/fixtures/construction-contract/, copie octet pour octet de
 * tripkit-backend/internal/handlers/testdata/contract/). Rien ici ne touche un
 * vrai backend : le cluster n'est pas joignable depuis les tests.
 */
import { test, expect } from './fixtures.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(name) {
  return readFileSync(join(__dirname, 'fixtures', 'construction-contract', name), 'utf8');
}

const QA = fixture('qa-violations.json');
const ADMIN = fixture('admin-check.json');
const HEALTH = fixture('health-check.json');
const NUISANCE = fixture('nuisance-check.json');
const BLOCKED = fixture('phase-transition-blocked.json');

function json(body, status = 200) {
  return { status, contentType: 'application/json', body };
}

/** Voyageurs avec nationalités : le regroupement admin par voyageur s'appuie dessus. */
const PROFILE = JSON.stringify({
  people: {
    alice: { id: 'alice', name: 'Alice', nationalities: ['FR'] },
    bob: { id: 'bob', name: 'Bob', nationalities: ['FR', 'US'] },
  },
  travelProfile: { pace: 'lent' },
  sources: ['test'],
});

async function openConstruction(page) {
  await page.goto('/');
  await page.waitForSelector('.bottom-nav button[data-tab]', { timeout: 8000 });
  await page.evaluate(() => {
    Store.set('tk-construction-mode', true);
    App.paintConstructionNav();
  });
  await page.locator('#nav-construction').click();
  await page.waitForSelector('#construction-action-bar', { timeout: 8000 });
}

test.describe('Construction ActionBar', () => {
  test('QA : les violations arrivent avec leurs badges', async ({ page }) => {
    await page.route('**/construction/qa', route => route.fulfill(json(QA)));
    await openConstruction(page);

    await page.locator('#action-qa').click();
    await expect(page.locator('#action-bar-results .action-results-header')).toContainText('QA : 2 problèmes');
    await expect(page.locator('#action-bar-results .action-results-header')).toContainText('phase 2');
    await expect(page.locator('#action-bar-results .qa-item')).toHaveCount(2);
    // Rouge d'abord, jaune ensuite.
    await expect(page.locator('#action-bar-results .qa-item').first()).toHaveClass(/qa-red/);
    await expect(page.locator('#action-bar-results .qa-item').first()).toContainText('Day 2 is missing');
    await expect(page.locator('#action-bar-results .qa-item').nth(1)).toHaveClass(/qa-yellow/);
    await expect(page.locator('#action-bar-results')).toContainText('transport_not_booked');
    await expect(page.locator('#action-bar-results')).not.toContainText('Aucun problème détecté');
  });

  test('QA : une enveloppe inconnue affiche une erreur, pas « aucun problème »', async ({ page }) => {
    // L'ancienne clé lue par le frontend : elle ne doit plus rassurer personne.
    await page.route('**/construction/qa', route => route.fulfill(json('{"results":[]}')));
    await openConstruction(page);

    await page.locator('#action-qa').click();
    await expect(page.locator('#action-bar-results .unrecognized-payload')).toBeVisible();
    await expect(page.locator('#action-bar-results')).toContainText('Réponse inattendue du serveur');
    await expect(page.locator('#action-bar-results')).not.toContainText('Aucun problème détecté');
  });

  test('QA : zéro violation reste un état vide légitime', async ({ page }) => {
    await page.route('**/construction/qa', route => route.fulfill(json('{"violations":[],"phase":1,"count":0}')));
    await openConstruction(page);

    await page.locator('#action-qa').click();
    await expect(page.locator('#action-bar-results .action-result-ok')).toContainText('Aucun problème détecté');
  });

  test('Admin : checklist par voyageur, pays et lien officiel', async ({ page }) => {
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE)));
    await page.route('**/admin-check', route => route.fulfill(json(ADMIN)));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    const results = page.locator('#action-bar-results');
    await expect(results).toContainText('Formalités administratives');
    await expect(results).toContainText('Pays détectés : CA, US');
    await expect(results).toContainText('Démarches à effectuer');
    // Un voyageur FR et un voyageur FR+US : les deux ont besoin de l'eTA canadien.
    await expect(results.locator('.admin-traveler')).toHaveCount(2);
    await expect(results.locator('.admin-traveler').first()).toContainText('Alice');
    await expect(results.locator('.admin-traveler').nth(1)).toContainText('Bob');
    await expect(results.locator('.admin-check-item')).toHaveCount(2);
    await expect(results).toContainText('eTA / AVE');
    await expect(results).toContainText('7 CAD');
    await expect(results.locator('a[href="https://www.canada.ca/eta"]')).toHaveCount(2);
    await expect(results).not.toContainText('Aucune formalité administrative requise');
  });

  test('Admin : une enveloppe inconnue affiche une erreur', async ({ page }) => {
    await page.route('**/admin-check', route => route.fulfill(json('{"travelers":[]}')));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    await expect(page.locator('#action-bar-results .unrecognized-payload')).toBeVisible();
    await expect(page.locator('#action-bar-results')).not.toContainText('Aucune formalité');
  });

  test('Santé : les items de la fixture Thaïlande sont affichés', async ({ page }) => {
    await page.route('**/health-check', route => route.fulfill(json(HEALTH)));
    await openConstruction(page);

    await page.locator('#action-sante').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.action-results-header')).toContainText('Santé : 4 recommandations');
    await expect(results.locator('.health-item')).toHaveCount(4);
    await expect(results).toContainText('Pays détectés : TH');
    await expect(results).toContainText('Vaccinations recommandees');
    await expect(results).toContainText('Risque de paludisme');
  });

  test('Santé : verdict none = silence, pas d’alarme', async ({ page }) => {
    await page.route('**/health-check', route => route.fulfill(json('{"verdict":"none","countries":["FR"],"items":null}')));
    await openConstruction(page);

    await page.locator('#action-sante').click();
    await expect(page.locator('#action-bar-results .action-result-ok')).toContainText('Aucune recommandation santé');
  });

  test('Nuisances : une analyse incomplète ne s’affiche jamais en vert', async ({ page }) => {
    await page.route('**/nuisance-check', route => route.fulfill(json(NUISANCE)));
    await openConstruction(page);

    await page.locator('#action-nuisances').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.nuisance-verdict')).toContainText('Analyse incomplète');
    await expect(results.locator('.nuisance-verdict')).toContainText('⚪');
    await expect(results.locator('.nuisance-incomplete')).toContainText('Catégories non vérifiées : trains');
    await expect(results).toContainText('Montréal Vieux-Port');
    await expect(results.locator('.nuisance-cat-unavailable')).toHaveCount(1);
    await expect(results).not.toContainText('Aucune nuisance');
  });

  test('Épingler : un 501 dit « pas encore disponible », jamais « Épinglé »', async ({ page }) => {
    await page.route('**/nuisance-check', route => route.fulfill(json(NUISANCE)));
    await page.route('**/nuisance-check/pin', route => route.fulfill(json(
      '{"error":"not_implemented","detail":"L\'écriture dans le seed n\'est pas encore branchée."}', 501)));
    await openConstruction(page);

    await page.locator('#action-nuisances').click();
    const pin = page.locator('#nuisance-pin-btn');
    await expect(pin).toBeVisible();
    await pin.click();
    await expect(pin).toHaveText('Pas encore disponible');
    await expect(pin).toBeDisabled();
    await expect(page.locator('#action-bar-results')).not.toContainText('Épinglé');
  });
});

test.describe('Construction profil voyageur', () => {
  test('demande de modification : un 501 ne peint aucun succès', async ({ page }) => {
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE)));
    await page.route('**/travel-profile/request', route => route.fulfill(json(
      '{"error":"not_implemented","detail":"Léo ne modifie pas encore le profil."}', 501)));
    await openConstruction(page);

    await page.locator('#construction-ctx-edit').click();
    await page.locator('#profile-edit-target').selectOption('interests');
    await page.locator('#profile-edit-text').fill('Plus de musées');
    await page.locator('#profile-edit-submit').click();

    const status = page.locator('#profile-edit-status');
    await expect(status).toContainText('Pas encore disponible');
    await expect(status).toContainText('Léo ne modifie pas encore le profil.');
    await expect(status).not.toContainText('Modification effectuée');
    await expect(page.locator('#profile-edit-submit')).toBeDisabled();
  });
});

test.describe('Construction PhaseBar', () => {
  test('phase 0 : barre « pas encore démarrée » et premier clic vers la phase 1', async ({ page }) => {
    await page.route('**/construction', route => route.fulfill(json('{"phase":0}')));

    const requested = [];
    await page.route('**/construction/phase*', route => {
      requested.push(route.request().postDataJSON());
      return route.fulfill(json('{"phase":1}'));
    });

    await openConstruction(page);
    await expect(page.locator('#construction-phase-bar .phase-label')).toContainText('Construction pas encore démarrée');
    await expect(page.locator('#construction-phase-bar')).toHaveAttribute('data-phase', '0');

    await page.locator('#construction-phase-next').click();
    await expect.poll(() => requested.length).toBeGreaterThan(0);
    expect(requested[0]).toEqual({ phase: 1 });
  });

  test('409 : les blocages arrivent en badges, aucun JSON brut', async ({ page }) => {
    await page.route('**/construction', route => route.fulfill(json('{"phase":2}')));
    await page.route('**/construction/phase*', route => route.fulfill(json(BLOCKED, 409)));

    await openConstruction(page);
    await expect(page.locator('#construction-phase-bar .phase-label')).toContainText('Phase 2');

    await page.locator('#construction-phase-next').click();
    const err = page.locator('#phase-transition-error');
    await expect(err).toBeVisible();
    await expect(err).toContainText('Transition bloquée : 1 blocage');
    await expect(err.locator('.qa-item.qa-red')).toHaveCount(1);
    await expect(err).toContainText('Day 2 is missing');
    const text = await err.textContent();
    expect(text).not.toContain('[{');
    expect(text).not.toContain('"severity"');
    // Le bouton redevient cliquable.
    await expect(page.locator('#construction-phase-next')).toBeEnabled();
  });

  test('403 : la transition forcée est réservée aux administrateurs', async ({ page }) => {
    await page.route('**/construction', route => route.fulfill(json('{"phase":2}')));
    await page.route('**/construction/phase*', route => route.fulfill(json('{"error":"admin_required"}', 403)));

    await openConstruction(page);
    await page.locator('#construction-phase-next').click();
    await expect(page.locator('#phase-transition-error')).toContainText('réservée à un administrateur');
  });
});
