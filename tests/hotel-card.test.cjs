/**
 * tests/hotel-card.test.cjs — Construction: to_book keeps search/book links.
 *
 * The old gate was `booked === false`. A hotel identified with name + address
 * (bookingStatus: to_book, no boolean) lost Airbnb/Booking links as if it
 * were already reserved. Booked means bookingStatus === 'booked' (or the
 * legacy boolean / a confirmation ref) — never "has a name and an addr".
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));

global.document = { getElementById() { return null; } };
eval(fs.readFileSync('js/components/hotel-card.js', 'utf8'));

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); console.log(`  \u2705 ${name}`); pass++; }
  catch (e) { console.log(`  \u274c ${name}\n     ${e.message}`); fail++; process.exitCode = 1; }
}

console.log('\n\u2500\u2500 HotelCard (booked vs identified) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

test('nom + adresse sans statut n\'est PAS booked', () => {
  assert.strictEqual(HotelCard.isBooked({ name: 'Hôtel Matabiau', addr: '64 Bd Pierre Sémard' }), false);
});

test('bookingStatus to_book n\'est PAS booked', () => {
  assert.strictEqual(HotelCard.isBooked({
    name: 'Hôtel Matabiau', addr: '64 Bd Pierre Sémard', bookingStatus: 'to_book',
  }), false);
});

test('bookingStatus candidate n\'est PAS booked', () => {
  assert.strictEqual(HotelCard.isBooked({ name: 'A', addr: '1 rue', bookingStatus: 'candidate' }), false);
});

test('bookingStatus booked EST booked, même sans ref', () => {
  assert.strictEqual(HotelCard.isBooked({ name: 'A', addr: '1 rue', bookingStatus: 'booked' }), true);
});

test('legacy booked:true EST booked', () => {
  assert.strictEqual(HotelCard.isBooked({ name: 'A', addr: '1 rue', booked: true }), true);
});

test('legacy booked:false n\'est PAS booked', () => {
  assert.strictEqual(HotelCard.isBooked({ name: 'A', addr: 'Palma', booked: false }), false);
});

test('to_book gagne sur un booked:true parasite', () => {
  assert.strictEqual(HotelCard.isBooked({
    name: 'A', addr: '1 rue', bookingStatus: 'to_book', booked: true,
  }), false);
});

test('un to_book avec nom+adresse garde les liens de recherche et Réserver', () => {
  const html = HotelCard.render({
    name: 'Hôtel Matabiau',
    addr: '64 Bd Pierre Sémard, Toulouse',
    bookingStatus: 'to_book',
    bookingUrl: 'https://www.booking.com/hotel/matabiau',
    dates: { checkin: '2026-09-01', checkout: '2026-09-03', nights: 2 },
  });
  assert.ok(html.includes('hotel-search-links'), 'liens de recherche visibles');
  assert.ok(html.includes('booking.com'), 'Booking dans les recherches');
  assert.ok(html.includes('airbnb.com'), 'Airbnb dans les recherches');
  assert.ok(html.includes('Réserver'), 'lien de book libellé Réserver');
  assert.ok(!html.includes('Voir la réservation'), 'pas le libellé réservé');
});

test('un booked avec nom+adresse n\'affiche PAS les liens de recherche', () => {
  const html = HotelCard.render({
    name: 'Hôtel Matabiau',
    addr: '64 Bd Pierre Sémard, Toulouse',
    bookingStatus: 'booked',
    bookingUrl: 'https://www.booking.com/hotel/matabiau',
    searchLinks: { airbnb: 'https://www.airbnb.com/s/should-not-show' },
  });
  assert.ok(!html.includes('hotel-search-links'), 'pas de bandeau recherche');
  assert.ok(!html.includes('should-not-show'), 'searchLinks d\'un booked ignorés');
  assert.ok(html.includes('Voir la réservation'), 'lien de confirmation');
});

test('plusieurs alternatives to_book restent des cartes avec liens', () => {
  const html = HotelCard.render({
    name: 'Hôtel A',
    addr: '1 Place du Capitole, Toulouse',
    bookingStatus: 'to_book',
    alternatives: [
      { name: 'Hôtel B', addr: '64 Bd Pierre Sémard, Toulouse', bookingUrl: 'https://example.com/b' },
    ],
  });
  assert.ok(html.includes('Hôtel B'), 'alternative rendue');
  assert.ok(html.includes('hotel-alternatives'), 'bloc alternatives');
  assert.ok((html.match(/hotel-search-links/g) || []).length >= 2, 'liens de recherche sur les deux');
});

test('sans adresse : on réclame hotels[].addr', () => {
  const html = HotelCard.render({ name: 'Hôtel sans rue', bookingStatus: 'to_book' });
  assert.ok(html.includes('hotel-addr-missing'), 'bandeau adresse manquante');
  assert.ok(html.includes('hotels[].addr'), 'on dit où l\'écrire');
});

console.log(`\n${pass} tests passed${fail ? `, ${fail} failed` : ''}\n`);
