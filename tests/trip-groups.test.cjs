/**
 * tests/trip-groups.test.cjs — Plus trip list buckets (mine / past / others)
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));
eval(fs.readFileSync('js/day-resolver.js', 'utf8'));
eval(fs.readFileSync('js/trip-groups.js', 'utf8'));

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

const now = new Date('2026-08-14T12:00:00');

function quebec(extra) {
  return Object.assign({
    trip: {
      id: 'quebec-2026',
      name: 'Boucle Québec 2026',
      startDate: '2026-08-14',
      endDate: '2026-09-01',
      travelers: [
        { personId: 'rene', role: 'owner' },
        { personId: 'nicole' },
        { personId: 'baptiste' },
      ],
      users: {
        rjullien: { defaultConf: 'rene' },
        Nicole: { city: 'Nice' },
        BaptTF: { city: 'Montréal' },
      },
    },
    people: { rene: { id: 'rene', name: 'René' } },
  }, extra || {});
}

function usa() {
  return {
    trip: {
      id: 'usa-2026',
      name: 'Road Trip USA 2026',
      startDate: '2026-04-16',
      endDate: '2026-05-06',
      travelers: [
        { personId: 'rene', role: 'owner' },
        { personId: 'laurine', leaveDate: '2026-04-27' },
      ],
      users: {
        rjullien: { defaultConf: 'rene' },
        'laurine-rol': { defaultConf: 'laurine' },
      },
    },
  };
}

function philippines() {
  return {
    trip: {
      id: 'philippines-2027',
      name: 'Philippines',
      startDate: '2027-02-25',
      endDate: '2027-03-11',
      travelers: [
        { personId: 'laurine', role: 'owner' },
        { personId: 'carl' },
      ],
    },
    people: { laurine: { id: 'laurine', name: 'Laurine', login: 'laurine' } },
  };
}

console.log('\n── TripGroups ─────────────────────────────────────────────');

test('René: Québec (en cours, à lui) stays open', () => {
  assert.strictEqual(TripGroups.bucket(quebec(), 'rjullien', now), 'open');
  assert.strictEqual(TripGroups.isMine(quebec(), 'rjullien'), true);
});

test('René: USA (passé, à lui) → past', () => {
  assert.strictEqual(TripGroups.bucket(usa(), 'rjullien', now), 'past');
});

test('Laurine: Philippines (à elle, futur) stays open', () => {
  assert.strictEqual(TripGroups.bucket(philippines(), 'laurine', now), 'open');
});

test('Laurine: USA visible mais pas à elle → others (même si voyageuse)', () => {
  assert.strictEqual(TripGroups.isMine(usa(), 'laurine-rol'), false);
  assert.strictEqual(TripGroups.bucket(usa(), 'laurine-rol', now), 'others');
});

test('Nicole on Québec is not owner → others', () => {
  assert.strictEqual(TripGroups.bucket(quebec(), 'Nicole', now), 'others');
});

test('unknown login does not dump trips into others', () => {
  assert.strictEqual(TripGroups.bucket(quebec(), '', now), 'open');
  assert.strictEqual(TripGroups.bucket(usa(), '', now), 'past');
});

test('login laurine matches personId owner without trip.users', () => {
  assert.strictEqual(TripGroups.isMine(philippines(), 'laurine'), true);
});

test('laurine-rol (USA users key) still owns Philippines via identity union', () => {
  const known = TripGroups.identityPersonIds([usa(), philippines()], 'laurine-rol');
  assert.ok(known.has('laurine'));
  assert.strictEqual(TripGroups.isMine(philippines(), 'laurine-rol', known), true);
  assert.strictEqual(TripGroups.bucket(philippines(), 'laurine-rol', now, known), 'open');
  assert.strictEqual(TripGroups.bucket(usa(), 'laurine-rol', now, known), 'others');
});

console.log(`\n  ${pass} passed\n`);
