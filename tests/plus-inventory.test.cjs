/**
 * tests/plus-inventory.test.cjs — contrat source de l'onglet Plus
 *
 * Polarsteps (et les autres landmarks Plus) ont déjà disparu du FE parce
 * qu'un agent « nettoyait » renderPlus / bundles.json. Les specs Playwright
 * de Polarsteps ne suffisent pas : on les supprime en même temps que le
 * panneau. Ce fichier est volontairement sans DOM — `npm run test:unit`
 * casse dès que le mount, le bundle ou le CSS n'est plus là.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
process.chdir(ROOT);

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

const appJs = fs.readFileSync('js/app.js', 'utf8');
const panelJs = fs.readFileSync('js/components/polarsteps-panel.js', 'utf8');
const css = fs.readFileSync('css/theme.css', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundles.json', 'utf8'));
const components = manifest['bundle-components'] || [];
const edge = manifest['bundle-edge'] || [];

function idx(src, needle, label) {
  const i = src.indexOf(needle);
  assert.ok(i > -1, `${label || needle} introuvable`);
  return i;
}

console.log('\n── Plus inventory (source) ─────────────────────────────────');

test('renderPlus monte Polarsteps entre Publier et Léo, hors Expérimental', () => {
  const renderPlus = appJs.slice(appJs.indexOf('function renderPlus'));
  const iSel = idx(renderPlus, 'id="plus-trip-selector"', '#plus-trip-selector');
  const iPub = idx(renderPlus, 'id="plus-publish-panel"', '#plus-publish-panel');
  const iPs = idx(renderPlus, 'id="plus-polarsteps-panel"', '#plus-polarsteps-panel');
  const iLeo = idx(renderPlus, 'id="plus-leo-chat-stream"', '#plus-leo-chat-stream');
  const iExp = idx(renderPlus, 'id="plus-experimental-wrap"', '#plus-experimental-wrap');
  assert.ok(iSel < iPub, 'Voyage actif / sélecteur doit précéder Publier');
  assert.ok(iPub < iPs, 'Polarsteps doit suivre Publier (SPEC-polarsteps-caption)');
  assert.ok(iPs < iLeo, 'Polarsteps doit précéder Léo');
  assert.ok(iLeo < iExp, 'Léo et Polarsteps restent hors Expérimental');
});

test('renderPlus appelle PolarstepsPanel après le paint HTML', () => {
  assert.ok(/PolarstepsPanel\.loadStatus\s*\(/.test(appJs),
    'renderPlus ne charge plus PolarstepsPanel.loadStatus');
  assert.ok(/PolarstepsPanel\.renderSection\s*\(/.test(appJs),
    'renderPlus ne peint plus PolarstepsPanel.renderSection');
  assert.ok(/getElementById\(['"]plus-polarsteps-panel['"]\)/.test(appJs),
    'le mount doit re-sélectionner #plus-polarsteps-panel (nœud live, pas un snapshot détaché)');
});

test('polarsteps-panel.js est dans bundle-components, pas bundle-edge', () => {
  const rel = 'js/components/polarsteps-panel.js';
  assert.ok(components.includes(rel),
    rel + ' absent de bundle-components — Polarsteps disparaît si le panneau n\'est plus booté');
  assert.ok(!edge.includes(rel),
    rel + ' a glissé dans bundle-edge : un échec edge vide la box Polarsteps');
  assert.ok(fs.existsSync(rel), rel + ' a été supprimé');
});

test('le panneau Polarsteps expose le titre et le bouton Générer', () => {
  assert.ok(/Polarsteps/.test(panelJs), 'titre Polarsteps absent de polarsteps-panel.js');
  assert.ok(/polarsteps-section/.test(panelJs), '.polarsteps-section absent du markup');
  assert.ok(/polarsteps-generate/.test(panelJs), 'bouton Générer absent');
  assert.ok(/function loadStatus/.test(panelJs), 'loadStatus a disparu');
  assert.ok(/function renderSection/.test(panelJs), 'renderSection a disparu');
  assert.ok(/seed\.polarsteps|trip\.polarsteps/.test(panelJs),
    'repli seed trip.polarsteps.enabled a disparu — un 5xx status recache la box');
});

test('CSS Polarsteps toujours chargé (theme.css, pas un fichier mort)', () => {
  assert.ok(/\.polarsteps-section/.test(css), '.polarsteps-section absent de css/theme.css');
});

test('API Polarsteps toujours câblée', () => {
  const api = fs.readFileSync('js/api.js', 'utf8');
  assert.ok(/function getPolarstepsStatus/.test(api), 'API.getPolarstepsStatus a disparu');
  assert.ok(/\/polarsteps\/status/.test(api), 'route /polarsteps/status absente de api.js');
});

test('SeedMerge transporte trip.polarsteps', () => {
  const merge = fs.readFileSync('js/seed-merge.js', 'utf8');
  assert.ok(/['"]polarsteps['"]/.test(merge),
    'polarsteps a sauté de TRIP_META_FIELDS — le flag seed ne survit plus au merge');
});

console.log(`\n  ${pass} passed\n`);
