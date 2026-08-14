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

test('Laurine: USA (voyageuse, passé) → past, not Autres', () => {
  assert.strictEqual(TripGroups.isMine(usa(), 'laurine-rol'), true);
  assert.strictEqual(TripGroups.bucket(usa(), 'laurine-rol', now), 'past');
});

test('Nicole on Québec (voyageuse, en cours) → open', () => {
  assert.strictEqual(TripGroups.isMine(quebec(), 'Nicole'), true);
  assert.strictEqual(TripGroups.bucket(quebec(), 'Nicole', now), 'open');
});

test('Baptiste on Québec (voyageur, en cours) → open', () => {
  assert.strictEqual(TripGroups.bucket(quebec(), 'BaptTF', now), 'open');
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
  assert.strictEqual(TripGroups.bucket(usa(), 'laurine-rol', now, known), 'past');
});

console.log('\n── TripGroups.bucketSource (GH seeds) ─────────────────────');

const jullienQc = {
  sourceId: 'jullien', family: 'jullien', tripId: 'quebec-2026',
  ownerLogins: ['rene', 'nicole'], publisherLogins: ['rene', 'nicole'],
};
const jullienUsa = {
  sourceId: 'jullien', family: 'jullien', tripId: 'usa-2026',
  ownerLogins: ['rene', 'nicole'], publisherLogins: ['rene', 'nicole'],
};
const jullienDemo = {
  sourceId: 'jullien', family: 'jullien', tripId: 'publish-demo-2026',
  ownerLogins: ['rene', 'nicole'], publisherLogins: ['rene', 'nicole'],
};
const laurinePh = {
  sourceId: 'laurine', family: 'laurine', tripId: 'philippines-2027',
  ownerLogins: ['laurine'], publisherLogins: ['laurine'],
};

test('seed with trip in Store reuses voyage buckets', () => {
  const known = TripGroups.identityPersonIds([quebec(), usa(), philippines()], 'rjullien');
  assert.strictEqual(TripGroups.bucketSource(jullienQc, quebec(), 'rjullien', now, known), 'open');
  assert.strictEqual(TripGroups.bucketSource(jullienUsa, usa(), 'rjullien', now, known), 'past');
  assert.strictEqual(TripGroups.bucketSource(laurinePh, philippines(), 'rjullien', now, known), 'others');
});

test('create seed (no trip data): mine via ownerLogins + identity stays open', () => {
  const known = TripGroups.identityPersonIds([quebec()], 'rjullien');
  assert.ok(known.has('rene'));
  assert.strictEqual(TripGroups.bucketSource(jullienDemo, null, 'rjullien', now, known), 'open');
});

test('create seed of another family → others', () => {
  const known = TripGroups.identityPersonIds([quebec()], 'rjullien');
  assert.strictEqual(TripGroups.bucketSource(laurinePh, null, 'rjullien', now, known), 'others');
});

test('unknown login does not dump create seeds into others', () => {
  assert.strictEqual(TripGroups.bucketSource(laurinePh, null, '', now), 'open');
});

console.log('\n── TripGroups.mergeListItem (GET /trips) ──────────────────');

test('list payload (start_date + data.travelers) buckets like a full seed', () => {
  const qcList = {
    id: 'quebec-2026',
    name: 'Québec 2026',
    start_date: '2026-08-14',
    end_date: '2026-09-01',
    data: {
      travelers: [{ personId: 'rene', role: 'owner' }],
      users: { rjullien: { defaultConf: 'rene' } },
    },
  };
  const usaList = {
    id: 'usa-2026',
    name: 'USA',
    start_date: '2026-04-16',
    end_date: '2026-05-06',
    data: {
      travelers: [{ personId: 'rene', role: 'owner' }, { personId: 'laurine' }],
      users: { rjullien: { defaultConf: 'rene' } },
    },
  };
  const phList = {
    id: 'philippines-2027',
    name: 'Philippines',
    start_date: '2027-02-25',
    end_date: '2027-03-11',
    data: {
      travelers: [{ personId: 'laurine', role: 'owner' }],
    },
  };
  const qc = TripGroups.mergeListItem(null, qcList);
  const us = TripGroups.mergeListItem(null, usaList);
  const ph = TripGroups.mergeListItem(null, phList);
  const known = TripGroups.identityPersonIds([qc, us, ph], 'rjullien');
  assert.strictEqual(TripGroups.bucket(qc, 'rjullien', now, known), 'open');
  assert.strictEqual(TripGroups.bucket(us, 'rjullien', now, known), 'past');
  assert.strictEqual(TripGroups.bucket(ph, 'rjullien', now, known), 'others');
});

test('mergeListItem fills missing travelers without wiping cached days', () => {
  const existing = {
    trip: { id: 'quebec-2026', name: 'Québec', startDate: '2026-08-14' },
    days: [{ day: 1 }],
  };
  const merged = TripGroups.mergeListItem(existing, {
    id: 'quebec-2026',
    start_date: '2026-08-14',
    end_date: '2026-09-01',
    data: { travelers: [{ personId: 'rene', role: 'owner' }] },
  });
  assert.strictEqual(merged.days.length, 1);
  assert.strictEqual(merged.trip.endDate, '2026-09-01');
  assert.strictEqual(merged.trip.travelers[0].personId, 'rene');
});

console.log(`\n  ${pass} passed\n`);
