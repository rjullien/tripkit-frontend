#!/usr/bin/env node
/**
 * perf-diag-full.mjs — Self-contained startup perf diagnostic.
 * Starts mock backend, runs measurements, kills server, prints report.
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9099;

// ═══════════════════════════════════════════════════════════════════════════════
// Simulated latencies (realistic mobile 3G / slow backend)
// ═══════════════════════════════════════════════════════════════════════════════
const LATENCIES = {
  '/health': 800,
  '/api/trips': 1200,
  '/api/trips/test-trip/version': 600,
  '/api/trips/test-trip/seed': 2500,
  '/api/trips/test-trip/construction': 1500,
};

const MOCK_SEED = {
  trip: { id: 'test-trip', name: 'Voyage Test', startDate: '2026-09-01' },
  days: Array.from({ length: 14 }, (_, i) => ({
    day: i + 1, title: `Jour ${i + 1}`, location: 'Montréal',
    geo: { lat: 45.5, lon: -73.56 },
  })),
  lists: {},
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK SERVER
// ═══════════════════════════════════════════════════════════════════════════════
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, `http://localhost:${PORT}`).pathname;

  if (path === '/health') {
    await delay(LATENCIES['/health']);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', version: '0.42.0' }));
    return;
  }
  if (path === '/api/trips') {
    await delay(LATENCIES['/api/trips']);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ id: 'test-trip', name: 'Voyage Test' }]));
    return;
  }
  if (path === '/api/trips/test-trip/version') {
    await delay(LATENCIES['/api/trips/test-trip/version']);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ version: '1', updated_at: '2026-08-20T10:00:00Z' }));
    return;
  }
  if (path === '/api/trips/test-trip/seed') {
    await delay(LATENCIES['/api/trips/test-trip/seed']);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(MOCK_SEED));
    return;
  }
  if (path === '/api/trips/test-trip/construction') {
    await delay(LATENCIES['/api/trips/test-trip/construction']);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ phase: 'active' }));
    return;
  }
  if (path.startsWith('/api/')) {
    await delay(300);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('null');
    return;
  }
  // Static files
  const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
  if (path === '/config.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(`var TRIPKIT_CONFIG = { apiUrl: "http://localhost:${PORT}", apiPrefix: "/api", defaultTripId: "test-trip" };`);
    return;
  }
  let filePath = join(ROOT, path === '/' ? 'index.html' : path);
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(readFileSync(filePath));
    return;
  }
  res.writeHead(404); res.end('Not found');
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEASUREMENT
// ═══════════════════════════════════════════════════════════════════════════════
async function fetchTimed(url, timeoutMs = 10000) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    const body = await res.text();
    return { elapsed: Date.now() - start, size: body.length, status: res.status, ok: true };
  } catch (e) {
    return { elapsed: Date.now() - start, size: 0, status: 0, ok: false, error: e.message };
  }
}

async function run() {
  await new Promise(r => server.listen(PORT, r));

  const B = `http://localhost:${PORT}`;
  console.log(`\n${'═'.repeat(76)}`);
  console.log(`  🔬  TripKit PWA — DIAGNOSTIC COMPLET DE PERFORMANCE AU DÉMARRAGE`);
  console.log(`${'═'.repeat(76)}`);
  console.log(`  Serveur mock: ${B}`);
  console.log(`  Date: ${new Date().toISOString()}\n`);

  // ── Shell download ──────────────────────────────────────────────────────────
  console.log(`┌${'─'.repeat(74)}┐`);
  console.log(`│  📦 PHASE 1: Téléchargement du shell (parallèle)                         │`);
  console.log(`├${'─'.repeat(74)}┤`);

  const shell = ['/index.html', '/config.js', '/css/theme.css', '/js/dist/bundle-core.js', '/js/dist/bundle-components.js'];
  const shellRes = await Promise.all(shell.map(p => fetchTimed(B + p)));
  shell.forEach((p, i) => {
    const r = shellRes[i];
    console.log(`│  ${r.ok ? '✅' : '❌'} ${p.padEnd(38)} ${String(r.elapsed).padStart(5)}ms  ${((r.size || 0) / 1024).toFixed(1).padStart(7)} KB │`);
  });
  const shellMax = Math.max(...shellRes.map(r => r.elapsed));
  console.log(`│  ⏱️  Temps shell (= plus lent):  ${String(shellMax).padStart(5)}ms                              │`);
  console.log(`└${'─'.repeat(74)}┘\n`);

  // ── Sequential boot chain ───────────────────────────────────────────────────
  console.log(`┌${'─'.repeat(74)}┐`);
  console.log(`│  🔗 PHASE 2: Chaîne séquentielle de boot (BLOQUANT — écran blanc)         │`);
  console.log(`├${'─'.repeat(74)}┤`);

  const steps = [
    { label: '/health (API.probe)',         url: '/health',                           timeout: 3000 },
    { label: 'GET /trips (reconcile)',      url: '/api/trips',                        timeout: 8000 },
    { label: 'GET /trips (resolveTripId)',  url: '/api/trips',                        timeout: 8000 },
    { label: '/trips/:id/version',          url: '/api/trips/test-trip/version',      timeout: 4000 },
    { label: '/trips/:id/seed',             url: '/api/trips/test-trip/seed',         timeout: 8000 },
    { label: '/trips/:id/construction',     url: '/api/trips/test-trip/construction', timeout: 15000 },
  ];

  let seqTotal = 0;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const r = await fetchTimed(B + s.url, s.timeout);
    seqTotal += r.elapsed;
    const bar = '█'.repeat(Math.round(r.elapsed / 100));
    console.log(`│  ${String(i + 1).padStart(2)}. ${s.label.padEnd(32)} ${String(r.elapsed).padStart(5)}ms  ${bar.padEnd(25)} │`);
  }
  console.log(`│  ${'─'.repeat(72)} │`);
  console.log(`│  ⏱️  Total séquentiel:          ${String(seqTotal).padStart(5)}ms                               │`);
  console.log(`└${'─'.repeat(74)}┘\n`);

  // ── Worst case (timeout) simulation ─────────────────────────────────────────
  console.log(`┌${'─'.repeat(74)}┐`);
  console.log(`│  💀 PHASE 3: Pire cas — backend « online mais injoignable »               │`);
  console.log(`├${'─'.repeat(74)}┤`);
  const worstCase = steps.reduce((sum, s) => sum + s.timeout, 0);
  steps.forEach((s, i) => {
    console.log(`│  ${String(i + 1).padStart(2)}. ${s.label.padEnd(32)} timeout: ${String(s.timeout / 1000).padStart(3)}s                       │`);
  });
  console.log(`│  ${'─'.repeat(72)} │`);
  console.log(`│  💀 TOTAL WORST CASE:           ${String(worstCase / 1000).padStart(5)}s  d'écran blanc               │`);
  console.log(`└${'─'.repeat(74)}┘\n`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`${'═'.repeat(76)}`);
  console.log(`  📊 RÉSUMÉ DU DIAGNOSTIC`);
  console.log(`${'═'.repeat(76)}`);
  console.log(`  ┌─────────────────────────────────────────────────────────────────────┐`);
  console.log(`  │ Scénario                          │ Temps estimé                    │`);
  console.log(`  ├─────────────────────────────────────────────────────────────────────┤`);
  console.log(`  │ Retour (cache localStorage)       │ ~${shellMax}ms (shell only)              │`);
  console.log(`  │ Cold start (backend normal)       │ ~${shellMax + seqTotal}ms (${((shellMax + seqTotal) / 1000).toFixed(1)}s)               │`);
  console.log(`  │ Cold start (backend timeout)      │ ~${worstCase}ms (${(worstCase / 1000).toFixed(0)}s !)                 │`);
  console.log(`  │ Réseau flaky (SW network-first)   │ +3-10s avant même le HTML       │`);
  console.log(`  └─────────────────────────────────────────────────────────────────────┘`);
  console.log('');
  console.log(`  🔴 PROBLÈMES IDENTIFIÉS:`);
  console.log('');
  console.log(`  1. SERVICE WORKER NETWORK-FIRST quand online:`);
  console.log(`     → Le navigateur attend la réponse réseau AVANT d'afficher le HTML`);
  console.log(`       même si le SW a une copie en cache. Sur un réseau lent/capté,`);
  console.log(`       l'écran reste blanc pendant 3-10s avant le premier octet.`);
  console.log('');
  console.log(`  2. CHAÎNE SÉQUENTIELLE de 6 appels réseau:`);
  console.log(`     → Chaque await bloque le suivant. Aucune parallélisation.`);
  console.log(`       probe → getTrips → getTrips(!) → version → seed → construction`);
  console.log(`       Sur un backend normal: ${seqTotal}ms. Timeout: ${worstCase / 1000}s.`);
  console.log('');
  console.log(`  3. DOUBLE APPEL GET /api/trips:`);
  console.log(`     → reconcileTripRegistry() + resolveTripId() appellent le même endpoint.`);
  console.log(`       Coût: ~${LATENCIES['/api/trips'] * 2}ms sur le chemin critique.`);
  console.log('');
  console.log(`  4. syncConstructionData BLOQUANT sur le chemin de boot:`);
  console.log(`     → await syncConstructionData() est dans loadTripSeed() (chemin critique).`);
  console.log(`       Même quand le mode construction est OFF, ça ajoute ${LATENCIES['/api/trips/test-trip/construction']}ms.`);
  console.log('');
  console.log(`  5. API.probe() REDONDANT:`);
  console.log(`     → fetchBackendVersion() dans init() fait déjà GET /health.`);
  console.log(`       Puis refreshFromBackend() refait API.probe() = un 2ème /health.`);
  console.log(`       Coût: ${LATENCIES['/health']}ms dupliqué sur le chemin critique.`);
  console.log('');
  console.log(`${'═'.repeat(76)}`);
  console.log(`  💡 RECOMMANDATIONS (par impact décroissant)`);
  console.log(`${'═'.repeat(76)}`);
  console.log('');
  console.log(`  R1. SW → stale-while-revalidate pour le shell`);
  console.log(`      Impact: élimine 3-10s sur réseau lent (paint immédiat depuis cache)`);
  console.log(`      Risque: version décalée d'un refresh max (le banner update corrige)`);
  console.log('');
  console.log(`  R2. Paralléliser probe + getTrips + checkVersion`);
  console.log(`      Impact: réduit la chaîne de 6 requêtes séquentielles à ~3`);
  console.log(`      Ex: Promise.all([probe(), getTrips()]) puis seed + construction`);
  console.log('');
  console.log(`  R3. Mettre en cache le résultat de getTrips() (déduplication)`);
  console.log(`      Impact: -${LATENCIES['/api/trips']}ms (élimine le 2ème appel identique)`);
  console.log('');
  console.log(`  R4. syncConstructionData en fire-and-forget (non-await)`);
  console.log(`      Impact: -${LATENCIES['/api/trips/test-trip/construction']}ms sur CHAQUE boot`);
  console.log(`      Le rendu n'en a pas besoin au premier paint`);
  console.log('');
  console.log(`  R5. Réutiliser fetchBackendVersion pour API.probe`);
  console.log(`      Impact: -${LATENCIES['/health']}ms (un seul /health au lieu de deux)`);
  console.log('');
  console.log(`  R6. Timeout agressif sur la chaîne globale (ex: 10s race)`);
  console.log(`      Impact: cap le pire cas à 10s au lieu de ${worstCase / 1000}s`);
  console.log(`      Affiche le cache local si le backend ne répond pas en 10s.`);
  console.log('');
  console.log(`${'═'.repeat(76)}\n`);

  server.close();
}

run().catch(e => { console.error(e); process.exit(1); });
