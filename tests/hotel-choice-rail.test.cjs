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
  assert.ok(root.innerHTML.includes('1 seul à réserver · 2 options'), 'exclusif : un seul à réserver');
  assert.ok(root.innerHTML.includes('Plan A') && root.innerHTML.includes('Plan B'), 'plans A / B nommés');
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

test('un booked + deux to_book : les autres sont « non retenu », sans aucun lien de réservation', () => {
  BookingsView.render('hotels-content', {
    days: [{ day: 2, hotelId: 'booked', locationId: 'toulouse', to: 'Toulouse' }],
    hotels: {
      booked: { name: 'Choisi', addr: '1 rue', bookingStatus: 'booked', locationId: 'toulouse' },
      x: { name: 'Option X', addr: '2 rue', bookingStatus: 'to_book', locationId: 'toulouse',
           searchLinks: { booking: 'https://www.booking.com/searchresults.html?ss=X' },
           links: [{ label: 'Booking X', url: 'https://www.booking.com/hotel/x' }] },
      y: { name: 'Option Y', addr: '3 rue', bookingStatus: 'candidate', locationId: 'toulouse',
           bookingUrl: 'https://www.booking.com/hotel/y' },
    },
  });
  const html = root.innerHTML;
  assert.ok(html.includes('Choisi'), 'le booked est là');
  assert.ok(!html.includes('hotel-choice-rail'), 'pas de rail « à réserver »');
  assert.ok(!html.includes('à réserver'), 'aucun « à réserver » pour cette nuit');
  assert.ok(html.includes('hotel-not-retained'), 'bloc non retenu');
  assert.ok(html.includes('déjà réservée : <b>Choisi</b>'), 'nomme l\'hôtel réservé');
  assert.ok(html.includes('Option X') && html.includes('Option Y'), 'les options restent nommées');
  assert.ok(!html.includes('hotel-search-links'), 'pas de recherche');
  assert.ok(!/booking\.com/.test(html), 'aucun lien Booking');
});

test('un booked + un candidate (plan B) : le plan B perd ses liens', () => {
  BookingsView.render('hotels-content', {
    days: [{ day: 15, hotelId: 'a', locationId: 'idaho-falls', to: 'Idaho Falls' }],
    hotels: {
      a: { name: 'Plan A', addr: '1 rue', bookingStatus: 'booked' },
      b: { name: 'Plan B', bookingStatus: 'candidate', dayNums: [15],
           searchLinks: { booking: 'https://www.booking.com/searchresults.html?ss=B' } },
    },
  });
  const html = root.innerHTML;
  assert.ok(html.includes('hotel-not-retained') && html.includes('Plan B'));
  assert.ok(!/booking\.com/.test(html), 'aucun lien Booking');
});

test('deux candidate sans booked : rail plan A / plan B avec liens', () => {
  BookingsView.render('hotels-content', {
    days: [{ day: 15, hotelId: 'a', locationId: 'idaho-falls', to: 'Idaho Falls' }],
    hotels: {
      a: { name: 'Plan A', addr: '1 rue', bookingStatus: 'candidate' },
      b: { name: 'Plan B', bookingStatus: 'candidate', dayNums: [15],
           searchLinks: { booking: 'https://www.booking.com/searchresults.html?ss=B' } },
    },
  });
  const html = root.innerHTML;
  assert.ok(html.includes('1 seul à réserver · 2 options'), 'rail exclusif');
  assert.ok(html.indexOf('>Plan A<') < html.indexOf('>Plan B<'), 'hotelId du jour = plan A');
  assert.ok(!html.includes('hotel-not-retained'));
  assert.ok(/booking\.com/.test(html), 'liens gardés tant que rien n\'est réservé');
});

console.log(`\n${pass} tests passed${fail ? `, ${fail} failed` : ''}\n`);
