/**
 * day-resolver.js — Determines which day to show on app load
 *
 * Logic:
 * 1. If user manually navigated → use their last position (localStorage)
 * 2. During trip → auto-navigate to today's day
 * 3. Before trip → Day 0 (or user's startDay if late joiner)
 * 4. After trip → last day
 * 5. User personalization: skipDays, startDay
 *
 * All computed from trip.startDate — zero hardcoded dates.
 */

var DayResolver = (() => {

  /**
   * Get the default day index to display.
   * @param {Object} tripData — { trip, days[] }
   * @param {Object} [opts] — { userId?, ignoreManual?, nowOverride? }
   * @returns {number} 0-based index into tripData.days[]
   */
  function getDefaultDayIndex(tripData, opts) {
    if (!tripData || !tripData.days || !tripData.days.length) return 0;
    opts = opts || {};

    const days = tripData.days;
    const trip = tripData.trip || {};
    const userId = opts.userId || null;
    const userCfg = userId && trip.users ? trip.users[userId] : null;

    // Check localStorage for manual position
    if (!opts.ignoreManual) {
      const stored = Store.get(trip.id + '-current-day');
      if (stored !== null) {
        const idx = days.findIndex(d => d.day === Number(stored));
        if (idx >= 0) return idx;
      }
    }

    // Compute today's trip day from startDate
    if (!trip.startDate) return 0;

    const now = opts.nowOverride || new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(trip.startDate + 'T00:00:00');
    const tripDay = Math.floor((today - start) / 86400000) + 1; // +1: startDate = Day 1, not Day 0

    // Before trip
    if (tripDay < 0) {
      // Late joiner? Jump to their start day
      if (userCfg && userCfg.startDay != null) {
        const idx = days.findIndex(d => d.day === userCfg.startDay);
        if (idx >= 0) return idx;
      }
      return 0;
    }

    // After trip
    if (tripDay >= days.length) {
      return days.length - 1;
    }

    // During trip — find today's day
    const idx = days.findIndex(d => d.day === tripDay);
    return idx >= 0 ? idx : 0;
  }

  /**
   * Filter days based on user config (skipDays).
   * Returns a new array (does not mutate).
   * @param {Array} days
   * @param {Object} userCfg — { skipDays?: number[] }
   * @returns {Array}
   */
  function filterDays(days, userCfg) {
    if (!userCfg || !userCfg.skipDays || !userCfg.skipDays.length) return days;
    return days.filter(d => !userCfg.skipDays.includes(d.day));
  }

  /**
   * Get countdown info (before trip).
   * @param {Object} trip — { startDate }
   * @returns {{ days: number, hours: number, active: boolean } | null}
   */
  function getCountdown(trip, nowOverride) {
    if (!trip || !trip.startDate) return null;
    const now = nowOverride || new Date();
    const start = new Date(trip.startDate + 'T00:00:00');
    const day0Start = new Date(start.getTime() - 86400000); // Day 0 = startDate - 1
    const diff = day0Start - now;
    if (diff <= 0) return { days: 0, hours: 0, active: false };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      active: true,
    };
  }

  /**
   * Check trip temporal state.
   * @param {Object} trip
   * @returns {"before" | "during" | "after"}
   */
  function tripState(trip, nowOverride) {
    if (!trip || !trip.startDate || !trip.endDate) return 'before';
    const now = nowOverride || new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(trip.startDate + 'T00:00:00');
    const day0Start = new Date(start.getTime() - 86400000); // Day 0 = startDate - 1
    const end = new Date(trip.endDate + 'T00:00:00');
    if (today < day0Start) return 'before';
    if (today > end) return 'after';
    return 'during';
  }

  return { getDefaultDayIndex, filterDays, getCountdown, tripState };
})();
