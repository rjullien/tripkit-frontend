/**
 * app.js — Main application controller
 * Hash-based router, tab switching, trip context, toast system
 *
 * Data flow (100% backend, localStorage = cache):
 * 1. Boot → render from localStorage cache (instant, works offline)
 * 2. If online → check /api/trips/:id/version (3s timeout, 50 bytes)
 * 3. If version changed → fetch /api/trips/:id/seed → update localStorage → re-render
 * 4. If offline/slow/same version → skip, use cached data
 * 5. No static seed JS — all data comes from backend, cached locally
 */
var App = (() => {

  let currentTab = 'programme';
  let currentDayIndex = 0;   // index into tripData.days array
  let currentListId = null;
  let _cachedVersion = null; // loaded from version.json
  let _backendVersion = null; // from GET /health — survives Plus tab re-renders
  let _backendVersionFetch = null; // in-flight promise (dedupe)
  let _deferredInstallPrompt = null; // Android/Chrome install prompt
  let _edgeBundlePromise = null; // in-flight injection of js/dist/bundle-edge.js
  let _edgeBundleAttempt = 0;    // compteur d'essais, cf. ensureEdgeBundle
  let _experimentalOpen = false; // « Expérimental » : état replié/déplié, survit aux re-render
  let _nuisanceAbort = null;     // AbortController du flux nuisances (onglet Plus)

  // ── PWA Install prompt capture (Android/Chrome) ─────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
  });

  // ── Magic Link Auth ────────────────────────────────────────────────────────
  // POST /auth/login is a full round-trip: awaiting it before the first paint
  // left the screen blank for the whole exchange. Boot now starts it and paints,
  // then awaits it right before touching the backend (the JWT it stores is what
  // authorises /api/trips…, and a first-ever visit has no local cache to show).
  const MAGIC_LINK_TIMEOUT_MS = 8000;

  /**
   * Starts the ?token= → JWT exchange without blocking the caller.
   * @returns {Promise<boolean>|null} null when the URL carries no magic token
   *   (the common case), else a promise resolving true when authenticated /
   *   false when the link was refused (error already displayed).
   */
  function startMagicLink() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return null;
    return handleMagicLink(token);
  }

  async function handleMagicLink(token) {
    // Exchange magic token for JWT via backend
    try {
      const baseUrl = (typeof TRIPKIT_CONFIG !== 'undefined' && TRIPKIT_CONFIG.apiUrl &&
                       TRIPKIT_CONFIG.apiUrl !== '${API_URL}')
        ? TRIPKIT_CONFIG.apiUrl.replace(/\/$/, '') : window.location.origin;

      // Timeout: boot waits on this promise before fetching data, so a hung
      // /auth/login must not stall « Chargement… » forever.
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), MAGIC_LINK_TIMEOUT_MS) : null;
      let res;
      try {
        res = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          signal: ctrl ? ctrl.signal : undefined,
        });
      } finally {
        if (timer) clearTimeout(timer);
      }

      if (res.ok) {
        const data = await res.json();
        if (data.jwt) {
          localStorage.setItem('tk-api-token', data.jwt);
          localStorage.setItem('tk-user-name', data.name || '');
          localStorage.setItem('tk-user-role', data.role || 'viewer');
          if (data.trip_id) {
            Store.setCurrentTripId(data.trip_id);
          }
          // Clean URL (remove ?token=xxx)
          window.history.replaceState({}, '', window.location.pathname + window.location.hash);
          return true;
        }
      }

      // Token invalid/expired — show error
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      showAuthError(err.error || 'Lien invalide ou expir\u00e9');
      return false;
    } catch (e) {
      console.error('[Auth] Magic link error:', e);
      showAuthError('Erreur de connexion au serveur');
      return false;
    }
  }

  function showAuthError(msg) {
    const container = document.getElementById('programme-content') || document.body;
    container.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">\ud83d\udd12</div>
      <h3>Acc\u00e8s refus\u00e9</h3>
      <p>${msg}</p>
      <p style="font-size:.8em;color:var(--muted);margin-top:12px">Demandez un nouveau lien d'invitation.</p>
    </div>`;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    window.addEventListener('hashchange', handleHash);
    // NOTE (FEAT-004) : personne ne dispatche « tripkit-sync-done » dans le repo
    // aujourd'hui (aucun dispatchEvent/CustomEvent dans js/). Le listener est
    // gardé comme point d'extension, mais il ne participe PAS aux refresh
    // parasites de l'onglet Plus : ceux-ci viennent de setupConnectivityResume().
    window.addEventListener('tripkit-sync-done', () => {
      // Don't auto-re-render while user is on the list (causes tap misses).
      // Only re-render if on the Plus tab but NOT viewing a specific list.
      if (currentTab === 'plus' && !currentListId) {
        renderCurrentTab();
      }
    });

    // Magic link: intercept ?token=xxx in URL → exchange for JWT.
    // Started here, not awaited: the UI below paints during the exchange.
    const magicLink = startMagicLink();

    paintConstructionNav();

    // Load version.json (non-blocking, best-effort)
    fetch('version.json').then(r => r.ok ? r.json() : null)
      .then(v => {
        if (v) {
          _cachedVersion = v;
          // Update version display if Plus tab is visible
          const verEl = document.getElementById('tripkit-version-info');
          if (verEl) verEl.innerHTML = `🏷️ Soft: <code style="font-size:.82em;color:var(--sec);font-weight:600">v${esc(v.soft)}</code> · Data: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(v.data)}</code> · Cache: <code style="font-size:.82em;color:var(--sec)">${v.cache || '?'}</code>`;
        }
      })
      .catch(() => {});

    // Backend version — cache in memory so Plus tab can show it even if the
    // /health response lands before #tripkit-backend-info exists (race).
    fetchBackendVersion();

    // Paint first, hit the backend after. When the URL carried a magic token the
    // /api calls must wait for its JWT — that is the only thing they wait for.
    const tripId = Store.getCurrentTripId();
    if (tripId && Store.getTripData(tripId)) {
      // Has cached data → render instantly, refresh in background
      handleHash();
      if (magicLink) magicLink.then(() => refreshFromBackend());
      else refreshFromBackend();
    } else {
      // First visit — show loading, fetch from backend, then render.
      // No cache to fall back on: the seed fetch genuinely needs the JWT.
      showLoading();
      const authed = magicLink ? await magicLink : null;
      await refreshFromBackend();

      // Check if we got data — if not, show offline message
      const newTripId = Store.getCurrentTripId();
      if (!newTripId || !Store.getTripData(newTripId)) {
        // A refused magic link already rendered its own error — don't clobber it
        if (authed !== false) showOffline();
      } else {
        handleHash();
      }
    }

    // 4. Register SW + update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then(reg => {
        setInterval(() => reg.update(), 30 * 60 * 1000);
        function showUpdateBanner() {
          if (document.getElementById('sw-update-banner')) return;
          const banner = document.createElement('div');
          banner.id = 'sw-update-banner';
          banner.className = 'update-banner';
          banner.innerHTML = '🔄 Mise à jour dispo !<button onclick="location.reload()" class="btn-update">Recharger</button>';
          document.body.appendChild(banner);
        }
        if (reg.waiting) showUpdateBanner();
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (newSW) newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner();
          });
        });
      }).catch(e => console.debug('[SW] registration failed:', e));
    }

    // 5. Swipe navigation
    setupSwipe();

    // 6. Resume when backend is really reachable again
    setupConnectivityResume();
    paintConnectivity();
  }

  // ── No static seed — data comes from backend, cached in localStorage ─────
  // First visit: backend fetch → localStorage. Subsequent visits: localStorage cache.
  // Offline after first visit: works from cache. Never-visited + offline: empty state shown.

  // ── Backend refresh (version-gated, data decoupled from code) ─────────────
  async function resolveTripId() {
    let tripId = Store.getCurrentTripId();
    if (tripId) return tripId;
    if (typeof TRIPKIT_CONFIG !== 'undefined' && TRIPKIT_CONFIG.defaultTripId &&
        TRIPKIT_CONFIG.defaultTripId !== '${DEFAULT_TRIP_ID}') {
      return TRIPKIT_CONFIG.defaultTripId;
    }
    const trips = await API.getTrips();
    if (trips && trips.length) return trips[0].id;
    // Offline / backend down: keep browsing a locally cached trip
    const localIds = Store.getAllTripIds();
    if (localIds && localIds.length) return localIds[0];
    return null;
  }

  /**
   * Fetch seed for tripId.
   * @returns {Promise<'updated'|'unchanged'|false>} 'updated' when a new seed was
   *   merged and stored, 'unchanged' when the backend version matched (or the
   *   version check failed) but local data stays usable, false when there is
   *   nothing usable at all. Both strings are truthy, so the historical
   *   `if (!ok)` / `if (ok || …)` call sites keep their control flow — but only
   *   'updated' may trigger a re-render (cf. refreshFromBackend).
   * Network failure never invalidates a good local cache.
   */
  async function loadTripSeed(tripId) {
    const hasLocal = !!Store.getTripData(tripId);
    const verRes = await API.checkVersionStatus(tripId);
    if (!verRes.ok || !verRes.data) {
      console.debug('[App] Version check failed for', tripId, verRes.status || verRes.error);
      // Keep current trip usable offline / when backend is flaky
      return hasLocal ? 'unchanged' : false;
    }
    const ver = verRes.data;

    const cachedVersion = Store.get(tripId + '-data-version');
    // Skip network seed only when we already have local data AND same version.
    // A leftover *-data-version without tk-trip-* must NOT skip (boot would stall).
    if (hasLocal && cachedVersion && String(cachedVersion) === String(ver.version)) {
      console.debug('[App] Data up to date (v' + ver.version + ') — skip refresh');
      return 'unchanged';
    }

    console.log('[App] Fetching seed:', tripId, 'version', cachedVersion, '→', ver.version);
    const seed = await API.fetchSeed(tripId);
    if (!seed) return hasLocal ? 'unchanged' : false;

    const tripData = SeedMerge.merge(seed, Store.getTripData(tripId) || {});
    Store.registerTrip(tripId);
    Store.setCurrentTripId(tripId);
    Store.markSeedLoaded(tripId);
    Store.setTripData(tripId, tripData);
    Store.set(tripId + '-data-version', ver.version);
    console.log('[App] Backend data refreshed:', tripId, tripData.days?.length, 'days, version:', ver.version);
    if (typeof API.warmTripAssets === 'function') API.warmTripAssets(tripId, tripData);
    return 'updated';
  }

  /**
   * Sync tk-trips with GET /trips. Only when the response is a real array
   * (including empty). null / network error → leave local cache alone.
   */
  async function reconcileTripRegistry() {
    if (typeof API === 'undefined' || typeof Store.reconcileTripsFromServer !== 'function') {
      return null;
    }
    try {
      const resp = await API.getTrips();
      const backendTrips = Array.isArray(resp)
        ? resp
        : (resp && Array.isArray(resp.results) ? resp.results : null);
      if (!backendTrips) return null;
      const ids = backendTrips.map(t => t && t.id).filter(Boolean);
      const result = Store.reconcileTripsFromServer(ids);
      if (result.removed.length) {
        console.debug('[App] Dropped trips gone from backend:', result.removed.join(', '));
      }
      return result;
    } catch (e) {
      console.debug('[App] Trip registry sync skipped:', e.message);
      return null;
    }
  }

  /**
   * @param {{probed?: boolean}} [opts] probed: le caller vient de sonder /health
   *   avec succès (kick()), inutile de le refaire — cela économise une requête
   *   /health par retour dans l'app.
   */
  async function refreshFromBackend(opts) {
    if (!navigator.onLine) return;
    // Prefer a real probe when the device claims to be online
    if (!(opts && opts.probed) && typeof API !== 'undefined' && API.probe) {
      const up = await API.probe();
      if (!up) {
        // Stay on cache — do not rediscover / wipe
        if (typeof API.flushOutbox === 'function') API.flushOutbox();
        return;
      }
    }

    // Drop deleted / ACL-lost trips from local registry (BE success only).
    // L'empreinte avant/après capture aussi bien un retrait qu'un ajout : le
    // résultat de reconcileTripsFromServer ne liste que les retraits.
    const tripsBefore = (Store.getAllTripIds() || []).join('|');
    const registry = await reconcileTripRegistry();
    const registryChanged = !!registry &&
      (Store.getAllTripIds() || []).join('|') !== tripsBefore;

    let tripId = await resolveTripId();
    if (!tripId) return;

    try {
      const hasLocal = !!Store.getTripData(tripId);
      let ok = await loadTripSeed(tripId);

      // Rediscover ONLY on definitive 403/404 and when we have NO local cache.
      // Never clear tk-current-trip because /health or /version timed out.
      if (!ok && !hasLocal && Store.getCurrentTripId() === tripId) {
        const st = await API.checkVersionStatus(tripId);
        if (st.status === 403 || st.status === 404) {
          console.debug('[App] Current trip gone (', st.status, ') — rediscovering');
          localStorage.removeItem('tk-current-trip');
          localStorage.removeItem(tripId + '-data-version');
          const trips = await API.getTrips();
          const next = trips && trips.length
            ? (trips.find(t => t.id !== tripId) || trips[0])
            : null;
          if (next && next.id) {
            ok = await loadTripSeed(next.id);
            tripId = next.id;
          }
        }
      }

      // Re-render ONLY when the seed really changed, or when this refresh is what
      // brought the first usable data (cold boot / rediscovered trip).
      // Repainting on an unchanged version was the « refresh parasite » of the
      // Plus tab: every app switch / screen unlock rebuilt #plus-content, which
      // restarted PublishPanel.loadSources(), LeoChatStream.loadStatus(),
      // PlusChatStream.loadStatus() and lost the scroll position.
      // …ou quand le registre des voyages a bougé côté backend (voyage ajouté ou
      // retiré) : la version du seed courant n'en dit rien, et sans ce cas le
      // sélecteur de voyages de l'onglet Plus resterait périmé jusqu'à ce que
      // l'utilisateur quitte l'onglet et y revienne.
      const firstPaint = !hasLocal && !!Store.getTripData(tripId);
      if (ok === 'updated' || firstPaint || registryChanged) renderCurrentTab();
    } catch (e) {
      console.debug('[App] Backend refresh failed (using cached):', e.message);
    }

    if (typeof API !== 'undefined' && tripId) {
      API.backgroundSyncTrip(tripId);
      // Even when seed was already up-to-date, warm images for offline Jour/Route
      const td = Store.getTripData(tripId);
      if (td && typeof API.warmTripAssets === 'function') API.warmTripAssets(tripId, td);
    }
  }

  // Deux garde-fous cumulés contre les reprises en rafale (l'utilisateur qui
  // bascule entre applis fait pleuvoir les visibilitychange) :
  //  1. un debounce de 400 ms qui fusionne les événements rapprochés ;
  //  2. un intervalle minimum entre deux reprises déclenchées par la visibilité.
  // L'événement « online » reste immédiat (hors intervalle minimum) : retrouver
  // le réseau doit resynchroniser tout de suite.
  const RESUME_MIN_INTERVAL_MS = 10000;

  /**
   * Intervalle minimum effectif entre deux reprises de visibilité.
   * Crochet de test uniquement : sans `window.__tripkitResumeMinIntervalMs`
   * (le cas en production, où rien ne le définit), renvoie toujours
   * RESUME_MIN_INTERVAL_MS. Il permet à tests/plus-refresh.spec.js de vérifier
   * que la reprise différée a bien lieu sans attendre 10 s de sommeil réel.
   */
  function resumeMinIntervalMs() {
    const override = window.__tripkitResumeMinIntervalMs;
    return (typeof override === 'number' && override > 0) ? override : RESUME_MIN_INTERVAL_MS;
  }

  /** Resume when network is really back (probe), not merely navigator.onLine. */
  function setupConnectivityResume() {
    let _resumeTimer = null;
    let _lastResumeAt = 0;
    const kick = (force) => {
      const minInterval = resumeMinIntervalMs();
      const since = _lastResumeAt ? Date.now() - _lastResumeAt : Infinity;
      if (!force && since < minInterval) {
        // L'intervalle minimum DIFFÈRE la reprise, il ne l'annule pas : un vrai
        // retour dans l'app 9 s après le précédent (souvent sur un autre réseau)
        // doit finir par resynchroniser. Un seul report est armé à la fois.
        clearTimeout(_resumeTimer);
        _resumeTimer = setTimeout(() => kick(true), minInterval - since);
        // L'indicateur de connectivité, lui, ne coûte rien : il est repeint tout
        // de suite pour ne pas rester périmé pendant la fenêtre.
        paintConnectivity();
        return;
      }
      clearTimeout(_resumeTimer);
      _resumeTimer = setTimeout(async () => {
        if (typeof API === 'undefined') return;
        _lastResumeAt = Date.now();
        const up = await API.probe();
        paintConnectivity();
        if (!up) return;
        await refreshFromBackend({ probed: true });
        if (typeof PublishPanel !== 'undefined' && PublishPanel.resumeIfNeeded) {
          PublishPanel.resumeIfNeeded();
        }
        if (typeof LeoChatStream !== 'undefined' && LeoChatStream.resumeIfNeeded) {
          LeoChatStream.resumeIfNeeded();
        }
        // If a shared list is open, re-pull so Nicole sees René's ticks after
        // unlocking the phone / coming back to Safari.
        if (currentListId && typeof ListComponent !== 'undefined') {
          const td = Store.getTripData(Store.getCurrentTripId());
          const list = td && td.lists && td.lists[currentListId];
          if (list && ListComponent.pullOnOpen) {
            ListComponent.pullOnOpen('plus-content', list);
          }
        }
      }, 400);
    };
    window.addEventListener('online', () => kick(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') kick(false);
    });
    if (typeof API.onReachabilityChange === 'function') {
      API.onReachabilityChange(() => paintConnectivity());
    }
  }

  function paintConnectivity() {
    const el = document.getElementById('tripkit-connectivity');
    if (!el) return;
    const device = navigator.onLine;
    const be = (typeof API !== 'undefined' && API.getReachability) ? API.getReachability() : null;
    let label;
    if (!device) label = '<span style="color:var(--orange)">Hors ligne (appareil)</span>';
    else if (be === true) label = '<span style="color:var(--green)">Backend OK</span>';
    else if (be === false) label = '<span style="color:var(--orange)">Appareil en ligne · backend injoignable</span>';
    else label = '<span style="color:var(--muted)">Appareil en ligne · backend…</span>';
    el.innerHTML = `🌐 ${label}`;
  }

  // ── Router ────────────────────────────────────────────────────────────────
  function handleHash() {
    const hash = window.location.hash.slice(1) || 'programme';
    const parts = hash.split('/');
    const tab = parts[0];

    if (['programme', 'route', 'culture', 'hotels', 'construction', 'plus'].includes(tab)) {
      if (tab === 'construction' && !Store.get('tk-construction-mode')) {
        window.location.hash = 'programme';
        return;
      }
      _updateTabUI(tab);
      if (currentTab && currentTab !== tab) _teardownTab(currentTab);
      currentTab = tab;

      if (tab === 'programme' && parts[1] !== undefined) {
        currentDayIndex = parseInt(parts[1]) || 0;
      }
      if (tab === 'plus') {
        // plus/listes/listId or plus/hotels
        currentListId = (parts[1] === 'listes' && parts[2]) ? parts[2] : null;
      } else {
        currentListId = null;
      }
    }

    renderCurrentTab();
  }

  function _updateTabUI(tab) {
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === 'tab-' + tab);
    });
  }

  /**
   * Coupe les flux SSE de l'onglet qu'on quitte.
   *
   * Un flux nuisances survit à l'abandon de son panneau : il continue jusqu'au
   * `done` puis repeint un panneau que l'utilisateur ne regarde plus. Chaque
   * panneau annule déjà son propre flux avant d'en ouvrir un autre ;
   * il manquait la sortie d'onglet.
   *
   * Limite : `abort()` ne coupe que la lecture côté client. Le job serveur
   * continue d'interroger Overpass jusqu'à son terme.
   */
  function _teardownTab(tab) {
    if (tab === 'construction' && typeof ConstructionView !== 'undefined' && ConstructionView.abortNuisanceStream) {
      ConstructionView.abortNuisanceStream();
    }
    if (tab === 'hotels' && typeof BookingsView !== 'undefined' && BookingsView.abortHotelNuisanceStreams) {
      BookingsView.abortHotelNuisanceStreams();
    }
    if (tab === 'plus' && _nuisanceAbort) {
      _nuisanceAbort.abort();
      _nuisanceAbort = null;
    }
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  function switchTab(tab) {
    if (currentTab && currentTab !== tab) _teardownTab(currentTab);
    currentTab = tab;
    _updateTabUI(tab);
    if (tab !== 'listes') currentListId = null;
    // Animate tab content
    const activeView = document.getElementById('tab-' + tab);
    if (activeView) {
      activeView.style.animation = 'none';
      activeView.offsetHeight;
      activeView.style.animation = 'fadeIn 0.25s ease';
    }
    window.location.hash = tab;
  }

  // ── Render current tab ────────────────────────────────────────────────────
  function renderCurrentTab() {
    const tripId = Store.getCurrentTripId();
    const tripData = tripId ? Store.getTripData(tripId) : null;

    switch (currentTab) {
      case 'programme': renderProgramme(tripData); break;
      case 'route':     renderRoute(tripData);     break;
      case 'culture':   renderCulture(tripData);   break;
      case 'hotels':    renderHotels(tripData);    break;
      case 'construction': renderConstruction(tripData); break;
      case 'plus':      renderPlus(tripData);      break;
    }
  }

  function reloadAllViews() { renderCurrentTab(); }

  // ── Programme tab ─────────────────────────────────────────────────────────
  function renderProgramme(tripData) {
    const container = document.getElementById('programme-content');
    if (!tripData || !tripData.days || !tripData.days.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🌍</div>
        <h3>Aucun voyage chargé</h3>
        <p>Allez dans ⚙️ Plus pour sélectionner un voyage.</p>
      </div>`;
      return;
    }
    // Auto-navigate to current day (during trip) or default
    if (typeof DayResolver !== 'undefined' && !window.location.hash.includes('programme/')) {
      currentDayIndex = DayResolver.getDefaultDayIndex(tripData);
    }
    currentDayIndex = Math.max(0, Math.min(currentDayIndex, tripData.days.length - 1));
    DailyView.render(container, tripData, currentDayIndex);
  }

  function goToDay(dayIndex) {
    const tripId = Store.getCurrentTripId();
    const tripData = tripId ? Store.getTripData(tripId) : null;
    if (!tripData) return;
    const oldIndex = currentDayIndex;
    currentDayIndex = Math.max(0, Math.min(dayIndex, tripData.days.length - 1));
    // Slide animation
    const container = document.getElementById('programme-content');
    if (container && oldIndex !== currentDayIndex) {
      const anim = currentDayIndex > oldIndex ? 'slideLeft' : 'slideRight';
      container.style.animation = 'none';
      container.offsetHeight; // force reflow
      container.style.animation = `${anim} 0.25s ease`;
    }
    window.location.hash = `programme/${currentDayIndex}`;
  }

  // ── Route tab ──────────────────────────────────────────────────────────────
  function renderRoute(tripData) {
    RouteView.render('route-content', tripData);
  }

  // ── Culture tab ───────────────────────────────────────────────────────────
  function renderCulture(tripData) {
    CultureView.render('culture-content', tripData);
  }

  // ── Résa tab (data-tab stays "hotels" for #hotels deep links) ─────────────
  function renderHotels(tripData) {
    if (typeof BookingsView !== 'undefined') {
      BookingsView.render('hotels-content', tripData);
      return;
    }
    const container = document.getElementById('hotels-content');
    container.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">📋</div><h3>Réservations indisponibles</h3></div>`;
  }

  // ── Construction tab ──────────────────────────────────────────────────────
  function renderConstruction(tripData) {
    if (typeof ConstructionView !== 'undefined') {
      ConstructionView.render('construction-content', tripData);
      return;
    }
    const container = document.getElementById('construction-content');
    if (container) container.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">🏗️</div><h3>Mode Construction</h3></div>`;
  }

  // ── Plus tab (listes + settings) ──────────────────────────────────────────
  function renderPlus(tripData) {
    const container = document.getElementById('plus-content');

    // If viewing a specific list
    if (currentListId && tripData?.lists?.[currentListId]) {
      const list = tripData.lists[currentListId];
      ListComponent.render('plus-content', list);
      // Pull shared customs + checks; keep pulling while open so peer ticks
      // appear without leaving the list (iPhone resume / wait on same screen).
      if (typeof ListComponent.startPullWhileOpen === 'function') {
        ListComponent.startPullWhileOpen('plus-content', list);
      } else if (typeof ListComponent.pullOnOpen === 'function') {
        ListComponent.pullOnOpen('plus-content', list);
      }
      return;
    }

    if (typeof ListComponent !== 'undefined' && ListComponent.stopPullWhileOpen) {
      ListComponent.stopPullWhileOpen();
    }

    let html = `<div class="page-header"><h1>⚙️ Plus</h1></div>`;

    // ── Lists → Documents → Voyage actif ──
    if (tripData?.lists && Object.keys(tripData.lists).length > 0) {
      html += `<div class="section-title">📋 Listes</div>`;
      Object.entries(tripData.lists).forEach(([id, list]) => {
        Store.rememberListType(id, list.type);
        const checks = Store.getChecks(id);
        let total = 0, checked = 0;
        (list.sections || []).forEach(s => {
          (s.items || []).forEach(it => { total++; if (checks[it.id]?.checked) checked++; });
        });
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
        const typeEmoji = list.type === 'shopping' ? '🛒' : list.type === 'packing' ? '🧳' : '📋';
        const shared = Store.isListShared(id);
        const sync = Store.getSyncState(id);
        const shareHint = sync && sync.state === 'error' ? '⚠️ ' + sync.message
          : sync && sync.state === 'offline' ? '🔌 hors ligne'
          : shared ? '☁️ partagée' : '🔒 locale';
        html += `<div class="trip-item" onclick="App.openList('${escAttr(id)}')">
          <span class="trip-emoji">${typeEmoji}</span>
          <div class="trip-info">
            <div class="trip-name">${esc(list.title)}</div>
            <div class="trip-dates">${checked}/${total} coché${checked !== 1 ? 's' : ''} — ${pct}% · ${shareHint}</div>
          </div>
          <span class="trip-arrow">›</span>
        </div>`;
      });
    }

    // Traveler documents (from people.js) — collapsed by default
    if (typeof BookingsView !== 'undefined' && BookingsView.renderDocumentsCollapsed) {
      html += BookingsView.renderDocumentsCollapsed(tripData);
    }

    // ── Trip selector ──
    html += `<div class="section-title" style="margin-top:24px">🌍 Voyage actif</div>`;
    html += `<div id="plus-trip-selector"></div>`;
    html += `<div id="plus-publish-panel"></div>`;
    html += `<div id="plus-polarsteps-panel"></div>`;
    html += `<div id="plus-leo-chat-stream"></div>`;
    // Replié par défaut au premier rendu ; un re-render légitime (changement de
    // voyage, nouvelles données) restitue l'état choisi par l'utilisateur.
    html += `<div class="section-wrap plus-docs-wrap plus-experimental-wrap" id="plus-experimental-wrap"
      style="margin-top:16px;border:none;background:transparent">
      <div class="section-head${_experimentalOpen ? '' : ' collapsed'} plus-docs-head" id="plus-experimental-head" role="button" tabindex="0"
        aria-expanded="${_experimentalOpen ? 'true' : 'false'}" aria-controls="plus-experimental-body">
        <span class="s-title">🧪 Expérimental</span>
        <span class="s-chevron">▼</span>
      </div>
      <div class="section-body${_experimentalOpen ? '' : ' hidden'} plus-docs-body" id="plus-experimental-body">
        <div id="plus-chat-stream"></div>
        <div id="plus-edge-chat-stream"></div>
        <div style="margin-top:12px;padding:12px;background:var(--card);border-radius:var(--radius)">
          <button class="btn btn-sm" id="plus-nuisance-all" style="width:100%;background:var(--accent);color:#000;font-weight:600">
            ⚠️ Analyse nuisances (tous les hôtels)
          </button>
          <div id="plus-nuisance-result" style="margin-top:8px"></div>
        </div>
      </div>
    </div>`;

    // ── Quiz (only if quiz exists for current trip) ──
    const tripsWithQuiz = []; // add trip ids that ship a questions.json quiz // trips that have a questions.json quiz
    const currentTripId = Store.getCurrentTripId();
    if (tripsWithQuiz.includes(currentTripId)) {
      html += `<div class="section-title" style="margin-top:24px">🧠 Quiz</div>`;
      html += `<a href="quiz.html" class="trip-item" style="text-decoration:none;color:var(--text)">
        <span class="trip-emoji">🧠</span>
        <div class="trip-info">
          <div class="trip-name">Quiz Voyage</div>
          <div class="trip-dates">140 questions · 5 niveaux · Scores par joueur</div>
        </div>
        <span class="trip-arrow">›</span>
      </a>`;
    }

    // ── Install guide (shown only if not already installed) ──
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      html += `<div class="section-title" style="margin-top:24px">📲 Installer l'app</div>`;
      html += `<div class="card" style="padding:16px">`;

      if (_deferredInstallPrompt) {
        // Android/Chrome — native install button
        html += `<p style="color:var(--text);margin:0 0 12px;font-size:.9em">Installe l'app pour un accès rapide depuis l'écran d'accueil 🚀</p>`;
        html += `<button class="btn" style="background:var(--green);color:#000;font-weight:700;width:100%" onclick="App.installPWA()">📲 Installer</button>`;
      } else if (isIOS && isSafari) {
        // iOS Safari — show guide
        html += `<p style="color:var(--text);margin:0 0 12px;font-size:.9em">Pour installer sur iPhone/iPad :</p>`;
        html += `<div style="font-size:.85em;color:var(--muted);line-height:2.2">`;
        html += `<div>1️⃣ Tape l'icône <strong style="color:var(--text);font-size:1.2em">⬆️</strong> (Partager) en bas de Safari</div>`;
        html += `<div>2️⃣ Scroll et tape <strong style="color:var(--text)">“Sur l'écran d'accueil”</strong></div>`;
        html += `<div>3️⃣ Tape <strong style="color:var(--text)">“Ajouter”</strong> — c'est fait ! ✅</div>`;
        html += `</div>`;
      } else if (isIOS && !isSafari) {
        // iOS but not Safari (Chrome, Firefox...)
        html += `<p style="color:var(--orange);margin:0 0 8px;font-size:.9em">⚠️ Ouvre cette page dans <strong>Safari</strong> pour installer !</p>`;
        html += `<p style="color:var(--muted);margin:0;font-size:.82em">Chrome/Firefox sur iOS ne permettent pas l'installation. Copie ce lien et ouvre-le dans Safari :</p>`;
        html += `<div style="margin-top:8px;padding:10px;background:var(--bg);border-radius:8px;font-size:.78em;word-break:break-all;color:var(--sec)">${window.location.origin}</div>`;
        html += `<button class="btn" style="margin-top:10px;background:var(--accent);color:#000;font-weight:600;width:100%" onclick="navigator.clipboard.writeText(window.location.origin);App.showToast('✅ Lien copié !')">📋 Copier le lien</button>`;
      } else if (isAndroid) {
        // Android but no prompt captured yet
        html += `<p style="color:var(--text);margin:0 0 12px;font-size:.9em">Pour installer :</p>`;
        html += `<div style="font-size:.85em;color:var(--muted);line-height:2.2">`;
        html += `<div>1️⃣ Tape le menu <strong style="color:var(--text)">⋮</strong> (3 points) en haut à droite</div>`;
        html += `<div>2️⃣ Tape <strong style="color:var(--text)">“Installer l'application”</strong> ou <strong style="color:var(--text)">“Ajouter à l'écran d'accueil”</strong></div>`;
        html += `</div>`;
      } else {
        // Desktop or unknown
        html += `<p style="color:var(--muted);margin:0;font-size:.85em">Utilise Chrome ou Safari mobile pour installer l'app sur ton téléphone 📱</p>`;
      }

      html += `</div>`;
    }

    // ── App info ──
    const ver = _cachedVersion || { soft: '?', data: '?' };
    const beLabel = _backendVersion
      ? `🖥️ Backend: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(formatBackendVersion(_backendVersion))}</code>`
      : `🖥️ Backend: <code style="font-size:.82em;color:var(--muted)">…</code>`;
    html += `<div class="section-title" style="margin-top:24px">ℹ️ Infos app</div>
      <div class="card"><div style="font-size:.84em;color:var(--muted);line-height:2">
        <div>📱 <strong style="color:var(--text)">Juju's Adventures</strong> — PWA offline-first</div>
        <div id="tripkit-version-info">🏷️ Soft: <code style="font-size:.82em;color:var(--sec);font-weight:600">v${esc(ver.soft)}</code> · Data: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(ver.data)}</code> · Cache: <code style="font-size:.82em;color:var(--sec)">${ver.cache || '?'}</code></div>
        <div id="tripkit-backend-info">${beLabel}</div>
        <div>💾 Device: <code style="font-size:.78em;color:var(--sec)">${Store.getDeviceId()}</code></div>
        <div id="tripkit-connectivity">🌐 …</div>
      </div></div>`;

    html += `<div class="btn-row" style="margin-top:12px;gap:8px;flex-direction:column">
      <button class="btn" style="background:var(--accent);color:#000;font-weight:700;width:100%" onclick="App.updateApp()">
        🚀 Mettre à jour l'app
      </button>
      <div style="display:flex;gap:8px">
        <button class="btn" style="background:var(--sec);color:#000;font-weight:600;flex:1" onclick="App.clearCache()">🔄 Vider cache</button>
        <button class="btn" style="flex:1;background:#f85149;color:#fff;font-weight:600" onclick="App.confirmClearData()">🗑️ Effacer données</button>
      </div>
      <p style="font-size:.78em;color:var(--muted);margin:8px 0 0;line-height:1.4">
        «&nbsp;Vider cache&nbsp;» n’efface pas le modèle hors-ligne (OPFS).
        «&nbsp;Effacer données&nbsp;» le supprime aussi.
      </p>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 12px;background:var(--card);border-radius:var(--radius)">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;color:var(--text);font-size:.85em">
          <input type="checkbox" id="nocache-toggle" ${localStorage.getItem('tripkit_nocache') === '1' ? 'checked' : ''} onchange="App.toggleNoCache(this.checked)" style="width:18px;height:18px">
          🛠️ Mode dev (pas de cache images)
        </label>
      </div>
      <div id="construction-mode-toggle-wrap" style="display:none;align-items:center;gap:10px;margin-top:8px;padding:10px 12px;background:var(--card);border-radius:var(--radius)">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;color:var(--text);font-size:.85em">
          <input type="checkbox" id="construction-toggle" ${Store.get('tk-construction-mode') ? 'checked' : ''} onchange="App.toggleConstructionMode(this.checked)" style="width:18px;height:18px">
          🏗️ Mode construction
        </label>
      </div>
    </div>`;

    container.innerHTML = html;

    if (typeof BookingsView !== 'undefined' && BookingsView.bindDocumentsCollapse) {
      BookingsView.bindDocumentsCollapse(container);
    }
    bindExperimentalCollapse(container);
    bindPlusNuisanceButton();

    // Trip list first, then GH publish (uses Store trips to mark « my » families).
    const selectorEl = document.getElementById('plus-trip-selector');
    const tripsReady = selectorEl && typeof TripSelector !== 'undefined'
      ? Promise.resolve(TripSelector.render(selectorEl))
      : Promise.resolve();

    const publishEl = document.getElementById('plus-publish-panel');
    if (publishEl && typeof PublishPanel !== 'undefined') {
      tripsReady.then(() => PublishPanel.loadSources()).then(() => {
        PublishPanel.renderSection(publishEl);
        PublishPanel.resumeIfNeeded();
        const cWrap = document.getElementById('construction-mode-toggle-wrap');
        if (cWrap && PublishPanel.sources && PublishPanel.sources().length > 0) {
          cWrap.style.display = 'flex';
        }
      });
    }

    const polarstepsEl = document.getElementById('plus-polarsteps-panel');
    if (polarstepsEl && typeof PolarstepsPanel !== 'undefined') {
      PolarstepsPanel.loadStatus().then(() => PolarstepsPanel.renderSection(polarstepsEl));
    }

    // Order: Polarsteps → Léo → Bifrost → Local (edge)
    // Those three sections live in bundle-edge, which is kept off the boot path:
    // render straight away when it is already there, otherwise fetch it first.
    if (edgeBundleLoaded()) renderEdgeSections();
    else ensureEdgeBundle().then(ok => { if (ok) renderEdgeSections(); else renderEdgeFallback(); });

    // If /health hasn't resolved yet (or failed earlier), retry now that the
    // Plus DOM exists — paintBackendVersion will fill #tripkit-backend-info.
    if (!_backendVersion) fetchBackendVersion();
    paintConnectivity();
    if (typeof API !== 'undefined' && API.probe) API.probe().then(() => paintConnectivity());
  }

  // ── bundle-edge : chargement à la demande ─────────────────────────────────
  // Léo / Bifrost / Local (appareil) et le moteur d'IA locale ne servent qu'à
  // l'onglet Plus : bundle-edge n'est donc pas dans index.html, il est injecté
  // ici au premier besoin. Le service worker le précache quand même, pour que le
  // shell reste complet hors ligne une fois mis en cache.
  function edgeBundleLoaded() {
    return typeof EdgeChatStream !== 'undefined';
  }

  // Plafond d'attente du chargement de bundle-edge. `onerror` couvre l'échec net
  // (DNS, 404, abort) mais PAS la requête qui pend : sur un réseau capté sans
  // sortie (portail WiFi, 3G morte), un <script> peut rester en attente sans
  // jamais déclencher le moindre événement. Le plafond vaut donc pour tous les
  // appelants — rendu de l'onglet Plus comme « Effacer données ».
  const EDGE_BUNDLE_TIMEOUT_MS = 5000;

  // Resolves true when the bundle is available, false when its load failed or
  // timed out. Never rejects and never throws: sans bundle-edge, le reste de
  // l'onglet Plus doit continuer à fonctionner. Un échec remet la promesse à null
  // pour qu'un rendu ultérieur — ou le bouton « Réessayer » — puisse retenter.
  function ensureEdgeBundle() {
    if (edgeBundleLoaded()) return Promise.resolve(true);
    if (_edgeBundlePromise) return _edgeBundlePromise;
    _edgeBundlePromise = new Promise(resolve => {
      const s = document.createElement('script');
      // Same cache-busting semantics as the tags rewritten by the Dockerfile:
      // version.json is served no-store, so ?v=<cache> follows each release.
      const cache = _cachedVersion && _cachedVersion.cache;
      const query = [];
      if (cache) query.push('v=' + cache);
      // Après un essai raté, la requête précédente peut être encore EN ATTENTE
      // (réseau qui pend) : le navigateur rattacherait le nouveau <script> à
      // cette requête morte plutôt que d'en ouvrir une neuve, et « Réessayer »
      // ne servirait à rien. Le numéro d'essai rend l'URL unique. Le service
      // worker sait quand même la servir hors ligne (matchShell → ignoreSearch).
      _edgeBundleAttempt += 1;
      if (_edgeBundleAttempt > 1) query.push('r=' + _edgeBundleAttempt);
      s.src = 'js/dist/bundle-edge.js' + (query.length ? '?' + query.join('&') : '');
      // Volontairement PAS `s.async = false` : l'ordre d'exécution n'a rien à
      // ordonner (bundle-edge est un seul fichier autonome, ses 7 sources sont
      // déjà concaténées dans le bon ordre par le build), alors qu'un script
      // injecté avec async=false rejoint la liste « à exécuter dans l'ordre » —
      // une première requête qui pend y bloquerait indéfiniment l'exécution du
      // script du « Réessayer ».

      let settled = false;
      const settle = (ok) => {
        if (settled) return; // un onload tardif après le plafond ne rejoue rien
        settled = true;
        clearTimeout(timer);
        if (!ok) {
          _edgeBundlePromise = null; // allow a retry on the next render
          // Le <script> abandonné ne sert plus à rien : on ne le laisse pas en
          // travers du prochain essai.
          if (s.parentNode) s.parentNode.removeChild(s);
        }
        resolve(ok);
      };
      // Sans ce plafond, une requête qui pend laisse la promesse en suspens pour
      // toujours : Léo / Bifrost / Local restent vides et le repli « Réessayer »
      // n'est jamais rendu, puisque personne ne reçoit `false`.
      const timer = setTimeout(() => settle(false), EDGE_BUNDLE_TIMEOUT_MS);
      s.onload = () => settle(true);
      s.onerror = () => settle(false);
      document.head.appendChild(s);
    });
    return _edgeBundlePromise;
  }

  // Échec de chargement (net ou par dépassement du plafond) : les trois <div>
  // resteraient vides, ce qui se lit comme un onglet cassé plutôt que dégradé. On
  // affiche donc un état explicite avec un bouton « Réessayer » — indispensable
  // depuis que la reprise d'app ne repeint plus l'onglet Plus : sans lui, il
  // faudrait ressortir de l'onglet pour retenter.
  function renderEdgeFallback() {
    const leoEl = document.getElementById('plus-leo-chat-stream');
    const target = leoEl || document.getElementById('plus-chat-stream');
    if (!target) return;
    const others = ['plus-chat-stream', 'plus-edge-chat-stream']
      .map(id => document.getElementById(id))
      .filter(el => el && el !== target);
    others.forEach(el => { el.innerHTML = ''; });

    target.innerHTML = `<div class="card" style="padding:14px" id="plus-edge-fallback">
      <div style="font-size:.9em;color:var(--orange);font-weight:600;margin-bottom:6px">⚠️ Assistants indisponibles</div>
      <p style="font-size:.82em;color:var(--muted);margin:0 0 10px;line-height:1.5">
        Léo, Bifrost et l'IA locale n'ont pas pu être chargés (réseau ou cache incomplet).
        Le reste de l'onglet fonctionne normalement.
      </p>
      <button type="button" class="btn" id="plus-edge-retry"
        style="background:var(--sec);color:#000;font-weight:600">🔄 Réessayer</button>
    </div>`;

    const btn = document.getElementById('plus-edge-retry');
    if (btn) btn.onclick = () => {
      btn.disabled = true;
      btn.textContent = '⏳ Chargement…';
      retryEdgeBundle();
    };
  }

  // Rejoue l'injection après un échec : ensureEdgeBundle a déjà remis sa promesse
  // à null, il suffit donc de la rappeler.
  function retryEdgeBundle() {
    return ensureEdgeBundle().then(ok => {
      if (ok) renderEdgeSections();
      else renderEdgeFallback();
      return ok;
    });
  }

  // Idempotent: the Plus tab re-renders often, so the elements are re-queried
  // every time and each global keeps its typeof guard.
  function renderEdgeSections() {
    const leoStreamEl = document.getElementById('plus-leo-chat-stream');
    if (leoStreamEl && typeof LeoChatStream !== 'undefined') {
      LeoChatStream.loadStatus().then(() => LeoChatStream.renderSection(leoStreamEl));
    }

    const plusChatEl = document.getElementById('plus-chat-stream');
    if (plusChatEl && typeof PlusChatStream !== 'undefined') {
      PlusChatStream.loadStatus().then(() => PlusChatStream.renderSection(plusChatEl));
    }

    const edgeChatEl = document.getElementById('plus-edge-chat-stream');
    if (edgeChatEl && typeof EdgeChatStream !== 'undefined') {
      EdgeChatStream.renderSection(edgeChatEl);
    }
  }

  function bindExperimentalCollapse(root) {
    const head = (root || document).querySelector('#plus-experimental-head');
    const body = (root || document).querySelector('#plus-experimental-body');
    if (!head || !body || head.dataset.bound === '1') return;
    head.dataset.bound = '1';
    const toggle = () => {
      const open = body.classList.toggle('hidden') === false;
      head.classList.toggle('collapsed', !open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      _experimentalOpen = open; // survit au prochain rendu de l'onglet Plus
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }

  function bindPlusNuisanceButton() {
    const btn = document.getElementById('plus-nuisance-all');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      const tripId = Store.getCurrentTripId();
      if (!tripId) return;
      const resultEl = document.getElementById('plus-nuisance-result');

      btn.disabled = true;
      btn.textContent = '...';

      const res = await API.runNuisanceCheck(tripId, null);

      btn.disabled = false;
      btn.textContent = '⚠️ Analyse nuisances (tous les hôtels)';

      if (!res.ok) {
        if (resultEl) resultEl.innerHTML = `<div class="construction-error" style="font-size:.82em">${esc(res.error || 'Erreur')}</div>`;
        return;
      }

      if (_nuisanceAbort) _nuisanceAbort.abort();
      const ac = new AbortController();
      _nuisanceAbort = ac;

      await NuisanceStream.start(resultEl, {
        tripId,
        data: res.data,
        signal: ac.signal,
        compact: true,
      });
    });
  }

  function formatBackendVersion(v) {
    const s = String(v || '');
    return s.startsWith('v') ? s : 'v' + s;
  }

  function paintBackendVersion() {
    if (!_backendVersion) return;
    const el = document.getElementById('tripkit-backend-info');
    if (!el) return;
    el.innerHTML = `🖥️ Backend: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(formatBackendVersion(_backendVersion))}</code>`;
  }

  /** Fetch GET /health once, cache APP_VERSION, paint Plus tab if visible. */
  function fetchBackendVersion() {
    if (!navigator.onLine) return Promise.resolve(null);
    if (_backendVersion) {
      paintBackendVersion();
      return Promise.resolve(_backendVersion);
    }
    if (_backendVersionFetch) return _backendVersionFetch;
    const baseUrl = (typeof API !== 'undefined' && API.getBaseUrl) ? API.getBaseUrl() : window.location.origin;
    _backendVersionFetch = fetch(baseUrl + '/health', { signal: AbortSignal.timeout(3000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.version) {
          _backendVersion = data.version;
          paintBackendVersion();
        }
        return _backendVersion;
      })
      .catch(() => null)
      .finally(() => { _backendVersionFetch = null; });
    return _backendVersionFetch;
  }

  function openList(listId) {
    currentListId = listId;
    window.location.hash = 'plus/listes/' + listId;
  }

  function selectTrip(tripId) {
    Store.setCurrentTripId(tripId);
    currentListId = null;
    currentDayIndex = 0;

    // Do NOT purge local cache before fetch — offline / flaky backend must keep
    // the previous seed. Successful loadTripSeed merges over it.
    tripData = Store.getTripData(tripId) || {};
    switchTab('programme');
    if (tripData && tripData.days && tripData.days.length) {
      renderCurrentTab();
      showToast('✅ Voyage sélectionné');
    } else {
      showToast('✅ Chargement…');
    }
    refreshFromBackend();
  }

  function updateApp() {
    showToast('🔄 Mise à jour en cours…');
    // 1. Unregister service worker to force fresh install
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        const promises = regs.map(r => r.unregister());
        Promise.all(promises).then(() => {
          // 2. Clear all caches
          if ('caches' in window) {
            caches.keys().then(names => {
              return Promise.all(names.map(name => caches.delete(name)));
            }).then(() => {
              // 3. Hard reload
              showToast('✅ Cache vidé — rechargement…');
              setTimeout(() => window.location.reload(true), 500);
            });
          } else {
            window.location.reload(true);
          }
        });
      });
    } else {
      // No SW — just hard reload
      window.location.reload(true);
    }
  }

  function confirmClearData() {
    if (!confirm('⚠️ Effacer les données locales ?\nLes données voyage seront retéléchargées.\nLe modèle hors-ligne (OPFS) sera aussi supprimé.')) return;
    const afterPurge = () => {
      // Remove cached versions so next reload forces a fresh backend fetch
      // but do NOT wipe tripkit-trips or user-id — just version markers
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('tripkit-version-') || k.endsWith('-data-version') || k.startsWith('tripkit-trip-')) {
          localStorage.removeItem(k);
        }
      });
      // Also clear SW cache (Cache API only — OPFS already purged above)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => location.reload(true));
    };
    // Edge GGUF lives in OPFS — must purge explicitly (clearCache does NOT).
    // The model can survive in OPFS from an earlier session, so bundle-edge is
    // loaded on demand here rather than skipping the purge when it is absent.
    // ensureEdgeBundle est borné par EDGE_BUNDLE_TIMEOUT_MS : cet appel ne peut
    // donc pas rester bloqué, mais il peut échouer.
    ensureEdgeBundle().then(ok => {
      if (ok && typeof EdgeEngine !== 'undefined' && EdgeEngine.purge) {
        Promise.resolve(EdgeEngine.purge()).catch(() => {}).then(afterPurge);
        return;
      }
      // Sans bundle-edge, EdgeEngine.purge est hors de portée : le modèle OPFS
      // survivrait à l'effacement alors que le premier dialogue vient de promettre
      // sa suppression. Et « ce sera purgé au prochain essai » ne tient pas : le
      // prochain essai a besoin du réseau, précisément ce qui manque ici. On dit
      // donc la vérité et on laisse l'utilisateur choisir.
      if (!confirm('⚠️ Le modèle hors-ligne (OPFS) n\'a pas pu être supprimé : ses outils de suppression n\'ont pas pu être chargés (réseau indisponible).\n\nEffacer quand même les autres données locales ?\nLe modèle restera sur l\'appareil ; réessaie avec du réseau pour t\'en débarrasser.')) return;
      afterPurge();
    });
  }

  // ── Swipe navigation (programme tab) ──────────────────────────────────────
  function setupSwipe() {
    let touchStartX = 0, touchStartY = 0;
    const container = document.getElementById('programme-content');
    if (!container) return;
    container.style.touchAction = 'pan-y'; // allow vertical scroll, intercept horizontal
    container.addEventListener('touchstart', e => {
      if (currentTab !== 'programme') return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    container.addEventListener('touchend', e => {
      if (currentTab !== 'programme') return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].screenY - touchStartY);
      // Only trigger if horizontal swipe > 60px and more horizontal than vertical (1.5x ratio)
      if (Math.abs(dx) > 60 && Math.abs(dx) > dy * 1.5) {
        const tripId = Store.getCurrentTripId();
        const tripData = tripId ? Store.getTripData(tripId) : null;
        if (!tripData) return;
        if (dx < 0 && currentDayIndex < tripData.days.length - 1) {
          goToDay(currentDayIndex + 1);
        } else if (dx > 0 && currentDayIndex > 0) {
          goToDay(currentDayIndex - 1);
        }
      }
    }, { passive: true });
  }

  // ── Clear cache (reload button) ───────────────────────────────────────────
  // Cache API + SW only. Does NOT touch OPFS edge model (SPEC-edge-model.md).
  function clearCache() {
    if (!confirm('Vider le cache et recharger ?\n(Le modèle hors-ligne OPFS est conservé.)')) return;
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => location.reload(true));
  }

  // ── Loading state (first visit) ──────────────────────────────────────────
  function showLoading() {
    const el = document.getElementById('programme-content');
    if (el) el.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">\u23f3</div>
      <h3>Chargement du voyage...</h3>
      <p style="color:var(--muted)">Premi\u00e8re connexion au serveur</p>
    </div>`;
  }

  function showOffline() {
    const el = document.getElementById('programme-content');
    if (!el) return;
    const stuck = Store.getCurrentTripId();
    el.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">\u26a0\ufe0f</div>
      <h3>Impossible de charger le voyage</h3>
      <p style="color:var(--muted);max-width:28em;margin:0 auto 12px">
        Le serveur n'a renvoy\u00e9 aucune donn\u00e9e (voyage local p\u00e9rim\u00e9, token, session Authelia, ou aucun voyage accessible).
        ${stuck ? `<br><code style="font-size:.8em">tk-current-trip=${esc(stuck)}</code>` : ''}
      </p>
      <p style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px">
        <button type="button" class="btn" id="tk-boot-retry" style="background:var(--accent);color:#000;font-weight:700">R\u00e9essayer</button>
        <button type="button" class="btn" id="tk-boot-reset-local" style="background:var(--sec);color:#000;font-weight:600">R\u00e9initialiser le local</button>
      </p>
    </div>`;
    const retry = document.getElementById('tk-boot-retry');
    if (retry) retry.onclick = () => location.reload();
    const resetBtn = document.getElementById('tk-boot-reset-local');
    if (resetBtn) {
      resetBtn.onclick = () => {
        try {
          if (typeof API !== 'undefined' && API.clearToken) API.clearToken();
          else localStorage.removeItem('tk-api-token');
          localStorage.removeItem('tk-user-name');
          localStorage.removeItem('tk-user-role');
          const cur = localStorage.getItem('tk-current-trip');
          if (cur) {
            localStorage.removeItem('tk-current-trip');
            localStorage.removeItem(cur + '-data-version');
            localStorage.removeItem('tk-trip-' + cur);
            localStorage.removeItem('tk-seed-loaded-' + cur);
          }
        } catch (_) { /* ignore */ }
        location.reload();
      };
    }
  }

  function showToast(msg, type = 'success') {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    // One toast at a time — avoid stacking that fills the screen.
    wrap.replaceChildren();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    wrap.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode === wrap) toast.remove();
      }, 300);
    }, 2200);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) {
    return String(s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  // ── Public API ────────────────────────────────────────────────────────────
  // ── PWA Install (Android/Chrome native prompt) ────────────────────────
  async function installPWA() {
    if (!_deferredInstallPrompt) {
      showToast('⚠️ Installation non disponible');
      return;
    }
    _deferredInstallPrompt.prompt();
    const result = await _deferredInstallPrompt.userChoice;
    if (result.outcome === 'accepted') {
      showToast('✅ App installée !');
    }
    _deferredInstallPrompt = null;
  }

  // ── No-cache toggle (dev mode) ────────────────────────────────────
  function toggleNoCache(enabled) {
    if (enabled) {
      localStorage.setItem('tripkit_nocache', '1');
      showToast('🛠️ Mode dev activé — images sans cache');
    } else {
      localStorage.removeItem('tripkit_nocache');
      showToast('✅ Cache normal réactivé');
    }
  }

  function paintConstructionNav() {
    const btn = document.getElementById('nav-construction');
    if (!btn) return;
    const enabled = !!Store.get('tk-construction-mode');
    btn.style.display = enabled ? '' : 'none';
  }

  function toggleConstructionMode(checked) {
    Store.set('tk-construction-mode', !!checked);
    paintConstructionNav();
    if (checked) {
      showToast('🏗️ Mode construction activé');
    } else {
      showToast('✅ Mode construction désactivé');
      if (currentTab === 'construction') {
        switchTab('programme');
        return;
      }
    }
    renderCurrentTab();
  }

  return {
    switchTab,
    openList,
    selectTrip,
    goToDay,
    showToast,
    reloadAllViews,
    confirmClearData,
    updateApp,
    clearCache,
    installPWA,
    toggleNoCache,
    paintConstructionNav,
    toggleConstructionMode,
    ensureEdgeBundle,
  };
})();
