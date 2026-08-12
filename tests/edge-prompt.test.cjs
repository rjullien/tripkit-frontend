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

test('calendar lists J1–J3', () => {
  const sys = EdgePrompt.buildMessages('x', [], { nowISO: '2026-06-16' })[0].content;
  assert.ok(sys.includes('Calendrier'), sys);
  assert.ok(sys.includes('J1'), sys);
  assert.ok(sys.includes('J3'), sys);
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
