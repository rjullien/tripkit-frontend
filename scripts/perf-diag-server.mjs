#!/usr/bin/env node
/**
 * perf-diag-server.mjs — Mock backend + instrumented frontend for startup diagnosis.
 *
 * Simulates backend endpoints with configurable latency to measure which calls
 * block the boot and for how long.
 *
 * Usage:
 *   node scripts/perf-diag-server.mjs [--latency <ms>] [--port <port>]
 *
 * The server serves the frontend files AND mocks /api/* + /health endpoints.
 * It injects performance marks into the HTML to capture exact timings.
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = parseInt(process.argv.find((a, i) => process.argv[i - 1] === '--port') || '9090');
const LATENCY = parseInt(process.argv.find((a, i) => process.argv[i - 1] === '--latency') || '0');

// Simulated latencies per endpoint (ms) — worst-case mobile 3G
const ENDPOINT_LATENCY = {
  '/health': 800,
  '/api/trips': 1200,
  '/api/trips/test-trip/version': 600,
  '/api/trips/test-trip/seed': 2500,
  '/api/trips/test-trip/construction': 1500,
};

// Mock trip data
const MOCK_SEED = {
  trip: {
    id: 'test-trip',
    name: 'Voyage Test Perf',
    startDate: '2026-09-01',
    endDate: '2026-09-14',
  },
  days: Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    title: `Jour ${i + 1}`,
    description: `Description du jour ${i + 1} avec du texte pour simuler une charge réaliste.`,
    location: 'Montréal, QC',
    geo: { lat: 45.5017, lon: -73.5673 },
    activities: [
      { time: '09:00', label: 'Petit déjeuner' },
      { time: '10:00', label: 'Visite' },
      { time: '12:00', label: 'Déjeuner' },
      { time: '14:00', label: 'Activité' },
      { time: '19:00', label: 'Dîner' },
    ],
  })),
  lists: {},
  people: [
    { name: 'Alice', nationality: 'FR' },
    { name: 'Bob', nationality: 'FR' },
  ],
};

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function delay(ms) {
  return new Promise(r => setTimeout(r, ms + LATENCY));
}

// Timing injection into index.html
const TIMING_SCRIPT = `
<script>
// ── Performance instrumentation ──────────────────────────────────────────────
window.__perfMarks = [];
window.__perfStart = performance.now();
function perfMark(label) {
  const t = performance.now() - window.__perfStart;
  window.__perfMarks.push({ label, t });
  console.log('[PERF] ' + t.toFixed(1) + 'ms — ' + label);
}
perfMark('html-parse-start');

// Monkey-patch fetch to track network calls
const _origFetch = window.fetch;
let _fetchId = 0;
window.fetch = function(...args) {
  const id = ++_fetchId;
  const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '?';
  const short = url.replace(window.location.origin, '').slice(0, 60);
  perfMark('fetch-start #' + id + ' ' + short);
  const start = performance.now();
  return _origFetch.apply(this, args).then(res => {
    const dt = (performance.now() - start).toFixed(0);
    perfMark('fetch-done  #' + id + ' ' + short + ' [' + res.status + '] ' + dt + 'ms');
    return res;
  }).catch(err => {
    const dt = (performance.now() - start).toFixed(0);
    perfMark('fetch-FAIL  #' + id + ' ' + short + ' [' + (err.name || 'err') + '] ' + dt + 'ms');
    throw err;
  });
};

// Track DOMContentLoaded and first render
document.addEventListener('DOMContentLoaded', () => perfMark('DOMContentLoaded'));
window.addEventListener('load', () => {
  perfMark('window-load');
  // Print summary after a short delay to capture post-load fetches
  setTimeout(() => {
    console.log('\\n══════════ PERF SUMMARY ══════════');
    const marks = window.__perfMarks;
    marks.forEach(m => console.log(('  ' + m.t.toFixed(1)).slice(-8) + ' ms — ' + m.label));
    const last = marks[marks.length - 1];
    console.log('──────────────────────────────────');
    console.log('Total boot time: ' + (last ? last.t.toFixed(0) : '?') + ' ms');
    console.log('Fetch calls: ' + _fetchId);
    console.log('══════════════════════════════════');
  }, 5000);
});
</script>
`;

function serveFile(res, filePath) {
  const ext = extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // ── Mock API endpoints ──────────────────────────────────────────────────
  if (path === '/health') {
    const lat = ENDPOINT_LATENCY['/health'] || 0;
    await delay(lat);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', version: '0.42.0' }));
    return;
  }

  if (path === '/api/trips') {
    const lat = ENDPOINT_LATENCY['/api/trips'] || 0;
    await delay(lat);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ id: 'test-trip', name: 'Voyage Test Perf' }]));
    return;
  }

  if (path === '/api/trips/test-trip/version') {
    const lat = ENDPOINT_LATENCY['/api/trips/test-trip/version'] || 0;
    await delay(lat);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ version: '1', updated_at: '2026-08-20T10:00:00Z' }));
    return;
  }

  if (path === '/api/trips/test-trip/seed') {
    const lat = ENDPOINT_LATENCY['/api/trips/test-trip/seed'] || 0;
    await delay(lat);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(MOCK_SEED));
    return;
  }

  if (path === '/api/trips/test-trip/construction') {
    const lat = ENDPOINT_LATENCY['/api/trips/test-trip/construction'] || 0;
    await delay(lat);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ phase: 'active', lastQA: null }));
    return;
  }

  if (path.startsWith('/api/')) {
    await delay(500);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('null');
    return;
  }

  // ── Static file serving ──────────────────────────────────────────────────
  // Serve config.js dynamically
  if (path === '/config.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' });
    res.end(`var TRIPKIT_CONFIG = {
  apiUrl: "http://localhost:${PORT}",
  apiPrefix: "/api",
  defaultTripId: "test-trip"
};`);
    return;
  }

  // Serve index.html with injected performance instrumentation
  if (path === '/' || path === '/index.html') {
    let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    // Inject timing script right after <head>
    html = html.replace('<head>', '<head>' + TIMING_SCRIPT);
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    res.end(html);
    return;
  }

  // Serve static files from root
  let filePath = join(ROOT, path);
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }

  // Fallback to index.html (SPA routing)
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`\n🔬 TripKit Perf Diagnostic Server`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Base latency: +${LATENCY}ms per endpoint`);
  console.log(`   Endpoint latencies:`);
  Object.entries(ENDPOINT_LATENCY).forEach(([ep, ms]) => {
    console.log(`     ${ep}: ${ms + LATENCY}ms`);
  });
  console.log(`\n   Open in browser or run:`);
  console.log(`   node scripts/perf-diag-measure.mjs http://localhost:${PORT}\n`);
});
