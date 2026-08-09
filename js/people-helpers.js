/**
 * people-helpers.js — Resolve trip.travelers[{personId}] → people{} fiches
 *
 * people lives in trip.data (injected by seed-import from people.js of the
 * same seed repo). Travelers keep trip-only fields (role, leaveDate).
 */

var PeopleHelpers = (() => {

  function peopleMap(tripData) {
    if (!tripData) return {};
    if (tripData.people && typeof tripData.people === 'object') return tripData.people;
    if (tripData.trip && tripData.trip.people && typeof tripData.trip.people === 'object') {
      return tripData.trip.people;
    }
    return {};
  }

  /** Display name for a traveler ref (personId or legacy name). */
  function displayName(traveler, people) {
    if (!traveler) return '?';
    const map = people || {};
    if (traveler.personId && map[traveler.personId]) {
      return map[traveler.personId].name || traveler.personId;
    }
    return traveler.name || traveler.personId || '?';
  }

  function displayEmoji(traveler, people) {
    if (!traveler) return '';
    const map = people || {};
    if (traveler.personId && map[traveler.personId] && map[traveler.personId].emoji) {
      return map[traveler.personId].emoji;
    }
    return traveler.emoji || '';
  }

  /** Resolve full person record + trip overlays for one traveler. */
  function resolve(traveler, people) {
    if (!traveler) return null;
    const map = people || {};
    const base = (traveler.personId && map[traveler.personId])
      ? Object.assign({}, map[traveler.personId])
      : { name: traveler.name, emoji: traveler.emoji };
    return Object.assign(base, {
      personId: traveler.personId || base.id || null,
      role: traveler.role,
      leaveDate: traveler.leaveDate,
      note: traveler.note || base.note,
    });
  }

  /** Travelers of the trip, resolved against people map. */
  function tripPeople(tripData) {
    const map = peopleMap(tripData);
    const travelers = (tripData && tripData.trip && tripData.trip.travelers) || [];
    return travelers.map(t => resolve(t, map)).filter(Boolean);
  }

  /** People on this trip that have at least one document. */
  function withDocuments(tripData) {
    return tripPeople(tripData).filter(p => Array.isArray(p.documents) && p.documents.length > 0);
  }

  return {
    peopleMap,
    displayName,
    displayEmoji,
    resolve,
    tripPeople,
    withDocuments,
  };
})();
