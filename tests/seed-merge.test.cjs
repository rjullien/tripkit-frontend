/**
 * tests/seed-merge.test.cjs — Regression tests for js/seed-merge.js
 *
 * Pure Node.js, no browser required.
 *
 * THE BUG THIS PINS
 * -----------------
 * App.refreshTripData() and TripSelector.select() each had their own copy of the
 * "backend seed → tripData" mapping. When mapHtml/meteoHtml were added (v2.27.33)
 * only app.js was updated, so selecting a trip dropped them and the interactive
 * Leaflet map + météo iframe disappeared from the Itinéraire tab for good
 * (refreshTripData short-circuits while the data version is unchanged).
 *
 * These tests assert the two call sites now share ONE mapping, and that every
 * field the views read is carried through it.
 */
const path = require('path');
const rootDir = path.join(__dirname, '..');
process.chdir(rootDir);
const fs = require('fs');
const assert = require('assert');

eval(fs.readFileSync('js/seed-merge.js', 'utf8'));

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

// Backend payload shaped like GET /api/trips/:id/seed for quebec-2026.
function quebecSeed() {
  return {
    trip: {
      id: 'quebec-2026',
      name: 'Boucle Québec 2026',
      emoji: '🍁',
      start_date: '2026-08-14',
      end_date: '2026-09-01',
      data: JSON.stringify({
        travelers: [{ name: 'René', role: 'owner' }],
        phases: [{ name: 'Québec', label: 'PHASE 1', range: [2, 5] }],
        routeUrl: 'https://www.google.com/maps/dir/Montreal/Quebec+City',
        mapHtml: 'quebec-map.html',
        meteoHtml: 'quebec-meteo.html',
        mapImage: 'route.jpg',
        users: { rjullien: { city: 'Nice' } },
        sharedLinks: [{ label: 'Drive', url: 'https://example.invalid' }],
        locations: { montreal: { lat: 45.5, lon: -73.5, tz: 'America/Toronto' } },
        restaurants: { 2: { main: { name: 'Le Cercle' } } },
        culture: { zones: [] },
        flights: { outbound: { pnr: 'ABC' } },
        carRental: { bookingRef: 'R1', provider: 'Avis' },
        ferry: { route: 'A→B', orderRef: '316243', date: '2026-08-23' },
        events: { show: { name: 'Cirque', orderRef: '88277', date: '2026-08-28' } },
      }),
    },
    days: [
      { day_num: 1, data: JSON.stringify({ day: 1, label: 'Vol' }) },
      { day_num: 0, data: JSON.stringify({ day: 0, label: 'Valises' }) },
      { day_num: 2, data: JSON.stringify({ day: 2, label: '_deleted' }) },
    ],
    hotels: [{ day_num: 1, data: JSON.stringify({ hotel: 'Airbnb St-Denis' }) }],
    lists: [{ id: 'checklist-quebec', type: 'packing', title: '🧳 Valise', data: JSON.stringify({ sections: [] }) }],
  };
}

console.log('\n── SeedMerge.merge ──────────────────────────────────────────');

test('carries mapHtml / meteoHtml / routeUrl on a clean rebuild (the regression)', () => {
  // {} = what TripSelector.select passes after purging the cache. This is the
  // exact call that used to lose the interactive maps.
  const td = SeedMerge.merge(quebecSeed(), {});
  assert.strictEqual(td.trip.mapHtml, 'quebec-map.html', 'mapHtml dropped');
  assert.strictEqual(td.trip.meteoHtml, 'quebec-meteo.html', 'meteoHtml dropped');
  assert.strictEqual(td.trip.routeUrl, 'https://www.google.com/maps/dir/Montreal/Quebec+City', 'routeUrl dropped');
  assert.strictEqual(td.trip.mapImage, 'route.jpg', 'mapImage dropped');
});

