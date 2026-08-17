/**
 * tests/steps-map.test.cjs — hotel bookends + split-with-overlap (jamais tronquer)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));
eval(fs.readFileSync('js/steps-map.js', 'utf8'));

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

console.log('\n── StepsMap ──────────────────────────────────────────────');

test('extractWaypoints : lat/lon gagne sur place', () => {
  const wps = StepsMap.extractWaypoints([
    { t: '10:00', d: 'A', place: 'Ignored', lat: 46.8, lon: -71.2 },
    { t: '11:00', d: 'B', place: 'Château Frontenac, Québec' },
    { t: '12:00', d: 'sans geo' },
  ]);
  assert.deepStrictEqual(wps, ['46.8,-71.2', 'Château Frontenac, Québec']);
});

test('< 2 waypoints → null', () => {
  assert.strictEqual(StepsMap.buildStepsUrl([]), null);
  assert.strictEqual(StepsMap.buildStepsUrl([{ place: 'Seul' }]), null);
});

test('2 places sans hôtel → un lien, pas de split', () => {
  const r = StepsMap.buildStepsUrl([
    { place: 'A' }, { place: 'B' },
  ]);
  assert.ok(r);
  assert.strictEqual(r.split, false);
  assert.strictEqual(r.total, 2);
  assert.strictEqual(r.links.length, 1);
  assert.strictEqual(r.links[0].count, 2);
  assert.ok(r.links[0].url.startsWith('https://www.google.com/maps/dir/'));
  assert.ok(r.links[0].url.includes(encodeURIComponent('A')));
  assert.ok(r.links[0].url.includes(encodeURIComponent('B')));
});

test('encodage des accents', () => {
  const r = StepsMap.buildStepsUrl([
    { place: 'Château Frontenac, Québec' },
    { place: 'Île d\'Orléans, QC' },
  ]);
  assert.ok(r.links[0].url.includes(encodeURIComponent('Château Frontenac, Québec')));
  assert.ok(r.links[0].url.includes(encodeURIComponent('Île d\'Orléans, QC')));
});

test('hôtel matin + soir encadrent la timeline', () => {
  const r = StepsMap.buildStepsUrl(
    [{ place: 'Musée' }, { place: 'Vieux-Port' }],
    {
      startPlace: '20 Côte de l\'Église, Boischatel',
      endPlace: '20 Côte de l\'Église, Boischatel',
    }
  );
  assert.strictEqual(r.total, 4);
  assert.strictEqual(r.split, false);
  const parts = r.links[0].url.split('/dir/')[1].split('/').map(decodeURIComponent);
  assert.deepStrictEqual(parts, [
    '20 Côte de l\'Église, Boischatel',
    'Musée',
    'Vieux-Port',
    '20 Côte de l\'Église, Boischatel',
  ]);
});

test('ne double pas l\'hôtel s\'il est déjà le premier / dernier place', () => {
  const hotel = '3470 Rue Saint-Denis, Montréal, QC';
  const r = StepsMap.buildStepsUrl(
    [{ place: hotel }, { place: 'Avis Laval' }, { place: hotel }],
    { startPlace: hotel, endPlace: hotel }
  );
  assert.strictEqual(r.total, 3);
  const parts = r.links[0].url.split('/dir/')[1].split('/').map(decodeURIComponent);
  assert.deepStrictEqual(parts, [hotel, 'Avis Laval', hotel]);
});

test('jour de route sans place : hôtel A → hôtel B', () => {
  const r = StepsMap.buildStepsUrl([], {
    startPlace: 'Hôtel Montréal',
    endPlace: 'Loft Boischâtel',
  });
  assert.ok(r);
  assert.strictEqual(r.total, 2);
  const parts = r.links[0].url.split('/dir/')[1].split('/').map(decodeURIComponent);
  assert.deepStrictEqual(parts, ['Hôtel Montréal', 'Loft Boischâtel']);
});

test('même hôtel matin et soir sans activité → pas de bouton', () => {
  const r = StepsMap.buildStepsUrl([], {
    startPlace: 'Loft ilewa',
    endPlace: 'Loft ilewa',
  });
  assert.strictEqual(r, null);
});

test('11 arrêts : 2 liens, overlap = dernier du 1er = premier du 2e, rien n\'est droppé', () => {
  const places = [];
  for (let i = 0; i < 11; i++) places.push({ place: 'P' + i });
  const r = StepsMap.buildStepsUrl(places);
  assert.ok(r.split);
  assert.strictEqual(r.total, 11);
  assert.strictEqual(r.links.length, 2);
  assert.strictEqual(r.links[0].count, 10);
  assert.strictEqual(r.links[1].count, 2);
  const a = r.links[0].url.split('/dir/')[1].split('/').map(decodeURIComponent);
  const b = r.links[1].url.split('/dir/')[1].split('/').map(decodeURIComponent);
  assert.strictEqual(a[a.length - 1], b[0], 'départ lien 2 = arrivée lien 1');
  assert.strictEqual(a[0], 'P0');
  assert.strictEqual(b[b.length - 1], 'P10', 'le 11e arrêt (Île d\'Orléans) n\'est plus tronqué');
});

test('13 points (11 places + 2 hôtels) → 2 liens de 10 et 4, overlap 1', () => {
  const places = [];
  for (let i = 0; i < 11; i++) places.push({ place: 'Stop' + i });
  const r = StepsMap.buildStepsUrl(places, {
    startPlace: 'Hôtel matin',
    endPlace: 'Hôtel soir',
  });
  assert.strictEqual(r.total, 13);
  assert.strictEqual(r.links.length, 2);
  assert.strictEqual(r.links[0].count, 10);
  assert.strictEqual(r.links[1].count, 4);
  const a = r.links[0].url.split('/dir/')[1].split('/').map(decodeURIComponent);
  const b = r.links[1].url.split('/dir/')[1].split('/').map(decodeURIComponent);
  assert.strictEqual(a[a.length - 1], b[0]);
  assert.strictEqual(a[0], 'Hôtel matin');
  assert.strictEqual(b[b.length - 1], 'Hôtel soir');
});

test('20 points uniques → 3 liens (2 liens ne couvrent que 19 avec overlap)', () => {
  const places = [];
  for (let i = 0; i < 20; i++) places.push({ place: 'X' + i });
  const r = StepsMap.buildStepsUrl(places);
  assert.strictEqual(r.links.length, 3);
  const last = r.links[r.links.length - 1].url.split('/dir/')[1].split('/').map(decodeURIComponent);
  assert.strictEqual(last[last.length - 1], 'X19');
});

test('placeFromHotel : addr > name, lat/lon en priorité', () => {
  assert.strictEqual(StepsMap.placeFromHotel(null), null);
  assert.strictEqual(StepsMap.placeFromHotel({ lat: 46.8, lon: -71.2, addr: 'x' }), '46.8,-71.2');
  assert.strictEqual(StepsMap.placeFromHotel({
    name: 'Les Lofts ilewa',
    addr: '20 Côte de l\'Église, Boischâtel',
  }), '20 Côte de l\'Église, Boischâtel');
  assert.strictEqual(StepsMap.placeFromHotel({ name: 'Sans adresse' }), 'Sans adresse');
});

test('MAX_WAYPOINTS = 10', () => {
  assert.strictEqual(StepsMap.MAX_WAYPOINTS, 10);
});

console.log(`\n  ${pass} passed\n`);
