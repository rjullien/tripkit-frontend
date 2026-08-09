/**
 * tests/people-helpers.test.cjs — personId → people resolution
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));
eval(fs.readFileSync('js/people-helpers.js', 'utf8'));

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

const people = {
  rene: {
    id: 'rene',
    name: 'René',
    emoji: '👨',
    documents: [
      { type: 'passport', label: 'Passeport', number: '18FD60393' },
      { type: 'eta-canada', label: 'AVE Canada', number: 'J528864639', passport: '18FD60393' },
    ],
  },
  nicole: { id: 'nicole', name: 'Nicole', emoji: '👩' },
};

console.log('\n── PeopleHelpers ──────────────────────────────────────────');

test('displayName from personId', () => {
  assert.strictEqual(PeopleHelpers.displayName({ personId: 'rene' }, people), 'René');
});

test('legacy name still works', () => {
  assert.strictEqual(PeopleHelpers.displayName({ name: 'Bob' }, people), 'Bob');
});

test('withDocuments only people who have docs', () => {
  const td = {
    trip: { travelers: [{ personId: 'rene' }, { personId: 'nicole' }] },
    people,
  };
  const docs = PeopleHelpers.withDocuments(td);
  assert.strictEqual(docs.length, 1);
  assert.strictEqual(docs[0].name, 'René');
  assert.strictEqual(docs[0].documents.length, 2);
  assert.strictEqual(docs[0].documents[1].passport, '18FD60393');
});

test('TRIP_DATA_COLLECTIONS includes people', () => {
  eval(fs.readFileSync('js/seed-merge.js', 'utf8'));
  assert.ok(SeedMerge.TRIP_DATA_COLLECTIONS.includes('people'));
  const importSrc = fs.readFileSync('seed-import.cjs', 'utf8');
  assert.ok(importSrc.includes('people: TRIP_PEOPLE') || importSrc.includes('people:'));
});

console.log(`\n  ${pass} passed\n`);
