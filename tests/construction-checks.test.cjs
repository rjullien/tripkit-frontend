/**
 * tests/construction-checks.test.cjs — rendering of the SPEC §7 / §8 checks.
 *
 * These tests exist because the admin, santé and nuisance panels each read a
 * different JSON shape than the backend sends, so all three rendered an empty
 * "all clear" state for every trip — and failed green, which is the wrong
 * direction for visa and vaccination advice.
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));

// ── Minimal DOM stub ────────────────────────────────────────────────────────
const _elements = {};
function makeEl(id) {
  return {
    id,
    innerHTML: '',
    textContent: '',
    disabled: false,
    _listeners: {},
    addEventListener(ev, fn) { this._listeners[ev] = fn; },
  };
}
['action-bar-results', 'action-admin', 'action-sante', 'action-nuisances'].forEach(id => {
  _elements[id] = makeEl(id);
});

global.document = {
  addEventListener() {},
  visibilityState: 'visible',
  getElementById(id) { return _elements[id] || null; },
  querySelectorAll() { return []; },
};
global.window = { location: { hash: '' } };
global.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.navigator = { onLine: true };
global.AbortController = class { constructor() { this.signal = {}; } abort() {} };
global.Store = { getCurrentTripId() { return 'trip-1'; } };
global.LeoChatStream = undefined;

// API stub: each test sets _next before calling.
const API = {
  _nextAdmin: null,
  _nextHealth: null,
  runAdminCheck() { return Promise.resolve(API._nextAdmin); },
  runHealthCheck() { return Promise.resolve(API._nextHealth); },
  runNuisanceCheck() { return Promise.resolve({ ok: true, data: {} }); },
  getNuisanceCheck() { return Promise.resolve({ ok: true, data: {} }); },
  leoJobStream() { return (async function* () {})(); },
};
global.API = API;

// Load the component under test.
const src = fs.readFileSync(path.join('js', 'components', 'construction-view.js'), 'utf8');
eval(src);

const results = () => _elements['action-bar-results'].innerHTML;

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    _elements['action-bar-results'].innerHTML = '';
    await fn();
    console.log('  \u2705 ' + name);
    passed++;
  } catch (e) {
    console.log('  \u274c ' + name + '\n     ' + e.message);
    failed++;
  }
}

// ── Fixtures: the exact shape the Go backend marshals ───────────────────────

// Mixed family to the US: Rene is FR only and needs an ESTA, Dinah is FR+US and
// does not. Both must appear.
const adminPayload = {
  ok: true,
  data: {
    verdict: 'action_required',
    countries: ['US'],
    summary: 'Rene doit demander un ESTA. Dinah voyage avec son passeport americain.',
    travelers: [
      {
        id: 'rene', name: 'Rene', nationalities: ['FR'], verdict: 'action_required',
        items: [{
          country: 'US', type: 'esta', label: 'ESTA', status: 'action_required',
          detail: 'Cout : 21 USD \u00b7 Delai : 72h', url: 'https://esta.cbp.dhs.gov',
          cost: '21 USD', deadline: '72h',
        }],
      },
      { id: 'dinah', name: 'Dinah', nationalities: ['FR', 'US'], verdict: 'ok', items: [] },
    ],
    items: [{ country: 'US', type: 'esta', label: 'ESTA', status: 'action_required', detail: '' }],
  },
};

(async () => {
  console.log('\n\u2500\u2500 Construction checks: admin (SPEC \u00a77.1) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

  await test('renders one block per traveler, not an empty state', async () => {
    API._nextAdmin = adminPayload;
    await ConstructionView.handleAdmin('trip-1');
    const html = results();
    assert.ok(html.includes('Rene'), 'Rene missing from the rendered output');
    assert.ok(html.includes('Dinah'), 'Dinah missing from the rendered output');
    assert.ok(!html.includes('Aucune formalite detectee'), 'rendered the empty state despite having data');
  });

  await test('shows the ESTA that applies to the FR-only traveler', async () => {
    API._nextAdmin = adminPayload;
    await ConstructionView.handleAdmin('trip-1');
    assert.ok(results().includes('ESTA'), 'ESTA requirement not rendered');
  });

  await test('renders deadline and official link (\u00a77.1)', async () => {
    API._nextAdmin = adminPayload;
    await ConstructionView.handleAdmin('trip-1');
    const html = results();
    assert.ok(html.includes('72h'), 'deadline not rendered');
    assert.ok(html.includes('esta.cbp.dhs.gov'), 'official URL not rendered');
  });

  await test('renders the LLM summary', async () => {
    API._nextAdmin = adminPayload;
    await ConstructionView.handleAdmin('trip-1');
    assert.ok(results().includes('action-result-summary'), 'summary block missing');
  });

  await test('a traveler with nothing to do says so explicitly', async () => {
    API._nextAdmin = adminPayload;
    await ConstructionView.handleAdmin('trip-1');
    assert.ok(results().includes('Aucune formalite requise'), 'empty traveler not labelled');
  });

  await test('unknown status renders as ? and never as a green tick', async () => {
    assert.strictEqual(ConstructionView.statusBadge('action_required'), '\u274c');
    assert.strictEqual(ConstructionView.statusBadge('warning'), '\u26a0\ufe0f');
    assert.strictEqual(ConstructionView.statusBadge('ok'), '\u2705');
    assert.strictEqual(ConstructionView.statusBadge('wat'), '\u2753');
  });

  await test('nationality_unknown is surfaced, not swallowed', async () => {
    API._nextAdmin = {
      ok: true,
      data: {
        verdict: 'warning', countries: ['US'],
        travelers: [{
          id: 'ghost', name: 'Ghost', nationalities: [], verdict: 'warning',
          items: [{ type: 'nationality_unknown', label: 'Nationalite non renseignee', status: 'warning', detail: 'Ajoute nationalities' }],
        }],
        items: [],
      },
    };
    await ConstructionView.handleAdmin('trip-1');
    const html = results();
    assert.ok(html.includes('Ghost'), 'traveler missing');
    assert.ok(html.includes('Nationalite non renseignee'), 'unknown-nationality warning not shown');
  });

  console.log('\n\u2500\u2500 Construction checks: sante (SPEC \u00a77.2 silence) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

  await test('verdict "none" renders NO section at all', async () => {
    API._nextHealth = { ok: true, data: { verdict: 'none', countries: ['US'], items: null } };
    await ConstructionView.handleSante('trip-1');
    assert.strictEqual(results(), '', 'the silence rule requires an empty render, got: ' + results());
  });

  await test('real advisories are rendered from data.items', async () => {
    API._nextHealth = {
      ok: true,
      data: {
        verdict: 'action_required', countries: ['TH'],
        summary: 'Traitement antipaludeen recommande.',
        items: [
          { country: 'TH', type: 'malaria', label: 'Paludisme', status: 'warning', detail: 'Zones rurales' },
          { country: 'TH', type: 'water', label: 'Eau', status: 'action_required', detail: 'Eau en bouteille' },
        ],
      },
    };
    await ConstructionView.handleSante('trip-1');
    const html = results();
    assert.ok(html.includes('Paludisme'), 'malaria advisory missing');
    assert.ok(html.includes('Eau'), 'water advisory missing');
    assert.ok(html.includes('action-result-summary'), 'summary missing');
  });

  console.log('\n\u2500\u2500 Construction checks: nuisances (SPEC \u00a78) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

  await test('reads locationName and renders categories', async () => {
    ConstructionView.renderNuisanceResults({
      results: [{
        locationId: 'h1', locationName: 'Hotel du Port', verdict: 'MODERE', verdictEmoji: '\ud83d\udfe1',
        categories: [{ category: 'trains', level: 'MODERE', emoji: '\ud83d\ude86', detail: 'voie ferree a 300m' }],
        recommendation: 'Demande une chambre cote cour.',
        alternatives: ['Hotel Central'],
      }],
    });
    const html = results();
    assert.ok(html.includes('Hotel du Port'), 'locationName not rendered (fell back to locationId)');
    assert.ok(html.includes('trains'), 'category missing');
    assert.ok(html.includes('cote cour'), 'Bifrost recommendation missing');
    assert.ok(html.includes('Hotel Central'), 'alternatives missing');
  });

  await test('INDETERMINE never renders as a green light', async () => {
    assert.strictEqual(ConstructionView.verdictEmoji('INDETERMINE'), '\u2753');
    assert.strictEqual(ConstructionView.verdictEmoji('FAIBLE'), '\ud83d\udfe2');
    assert.strictEqual(ConstructionView.verdictEmoji('ELEVE'), '\ud83d\udd34');
  });

  await test('a partial analysis is announced up front', async () => {
    ConstructionView.renderNuisanceResults({
      results: [{
        locationId: 'h1', locationName: 'Hotel Test', verdict: 'INDETERMINE', partial: true,
        categories: [{ category: 'trains', level: 'INDETERMINE', emoji: '\u2753', detail: 'Source indisponible' }],
      }],
    });
    const html = results();
    assert.ok(html.includes('Analyse incomplete'), 'missing the incomplete-analysis warning');
    assert.ok(html.includes('INDETERMINE'), 'indeterminate level not shown');
  });

  await test('an empty result list does not claim the trip is quiet', async () => {
    ConstructionView.renderNuisanceResults({ results: [] });
    assert.ok(!results().includes('Aucune nuisance detectee'),
      'an unanalysed trip must not be reported as nuisance-free');
  });

  console.log('\n' + (failed === 0
    ? passed + ' tests passed\n'
    : failed + ' FAILED, ' + passed + ' passed\n'));
  process.exit(failed === 0 ? 0 : 1);
})();
