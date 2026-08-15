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
 *      ../tripkit-frontend/tests/fixtures/construction-contract/
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
  assert.deepStrictEqual(ConstructionContract.itemAppliesTo(item), ['FR', 'US']);
  assert.deepStrictEqual(ConstructionContract.itemAppliesTo({ applies_to: ['FR'] }), ['FR']);
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

console.log(`\n${pass} tests passed${fail ? `, ${fail} failed` : ''}\n`);
