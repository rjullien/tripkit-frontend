/**
 * trip-selector.js — Trip picker on Plus.
 * Mine + not finished stay visible. Past and other people's trips are
 * collapsed by default (same buckets as GH seeds / Documents).
 *
 * Classification uses GET /trips list metadata (dates + data.travelers/users),
 * not only a fully downloaded seed.
 */

var TripSelector = (() => {
  let _login = undefined;

  async function currentLogin() {
    if (_login !== undefined) return _login;
    const stored = (typeof localStorage !== 'undefined'
      && (localStorage.getItem('tk-user') || localStorage.getItem('tk-user-name')))
      || '';
    if (typeof API !== 'undefined' && API.getMe && navigator.onLine) {
      try {
        const res = await API.getMe();
        if (res && res.ok && res.data && res.data.user) {
          _login = String(res.data.user);
          try { localStorage.setItem('tk-user', _login); } catch (_) {}
          return _login;
        }
      } catch (e) {
        console.debug('[TripSelector] /me failed:', e.message);
      }
    }
    _login = stored;
    return _login;
  }

  /**
   * Render trip selector into container.
   * Fetches backend trips list to discover new trips.
   * @param {HTMLElement} container
   */
  async function render(container) {
    if (!container) return;

    // Fetch backend trips: discover new + drop orphans (only on success).
    // Network failure → keep local registry (offline-safe).
    if (navigator.onLine && typeof API !== 'undefined') {
      try {
        const resp = await API.getTrips();
        const backendTrips = Array.isArray(resp)
          ? resp
          : (resp && Array.isArray(resp.results) ? resp.results : null);
        if (backendTrips) {
          Store.reconcileTripsFromServer(backendTrips.map(t => t && t.id).filter(Boolean));
          backendTrips.forEach(t => {
            const id = t && t.id;
            if (!id) return;
            if (typeof TripGroups !== 'undefined' && TripGroups.mergeListItem) {
              Store.setTripData(id, TripGroups.mergeListItem(Store.getTripData(id), t));
              return;
            }
            if (!Store.getTripData(id)) {
              const extra = t.data
                ? (typeof t.data === 'string' ? JSON.parse(t.data) : t.data)
                : {};
              Store.setTripData(id, {
                trip: {
                  id: id,
                  name: t.name || id,
                  emoji: t.emoji || '🌍',
                  startDate: t.start_date || extra.startDate,
                  endDate: t.end_date || extra.endDate,
                  travelers: extra.travelers || [],
                  phases: extra.phases || [],
                  users: extra.users || {},
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
    const login = await currentLogin();
    const allData = tripIds.map((id) => Store.getTripData(id)).filter(Boolean);
    const knownIds = (typeof TripGroups !== 'undefined' && TripGroups.identityPersonIds)
      ? TripGroups.identityPersonIds(allData, login)
      : null;

    if (!tripIds.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🌍</div>
        <h3>Aucun voyage</h3>
        <p>Les données de voyage n'ont pas encore été chargées.</p>
      </div>`;
      return;
    }

    const groups = { open: [], past: [], others: [] };
    tripIds.forEach((id) => {
      const data = Store.getTripData(id);
      if (!data) return;
      const kind = (typeof TripGroups !== 'undefined' && TripGroups.bucket)
        ? TripGroups.bucket(data, login, undefined, knownIds)
        : 'open';
      (groups[kind] || groups.open).push({ id, data });
    });

    const seedGroups = { open: [], past: [], others: [] };
    const sources = (typeof PublishPanel !== 'undefined' && PublishPanel.sources)
      ? PublishPanel.sources() : [];
    sources.forEach((s) => {
      const td = (typeof Store !== 'undefined' && Store.getTripData)
        ? Store.getTripData(s.tripId) : null;
      const kind = (typeof TripGroups !== 'undefined' && TripGroups.bucketSource)
        ? TripGroups.bucketSource(s, td, login, undefined, knownIds)
        : 'open';
      (seedGroups[kind] || seedGroups.open).push(s);
    });

    const byStart = (a, b) => {
      const sa = (a.data.trip || a.data).startDate || '';
      const sb = (b.data.trip || b.data).startDate || '';
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    };
    groups.open.sort(byStart);
    groups.past.sort((a, b) => byStart(b, a));
    groups.others.sort(byStart);

    let html = '';
    groups.open.forEach(({ id, data }) => { html += tripRow(id, data, currentId); });
    seedGroups.open.forEach((s) => { html += seedRow(s); });
    html += collapsedGroup('past', '🕰️ Voyages passés', groups.past, seedGroups.past, currentId);
    html += collapsedGroup('others', '👥 Autres voyages', groups.others, seedGroups.others, currentId);

    container.innerHTML = html;
    bindCollapse(container);
    if (typeof PublishPanel !== 'undefined' && PublishPanel.bindPublishButtons) {
      PublishPanel.bindPublishButtons(container);
    }
  }

  function seedRow(s) {
    if (typeof PublishPanel !== 'undefined' && PublishPanel.sourceRow) return PublishPanel.sourceRow(s);
    return '';
  }

  function collapsedGroup(key, title, tripItems, seedItems, currentId) {
    const seeds = seedItems || [];
    if (!tripItems.length && !seeds.length) return '';
    let body = '';
    tripItems.forEach(({ id, data }) => { body += tripRow(id, data, currentId); });
    seeds.forEach((s) => { body += seedRow(s); });
    return `<div class="section-wrap plus-docs-wrap plus-trips-wrap">
      <div class="section-head collapsed plus-docs-head plus-trips-head" data-trips-group="${key}"
        role="button" tabindex="0" aria-expanded="false" aria-controls="plus-trips-body-${key}">
        <span class="s-title">${title}</span>
        <span class="s-count">${tripItems.length + seeds.length}</span>
        <span class="s-chevron">▼</span>
      </div>
      <div class="section-body hidden plus-docs-body plus-trips-body" id="plus-trips-body-${key}">${body}</div>
    </div>`;
  }

  function tripRow(id, data, currentId) {
    const trip = data.trip || data;
    const isActive = id === currentId;
    const startDate = trip.startDate ? formatDate(trip.startDate) : '';
    const endDate = trip.endDate ? formatDate(trip.endDate) : '';
    const dateStr = (startDate && endDate) ? `${startDate} → ${endDate}` : (startDate || '');
    const people = data.people;
    const travelers = trip.travelers
      ? `<div class="trip-dates">${trip.travelers.map((t) =>
        (typeof PeopleHelpers !== 'undefined')
          ? PeopleHelpers.displayName(t, people)
          : (t.name || t.personId || '?')
      ).join(', ')}</div>`
      : '';
    return `<div class="trip-item ${isActive ? 'active' : ''}" onclick="TripSelector.select('${escapeAttr(id)}')">
        <span class="trip-emoji">${escapeHtml(trip.emoji || '🌍')}</span>
        <div class="trip-info">
          <div class="trip-name">${escapeHtml(trip.name || id)}</div>
          ${dateStr ? `<div class="trip-dates">${dateStr}</div>` : ''}
          ${travelers}
        </div>
        <span class="trip-arrow">${isActive ? '✓' : '›'}</span>
      </div>`;
  }

  function bindCollapse(root) {
    if (!root) return;
    root.querySelectorAll('.plus-trips-head').forEach((head) => {
      if (head.dataset.bound === '1') return;
      head.dataset.bound = '1';
      const key = head.getAttribute('data-trips-group');
      const body = root.querySelector(`#plus-trips-body-${key}`);
      if (!body) return;
      const toggle = () => {
        const open = body.classList.toggle('hidden') === false;
        head.classList.toggle('collapsed', !open);
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      head.addEventListener('click', toggle);
      head.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /**
   * Select a trip and reload all views.
   * If trip data is minimal (just metadata), fetch full seed from backend.
   * @param {string} tripId
   */
  async function select(tripId) {
    Store.setCurrentTripId(tripId);

    // Keep local cache until a successful seed fetch (offline-safe).
    const hadLocal = !!Store.getTripData(tripId);

    if (navigator.onLine && typeof API !== 'undefined') {
      try {
        const up = API.isReachable && API.isReachable()
          ? true
          : (API.probe ? await API.probe() : true);
        if (up) {
          const ver = await API.checkVersion(tripId);
          const seed = await API.fetchSeed(tripId);
          if (seed) {
            const tripData = SeedMerge.merge(seed, Store.getTripData(tripId) || {});
            Store.setTripData(tripId, tripData);
            if (ver) Store.set(tripId + '-data-version', ver.version);
          } else if (!hadLocal) {
            App.showToast('Serveur injoignable — pas de données locales', 'error');
          }
        }
      } catch (e) {
        console.debug('[TripSelector] Failed to fetch trip data:', e.message);
      }
    }

    App.reloadAllViews();
    App.showToast(hadLocal || Store.getTripData(tripId) ? 'Voyage sélectionné !' : 'Chargement…', 'success');
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
