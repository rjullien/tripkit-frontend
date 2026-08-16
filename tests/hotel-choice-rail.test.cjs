/**
 * tests/hotel-choice-rail.test.cjs — Several to_book on one stay = swipe list.
 *
 * The next card must peek (not 100% width) and the copy must say there is
 * more to the right. A single booked hotel stays a normal stacked card.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));

function fakeRoot() {
  return {
    innerHTML: '',
    querySelectorAll() { return []; },
    querySelector() { return null; },
  };
}

const root = fakeRoot();
global.document = {
  getElementById() { return root; },
  addEventListener() {},
};
global.Store = { getCurrentTripId() { return 'trip-1'; } };
global.API = {};
global.NuisanceStream = {};

eval(fs.readFileSync('js/components/hotel-card.js', 'utf8'));
eval(fs.readFileSync('js/components/bookings-view.js', 'utf8'));

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); console.log(`  \u2705 ${name}`); pass++; }
  catch (e) { console.log(`  \u274c ${name}\n     ${e.message}`); fail++; process.exitCode = 1; }
}

console.log('\n\u2500\u2500 Hotel choice rail (to_book swipe) \u2500\u2500\u2500\u2500\u2500\u2500');

test('deux to_book d\'une même étape = rail + peek + hint à droite', () => {
  BookingsView.render('hotels-content', {
    days: [
      { day: 1, hotelId: 'a', locationId: 'toulouse', to: 'Toulouse' },
    ],
    hotels: {
      a: { name: 'Hôtel A', addr: '1 Place du Capitole', bookingStatus: 'to_book', locationId: 'toulouse' },
      b: { name: 'Hôtel B', addr: '64 Bd Pierre Sémard', bookingStatus: 'to_book', locationId: 'toulouse' },
    },
  });
  assert.ok(root.innerHTML.includes('hotel-choice-rail'), 'rail présent');
  assert.ok(root.innerHTML.includes('hotel-choice-slide'), 'cartes en slides');
  assert.ok((root.innerHTML.match(/hotel-choice-slide/g) || []).length === 2, '2 slides');
  assert.ok(root.innerHTML.includes('2 à réserver'), 'compte visible');
  assert.ok(root.innerHTML.includes('1 / 2'), 'position 1/n');
  assert.ok(root.innerHTML.includes('à droite'), 'hint qu\'il y a quelque chose à droite');
  assert.ok(root.innerHTML.includes('Hôtel A') && root.innerHTML.includes('Hôtel B'), 'les deux noms');
  assert.ok(root.innerHTML.includes('hotel-search-links'), 'liens de recherche gardés');
});

test('un seul hôtel booked = pas de rail', () => {
  BookingsView.render('hotels-content', {
    days: [{ day: 1, hotelId: 'a', to: 'Toulouse' }],
    hotels: {
      a: { name: 'Hôtel A', addr: '1 rue', bookingStatus: 'booked', bookingRef: 'XYZ' },
    },
  });
  assert.ok(!root.innerHTML.includes('hotel-choice-rail'), 'pas de carrousel');
  assert.ok(root.innerHTML.includes('Hôtel A'), 'carte normale');
  assert.ok(!root.innerHTML.includes('hotel-search-links'), 'booked sans recherche');
});

test('un booked + deux to_book : le booked reste seul, les to_book swipent', () => {
  BookingsView.render('hotels-content', {
    days: [{ day: 2, hotelId: 'booked', locationId: 'toulouse', to: 'Toulouse' }],
    hotels: {
      booked: { name: 'Choisi', addr: '1 rue', bookingStatus: 'booked', locationId: 'toulouse' },
      x: { name: 'Option X', addr: '2 rue', bookingStatus: 'to_book', locationId: 'toulouse' },
      y: { name: 'Option Y', addr: '3 rue', bookingStatus: 'candidate', locationId: 'toulouse' },
    },
  });
  assert.ok(root.innerHTML.includes('Choisi'), 'le booked est là');
  assert.ok(root.innerHTML.includes('2 à réserver'), 'les deux ouverts en rail');
  assert.ok(root.innerHTML.includes('Option X') && root.innerHTML.includes('Option Y'));
});

console.log(`\n${pass} tests passed${fail ? `, ${fail} failed` : ''}\n`);
