#!/usr/bin/env node
/**
 * seed-import.js — Import TripKit seed data into the backend API
 *
 * Usage:
 *   node seed-import.js [--api URL] [--token TOKEN] [--seed FILE]
 *
 * Defaults:
 *   --api    http://localhost:3001
 *   --seed   js/seed/usa-2026.js (auto-detected)
 *
 * This script:
 * 1. Loads the seed JS file (auto-detects variable name)
 * 2. Creates/updates the trip in the backend
 * 3. Upserts each day (day.data = full day object)
 * 4. Upserts each hotel (extracted from day data)
 * 5. Upserts each list
 * 6. Stores restaurants in trip.data
 *
 * Run after every voyage-app sync to update the backend
 * without rebuilding the frontend Docker image.
 */

const fs = require('fs');
const path = require('path');

// Parse args
const args = process.argv.slice(2);
let apiUrl = 'http://localhost:3001';
let token = process.env.TRIPKIT_API_TOKEN || '';
let seedFile = path.join(__dirname, 'js/seed/usa-2026.js');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api' && args[i + 1]) apiUrl = args[++i];
  if (args[i] === '--token' && args[i + 1]) token = args[++i];
  if (args[i] === '--seed' && args[i + 1]) seedFile = args[++i];
}

apiUrl = apiUrl.replace(/\/$/, '');

// Load seed
const seedCode = fs.readFileSync(seedFile, 'utf8');
// Extract seed data — supports any variable name (SEED_XXX or TRIP_DATA)
const varMatch = seedCode.match(/^var\s+(\w+)\s*=/m);
if (!varMatch) { console.error('❌ No variable found in seed file'); process.exit(1); }
const varName = varMatch[1];
const fn = new Function(seedCode + '; return ' + varName + ';');
const SEED = fn();

if (!SEED || !SEED.trip || !SEED.days) {
  console.error('❌ Invalid seed file:', seedFile);
  process.exit(1);
}

console.log(`📦 Importing ${SEED.trip.name} (${SEED.days.length} days, ${Object.keys(SEED.restaurants || {}).length} restaurants)`);
console.log(`🌐 API: ${apiUrl}`);

const headers = {
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
};

async function api(method, path, body) {
  const res = await fetch(`${apiUrl}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  // 1. Create or update trip
  const tripId = SEED.trip.id;
  const tripData = {
    travelers: SEED.trip.travelers,
    phases: SEED.trip.phases,
    restaurants: SEED.restaurants || {},
    culture: SEED.culture || [],
    hotels: SEED.hotels || {},
    locations: SEED.locations || {},
  };

  try {
    await api('GET', `/trips/${tripId}`);
    // Trip exists — update
    await api('PUT', `/trips/${tripId}`, {
      name: SEED.trip.name,
      emoji: SEED.trip.emoji,
      start_date: SEED.trip.startDate,
      end_date: SEED.trip.endDate,
      data: tripData,
    });
    console.log(`✅ Trip updated: ${tripId}`);
  } catch (e) {
    // Create new
    await api('POST', '/trips', {
      id: tripId,
      name: SEED.trip.name,
      emoji: SEED.trip.emoji,
      start_date: SEED.trip.startDate,
      end_date: SEED.trip.endDate,
      data: tripData,
    });
    console.log(`✅ Trip created: ${tripId}`);
  }

  // 2. Upsert each day
  for (const day of SEED.days) {
    const dayNum = day.day;
    await api('PUT', `/trips/${tripId}/days/${dayNum}`, day);
  }
  console.log(`✅ ${SEED.days.length} days upserted`);

  // 3. Upsert hotels (from normalized hotels dict)
  const hotelEntries = Object.entries(SEED.hotels || {});
  for (const [hotelId, hotelData] of hotelEntries) {
    // Find which days use this hotel
    const dayNums = SEED.days.filter(d => d.hotelId === hotelId).map(d => d.day);
    if (dayNums.length > 0) {
      await api('PUT', `/trips/${tripId}/hotels/${dayNums[0]}`, { ...hotelData, hotelId, dayNums });
    }
  }
  console.log(`✅ ${hotelEntries.length} hotels upserted`);

  // 4. Upsert lists
  const lists = SEED.lists || {};
  let listCount = 0;
  for (const [listId, list] of Object.entries(lists)) {
    await api('PUT', `/trips/${tripId}/lists/${listId}`, {
      type: list.type || 'generic',
      title: list.title || listId,
      data: list,
    });
    listCount++;
  }
  console.log(`✅ ${listCount} lists upserted`);

  console.log(`\n🎉 Import complete! ${SEED.days.length} days → ${apiUrl}`);

  // Bump trip updated_at so /version endpoint reflects this import
  await api('PUT', `/trips/${tripId}`, {
    name: SEED.trip.name,
    data: tripData,
  });

  // Read back version for confirmation
  try {
    const ver = await fetch(`${apiUrl}/api/trips/${tripId}/version`, { headers }).then(r => r.json());
    console.log(`   📌 Data version: ${ver.version} (${ver.updated_at})`);
  } catch(e) { /* ignore */ }
  console.log(`   Frontend will auto-fetch from backend on next load.`);
}

main().catch(e => {
  console.error('❌ Import failed:', e.message);
  process.exit(1);
});
