#!/usr/bin/env node
/**
 * scripts/build-bundles.mjs — le seul build step du repo.
 *
 * Concatène les sources listées dans bundles.json (dans l'ordre) en
 * js/dist/<bundle>.js. Aucune dépendance npm : node:fs / node:path / node:zlib.
 *
 * Pourquoi une simple concaténation et pas un bundler :
 * chaque source est un script classique `var X = (() => { ... })();` sans
 * import/export. Concaténer dans l'ordre est donc exactement équivalent à la
 * suite de <script> d'avant, sans changer la sémantique des globales.
 *
 * Idempotent : réécrit les mêmes octets pour les mêmes sources.
 * Sort en 1 si une source de bundles.json manque sur le disque.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'js', 'dist');
const MANIFEST = join(ROOT, 'bundles.json');

// nginx.conf gzips en level 5 : on mesure au même niveau pour que le rapport
// reflète les octets réellement transférés.
const GZIP_LEVEL = 5;

function kb(bytes) {
  return (bytes / 1024).toFixed(1) + ' Ko';
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
// Les clés `_*` sont de la documentation dans le manifeste, pas des bundles.
const bundles = Object.entries(manifest).filter(([name]) => !name.startsWith('_'));

if (!bundles.length) {
  console.error('[build] bundles.json ne déclare aucun bundle');
  process.exit(1);
}

// 1) Vérification stricte : toutes les sources doivent exister avant d'écrire.
const sources = new Map();
let missing = 0;
for (const [name, files] of bundles) {
  if (!Array.isArray(files) || !files.length) {
    console.error(`[build] ${name}: liste de sources vide ou invalide`);
    process.exit(1);
  }
  for (const rel of files) {
    if (sources.has(rel)) continue;
    try {
      sources.set(rel, readFileSync(join(ROOT, rel), 'utf8'));
    } catch (err) {
      console.error(`[build] source introuvable : ${rel} (${err.code})`);
      missing++;
    }
  }
}
if (missing) {
  console.error(`[build] ${missing} source(s) manquante(s) — rien n'a été écrit`);
  process.exit(1);
}

// 2) Concaténation + écriture.
mkdirSync(OUT_DIR, { recursive: true });

let totalRaw = 0;
let totalGzip = 0;
console.log(`[build] ${bundles.length} bundles depuis bundles.json (gzip niveau ${GZIP_LEVEL})`);

for (const [name, files] of bundles) {
  // Le `;` en tête n'est pas décoratif : il empêche un `"use strict"` en
  // première ligne d'une source (js/lib/qrcode-svg.min.js) de devenir le
  // directive prologue du bundle et de passer TOUTES les autres sources en
  // strict mode, ce qu'elles n'étaient pas en <script> séparés.
  const header =
    `/* ==== ${name}.js — généré par scripts/build-bundles.mjs, ne pas éditer ==== */\n` +
    `/* Sources (${files.length}), dans l'ordre de bundles.json. */\n;\n`;

  const body = files
    .map(rel => `/* ==== ${rel} ==== */\n${sources.get(rel).replace(/\n*$/, '')}\n`)
    .join(';\n');

  const out = header + body;
  writeFileSync(join(OUT_DIR, `${name}.js`), out);

  const raw = Buffer.byteLength(out);
  const gzip = gzipSync(out, { level: GZIP_LEVEL }).length;
  totalRaw += raw;
  totalGzip += gzip;
  console.log(
    `[build]   js/dist/${name}.js — ${String(files.length).padStart(2)} sources, ` +
    `${kb(raw)} brut, ${kb(gzip)} gzip (${raw} / ${gzip} octets)`
  );
}

console.log(`[build] total ${kb(totalRaw)} brut, ${kb(totalGzip)} gzip (${totalRaw} / ${totalGzip} octets)`);
