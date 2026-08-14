/**
 * trip-groups.js — Plus trip list buckets: open / past / others.
 *
 * Open (Voyage actif): trips I own that are not finished.
 * Past: trips I own that already ended (collapsed like Documents).
 * Others: trips I can see but do not own (collapsed), even if I'm a traveler.
 *
 * Same buckets for GH seed rows in « Publier depuis git ».
 *
 * "Own" = traveler with role "owner" matching the Authelia login
 * (trip.users[login].defaultConf, people[].login, or personId === login).
 * Unknown login → do not hide trips as "others" (offline / anonymous).
 */
var TripGroups = (() => {

  function fold(s) {
    return String(s || '').trim().toLowerCase();
  }

  function tripOf(tripData) {
    if (!tripData) return {};
    return tripData.trip || tripData;
  }

  function peopleOf(tripData) {
    if (!tripData) return {};
    if (tripData.people && typeof tripData.people === 'object') return tripData.people;
    const trip = tripOf(tripData);
    if (trip.people && typeof trip.people === 'object') return trip.people;
    return {};
  }

  /** Person ids that count as "the logged-in user" on this trip. */
  function personIdsForLogin(tripData, login) {
    const ids = new Set();
    const L = fold(login);
    if (!L) return ids;
    ids.add(L);
    const trip = tripOf(tripData);
    const users = trip.users || {};
    Object.keys(users).forEach((key) => {
      if (fold(key) !== L) return;
      ids.add(fold(key));
      const cfg = users[key] || {};
      if (cfg.defaultConf) ids.add(fold(cfg.defaultConf));
    });
    const people = peopleOf(tripData);
    Object.keys(people).forEach((id) => {
      const p = people[id] || {};
      if (fold(p.login) === L || fold(p.id) === L) ids.add(fold(id));
    });
    return ids;
  }

  function ownerPersonIds(trip) {
    const travelers = (trip && trip.travelers) || [];
    return travelers
      .filter((t) => t && fold(t.role) === 'owner')
      .map((t) => fold(t.personId || t.id))
      .filter(Boolean);
  }

  function loginOnTrip(tripData, login) {
    const my = personIdsForLogin(tripData, login);
    if (!my.size) return false;
    const trip = tripOf(tripData);
    const travelers = trip.travelers || [];
    for (let i = 0; i < travelers.length; i++) {
      const t = travelers[i] || {};
      if (my.has(fold(t.personId || t.id))) return true;
    }
    const users = trip.users || {};
    return Object.keys(users).some((key) => fold(key) === fold(login));
  }

  /**
   * Union of person ids for this login across every trip we know.
   * USA maps `laurine-rol` → `laurine`; Philippines owner is `laurine`.
   */
  function identityPersonIds(tripDatas, login) {
    const ids = new Set();
    const L = fold(login);
    if (L) ids.add(L);
    (tripDatas || []).forEach((td) => {
      personIdsForLogin(td, login).forEach((id) => ids.add(id));
    });
    return ids;
  }

  /**
   * True when this trip is "mine" for the Plus open list.
   * Owner role wins. If the seed has no owner, fall back to being on the trip.
   * @param {object} tripData
   * @param {string} login
   * @param {Set<string>} [knownIds] person ids already resolved for this login
   */
  function isMine(tripData, login, knownIds) {
    const L = fold(login);
    if (!L) return true;
    const trip = tripOf(tripData);
    const owners = ownerPersonIds(trip);
    const my = new Set(knownIds || []);
    personIdsForLogin(tripData, login).forEach((id) => my.add(id));
    if (!my.size) my.add(L);
    if (owners.length) {
      return owners.some((id) => my.has(id));
    }
    return loginOnTrip(tripData, login);
  }

  function isPast(trip, now) {
    if (typeof DayResolver !== 'undefined' && DayResolver.tripState) {
      return DayResolver.tripState(trip, now) === 'after';
    }
    if (!trip || !trip.endDate) return false;
    const today = now || new Date();
    const end = new Date(String(trip.endDate) + 'T00:00:00');
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return day > end;
  }

  /**
   * @returns {'open'|'past'|'others'}
   */
  function bucket(tripData, login, now, knownIds) {
    if (fold(login) && !isMine(tripData, login, knownIds)) return 'others';
    if (isPast(tripOf(tripData), now)) return 'past';
    return 'open';
  }

  /**
   * GH seed is "mine" when I'm on ownerLogins / publisherLogins, or the
   * source id / family matches a known person id (nadia, laurine, …).
   */
  function isMySource(source, login, knownIds) {
    const L = fold(login);
    if (!L) return true;
    const my = new Set(knownIds || []);
    my.add(L);
    const owners = [].concat(source.ownerLogins || [], source.publisherLogins || []);
    if (owners.length) {
      return owners.some((o) => my.has(fold(o)));
    }
    return my.has(fold(source.sourceId)) || my.has(fold(source.family));
  }

  /**
   * Same open / past / others buckets as Voyage actif, for a publish source.
   * When the trip is already in Store, reuse bucket(). Otherwise (create, or
   * trip not downloaded) fall back to source ownership — never dates.
   * @returns {'open'|'past'|'others'}
   */
  function bucketSource(source, tripData, login, now, knownIds) {
    if (tripData) return bucket(tripData, login, now, knownIds);
    if (fold(login) && !isMySource(source, login, knownIds)) return 'others';
    return 'open';
  }

  return {
    fold, personIdsForLogin, identityPersonIds, isMine, isPast, bucket,
    isMySource, bucketSource,
  };
})();
