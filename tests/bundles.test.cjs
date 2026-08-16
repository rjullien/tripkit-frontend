/**
 * tests/bundles.test.cjs — contrat de scripts/build-bundles.mjs et contenu généré
 *
 * Ce que rien ne verrouillait avant : le build sort-il vraiment en 1 quand une
 * source manque (sinon un bundle amputé partirait en prod sans bruit), et les
 * bundles générés contiennent-ils bien les 34 sources ? Le manifeste seul était
 * vérifié, donc une source silencieusement sautée passait.
 *
 * L'ordre de chargement, déplacé de index.html vers bundles.json, est également
 * verrouillé ici — et pas seulement pour seed-merge.js : les deux positions qui
 * ont réellement changé sont app.js (dernier de bundle-core, donc avant tous les
 * composants) et les sources edge-model/ avant les flux de chat.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
process.chdir(ROOT);

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

const NODE = process.execPath;
const SCRIPT = path.join('scripts', 'build-bundles.mjs');

function build(args) {
  return spawnSync(NODE, [SCRIPT].concat(args || []), { encoding: 'utf8' });
}

const manifest = JSON.parse(fs.readFileSync('bundles.json', 'utf8'));
const names = Object.keys(manifest).filter(k => !k.startsWith('_'));
const allSources = names.flatMap(n => manifest[n]);

// Le build est idempotent : on le lance une fois pour travailler sur js/dist réel
// (les tests unitaires peuvent tourner avant `npm run build` en CI).
const initial = build();

test('npm run build réussit et écrit les trois bundles', () => {
  assert.strictEqual(initial.status, 0, 'build en échec : ' + initial.stderr);
  for (const name of names) {
    const out = path.join('js', 'dist', name + '.js');
    assert.ok(fs.existsSync(out), out + ' non généré');
  }
});

test('chaque source du manifeste est présente dans son bundle, avec son contenu', () => {
  for (const name of names) {
    const out = fs.readFileSync(path.join('js', 'dist', name + '.js'), 'utf8');
    for (const rel of manifest[name]) {
      assert.ok(out.includes(`/* ==== ${rel} ==== */`), `${rel} absent de ${name}.js`);
      // Marqueur de contenu : la dernière ligne non vide de la source doit s'y
      // retrouver, sinon le fichier a été « inclus » vide.
      const src = fs.readFileSync(rel, 'utf8').replace(/\n*$/, '');
      const lastLine = src.split('\n').filter(l => l.trim()).pop();
      assert.ok(out.includes(lastLine), `${rel} tronqué dans ${name}.js`);
    }
  }
});

test('les 34 sources sont couvertes, sans doublon entre bundles', () => {
  assert.strictEqual(allSources.length, 34, 'le manifeste ne déclare plus 34 sources');
  assert.strictEqual(new Set(allSources).size, 34, 'une source apparaît dans deux bundles');
});

test('le prologue du bundle neutralise le "use strict" de qrcode-svg.min.js', () => {
  const out = fs.readFileSync(path.join('js', 'dist', 'bundle-components.js'), 'utf8');
  const header = out.slice(0, out.indexOf('/* ==== js/lib/qrcode-svg.min.js'));
  assert.ok(/;\s*$/.test(header),
    'le `;` de tête a disparu : le "use strict" de qrcode-svg passerait les 14 autres composants en strict mode');
});

// ── Ordre de chargement (déplacé de index.html vers bundles.json) ────────────
const order = names.flatMap(n => manifest[n]);
const at = (rel) => {
  const i = order.indexOf(rel);
  assert.ok(i > -1, rel + ' n\'est dans aucun bundle');
  return i;
};

test('app.js est la dernière source de bundle-core', () => {
  const core = manifest['bundle-core'];
  assert.strictEqual(core[core.length - 1], 'js/app.js',
    'app.js doit rester en fin de bundle-core : il s\'abonne à DOMContentLoaded et lit les composants au call time');
  assert.ok(at('js/store.js') < at('js/app.js'), 'store.js doit précéder app.js');
  assert.ok(at('js/api.js') < at('js/app.js'), 'api.js doit précéder app.js');
});

test('les composants sont chargés après le cœur, qrcode en tête', () => {
  assert.ok(at('js/app.js') < at('js/components/timeline.js'),
    'bundle-core doit précéder bundle-components (ordre des <script> dans index.html)');
  assert.strictEqual(manifest['bundle-components'][0], 'js/lib/qrcode-svg.min.js',
    'qrcode-svg.min.js doit rester la première source de bundle-components');
});

test('bundle-edge : le moteur avant les flux de chat qui l\'utilisent', () => {
  ['js/edge-model/config.js', 'js/edge-model/intent.js', 'js/edge-model/prompt-builder.js', 'js/edge-model/engine.js']
    .forEach(rel => {
      assert.ok(at(rel) < at('js/components/leo-chat-stream.js'), rel + ' doit précéder leo-chat-stream.js');
      assert.ok(at(rel) < at('js/components/edge-chat-stream.js'), rel + ' doit précéder edge-chat-stream.js');
    });
  const edge = manifest['bundle-edge'];
  assert.strictEqual(edge[edge.length - 1], 'js/components/edge-chat-stream.js',
    'edge-chat-stream.js doit rester la dernière source de bundle-edge');
});

test('seed-merge.js précède ses consommateurs', () => {
  assert.ok(at('js/seed-merge.js') < at('js/components/trip-selector.js'));
  assert.ok(at('js/seed-merge.js') < at('js/app.js'));
});

test('construction-contract est dans bundle-core, avant app.js', () => {
  const core = manifest['bundle-core'];
  assert.ok(core.includes('js/construction-contract.js'), 'construction-contract.js doit rester dans bundle-core (pur, pas de DOM)');
  assert.ok(at('js/construction-contract.js') < at('js/app.js'));
});

test('nuisance-stream précède construction-view dans bundle-components', () => {
  assert.ok(at('js/components/nuisance-stream.js') < at('js/components/construction-view.js'));
});

test('discovery-panel précède construction-view dans bundle-components', () => {
  assert.ok(at('js/components/discovery-panel.js') < at('js/components/construction-view.js'));
});

// ── Contrat d'échec : rien ne l'épinglait ────────────────────────────────────
function withTempManifest(content, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tk-bundles-'));
  const manifestPath = path.join(dir, 'bundles.json');
  fs.writeFileSync(manifestPath, JSON.stringify(content));
  try {
    return fn(build(['--manifest', manifestPath, '--out-dir', path.join(dir, 'dist')]), dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('source manquante : sortie en 1 et aucun bundle écrit', () => {
  withTempManifest({ 'bundle-x': ['js/store.js', 'js/pas-la.js'] }, (res, dir) => {
    assert.strictEqual(res.status, 1, 'le build doit sortir en 1 quand une source manque');
    assert.ok(/source introuvable/.test(res.stderr), 'aucun message sur la source manquante');
    assert.ok(!fs.existsSync(path.join(dir, 'dist', 'bundle-x.js')),
      'un bundle amputé a été écrit malgré la source manquante');
  });
});

test('liste de sources vide : sortie en 1', () => {
  withTempManifest({ 'bundle-x': [] }, (res) => {
    assert.strictEqual(res.status, 1);
    assert.ok(/vide ou invalide/.test(res.stderr), res.stderr);
  });
});

test('manifeste sans aucun bundle : sortie en 1', () => {
  withTempManifest({ _comment: ['doc seulement'] }, (res) => {
    assert.strictEqual(res.status, 1);
    assert.ok(/aucun bundle/.test(res.stderr), res.stderr);
  });
});

test('manifeste illisible : sortie en 1', () => {
  const res = build(['--manifest', path.join(os.tmpdir(), 'tk-inexistant-' + Date.now() + '.json')]);
  assert.strictEqual(res.status, 1);
  assert.ok(/manifeste illisible/.test(res.stderr), res.stderr);
});

test('build idempotent : deux exécutions donnent les mêmes octets', () => {
  const before = names.map(n => fs.readFileSync(path.join('js', 'dist', n + '.js')));
  assert.strictEqual(build().status, 0);
  const after = names.map(n => fs.readFileSync(path.join('js', 'dist', n + '.js')));
  before.forEach((buf, i) => assert.ok(buf.equals(after[i]), names[i] + ' n\'est pas reproductible'));
});

console.log(`\n  ${pass} passed\n`);
