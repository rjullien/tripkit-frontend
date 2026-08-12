/**
 * tests/edge-intent.test.cjs — EdgeIntent.classify keywords V1
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));
eval(fs.readFileSync('js/edge-model/intent.js', 'utf8'));

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

console.log('\n── EdgeIntent ─────────────────────────────────────────────');

test('rythme culturel → local', () => {
  assert.strictEqual(EdgeIntent.classify('Quel rythme pour 3 jours à Québec ?'), 'local');
});

test('conseil pratique → local', () => {
  assert.strictEqual(EdgeIntent.classify('Que mettre dans la valise pour le Canada ?'), 'local');
});

test('météo → remote', () => {
  assert.strictEqual(EdgeIntent.classify('Météo lundi à Montréal ?'), 'remote');
});

test('wifi / pin → remote', () => {
  assert.strictEqual(EdgeIntent.classify('Code wifi Airbnb demain ?'), 'remote');
});

test('prix → remote', () => {
  assert.strictEqual(EdgeIntent.classify('Quel prix pour un taxi ?'), 'remote');
});

test('empty → remote', () => {
  assert.strictEqual(EdgeIntent.classify(''), 'remote');
});

console.log(`\n${pass} tests passed\n`);