test('every field read by route-view.js is declared in TRIP_META_FIELDS', () => {
  const view = fs.readFileSync('js/components/route-view.js', 'utf8');
  ['mapImage', 'mapHtml', 'meteoHtml', 'routeUrl', 'phases', 'travelers'].forEach(f => {
    assert.ok(view.includes('trip.' + f), `route-view.js no longer reads trip.${f} — update this test`);
    assert.ok(SeedMerge.TRIP_META_FIELDS.includes(f), `trip.${f} is read by route-view but missing from TRIP_META_FIELDS`);
  });
});

test('neither call site re-inlines its own trip meta field list', () => {
  // Guards against the copy-paste that caused the original drift.
  ['js/app.js', 'js/components/trip-selector.js'].forEach(f => {
    const src = fs.readFileSync(f, 'utf8');
    assert.ok(src.includes('SeedMerge.merge('), `${f} does not use SeedMerge.merge`);
    assert.ok(!/routeUrl:\s*extra\.routeUrl/.test(src), `${f} still builds trip meta inline — it will drift again`);
  });
});

test('index.html loads seed-merge.js before its consumers', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const iMerge = html.indexOf('js/seed-merge.js');
  const iSelector = html.indexOf('js/components/trip-selector.js');
  const iApp = html.indexOf('js/app.js');
  assert.ok(iMerge > -1, 'seed-merge.js is not in index.html');
  assert.ok(iMerge < iSelector && iMerge < iApp, 'seed-merge.js must load before trip-selector.js and app.js');
});

test('days are sorted, _deleted days filtered, hotels merged by day_num', () => {
  const td = SeedMerge.merge(quebecSeed(), {});
  assert.deepStrictEqual(td.days.map(d => d.day), [0, 1], 'days not sorted / _deleted not filtered');
  assert.strictEqual(td.days[1].hotel, 'Airbnb St-Denis', 'hotel not merged into its day');
});

test('trip.data collections land at the top level', () => {
  const td = SeedMerge.merge(quebecSeed(), {});
  assert.ok(td.locations.montreal, 'locations missing');
  assert.ok(td.restaurants['2'], 'restaurants missing');
  assert.ok(td.culture, 'culture missing');
  assert.strictEqual(td.lists['checklist-quebec'].title, '🧳 Valise', 'lists missing');
  assert.strictEqual(td.flights.outbound.pnr, 'ABC', 'flights dropped');
  assert.strictEqual(td.carRental.bookingRef, 'R1', 'carRental dropped');
  assert.strictEqual(td.ferry.orderRef, '316243', 'ferry dropped');
  assert.strictEqual(td.events.show.orderRef, '88277', 'events dropped');
});

test('TRIP_DATA_COLLECTIONS lists every booking collection BookingsView needs', () => {
  ['flights', 'carRental', 'ferry', 'events', 'hotels'].forEach(f => {
    assert.ok(SeedMerge.TRIP_DATA_COLLECTIONS.includes(f), `${f} missing from TRIP_DATA_COLLECTIONS`);
  });
  const importSrc = fs.readFileSync('seed-import.cjs', 'utf8');
  ['flights', 'carRental', 'ferry', 'events'].forEach(f => {
    assert.ok(importSrc.includes(`${f}: SEED.${f}`), `seed-import.cjs does not inject ${f}`);
  });
});

test('incremental refresh keeps previously known meta when trip.data omits it', () => {
  const seed = quebecSeed();
  seed.trip.data = JSON.stringify({ travelers: [{ name: 'René' }] }); // partial payload
  const td = SeedMerge.merge(seed, { trip: { mapHtml: 'quebec-map.html', routeUrl: 'x' } });
  assert.strictEqual(td.trip.mapHtml, 'quebec-map.html', 'lost cached mapHtml');
  assert.strictEqual(td.trip.routeUrl, 'x', 'lost cached routeUrl');
});

test('malformed trip.data JSON does not throw', () => {
  const seed = quebecSeed();
  seed.trip.data = '{not json';
  const td = SeedMerge.merge(seed, {});
  assert.strictEqual(td.trip.id, 'quebec-2026');
  assert.strictEqual(td.trip.mapHtml, undefined);
});

console.log(`\n  ${pass} passed\n`);
