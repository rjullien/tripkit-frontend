#!/usr/bin/env node
// Mesure le chemin critique de boot de TripKit : le document + tous les assets
// bloquants/différés qu'il référence (<script src> et <link> CSS).
//
// Usage :
//   node scripts/measure-boot.mjs http://localhost:8099
//   node scripts/measure-boot.mjs http://10.88.0.19/
//
// Sort en code != 0 si un seul asset ne répond pas 200 : le script sert donc
// aussi de smoke test après un `docker build` (un bundle manquant, une balise
// mal réécrite par le cache-buster ou un config.js non généré font échouer).
//
// Zéro dépendance npm : node:http / node:https pour le réseau, node:zlib pour
// dégonfler. On n'utilise PAS fetch() : undici décompresse les réponses gzip de
// façon transparente, ce qui rendrait la colonne « transféré » identique à la
// colonne « brut ». Ici on compte les octets réellement reçus sur le fil, puis
// on gunzip localement pour connaître la taille décompressée.
import http from 'node:http';
import https from 'node:https';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const base = process.argv[2];
if (!base) {
  console.error('usage: node scripts/measure-boot.mjs <base-url>');
  process.exit(2);
}

function get(rawUrl) {
  return new Promise((resolve, reject) => {
    const u = new URL(rawUrl);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'GET',
        // Explicite : c'est ce que fait un navigateur, et c'est ce qui déclenche
        // le gzip de nginx. Sans cet en-tête on mesurerait du non compressé.
        headers: { 'Accept-Encoding': 'gzip, deflate, br', Host: u.host },
      },
      (res) => {
        const chunks = [];
        let wire = 0;
        res.on('data', (c) => {
          wire += c.length;
          chunks.push(c);
        });
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const enc = (res.headers['content-encoding'] || 'identity').toLowerCase();
          let raw = body;
          try {
            if (enc === 'gzip') raw = gunzipSync(body);
            else if (enc === 'deflate') raw = inflateSync(body);
            else if (enc === 'br') raw = brotliDecompressSync(body);
          } catch {
            raw = body; // corps illisible : on reste sur les octets du fil
          }
          resolve({ code: res.statusCode, wire, raw: raw.length, enc, text: raw.toString('utf8') });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

// Les URLs sont relevées EXACTEMENT comme servies (cache-buster ?v=N compris),
// pour mesurer ce que le navigateur demande vraiment.
function extractAssets(html) {
  const assets = [];
  const seen = new Set();
  const push = (kind, url) => {
    if (!url || /^(https?:)?\/\//.test(url) || url.startsWith('data:')) return; // hors origine : hors chemin critique local
    if (seen.has(url)) return;
    seen.add(url);
    assets.push({ kind, url });
  };
  for (const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) push('js', m[1]);
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/\brel=["']?stylesheet/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (href) push('css', href[1]);
  }
  return assets;
}

const index = await get(base);
if (index.code !== 200) {
  console.error(`FATAL: ${base} a répondu ${index.code} (attendu 200)`);
  process.exit(1);
}

const rows = [{ kind: 'html', url: new URL(base).pathname, ...index }];
for (const { kind, url } of extractAssets(index.text)) {
  const abs = new URL(url, base).href;
  const res = await get(abs);
  rows.push({ kind, url, ...res });
}

const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
console.log(`BASE=${base}`);
console.log(pad('URL', 46), lpad('TRANSFERRED', 12), lpad('UNCOMPRESSED', 13), lpad('CODE', 5), ' ENCODING');
for (const r of rows) {
  console.log(pad(r.url, 46), lpad(r.wire, 12), lpad(r.raw, 13), lpad(r.code, 5), ' ' + r.enc);
}
console.log('-'.repeat(92));

const sum = (list, f) => list.reduce((a, r) => a + r[f], 0);
const of = (kind) => rows.filter((r) => r.kind === kind);
console.log(`BOOT_REQUESTS=${rows.length} TRANSFERRED_GZIP_BYTES=${sum(rows, 'wire')} UNCOMPRESSED_BYTES=${sum(rows, 'raw')}`);
console.log(`JS_REQUESTS=${of('js').length} JS_GZIP=${sum(of('js'), 'wire')} JS_RAW=${sum(of('js'), 'raw')}`);
console.log(`CSS_REQUESTS=${of('css').length} CSS_GZIP=${sum(of('css'), 'wire')} CSS_RAW=${sum(of('css'), 'raw')}`);

const broken = rows.filter((r) => r.code !== 200);
if (broken.length) {
  console.error(`\nFATAL: ${broken.length} asset(s) de boot ne répondent pas 200 :`);
  for (const r of broken) console.error(`  ${r.code}  ${r.url}`);
  process.exit(1);
}
console.log('\nOK: tous les assets de boot répondent 200.');
