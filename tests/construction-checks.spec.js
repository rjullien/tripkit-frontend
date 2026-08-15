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

/** Groupe mixte : la nationalité de Chen n'est visée par aucune règle de la base. */
const PROFILE_MIXED = JSON.stringify({
  people: {
    alice: { id: 'alice', name: 'Alice', nationalities: ['FR'] },
    chen: { id: 'chen', name: 'Chen', nationalities: ['CN'] },
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

  // Le cas que la restriction de `appliesTo` a rendu atteignable : un voyageur
  // dont aucune règle ne parle. La base ne couvre qu'une douzaine de destinations,
  // donc « zéro item » veut dire « pas de règle connue », jamais « rien à faire » —
  // un passeport chinois parti aux États-Unis a besoin d'un visa B1/B2.
  test("Admin : un passeport que la base ne couvre pas n'est jamais annoncé en vert", async ({ page }) => {
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE_MIXED)));
    await page.route('**/admin-check', route => route.fulfill(json(ADMIN)));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.admin-traveler')).toHaveCount(2);

    // Alice (FR) reçoit l'eTA canadien ; Chen (CN) n'est visé par aucune règle.
    const chen = results.locator('.admin-traveler').filter({ hasText: 'Chen' });
    await expect(chen).toContainText('Aucune règle connue pour ce passeport');
    await expect(chen).toContainText('à vérifier');
    await expect(chen.locator('.admin-unknown')).toHaveCount(1);
    await expect(chen).not.toContainText('Aucune démarche spécifique');
    await expect(results).not.toContainText('✅ Aucune');

    // Et la limite du moteur est dite dans le panneau, pas seulement dans un doc :
    // la présence d'un item est calculée sur l'union des nationalités du voyage.
    await expect(results.locator('.admin-limitation')).toContainText("pas passeport par passeport");
  });

  // La charge utile est celle que le service envoie VRAIMENT sur un check vide :
  // `worstVerdict([])` vaut "ok", donc AdminCheck renvoie verdict "ok" avec zéro
  // item dès qu'aucun pays n'est détecté, qu'aucune nationalité n'est connue
  // (`nationalities` est optionnel dans un seed) ou qu'aucune règle ne matche.
  // « ✅ Rien à faire » se serait affiché AU-DESSUS de l'avertissement orange.
  test("Admin : zéro item pour le voyage se lit « aucune règle connue », pas « rien à faire »", async ({ page }) => {
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE)));
    await page.route('**/admin-check', route => route.fulfill(json('{"verdict":"ok","countries":["BR"],"items":[]}')));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.admin-unknown')).toContainText('Aucune règle connue pour cette destination');
    await expect(results).toContainText("Ce silence n'est pas un feu vert");
    await expect(results).not.toContainText('Aucune formalité administrative requise');
    // La phrase de verdict elle-même, pas seulement la chaîne qu'elle ne contient pas.
    await expect(results).not.toContainText('Rien à faire');
    await expect(results.locator('.admin-verdict')).toHaveCount(0);
    await expect(results.locator('.action-result-ok')).toHaveCount(0);
    await expect(results).not.toContainText('✅');
  });

  // Aucun pays déduit du voyage : le moteur n'a rien analysé. Dire « aucune règle
  // connue pour cette destination » affirmerait une destination que le backend n'a
  // jamais eue.
  test("Admin : sans pays détecté, le panneau dit que la destination n'est pas identifiée", async ({ page }) => {
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE)));
    await page.route('**/admin-check', route => route.fulfill(json('{"verdict":"ok","countries":null,"items":[]}')));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.admin-unknown')).toContainText('Destination non identifiée');
    await expect(results).not.toContainText('Rien à faire');
    await expect(results.locator('.action-result-ok')).toHaveCount(0);
  });

  test('Admin : une enveloppe inconnue affiche une erreur', async ({ page }) => {
    await page.route('**/admin-check', route => route.fulfill(json('{"travelers":[]}')));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    await expect(page.locator('#action-bar-results .unrecognized-payload')).toBeVisible();
    await expect(page.locator('#action-bar-results')).not.toContainText('Aucune formalité');
  });

  // Lot #76 : échéance + lien officiel + prose LLM dans un bloc distinct.
  // La fixture d'or n'a ni deadline ni summary (Bifrost optionnel) : on les
  // ajoute ici sans toucher au fichier d'or.
  test('Admin : échéance, lien officiel et résumé LLM visuellement séparés', async ({ page }) => {
    const payload = JSON.parse(ADMIN);
    payload.summary = 'Alice doit demander un eTA canadien.';
    payload.items[0].deadline = '72h';
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE)));
    await page.route('**/admin-check', route => route.fulfill(json(JSON.stringify(payload))));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.admin-deadline')).toHaveCount(2);
    await expect(results).toContainText('Échéance : 72h');
    await expect(results.locator('a[href="https://www.canada.ca/eta"]')).toHaveCount(2);
    await expect(results.locator('.action-result-summary')).toContainText('Alice doit demander un eTA canadien.');
  });

  // Lot #76 : `/ok|done|valid/` faisait retomber `invalid` sur un tick vert.
  test("Admin : un statut inconnu n'est jamais un tick vert", async ({ page }) => {
    const payload = JSON.parse(ADMIN);
    payload.items[0].status = 'invalid';
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE)));
    await page.route('**/admin-check', route => route.fulfill(json(JSON.stringify(payload))));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    const item = page.locator('#action-bar-results .admin-check-item').first();
    await expect(item).toContainText('❓');
    await expect(item).not.toContainText('✅');
  });

  test('Admin : nationality_unknown arrive comme un item, pas via travelers[]', async ({ page }) => {
    const payload = {
      verdict: 'warning',
      countries: ['US'],
      items: [{
        type: 'nationality_unknown',
        label: 'Nationalité non renseignée',
        status: 'warning',
        detail: 'Ajoute nationalities au profil.',
        appliesTo: ['*'],
      }],
    };
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE)));
    await page.route('**/admin-check', route => route.fulfill(json(JSON.stringify(payload))));
    await openConstruction(page);

    await page.locator('#action-admin').click();
    const results = page.locator('#action-bar-results');
    await expect(results).toContainText('Nationalité non renseignée');
    await expect(results).toContainText('Ajoute nationalities');
    await expect(results.locator('.unrecognized-payload')).toHaveCount(0);
  });

  test('Santé : les items de la fixture Thaïlande sont affichés', async ({ page }) => {
    await page.route('**/health-check', route => route.fulfill(json(HEALTH)));
    await openConstruction(page);

    await page.locator('#action-sante').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.action-results-header')).toContainText('Santé : 4 recommandations');
    await expect(results.locator('.health-item')).toHaveCount(4);
    await expect(results).toContainText('Pays détectés : TH');
    await expect(results).toContainText('Vaccinations recommandées');
    await expect(results).toContainText('Risque de paludisme');
  });

  // Destination connue et sans recommandation : silence voulu par la spec
  // (construction/SPEC.md §7.2). Le ✅ vert reste légitime ICI, et seulement ici.
  test('Santé : verdict none sur un pays détecté = silence, pas d’alarme', async ({ page }) => {
    await page.route('**/health-check', route => route.fulfill(json('{"verdict":"none","countries":["FR"],"items":null}')));
    await openConstruction(page);

    await page.locator('#action-sante').click();
    await expect(page.locator('#action-bar-results .action-result-ok')).toContainText('Aucune recommandation santé');
    await expect(page.locator('#action-bar-results .health-unknown')).toHaveCount(0);
  });

  // Même verdict "none", situation opposée : `countries` vide veut dire que
  // DetectCountries n'a rien reconnu, donc qu'aucune recommandation n'a été
  // cherchée. Le vaccin manquant se lisait comme un feu vert.
  test("Santé : sans pays détecté, le silence de la spec ne s'applique pas", async ({ page }) => {
    await page.route('**/health-check', route => route.fulfill(json('{"verdict":"none","countries":[],"items":null}')));
    await openConstruction(page);

    await page.locator('#action-sante').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.health-unknown')).toContainText('Destination non identifiée');
    await expect(results.locator('.health-unknown')).toContainText('aucun contrôle');
    await expect(results.locator('.action-result-ok')).toHaveCount(0);
    await expect(results).not.toContainText('Aucune recommandation santé');
    await expect(results).not.toContainText('✅');
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

  // Lot #76 : la fixture d'or a recommendation vide et alternatives null.
  test('Nuisances : recommandation Bifrost et alternatives', async ({ page }) => {
    const payload = JSON.parse(NUISANCE);
    payload.results[0].recommendation = 'Changer de quartier.';
    payload.results[0].alternatives = ['Rue calme', 'Airbnb intérieur'];
    await page.route('**/nuisance-check', route => route.fulfill(json(JSON.stringify(payload))));
    await openConstruction(page);

    await page.locator('#action-nuisances').click();
    const results = page.locator('#action-bar-results');
    await expect(results.locator('.nuisance-reco')).toContainText('Changer de quartier.');
    await expect(results.locator('.nuisance-alts')).toContainText('Rue calme');
    await expect(results.locator('.nuisance-alts')).toContainText('Airbnb intérieur');
  });

  // Le report d'une fonctionnalité doit se voir AVANT l'action : révéler « Pas
  // encore disponible » seulement après le clic est honnête trop tard.
  test('Épingler : indisponibilité annoncée avant le clic', async ({ page }) => {
    await page.route('**/nuisance-check', route => route.fulfill(json(NUISANCE)));
    await openConstruction(page);

    await page.locator('#action-nuisances').click();
    const pin = page.locator('#nuisance-pin-btn');
    await expect(pin).toBeVisible();
    await expect(pin).toHaveAttribute('title', /Pas encore branché/);
    await expect(pin).toHaveClass(/deferred/);
    await expect(pin).toContainText('⏳');
  });

  // Un flux nuisances abandonné continuait jusqu'à sa trame `done` puis allait
  // chercher le résultat final pour repeindre un panneau que plus personne ne
  // regarde. Chaque panneau coupait déjà son propre flux ; il manquait la sortie
  // d'onglet. Preuve : le GET final n'est jamais émis.
  test("quitter l'onglet coupe le flux nuisances en cours", async ({ page }) => {
    let finalFetches = 0;
    await page.route('**/nuisance-check', route => {
      if (route.request().method() !== 'GET') {
        return route.fulfill(json('{"jobId":"job-nuis-abort"}', 202));
      }
      finalFetches++;
      return route.fulfill(json(NUISANCE));
    });
    // Le `done` n'arrive qu'après un délai : on quitte l'onglet avant.
    await page.route('**/leo/jobs/job-nuis-abort/stream**', async route => {
      await new Promise(r => setTimeout(r, 1200));
      try {
        await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'event: done\ndata: {}\n\n' });
      } catch (_) { /* client parti : c'est exactement l'abandon attendu */ }
    });

    await openConstruction(page);
    await page.locator('#action-nuisances').click();
    await expect(page.locator('#action-bar-results .nuisance-progress')).toBeVisible();
    expect(finalFetches).toBe(0);

    await page.locator('.bottom-nav button[data-tab="programme"]').click();
    await page.waitForTimeout(2200);

    expect(finalFetches, 'le flux abandonné ne doit plus aller chercher le résultat final').toBe(0);
  });

  // L'autre porte de sortie : le routeur. Le clic sur la nav passe par
  // switchTab() ; un retour navigateur ou un hash saisi à la main passe par
  // handleHash(), qui appelle le même teardown — non couvert jusqu'ici.
  test('retour navigateur : le hash change et coupe aussi le flux', async ({ page }) => {
    let finalFetches = 0;
    await page.route('**/nuisance-check', route => {
      if (route.request().method() !== 'GET') {
        return route.fulfill(json('{"jobId":"job-nuis-hash"}', 202));
      }
      finalFetches++;
      return route.fulfill(json(NUISANCE));
    });
    await page.route('**/leo/jobs/job-nuis-hash/stream**', async route => {
      await new Promise(r => setTimeout(r, 1200));
      try {
        await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'event: done\ndata: {}\n\n' });
      } catch (_) { /* client parti : abandon attendu */ }
    });

    await openConstruction(page);
    await page.locator('#action-nuisances').click();
    await expect(page.locator('#action-bar-results .nuisance-progress')).toBeVisible();

    // Retour navigateur : aucun onclick de la nav n'est joué, seul hashchange l'est.
    await page.goBack();
    await expect(page.locator('#tab-programme')).toHaveClass(/active/);
    await page.waitForTimeout(2200);

    expect(finalFetches, 'handleHash doit couper le flux comme switchTab').toBe(0);
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
  test('travel-profile.js : rythme lu sous travelStyle', async ({ page }) => {
    await page.route('**/travel-profile', route => route.fulfill(json(JSON.stringify({
      people: { rene: { id: 'rene', name: 'René' } },
      travelProfile: {
        travelStyle: { pace: 'modéré', maxDrivingPerDay: '4h' },
        budgetRules: { accommodation: { maxPerNight: 200, currency: 'EUR' } },
        interests: { rene: { likes: ['parcs nationaux'], dislikes: [] } },
      },
    }))));
    await openConstruction(page);
    const box = page.locator('#construction-context-box');
    await expect(box).toContainText('Rythme');
    await expect(box).toContainText('modéré');
    await expect(box).toContainText('4h');
    await expect(box).toContainText('parcs nationaux');
  });

  test('demande de modification : un 501 ne peint aucun succès', async ({ page }) => {
    await page.route('**/travel-profile', route => route.fulfill(json(PROFILE)));
    await page.route('**/travel-profile/request', route => route.fulfill(json(
      '{"error":"not_implemented","detail":"Léo ne modifie pas encore le profil."}', 501)));
    await openConstruction(page);

    await page.locator('#construction-ctx-edit').click();
    // Annoncé d'entrée : on ne laisse pas l'utilisateur remplir le formulaire
    // pour lui apprendre ensuite que la fonctionnalité n'existe pas.
    await expect(page.locator('#profile-edit-deferred')).toContainText('Pas encore disponible');
    await expect(page.locator('#profile-edit-deferred')).toContainText('rien ne sera enregistré');
    await expect(page.locator('#profile-edit-submit')).toHaveAttribute('title', /Pas encore branché/);
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
