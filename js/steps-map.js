/**
 * steps-map.js — Build a Google Maps Directions URL from timeline waypoints.
 *
 * Uses the optional `place`, `lat`/`lon` fields on timeline entries
 * to construct a multi-waypoint directions URL.
 *
 * Google Maps free URL limit: ~10 waypoints max.
 */

var StepsMap = (() => {

  const MAX_WAYPOINTS = 10;
  const BASE = 'https://www.google.com/maps/dir/';

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
      } else if (ev.place && typeof ev.place === 'string') {
        waypoints.push(ev.place);
      }
    }
    return waypoints;
  }

  /**
   * Build a Google Maps Directions URL from timeline entries.
   *
   * @param {Array} timeline — day.timeline array
   * @param {Object} [opts] — optional { startPlace, endPlace } to prepend/append
   * @returns {{ url: string, count: number, truncated: boolean }|null}
   *   null if fewer than 2 waypoints available
   */
  function buildStepsUrl(timeline, opts) {
    const waypoints = extractWaypoints(timeline);
    if (waypoints.length < 2) return null;

    const truncated = waypoints.length > MAX_WAYPOINTS;
    const used = waypoints.slice(0, MAX_WAYPOINTS);

    const encoded = used.map(wp => encodeURIComponent(wp)).join('/');
    const url = BASE + encoded;

    return {
      url: url,
      count: used.length,
      truncated: truncated
    };
  }

  return { buildStepsUrl, extractWaypoints, MAX_WAYPOINTS };
})();
