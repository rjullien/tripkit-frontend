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
        travelers: [{ name: 'Alice', role: 'owner' }],
        phases: [{ name: 'Québec', label: 'PHASE 1', range: [2, 5] }],
        routeUrl: 'https://www.google.com/maps/dir/Montreal/Quebec+City',
        mapHtml: 'quebec-map.html',
        meteoHtml: 'quebec-meteo.html',
        mapImage: 'route.jpg',
        homeTz: 'Europe/Paris',
        polarsteps: { enabled: true, tripUrl: 'https://www.polarsteps.com/test/quebec/' },
        people: { alice: { id: 'alice', name: 'Alice', documents: [] } },
        users: { alice: { city: 'Paris' } },
        sharedLinks: [{ label: 'Drive', url: 'https://example.invalid' }],
        locations: { montreal: { lat: 45.5, lon: -73.5, tz: 'America/Toronto' } },
        restaurants: { 2: { main: { name: 'Le Cercle' } } },
        culture: { zones: [] },
        flights: { outbound: { pnr: 'ABC' } },
        carRental: { bookingRef: 'R1', provider: 'Avis' },
        ferry: { route: 'A→B', orderRef: '316243', date: '2026-08-23' },
        ferries: [{ route: 'X→Y', date: '2026-08-24' }],
        events: { show: { name: 'Cirque', orderRef: '88277', date: '2026-08-28' } },
      }),
    },
    days: [
      { day_num: 1, data: JSON.stringify({ day: 1, label: 'Vol', hotelId: 'montreal' }) },
      { day_num: 0, data: JSON.stringify({ day: 0, label: 'Valises' }) }, // J0 maison — no hotelId
      { day_num: 2, data: JSON.stringify({ day: 2, label: '_deleted' }) },
    ],
    hotels: [{ day_num: 1, data: JSON.stringify({ hotel: 'Airbnb St-Denis', hotelId: 'montreal' }) }],
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
  assert.ok(SeedMerge.TRIP_META_FIELDS.includes('homeTz'), 'homeTz missing from TRIP_META_FIELDS');
  assert.ok(SeedMerge.TRIP_META_FIELDS.includes('polarsteps'), 'polarsteps missing from TRIP_META_FIELDS');
  assert.strictEqual(SeedMerge.merge(quebecSeed(), {}).trip.homeTz, 'Europe/Paris', 'homeTz dropped');
  assert.strictEqual(SeedMerge.merge(quebecSeed(), {}).trip.polarsteps.enabled, true, 'polarsteps dropped');
});

test('neither call site re-inlines its own trip meta field list', () => {
  // Guards against the copy-paste that caused the original drift.
  ['js/app.js', 'js/components/trip-selector.js'].forEach(f => {
    const src = fs.readFileSync(f, 'utf8');
    assert.ok(src.includes('SeedMerge.merge('), `${f} does not use SeedMerge.merge`);
    assert.ok(!/routeUrl:\s*extra\.routeUrl/.test(src), `${f} still builds trip meta inline — it will drift again`);
  });
});

// index.html no longer lists the sources: it loads the bundles generated from
// bundles.json, which is now where the load order lives.
test('bundles.json loads seed-merge.js before its consumers', () => {
  const manifest = JSON.parse(fs.readFileSync('bundles.json', 'utf8'));
  const order = Object.keys(manifest)
    .filter(k => !k.startsWith('_'))
    .flatMap(k => manifest[k]);
  const iMerge = order.indexOf('js/seed-merge.js');
  const iSelector = order.indexOf('js/components/trip-selector.js');
  const iApp = order.indexOf('js/app.js');
  assert.ok(iMerge > -1, 'seed-merge.js is in no bundle');
  assert.ok(iSelector > -1, 'trip-selector.js is in no bundle');
  assert.ok(iApp > -1, 'app.js is in no bundle');
  assert.ok(iMerge < iSelector && iMerge < iApp, 'seed-merge.js must load before trip-selector.js and app.js');

  // Comments are stripped first: index.html *mentions* bundle-edge.js in a
  // comment explaining that it is injected on demand, so a plain substring
  // match would pass even if the tag/loader wiring were broken.
  const html = fs.readFileSync('index.html', 'utf8');
  const scriptTags = html.replace(/<!--[\s\S]*?-->/g, '').match(/<script\b[^>]*>/gi) || [];
  const tagFor = b => scriptTags.find(t => new RegExp(`src\\s*=\\s*"js/dist/${b}\\.js(\\?[^"]*)?"`).test(t));

  ['bundle-core', 'bundle-components'].forEach(b => {
    const tag = tagFor(b);
    assert.ok(tag, `${b}.js is not loaded by a <script src> tag in index.html`);
    assert.ok(/\sdefer(\s|>|=)/.test(tag), `${b}.js must be loaded with defer — got ${tag}`);
  });

  // bundle-edge is lazy: no tag in index.html, injected by App.ensureEdgeBundle
  // on the first Plus render, and still precached by the service worker.
  assert.ok(!tagFor('bundle-edge'), 'bundle-edge.js must NOT be in a <script> tag in index.html — it is loaded on demand');
  const app = fs.readFileSync('js/app.js', 'utf8');
  const fnStart = app.indexOf('function ensureEdgeBundle');
  assert.ok(fnStart > -1, 'js/app.js no longer defines ensureEdgeBundle — bundle-edge would never load');
  const fnSrc = app.slice(fnStart, app.indexOf('\n  }', fnStart));
  assert.ok(fnSrc.includes('js/dist/bundle-edge.js'), 'ensureEdgeBundle no longer injects js/dist/bundle-edge.js');
  assert.ok((app.match(/ensureEdgeBundle\(/g) || []).length >= 2, 'ensureEdgeBundle is defined but never called');
  assert.ok(fs.readFileSync('sw.js', 'utf8').includes("'/js/dist/bundle-edge.js'"), 'bundle-edge.js is no longer precached by sw.js');
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
  assert.strictEqual(td.ferries[0].route, 'X→Y', 'ferries dropped');
  assert.strictEqual(td.events.show.orderRef, '88277', 'events dropped');
});

test('TRIP_DATA_COLLECTIONS lists every booking collection BookingsView needs', () => {
  ['flights', 'carRental', 'ferry', 'ferries', 'events', 'hotels', 'people'].forEach(f => {
    assert.ok(SeedMerge.TRIP_DATA_COLLECTIONS.includes(f), `${f} missing from TRIP_DATA_COLLECTIONS`);
  });
  assert.strictEqual(SeedMerge.merge(quebecSeed(), {}).people.alice.name, 'Alice', 'people dropped');
  const importSrc = fs.readFileSync('seed-import.cjs', 'utf8');
  ['flights', 'carRental', 'ferry', 'ferries', 'events'].forEach(f => {
    assert.ok(importSrc.includes(`${f}: SEED.${f}`), `seed-import.cjs does not inject ${f}`);
  });
  assert.ok(importSrc.includes('people:'), 'seed-import.cjs does not inject people');
});

test('incremental refresh keeps previously known meta when trip.data omits it', () => {
  const seed = quebecSeed();
  seed.trip.data = JSON.stringify({ travelers: [{ name: 'Alice' }] }); // partial payload
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
