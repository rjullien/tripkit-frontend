/**
 * seed-merge.js — Single source of truth for "backend seed payload → tripData".
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * This mapping used to be copy-pasted in two places: App.refreshTripData() and
 * TripSelector.select(). The copies drifted: when `mapHtml` / `meteoHtml` were
 * added (v2.27.33) only app.js was updated. TripSelector.select() purges the
 * cached trip data and then rebuilds trip meta from its own field list, so
 * selecting a trip silently DROPPED mapHtml/meteoHtml — the interactive Leaflet
 * map and the météo table vanished from the Itinéraire tab and never came back
 * (App.refreshTripData short-circuits while the data version is unchanged).
 *
 * Any trip-level field stored in `trip.data` must be declared in
 * TRIP_META_FIELDS below. There is now exactly one list to keep in sync.
 */

var SeedMerge = (() => {

  /**
   * Trip-level fields carried inside the backend's `trip.data` JSON blob.
   * The backend model only has id/name/emoji/start_date/end_date as columns —
   * everything else round-trips through `data`.
   */
  const TRIP_META_FIELDS = [
    'travelers',
    'phases',
    'mapImage',    // static route image (backend asset or URL)
    'mapHtml',     // interactive map iframe (backend asset filename)
    'meteoHtml',   // météo iframe (backend asset filename)
    'routeUrl',    // full trip route on Google Maps
    'users',
    'sharedLinks',
    'homeTz',      // IANA home TZ for timeline dual times (default Europe/Paris)
    'polarsteps',  // { enabled, tripUrl? } — Plus Polarsteps box
    'construction', // { phase, dates? } — onglet Construction à jour au chargement
    'travelProfile', // overlay Publish (travel-profile.js)
  ];

  /** Top-level tripData collections carried in trip.data (see seed-import.cjs). */
  const TRIP_DATA_COLLECTIONS = [
    'restaurants', 'culture', 'locations', 'hotels',
    'flights', 'carRental', 'ferry', 'ferries', 'events',
    'activities',
    'people', // person fiches (from people.js) for travelers on this trip
  ];

  function parseMaybeJson(raw, fallback) {
    if (raw === undefined || raw === null) return fallback;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  /**
   * Merge a backend seed payload into a tripData object.
   *
   * @param {Object} seed — { trip, days[], hotels[], lists[] } from GET /trips/:id/seed
   * @param {Object} [existing] — tripData to merge into (pass {} for a clean rebuild)
   * @returns {Object} tripData — { trip, days[], hotels{}, locations{}, restaurants, culture, lists{} }
   */
  function merge(seed, existing) {
    const tripData = existing || {};
    if (!seed) return tripData;

    // ── Days: backend stores each day as { day_num, data: {...} } ────────────
    if (seed.days && seed.days.length) {
      tripData.days = seed.days
        .map(d => parseMaybeJson(d.data, d) || d)
        .filter(d => d.label && d.label !== '_deleted')
        .sort((a, b) => (a.day || 0) - (b.day || 0));
    }

    // ── Trip metadata ────────────────────────────────────────────────────────
    if (seed.trip) {
      const t = seed.trip;
      const extra = parseMaybeJson(t.data, {}) || {};
      const prev = tripData.trip || {};

      const meta = {
        id: t.id,
        name: t.name,
        emoji: t.emoji,
        startDate: t.start_date || extra.startDate,
        endDate: t.end_date || extra.endDate,
      };
      TRIP_META_FIELDS.forEach(f => { meta[f] = extra[f] !== undefined ? extra[f] : prev[f]; });
      tripData.trip = meta;

      // Collections that may travel inside trip.data (top-level on tripData,
      // NOT on trip — same pattern as hotels/restaurants). Must stay in sync
      // with seed-import.cjs or BookingsView loses ferry/events/flights.
      ['restaurants', 'culture', 'locations', 'flights', 'carRental', 'ferry', 'ferries', 'events', 'people'].forEach(key => {
        if (extra[key] !== undefined) tripData[key] = extra[key];
      });
      if (extra.hotels) {
        // Normalize array format [{id, ...}] to dict {id: {...}} for HotelCard.fromDay()
        if (Array.isArray(extra.hotels)) {
          const dict = {};
          extra.hotels.forEach(h => { if (h.id) dict[h.id] = h; });
          tripData.hotels = dict;
        } else {
          tripData.hotels = extra.hotels;
        }
      }
    }

    // ── Hotels: merge into days by day_num ───────────────────────────────────
    // Legacy path: hotel rows can carry wifi/etc. onto the day.
    // NEVER attach a hotel onto a day without hotelId (J0 = maison) — stale
    // hotels.day_num=0 would otherwise force Montréal onto the packing day.
    if (seed.hotels && seed.hotels.length) {
      seed.hotels.forEach(h => {
        const hData = parseMaybeJson(h.data, {}) || {};
        const day = tripData.days && tripData.days.find(d => d.day === h.day_num);
        if (!day || !day.hotelId) return;
        if (hData.hotelId && hData.hotelId !== day.hotelId) return;
        Object.assign(day, hData);
      });
    }

    // ── Lists: backend lists override seed lists (structure, not check state) ─
    if (seed.lists && seed.lists.length) {
      tripData.lists = tripData.lists || {};
      seed.lists.forEach(l => {
        const lData = parseMaybeJson(l.data, {}) || {};
        tripData.lists[l.id] = { id: l.id, type: l.type, title: l.title, ...lData };
      });
    }

    return tripData;
  }

  return { merge, TRIP_META_FIELDS, TRIP_DATA_COLLECTIONS };
})();
