/**
 * day-helpers.js — Resolve computed fields for days
 *
 * Days in the seed are normalized:
 * - No date/dow (computed from trip.startDate + day.day)
 * - No geo (resolved from locations[locationId])
 * - No inline culture (top-level culture[] is source of truth)
 * - No inline hotel fields (resolved from hotels[hotelId])
 *
 * This module enriches a raw day with computed fields for rendering.
 */

var DayHelpers = (() => {

  const DOWS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const MONTHS = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];

  /**
   * Enrich a raw day object with computed fields.
   * Returns a NEW object (does not mutate the original).
   *
   * @param {Object} day — raw day from tripData.days
   * @param {Object} tripData — full trip data (for locations, hotels, trip meta)
   * @returns {Object} enriched day with .date, .dow, .geo resolved
   */
  function enrich(day, tripData) {
    if (!day) return day;

    const enriched = Object.assign({}, day);
    const trip = tripData.trip || {};

    // ── Compute date + dow from trip.startDate ──
    // startDate = Day 1 (first travel day). Day 0 = startDate - 1 (veille).
    // Formula: date = startDate + (day - 1)
    if (!enriched.date && trip.startDate) {
      const start = new Date(trip.startDate + 'T12:00:00Z');
      const d = new Date(start.getTime() + ((day.day || 0) - 1) * 86400000);
      enriched.dow = DOWS[d.getUTCDay()];
      enriched.date = d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
      enriched._isoDate = d.toISOString().split('T')[0];
    }

    // ── Resolve locationId → geo ──
    if (!enriched.geo && enriched.locationId && tripData.locations) {
      enriched.geo = tripData.locations[enriched.locationId] || null;
    }

    return enriched;
  }

  /**
   * Compute ISO date string for a day.
   * @param {Object} day
   * @param {Object} trip — { startDate }
   * @returns {string} "2026-04-17"
   */
  function isoDate(day, trip) {
    if (!trip || !trip.startDate) return '';
    const start = new Date(trip.startDate + 'T12:00:00Z');
    const d = new Date(start.getTime() + ((day.day || 0) - 1) * 86400000);
    return d.toISOString().split('T')[0];
  }

  return { enrich, isoDate };
})();
