/**
 * tests/edge-prompt.test.cjs — EdgePrompt injects today/tomorrow/hotel like Bifrost
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));
eval(fs.readFileSync('js/day-helpers.js', 'utf8'));
eval(fs.readFileSync('js/day-resolver.js', 'utf8'));
eval(fs.readFileSync('js/tz-helpers.js', 'utf8'));
eval(fs.readFileSync('js/edge-model/prompt-builder.js', 'utf8'));

const TRIP = {
  trip: {
    id: 'test-trip-2026',
    name: 'Test Trip 2026',
    startDate: '2026-06-15',
    endDate: '2026-06-18',
    homeTz: 'Europe/Paris',
  },
  days: [
    {
      day: 1, label: 'Arrival — City center', from: 'Home', to: 'Destination',
      hotelId: 'city-hotel',
      timeline: [
        { t: '08:00', d: 'Flight departure' },
        { t: '12:00', d: 'Hotel check-in' },
      ],
      highlights: ['Book restaurant'],
    },
    {
      day: 2, label: 'City exploration', hotelId: 'city-hotel',
      timeline: [{ t: '10:00', d: 'Museum visit' }],
    },
    {
      day: 3, label: 'Return home',
      timeline: [{ t: '14:00', d: 'Flight home' }],
    },
  ],
  hotels: {
    'city-hotel': {
      name: 'Grand Hotel City Center',
      addr: '123 Main Street, Destination',
      wifi: { ssid: 'GrandGuest', pass: 'secretwifi' },
      access: 'Pin porte 4360',
      checkin: '14:00',
      confirmationNumber: 'HTL99',
    },
  },
  restaurants: {
    '1': { main: { name: 'Le Bistro', note: 'Local cuisine', price: '€€' } },
  },
  flights: {
    outbound: { pnr: 'TESTPNR', from: 'AAA', to: 'BBB', dep: '2026-06-15T08:00' },
  },
};

global.Store = {
  getCurrentTripId: () => 'test-trip-2026',
  getTripData: () => TRIP,
};

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

console.log('\n── EdgePrompt trip context ────────────────────────────────');

test('system + CONTEXTE with today hotel wifi/pin/addr', () => {
  const msgs = EdgePrompt.buildMessages('Code wifi ?', [], { nowISO: '2026-06-15' });
  assert.strictEqual(msgs[0].role, 'system');
  const sys = msgs[0].content;
  assert.ok(sys.includes('CONTEXTE'), 'missing CONTEXTE');
  assert.ok(sys.includes('Test Trip 2026'), sys);
  assert.ok(sys.includes('AUJOURD’HUI') || sys.includes("AUJOURD'HUI"), sys);
  assert.ok(sys.includes('Grand Hotel City Center'), sys);
  assert.ok(sys.includes('123 Main Street'), sys);
  assert.ok(sys.includes('GrandGuest'), sys);
  assert.ok(sys.includes('secretwifi'), sys);
  assert.ok(sys.includes('4360'), sys);
  assert.ok(sys.includes('Le Bistro'), sys);
  assert.ok(sys.includes('TESTPNR'), sys);
});

test('tomorrow is the next seed day', () => {
  const sys = EdgePrompt.buildMessages('Demain ?', [], { nowISO: '2026-06-15' })[0].content;
  assert.ok(sys.includes('DEMAIN'), sys);
  assert.ok(sys.includes('City exploration'), sys);
});

test('calendar lists nearby days only', () => {
  const sys = EdgePrompt.buildMessages('x', [], { nowISO: '2026-06-16' })[0].content;
  assert.ok(sys.includes('Calendrier'), sys);
  assert.ok(sys.includes('J1'), sys);
  assert.ok(sys.includes('J3'), sys);
});

test('same hotel is not repeated on DEMAIN', () => {
  const sys = EdgePrompt.buildMessages('Wifi ?', [], { nowISO: '2026-06-15' })[0].content;
  const i = sys.indexOf('DEMAIN');
  assert.ok(i > 0, sys);
  const demain = sys.slice(i);
  assert.ok(!demain.includes('Grand Hotel'), demain);
  assert.ok(!demain.includes('GrandGuest'), demain);
  assert.ok(sys.includes('GrandGuest'), sys);
});

test('prompt stays small enough for leftover n_ctx 1024', () => {
  const fatDays = [];
  for (let i = 1; i <= 20; i++) {
    fatDays.push({
      day: i,
      label: 'Very long sightseeing day with museums parks and boats ' + i,
      hotelId: 'city-hotel',
      timeline: [
        { t: '09:00', d: 'Long activity description that would bloat the prompt ' + i },
        { t: '12:00', d: 'Lunch reservation at a fancy place downtown ' + i },
        { t: '15:00', d: 'Another long visit that should be truncated ' + i },
        { t: '18:00', d: 'Evening walk along the river with photos ' + i },
        { t: '20:00', d: 'Dinner notes and extra padding text ' + i },
        { t: '22:00', d: 'Should not appear — beyond MAX_TIMELINE' },
      ],
      highlights: ['A', 'B', 'C', 'D'],
    });
  }
  const prev = global.Store;
  global.Store = {
    getCurrentTripId: () => 'test-trip-2026',
    getTripData: () => Object.assign({}, TRIP, {
      trip: Object.assign({}, TRIP.trip, { endDate: '2026-07-04' }),
      days: fatDays,
    }),
  };
  const hist = [
    { role: 'user', content: 'x'.repeat(400) },
    { role: 'assistant', content: 'y'.repeat(400) },
    { role: 'user', content: 'z'.repeat(400) },
  ];
  const msgs = EdgePrompt.buildMessages('Tu sais quoi sur mon voyage', hist, { nowISO: '2026-06-20' });
  global.Store = prev;
  const total = msgs.reduce((n, m) => n + String(m.content).length, 0);
  assert.ok(total <= 1800, 'prompt too large: ' + total);
  const sys = msgs[0].content;
  assert.ok(!sys.includes('J20'), sys);
  assert.ok(!sys.includes('beyond MAX_TIMELINE'), sys);
  assert.strictEqual(msgs.filter(m => m.role !== 'system').length, 2);
});

test('engine warm-up uses n_ctx 2048', () => {
  const src = fs.readFileSync('js/edge-model/engine.js', 'utf8');
  assert.ok(src.includes('const nCtx = 2048'), src.slice(300, 340));
});

test('user message appended', () => {
  const msgs = EdgePrompt.buildMessages('Wifi demain ?', [], { nowISO: '2026-06-15' });
  assert.strictEqual(msgs[msgs.length - 1].role, 'user');
  assert.strictEqual(msgs[msgs.length - 1].content, 'Wifi demain ?');
});

test('no trip → still system, no CONTEXTE facts', () => {
  const prev = global.Store;
  global.Store = { getCurrentTripId: () => '', getTripData: () => null };
  const sys = EdgePrompt.buildMessages('Hello')[0].content;
  global.Store = prev;
  assert.ok(sys.includes('Pas de voyage'), sys);
  assert.ok(!sys.includes('Grand Hotel'), sys);
});

console.log(`\n${pass} tests passed\n`);
