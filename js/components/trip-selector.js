/**
 * trip-selector.js — Trip picker component
 * Lists all available trips and lets the user switch between them.
 * Fetches from backend to discover new trips not yet in localStorage.
 */

var TripSelector = (() => {

  /**
   * Render trip selector into container.
   * Fetches backend trips list to discover new trips.
   * @param {HTMLElement} container
   */
  async function render(container) {
    if (!container) return;

    // Fetch backend trips to discover new ones
    if (navigator.onLine && typeof API !== 'undefined') {
      try {
        const resp = await API.getTrips();
        const backendTrips = Array.isArray(resp) ? resp : (resp && resp.results ? resp.results : null);
        if (backendTrips && backendTrips.length) {
          backendTrips.forEach(t => {
            const id = t.id;
            Store.registerTrip(id);
            // Store minimal trip metadata if not already cached
            if (!Store.getTripData(id)) {
              const extra = t.data ? (typeof t.data === 'string' ? JSON.parse(t.data) : t.data) : {};
              Store.setTripData(id, {
                trip: {
                  id: id,
                  name: t.name || id,
                  emoji: t.emoji || '🌍',
                  startDate: t.start_date || extra.startDate,
                  endDate: t.end_date || extra.endDate,
                  travelers: extra.travelers || [],
                  phases: extra.phases || [],
                },
                people: extra.people || {},
                days: [],
                hotels: Array.isArray(extra.hotels)
                  ? extra.hotels.reduce((d, h) => { if (h.id) d[h.id] = h; return d; }, {})
                  : (extra.hotels || {}),
              });
            }
          });
        }
      } catch (e) {
        console.debug('[TripSelector] Backend fetch failed:', e.message);
      }
    }

    const tripIds = Store.getAllTripIds();
    const currentId = Store.getCurrentTripId();

    if (!tripIds.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🌍</div>
        <h3>Aucun voyage</h3>
        <p>Les données de voyage n'ont pas encore été chargées.</p>
      </div>`;
      return;
    }

    let html = `<div class="page-header">
      <h1>🌍 Mes Voyages</h1>
      <div class="sub">Sélectionne un voyage</div>
    </div>`;

    tripIds.forEach(id => {
      const data = Store.getTripData(id);
      if (!data) return;
      const trip = data.trip || data;
      const isActive = id === currentId;

      const startDate = trip.startDate ? formatDate(trip.startDate) : '';
      const endDate   = trip.endDate   ? formatDate(trip.endDate)   : '';
      const dateStr   = (startDate && endDate) ? `${startDate} → ${endDate}` : (startDate || '');

      html += `<div class="trip-item ${isActive ? 'active' : ''}" onclick="TripSelector.select('${escapeAttr(id)}')">
        <span class="trip-emoji">${escapeHtml(trip.emoji || '🌍')}</span>
        <div class="trip-info">
          <div class="trip-name">${escapeHtml(trip.name || id)}</div>
          ${dateStr ? `<div class="trip-dates">${dateStr}</div>` : ''}
          ${trip.travelers ? `<div class="trip-dates">${trip.travelers.map(t =>
            (typeof PeopleHelpers !== 'undefined')
              ? PeopleHelpers.displayName(t, data.people)
              : (t.name || t.personId || '?')
          ).join(', ')}</div>` : ''}
        </div>
        <span class="trip-arrow">${isActive ? '✓' : '›'}</span>
      </div>`;
    });

    container.innerHTML = html;
  }

  /**
   * Select a trip and reload all views.
   * If trip data is minimal (just metadata), fetch full seed from backend.
   * @param {string} tripId
   */
  async function select(tripId) {
    Store.setCurrentTripId(tripId);

    // PURGE + force re-fetch — prevents stale/mixed trip data
    Store.clearTripData(tripId);
    Store.set(tripId + '-data-version', null);

    if (navigator.onLine && typeof API !== 'undefined') {
      try {
        const ver = await API.checkVersion(tripId);
        const seed = await API.fetchSeed(tripId);
        if (seed) {
          // Clean rebuild (the cache was purged above) using the SAME mapping as
          // App.refreshTripData. Never re-inline this: the old duplicated field
          // list here dropped mapHtml/meteoHtml. See js/seed-merge.js.
          const tripData = SeedMerge.merge(seed, {});
          Store.setTripData(tripId, tripData);
          if (ver) Store.set(tripId + '-data-version', ver.version);
        }
      } catch (e) {
        console.debug('[TripSelector] Failed to fetch trip data:', e.message);
      }
    }

    App.reloadAllViews();
    App.showToast(`Voyage sélectionné !`, 'success');
  }

  function formatDate(isoDate) {
    try {
      const d = new Date(isoDate + 'T12:00:00');
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return isoDate; }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;');
  }

  return { render, select };
})();
