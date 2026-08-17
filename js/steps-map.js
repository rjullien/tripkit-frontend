/**
 * steps-map.js — Google Maps Directions URLs from a day's waypoints.
 *
 * Timeline entries may carry `place` (Google-friendly string) and/or
 * `lat`/`lon`. Optional hotel bookends (`startPlace` / `endPlace`) wrap
 * the day: morning hotel → stops → evening hotel.
 *
 * Google Maps free URL limit: 10 waypoints. Beyond that we split into
 * overlapping links so the last stop of link N is the first of link N+1
 * (nothing is dropped — that was the Île d'Orléans bug).
 */

var StepsMap = (() => {

  const MAX_WAYPOINTS = 10;
  const BASE = 'https://www.google.com/maps/dir/';

  function sameWaypoint(a, b) {
    if (a == null || b == null) return false;
    const na = String(a).trim().toLowerCase().replace(/\s+/g, ' ');
    const nb = String(b).trim().toLowerCase().replace(/\s+/g, ' ');
    return na !== '' && na === nb;
  }

  /**
   * Hotel / place object → waypoint string.
   * Priority: numeric lat/lon > addr > name.
   *
   * @param {Object|null} hotel
   * @returns {string|null}
   */
  function placeFromHotel(hotel) {
    if (!hotel) return null;
    if (typeof hotel.lat === 'number' && typeof hotel.lon === 'number') {
      return hotel.lat + ',' + hotel.lon;
    }
    const addr = typeof hotel.addr === 'string' ? hotel.addr.trim() : '';
    if (addr && addr !== '\u2014' && addr !== '-') return addr;
    const name = typeof hotel.name === 'string' ? hotel.name.trim() : '';
    if (name && name !== '\u2014' && name !== '-') return name;
    return null;
  }

  /**
   * Extract waypoints from a timeline array.
   * Priority: lat/lon (numeric) > place (string).
   * Entries without either are skipped.
   *
   * @param {Array} timeline — array of {t, d, place?, lat?, lon?}
   * @returns {Array<string>} waypoint strings for URL
   */
  function extractWaypoints(timeline) {
    if (!timeline || !timeline.length) return [];
    const waypoints = [];
    for (let i = 0; i < timeline.length; i++) {
      const ev = timeline[i];
      if (typeof ev.lat === 'number' && typeof ev.lon === 'number') {
        waypoints.push(ev.lat + ',' + ev.lon);
      } else if (ev.place && typeof ev.place === 'string' && ev.place.trim()) {
        waypoints.push(ev.place.trim());
      }
    }
    return waypoints;
  }

  function applyBookends(waypoints, startPlace, endPlace) {
    const out = waypoints.slice();
    const start = startPlace && String(startPlace).trim();
    const end = endPlace && String(endPlace).trim();
    if (start && (out.length === 0 || !sameWaypoint(out[0], start))) {
      out.unshift(start);
    }
    if (end && (out.length === 0 || !sameWaypoint(out[out.length - 1], end))) {
      out.push(end);
    }
    return out;
  }

  function collapseConsecutive(waypoints) {
    const out = [];
    for (let i = 0; i < waypoints.length; i++) {
      if (out.length === 0 || !sameWaypoint(out[out.length - 1], waypoints[i])) {
        out.push(waypoints[i]);
      }
    }
    return out;
  }

  function urlFor(waypoints) {
    return BASE + waypoints.map(wp => encodeURIComponent(wp)).join('/');
  }

  /**
   * Split waypoints into ≤10-point chunks with a 1-waypoint overlap:
   * last of chunk i === first of chunk i+1.
   */
  function splitChunks(waypoints) {
    if (waypoints.length <= MAX_WAYPOINTS) return [waypoints];
    const chunks = [];
    let start = 0;
    while (start < waypoints.length) {
      const remaining = waypoints.length - start;
      if (remaining <= MAX_WAYPOINTS) {
        chunks.push(waypoints.slice(start));
        break;
      }
      chunks.push(waypoints.slice(start, start + MAX_WAYPOINTS));
      start += MAX_WAYPOINTS - 1;
    }
    return chunks;
  }

  /**
   * Build Google Maps Directions URL(s) from timeline entries.
   *
   * @param {Array} timeline — day.timeline array
   * @param {Object} [opts] — { startPlace, endPlace } hotel bookends
   * @returns {{ links: Array<{url: string, count: number}>, total: number, split: boolean }|null}
   *   null if fewer than 2 waypoints after bookends
   */
  function buildStepsUrl(timeline, opts) {
    const startPlace = opts && opts.startPlace;
    const endPlace = opts && opts.endPlace;
    const waypoints = collapseConsecutive(
      applyBookends(extractWaypoints(timeline), startPlace, endPlace)
    );
    if (waypoints.length < 2) return null;

    const chunks = splitChunks(waypoints);
    const links = chunks.map(chunk => ({
      url: urlFor(chunk),
      count: chunk.length
    }));

    return {
      links: links,
      total: waypoints.length,
      split: links.length > 1
    };
  }

  return {
    buildStepsUrl,
    extractWaypoints,
    placeFromHotel,
    MAX_WAYPOINTS
  };
})();
