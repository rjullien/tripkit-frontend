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
          ${trip.travelers ? `<div class="trip-dates">${trip.travelers.map(t => t.name).join(', ')}</div>` : ''}
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
          const tripData = {};
          if (seed.days && seed.days.length) {
            tripData.days = seed.days.map(d => {
              const raw = d.data;
              return typeof raw === 'string' ? JSON.parse(raw) : (raw || d);
            }).sort((a, b) => (a.day || 0) - (b.day || 0));
          }
          if (seed.trip) {
            const t = seed.trip;
            const extra = t.data ? (typeof t.data === 'string' ? JSON.parse(t.data) : t.data) : {};
            tripData.trip = {
              id: t.id,
              name: t.name,
              emoji: t.emoji,
              startDate: t.start_date || extra.startDate,
              endDate: t.end_date || extra.endDate,
              travelers: extra.travelers || tripData.trip?.travelers,
              phases: extra.phases || tripData.trip?.phases,
              mapImage: extra.mapImage || tripData.trip?.mapImage,
              routeUrl: extra.routeUrl || tripData.trip?.routeUrl,
              users: extra.users || tripData.trip?.users,
              sharedLinks: extra.sharedLinks || tripData.trip?.sharedLinks,
            };
            if (extra.restaurants) tripData.restaurants = extra.restaurants;
            if (extra.culture) tripData.culture = extra.culture;
            if (extra.hotels) {
              if (Array.isArray(extra.hotels)) {
                const dict = {};
                extra.hotels.forEach(h => { if (h.id) dict[h.id] = h; });
                tripData.hotels = dict;
              } else {
                tripData.hotels = extra.hotels;
              }
            }
            if (extra.locations) tripData.locations = extra.locations;
          }
          if (seed.hotels && seed.hotels.length) {
            seed.hotels.forEach(h => {
              const hData = typeof h.data === 'string' ? JSON.parse(h.data) : (h.data || {});
              const day = tripData.days?.find(d => d.day === h.day_num);
              if (day) Object.assign(day, hData);
            });
          }
          if (seed.lists && seed.lists.length) {
            tripData.lists = tripData.lists || {};
            seed.lists.forEach(l => {
              const lData = typeof l.data === 'string' ? JSON.parse(l.data) : (l.data || {});
              tripData.lists[l.id] = { id: l.id, type: l.type, title: l.title, ...lData };
            });
          }
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
