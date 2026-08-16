/**
 * tests/construction-contract.test.cjs — Contrat cross-repo du mode Construction.
 *
 * Les fixtures de tests/fixtures/construction-contract/ sont une copie
 * OCTET POUR OCTET de tripkit-backend/internal/handlers/testdata/contract/,
 * capturée depuis les vrais handlers HTTP. Régénération :
 *
 *   cd tripkit-backend
 *   go test ./internal/handlers/ -run TestContractFixtures -update
 *   cp internal/handlers/testdata/contract/*.json \
 *      internal/handlers/testdata/contract/CHECKSUMS.txt \
 *      ../tripkit-frontend/tests/fixtures/construction-contract/
 *
 * La recopie n'est plus laissée à la mémoire de l'auteur : CHECKSUMS.txt est un
 * manifeste sha256 committé des deux côtés, vérifié ici ET par
 * TestContractFixtures_Checksums côté backend, et
 * TestContractFixtures_FrontendCopyInSync compare les deux répertoires octet à
 * octet quand les deux dépôts sont clonés côte à côte.
 *
 * Voir tripkit-backend/internal/handlers/testdata/contract/README.md.
 *
 * Raison d'être : les trois enveloppes QA / admin-check / health-check ont pu
 * partir en production avec les deux suites de tests vertes, parce qu'aucun test
 * ne traversait la frontière entre les deux dépôts. Ici, un changement
 * d'enveloppe côté backend casse ce test côté frontend.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));

// ── Stubs navigateur minimaux (les deux modules testés ne touchent au DOM que
// via l'élément qu'on leur passe) ────────────────────────────────────────────
const _elements = {};
global.document = {
  addEventListener() {},
  getElementById(id) { return _elements[id] || null; },
  querySelectorAll() { return []; },
};
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.navigator = { onLine: true };
global.AbortController = class { constructor() { this.signal = { aborted: false }; } abort() { this.signal.aborted = true; } };
global.API = {
  leoJobStream() { return (async function* () {})(); },
  getNuisanceCheck() { return Promise.resolve({ ok: false, status: 0, data: null, error: 'stub' }); },
};
global.Store = { getCurrentTripId() { return 'trip-1'; }, getTripData() { return null; } };

eval(fs.readFileSync('js/construction-contract.js', 'utf8'));
eval(fs.readFileSync('js/components/nuisance-stream.js', 'utf8'));
global.LeoChatStream = { create() { return { mount() {}, unmount() {} }; } };
global.App = { ensureEdgeBundle() { return Promise.resolve(); } };
eval(fs.readFileSync('js/components/construction-view.js', 'utf8'));

const FIXTURES = path.join('tests', 'fixtures', 'construction-contract');
function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf8'));
}

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); console.log(`  \u2705 ${name}`); pass++; }
  catch (e) { console.log(`  \u274c ${name}\n     ${e.message}`); fail++; process.exitCode = 1; }
}

// Les cas qui traversent le flux SSE sont asynchrones : ils sont collectés ici
// et joués après les tests synchrones, avant le récapitulatif.
const asyncTests = [];
function testAsync(name, fn) { asyncTests.push([name, fn]); }

console.log('\n\u2500\u2500 Construction contract (golden fixtures) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

// ── Les cinq fixtures sont présentes ───────────────────────────────────────────

test('les cinq fixtures dorées du backend sont présentes', () => {
  const files = fs.readdirSync(FIXTURES).filter(f => f.endsWith('.json')).sort();
  assert.deepStrictEqual(files, [
    'admin-check.json',
    'health-check.json',
    'nuisance-check.json',
    'phase-transition-blocked.json',
    'qa-violations.json',
  ]);
});

// ── Le manifeste sha256 partagé avec le backend ────────────────────────────────
//
// Sans ce contrôle, une enveloppe régénérée côté backend et jamais recopiée ici
// laissait les deux suites vertes contre une fixture périmée — exactement l'angle
// mort que ces fixtures existent pour fermer.

test('CHECKSUMS.txt correspond aux fixtures locales', () => {
  const manifest = fs.readFileSync(path.join(FIXTURES, 'CHECKSUMS.txt'), 'utf8');
  const lines = manifest.split('\n').filter(l => l.trim() !== '');
  assert.strictEqual(lines.length, 5, 'le manifeste couvre les cinq fixtures');

  const listed = [];
  lines.forEach(line => {
    // Format sha256sum : <hash>  <nom de fichier>
    const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(line);
    assert.ok(m, `ligne de manifeste illisible : ${line}`);
    const [, want, name] = m;
    listed.push(name);
    const got = crypto.createHash('sha256').update(fs.readFileSync(path.join(FIXTURES, name))).digest('hex');
    assert.strictEqual(got, want,
      `${name} ne correspond pas à CHECKSUMS.txt : recopier les fixtures ET le manifeste depuis ` +
      'tripkit-backend/internal/handlers/testdata/contract/');
  });

  const onDisk = fs.readdirSync(FIXTURES).filter(f => f.endsWith('.json')).sort();
  assert.deepStrictEqual(listed.slice().sort(), onDisk,
    'le manifeste et le répertoire ne listent pas les mêmes fichiers');
});

// ── QA ─────────────────────────────────────────────────────────────────────────

test('parseQA lit {violations, phase, count} de la fixture', () => {
  const parsed = ConstructionContract.parseQA(fixture('qa-violations.json'));
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.violations.length, 2);
  assert.strictEqual(parsed.count, 2);
  assert.strictEqual(parsed.phase, 2);
  const codes = parsed.violations.map(v => v.code).sort();
  assert.deepStrictEqual(codes, ['day_gap', 'transport_not_booked']);
  const severities = parsed.violations.map(v => v.severity).sort();
  assert.deepStrictEqual(severities, ['red', 'yellow']);
});

test('sortViolations remonte les rouges avant les jaunes', () => {
  const parsed = ConstructionContract.parseQA(fixture('qa-violations.json'));
  const sorted = ConstructionContract.sortViolations(parsed.violations);
  assert.strictEqual(sorted[0].severity, 'red');
  assert.strictEqual(sorted[1].severity, 'yellow');
  // La liste d'origine n'est pas modifiée.
  assert.strictEqual(parsed.violations.length, 2);
});

test('parseQA : violations null (slice Go nil) = liste vide reconnue', () => {
  const parsed = ConstructionContract.parseQA({ violations: null, phase: 0, count: 0 });
  assert.strictEqual(parsed.ok, true);
  assert.deepStrictEqual(parsed.violations, []);
  assert.strictEqual(parsed.phase, 0);
});

test("parseQA : l'ancienne clé data.results n'est PAS acceptée", () => {
  const parsed = ConstructionContract.parseQA({ results: [] });
  assert.strictEqual(parsed.ok, false);
  assert.strictEqual(parsed.reason, 'unrecognized_payload');
});

// ── Phase ──────────────────────────────────────────────────────────────────────

test('readPhase préserve la phase 0 et signale une phase absente', () => {
  assert.strictEqual(ConstructionContract.readPhase({ phase: 0 }), 0);
  assert.strictEqual(ConstructionContract.readPhase({ phase: 3 }), 3);
  assert.strictEqual(ConstructionContract.readPhase({}), null);
  assert.strictEqual(ConstructionContract.readPhase(null), null);
  assert.strictEqual(ConstructionContract.readPhase({ phase: '2' }), null);
});

// ── Blocages de transition (409) ───────────────────────────────────────────────

test('parseBlockers lit les blocages structurés du 409', () => {
  const data = fixture('phase-transition-blocked.json');
  assert.strictEqual(data.error, 'transition_blocked');
  const blockers = ConstructionContract.parseBlockers(data);
  assert.strictEqual(blockers.length, 1);
  assert.strictEqual(blockers[0].code, 'day_gap');
  assert.strictEqual(blockers[0].severity, 'red');
  assert.strictEqual(blockers[0].dayNum, 2);
});

test('parseBlockers rend undefined quand le corps ne porte pas de blockers', () => {
  assert.strictEqual(ConstructionContract.parseBlockers({ error: 'boom' }), undefined);
});

// ── Admin-check ────────────────────────────────────────────────────────────────

test('parseAdminCheck lit {verdict, countries, items} de la fixture', () => {
  const parsed = ConstructionContract.parseAdminCheck(fixture('admin-check.json'));
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.verdict, 'action_required');
  assert.deepStrictEqual(parsed.countries, ['CA', 'US']);
  assert.strictEqual(parsed.items.length, 1);
  assert.strictEqual(parsed.items[0].country, 'CA');
  assert.strictEqual(parsed.items[0].type, 'eta');
  assert.strictEqual(parsed.items[0].status, 'action_required');
  assert.strictEqual(parsed.items[0].url, 'https://www.canada.ca/eta');
  assert.strictEqual(parsed.items[0].cost, '7 CAD');
  // summary est optionnel (absent sans Bifrost configuré).
  assert.strictEqual(parsed.summary, '');
});

test('appliesTo est en camelCase, applies_to reste toléré', () => {
  const item = fixture('admin-check.json').items[0];
  assert.ok('appliesTo' in item, 'la fixture porte appliesTo');
  assert.ok(!('applies_to' in item), 'la fixture ne porte plus applies_to');
  assert.deepStrictEqual(ConstructionContract.itemAppliesTo(item), ['FR']);
  assert.deepStrictEqual(ConstructionContract.itemAppliesTo({ applies_to: ['FR'] }), ['FR']);
});

// Le backend restreint désormais appliesTo aux nationalités qui DÉCLENCHENT la
// règle (voyage FR+US, l'eTA canadien ne concerne que le passeport FR). Sans
// cette restriction le regroupement par voyageur était décoratif : chacun
// recevait toutes les formalités du voyage.
test('appliesTo ne porte que les nationalités déclenchantes, pas tout le voyage', () => {
  const parsed = ConstructionContract.parseAdminCheck(fixture('admin-check.json'));
  const eta = parsed.items.find(i => i.type === 'eta');
  const applies = ConstructionContract.itemAppliesTo(eta);
  assert.deepStrictEqual(applies, ['FR'], "l'eTA canadien ne concerne pas le passeport US");
  assert.ok(applies.indexOf('US') === -1, 'US ne doit pas être listé');
  // La liste n'est jamais vide : une liste vide se relit « tous les voyageurs ».
  parsed.items.forEach(i => {
    assert.ok(ConstructionContract.itemAppliesTo(i).length > 0, `appliesTo vide sur ${i.country}/${i.type}`);
  });
});

test("un voyageur hors du appliesTo ne reçoit pas l'item", () => {
  const parsed = ConstructionContract.parseAdminCheck(fixture('admin-check.json'));
  const groups = ConstructionContract.groupAdminItemsByTraveler(parsed.items, {
    rene: { name: 'René', nationalities: ['FR'] },
    dinah: { name: 'Dinah', nationalities: ['FR', 'US'] },
    hank: { name: 'Hank', nationalities: ['US'] },
  });
  const byName = {};
  groups.travelers.forEach(t => { byName[t.name] = t; });
  assert.strictEqual(byName['René'].items.length, 1, 'René (FR) doit demander un eTA');
  assert.strictEqual(byName['Dinah'].items.length, 1, 'Dinah (FR+US) aussi, par son passeport FR');
  assert.strictEqual(byName['Hank'].items.length, 0,
    "Hank (US seul) n'est pas éligible à l'eTA canadien : il ne doit rien recevoir");
  assert.strictEqual(groups.everyone.length, 0, 'aucun item universel ici');
  assert.strictEqual(groups.unassigned.length, 0, 'aucun item orphelin');
});

test('cas bi-national FR+US : eTA canadien pour tous, aucun ESTA', () => {
  const parsed = ConstructionContract.parseAdminCheck(fixture('admin-check.json'));
  // Un passeport US supprime l'ESTA (destination US) mais pas l'eTA canadien.
  assert.strictEqual(parsed.items.filter(i => i.type === 'esta').length, 0);
  assert.strictEqual(parsed.items.filter(i => i.type === 'eta').length, 1);
});

test('groupAdminItemsByTraveler bâtit une checklist par voyageur', () => {
  const parsed = ConstructionContract.parseAdminCheck(fixture('admin-check.json'));
  const people = {
    rene: { name: 'René', nationalities: ['FR'] },
    dinah: { name: 'Dinah', nationalities: ['FR', 'US'] },
    yuki: { name: 'Yuki', nationalities: ['JP'] },
  };
  const groups = ConstructionContract.groupAdminItemsByTraveler(parsed.items, people);
  assert.strictEqual(groups.grouped, true);
  assert.strictEqual(groups.travelers.length, 3);
  const byName = {};
  groups.travelers.forEach(t => { byName[t.name] = t; });
  assert.strictEqual(byName['René'].items.length, 1, 'René (FR) concerné par l\'eTA');
  assert.strictEqual(byName['Dinah'].items.length, 1, 'Dinah (FR+US) concernée par l\'eTA');
  assert.strictEqual(byName['Yuki'].items.length, 0, 'Yuki (JP) hors du appliesTo FR/US');
  assert.strictEqual(groups.everyone.length, 0);
  assert.strictEqual(groups.unassigned.length, 0);
});

test('groupAdminItemsByTraveler : appliesTo * ou vide = tous les voyageurs', () => {
  const items = [
    { country: 'IN', label: 'Visa', status: 'action_required', appliesTo: ['*'] },
    { country: 'BR', label: 'Passeport', status: 'warning', appliesTo: [] },
  ];
  const groups = ConstructionContract.groupAdminItemsByTraveler(items, [{ name: 'René', nationalities: ['FR'] }]);
  assert.strictEqual(groups.everyone.length, 2);
  assert.strictEqual(groups.travelers[0].items.length, 0);
});

test('groupAdminItemsByTraveler : sans voyageur connu, grouped=false', () => {
  const parsed = ConstructionContract.parseAdminCheck(fixture('admin-check.json'));
  const groups = ConstructionContract.groupAdminItemsByTraveler(parsed.items, null);
  assert.strictEqual(groups.grouped, false);
  assert.strictEqual(groups.everyone.length, 1);
  assert.strictEqual(groups.travelers.length, 0);
});

test('groupAdminItemsByTraveler : nationalité rattachée à personne', () => {
  const items = [{ country: 'US', label: 'ESTA', status: 'action_required', appliesTo: ['DE'] }];
  const groups = ConstructionContract.groupAdminItemsByTraveler(items, [{ name: 'René', nationalities: ['FR'] }]);
  assert.strictEqual(groups.unassigned.length, 1, 'jamais silencieusement perdu');
  assert.strictEqual(groups.travelers[0].items.length, 0);
});

test("parseAdminCheck : l'ancienne clé data.travelers n'est PAS acceptée", () => {
  assert.strictEqual(ConstructionContract.parseAdminCheck({ travelers: [] }).ok, false);
  assert.strictEqual(ConstructionContract.parseAdminCheck({ results: [] }).ok, false);
  assert.strictEqual(ConstructionContract.parseAdminCheck({ unexpected: 1 }).ok, false);
});

test('parseAdminCheck : items null (verdict ok) = liste vide reconnue', () => {
  const parsed = ConstructionContract.parseAdminCheck({ verdict: 'ok', countries: ['FR'], items: null });
  assert.strictEqual(parsed.ok, true);
  assert.deepStrictEqual(parsed.items, []);
  assert.strictEqual(parsed.verdict, 'ok');
});

test('parseAdminCheck déballe la réponse GET en cache {result, cached}', () => {
  const parsed = ConstructionContract.parseAdminCheck({ result: fixture('admin-check.json'), cached: true, cachedAt: 'x' });
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.items.length, 1);
});

test('parseAdminCheck expose le summary Bifrost quand il est présent', () => {
  const raw = Object.assign({}, fixture('admin-check.json'), { summary: 'Deux eTA à demander.' });
  assert.strictEqual(ConstructionContract.parseAdminCheck(raw).summary, 'Deux eTA à demander.');
});

// ── Health-check ───────────────────────────────────────────────────────────────

test('parseHealthCheck lit les 4 items de la fixture Thaïlande', () => {
  const parsed = ConstructionContract.parseHealthCheck(fixture('health-check.json'));
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.verdict, 'action_required');
  assert.deepStrictEqual(parsed.countries, ['TH']);
  assert.strictEqual(parsed.items.length, 4);
  const types = parsed.items.map(i => i.type);
  assert.deepStrictEqual(types, ['vaccins', 'paludisme', 'eau', 'trousse']);
  const statuses = parsed.items.map(i => i.status);
  assert.deepStrictEqual(statuses, ['action_required', 'action_required', 'warning', 'warning']);
  // L'item générique porte le pays "*".
  assert.strictEqual(parsed.items[3].country, '*');
});

test("parseHealthCheck : l'ancienne clé data.recommendations n'est PAS acceptée", () => {
  assert.strictEqual(ConstructionContract.parseHealthCheck({ recommendations: [] }).ok, false);
  assert.strictEqual(ConstructionContract.parseHealthCheck({ results: [] }).ok, false);
});

test('parseHealthCheck : verdict none avec items null (règle de silence)', () => {
  const parsed = ConstructionContract.parseHealthCheck({ verdict: 'none', countries: [], items: null });
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.verdict, 'none');
  assert.deepStrictEqual(parsed.items, []);
});

// ── Nuisances ──────────────────────────────────────────────────────────────────

test('parseNuisance calcule le verdict global depuis results[]', () => {
  const parsed = ConstructionContract.parseNuisance(fixture('nuisance-check.json'));
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.locations.length, 1);
  assert.strictEqual(parsed.locations[0].locationName, 'Montréal Vieux-Port');
  assert.strictEqual(parsed.verdict, 'INDETERMINE');
  assert.strictEqual(parsed.verdictEmoji, '⚪');
});

test('parseNuisance remonte incomplete / failedCategories', () => {
  const parsed = ConstructionContract.parseNuisance(fixture('nuisance-check.json'));
  assert.strictEqual(parsed.incomplete, true);
  assert.deepStrictEqual(parsed.failedCategories, ['trains']);
  const cats = parsed.locations[0].categories;
  const trains = cats.find(c => c.category === 'trains');
  assert.strictEqual(trains.unavailable, true);
  assert.strictEqual(trains.level, 'INDETERMINE');
  const nightlife = cats.find(c => c.category === 'nightlife');
  assert.strictEqual(nightlife.level, 'MODERE');
  assert.strictEqual(nightlife.count, 3);
});

test('parseNuisance : une catégorie unavailable suffit à marquer incomplete', () => {
  const parsed = ConstructionContract.parseNuisance({
    results: [{ locationId: 'a', verdict: 'FAIBLE', categories: [{ category: 'trains', level: 'FAIBLE', unavailable: true }] }],
  });
  assert.strictEqual(parsed.incomplete, true);
});

test('worstNuisanceVerdict : ELEVE > INDETERMINE > MODERE > FAIBLE', () => {
  const worst = ConstructionContract.worstNuisanceVerdict;
  assert.strictEqual(worst(['FAIBLE', 'MODERE', 'INDETERMINE']), 'INDETERMINE');
  assert.strictEqual(worst(['INDETERMINE', 'ELEVE']), 'ELEVE');
  assert.strictEqual(worst(['FAIBLE', 'MODERE']), 'MODERE');
  assert.strictEqual(worst(['FAIBLE', 'FAIBLE']), 'FAIBLE');
  assert.strictEqual(worst([]), '');
  assert.strictEqual(worst(['???']), '');
  assert.strictEqual(ConstructionContract.nuisanceEmoji('ELEVE'), '🔴');
  assert.strictEqual(ConstructionContract.nuisanceEmoji('MODERE'), '🟡');
  assert.strictEqual(ConstructionContract.nuisanceEmoji('FAIBLE'), '🟢');
});

test("parseNuisance : data.locations n'est PAS accepté", () => {
  assert.strictEqual(ConstructionContract.parseNuisance({ locations: [] }).ok, false);
  assert.strictEqual(ConstructionContract.parseNuisance({ unexpected: 1 }).ok, false);
  assert.strictEqual(ConstructionContract.parseNuisance(null).ok, false);
});

// ── Rendu partagé (NuisanceStream) ─────────────────────────────────────────────

test('NuisanceStream.render affiche une analyse incomplète, jamais du vert', () => {
  const el = { innerHTML: '' };
  const parsed = NuisanceStream.render(el, fixture('nuisance-check.json'), {});
  assert.strictEqual(parsed.ok, true);
  assert.ok(el.innerHTML.includes('Analyse incomplète'), 'bandeau analyse incomplète');
  assert.ok(el.innerHTML.includes('⚪'), 'emoji indéterminé');
  assert.ok(el.innerHTML.includes('trains'), 'catégorie en échec nommée');
  assert.ok(el.innerHTML.includes('Montréal Vieux-Port'), 'nom du lieu');
  assert.ok(!/Aucune nuisance/.test(el.innerHTML), 'aucun message rassurant');
});

test('NuisanceStream.render affiche les alternatives Bifrost', () => {
  const el = { innerHTML: '' };
  NuisanceStream.render(el, {
    results: [{
      locationId: 'h1',
      locationName: 'Hôtel du Port',
      verdict: 'ELEVE',
      recommendation: 'Changer de quartier.',
      alternatives: ['Rue calme', 'Airbnb intérieur'],
      categories: [{ category: 'nightlife', level: 'ELEVE', emoji: '🎵' }],
    }],
  }, {});
  assert.ok(el.innerHTML.includes('Hôtel du Port'), 'locationName, pas l\'id');
  assert.ok(el.innerHTML.includes('Changer de quartier'), 'recommendation');
  assert.ok(el.innerHTML.includes('Alternatives'), 'liste d\'alternatives');
  assert.ok(el.innerHTML.includes('Rue calme'));
  assert.ok(el.innerHTML.includes('Airbnb intérieur'));
});

test('NuisanceStream.render affiche une erreur sur enveloppe non reconnue', () => {
  const el = { innerHTML: '' };
  const parsed = NuisanceStream.render(el, { locations: [] }, {});
  assert.strictEqual(parsed.ok, false);
  assert.ok(el.innerHTML.includes('Réponse inattendue'), 'erreur explicite');
  assert.ok(!/Aucune nuisance/.test(el.innerHTML));
});

test('NuisanceStream.render échappe le HTML des données', () => {
  const el = { innerHTML: '' };
  NuisanceStream.render(el, {
    results: [{ locationId: 'x', locationName: '<img src=x onerror=alert(1)>', verdict: 'FAIBLE', categories: [] }],
  }, {});
  assert.ok(!el.innerHTML.includes('<img'), 'balise échappée');
  assert.ok(el.innerHTML.includes('&lt;img'), 'échappement présent');
});

test('NuisanceStream.render ne peint rien si le flux a été abandonné', () => {
  const el = { innerHTML: 'intact' };
  const out = NuisanceStream.render(el, fixture('nuisance-check.json'), { signal: { aborted: true } });
  assert.strictEqual(out, null);
  assert.strictEqual(el.innerHTML, 'intact');
});

test('NuisanceStream.filterLocation restreint à un hébergement', () => {
  const parsed = ConstructionContract.parseNuisance(fixture('nuisance-check.json'));
  const kept = NuisanceStream.filterLocation(parsed, 'loc-mtl');
  assert.strictEqual(kept.locations.length, 1);
  assert.strictEqual(kept.verdict, 'INDETERMINE');
  assert.strictEqual(kept.incomplete, true);
  const none = NuisanceStream.filterLocation(parsed, 'loc-absent');
  assert.strictEqual(none.locations.length, 0);
  assert.strictEqual(none.verdict, '');
});

// Lot #76 : l'ancienne cascade de regex `/ok|done|valid/` peignait ✅ sur
// `invalid` (contient "valid") et `not_ok` (contient "ok").
test('statusBadge : un statut inconnu rend ❓, jamais ✅', () => {
  assert.strictEqual(ConstructionView.statusBadge('ok'), '✅');
  assert.strictEqual(ConstructionView.statusBadge('warning'), '⚠️');
  assert.strictEqual(ConstructionView.statusBadge('action_required'), '🔴');
  assert.strictEqual(ConstructionView.statusBadge('none'), '');
  assert.strictEqual(ConstructionView.statusBadge('wat'), '❓');
  assert.strictEqual(ConstructionView.statusBadge('invalid'), '❓');
  assert.strictEqual(ConstructionView.statusBadge('not_ok'), '❓');
  assert.strictEqual(ConstructionView.statusBadge(''), '❓');
});

// ── Flux SSE : job en échec vs résultats déjà enregistrés ──────────────────────
//
// Le backend interroge Overpass séquentiellement et enregistre chaque lieu au
// fur et à mesure. Un job qui casse en route (temps imparti, redémarrage) laisse
// donc des résultats partiels en base : les jeter pour n'afficher qu'une erreur
// perdait du travail déjà payé en requêtes Overpass.

function streamOf(frames) {
  return function () {
    return (async function* () { for (const f of frames) yield f; })();
  };
}

async function withAPI(overrides, fn) {
  const saved = {};
  Object.keys(overrides).forEach(k => { saved[k] = API[k]; API[k] = overrides[k]; });
  try { await fn(); } finally { Object.keys(saved).forEach(k => { API[k] = saved[k]; }); }
}

testAsync("un job en échec affiche les résultats partiels déjà enregistrés", async () => {
  const el = { innerHTML: '' };
  await withAPI({
    leoJobStream: streamOf([{ event: 'error', data: { code: 'timeout', error: 'Analyse trop longue.' } }]),
    getNuisanceCheck: () => Promise.resolve({ ok: true, status: 200, data: fixture('nuisance-check.json') }),
  }, () => NuisanceStream.subscribe(el, { jobId: 'j1', tripId: 'trip-1' }));

  assert.ok(el.innerHTML.includes('Analyse trop longue.'), "l'erreur reste affichée");
  assert.ok(el.innerHTML.includes('Résultats partiels'), 'le caractère partiel est dit');
  assert.ok(el.innerHTML.includes('Montréal Vieux-Port'), 'les lieux déjà analysés sont rendus');
  assert.ok(!/Nuisances faibles/.test(el.innerHTML), 'aucun verdict rassurant inventé');
});

testAsync("un job en échec sans résultat enregistré n'affiche que l'erreur", async () => {
  const el = { innerHTML: '' };
  await withAPI({
    leoJobStream: streamOf([{ event: 'error', data: { code: 'network', error: 'Connexion perdue.' } }]),
    getNuisanceCheck: () => Promise.resolve({ ok: false, status: 0, data: null, error: 'stub' }),
  }, () => NuisanceStream.subscribe(el, { jobId: 'j1', tripId: 'trip-1' }));

  assert.ok(el.innerHTML.includes('Connexion perdue.'));
  assert.ok(!/Résultats partiels/.test(el.innerHTML));
});

testAsync('une annulation volontaire ne peint rien', async () => {
  const el = { innerHTML: 'intact' };
  await withAPI({
    leoJobStream: streamOf([{ event: 'error', data: { code: 'cancelled', error: 'Annulé.' } }]),
    getNuisanceCheck: () => { throw new Error('ne doit pas être appelé'); },
  }, () => NuisanceStream.subscribe(el, { jobId: 'j1', tripId: 'trip-1' }));

  assert.strictEqual(el.innerHTML, 'intact');
});

(async () => {
  for (const [name, fn] of asyncTests) {
    try { await fn(); console.log(`  \u2705 ${name}`); pass++; }
    catch (e) { console.log(`  \u274c ${name}\n     ${e.message}`); fail++; process.exitCode = 1; }
  }
  console.log(`\n${pass} tests passed${fail ? `, ${fail} failed` : ''}\n`);
})();
