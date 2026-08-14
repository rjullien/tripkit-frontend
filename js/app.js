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

  // ── PWA Install prompt capture (Android/Chrome) ─────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
  });

  // ── Magic Link Auth ────────────────────────────────────────────────────────
  async function handleMagicLink() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    // Exchange magic token for JWT via backend
    try {
      const baseUrl = (typeof TRIPKIT_CONFIG !== 'undefined' && TRIPKIT_CONFIG.apiUrl &&
                       TRIPKIT_CONFIG.apiUrl !== '${API_URL}')
        ? TRIPKIT_CONFIG.apiUrl.replace(/\/$/, '') : window.location.origin;

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

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
          return;
        }
      }

      // Token invalid/expired — show error
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      showAuthError(err.error || 'Lien invalide ou expir\u00e9');
    } catch (e) {
      console.error('[Auth] Magic link error:', e);
      showAuthError('Erreur de connexion au serveur');
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
    window.addEventListener('tripkit-sync-done', () => {
      // Don't auto-re-render while user is on the list (causes tap misses).
      // Only re-render if on the Plus tab but NOT viewing a specific list.
      if (currentTab === 'plus' && !currentListId) {
        renderCurrentTab();
      }
    });

    // Magic link: intercept ?token=xxx in URL → exchange for JWT
    await handleMagicLink();

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

    const tripId = Store.getCurrentTripId();
    if (tripId && Store.getTripData(tripId)) {
      // Has cached data → render instantly, refresh in background
      handleHash();
      refreshFromBackend();
    } else {
      // First visit — show loading, fetch from backend, then render
      showLoading();
      await refreshFromBackend();

      // Check if we got data — if not, show offline message
      const newTripId = Store.getCurrentTripId();
      if (!newTripId || !Store.getTripData(newTripId)) {
        showOffline();
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
   * Fetch seed for tripId; returns true if local trip data is usable afterwards.
   * Network failure never invalidates a good local cache.
   */
  async function loadTripSeed(tripId) {
    const hasLocal = !!Store.getTripData(tripId);
    const verRes = await API.checkVersionStatus(tripId);
    if (!verRes.ok || !verRes.data) {
      console.debug('[App] Version check failed for', tripId, verRes.status || verRes.error);
      // Keep current trip usable offline / when backend is flaky
      return hasLocal;
    }
    const ver = verRes.data;

    const cachedVersion = Store.get(tripId + '-data-version');
    // Skip network seed only when we already have local data AND same version.
    // A leftover *-data-version without tk-trip-* must NOT skip (boot would stall).
    if (hasLocal && cachedVersion && String(cachedVersion) === String(ver.version)) {
      console.debug('[App] Data up to date (v' + ver.version + ') — skip refresh');
      return true;
    }

    console.log('[App] Fetching seed:', tripId, 'version', cachedVersion, '→', ver.version);
    const seed = await API.fetchSeed(tripId);
    if (!seed) return hasLocal;

    const tripData = SeedMerge.merge(seed, Store.getTripData(tripId) || {});
    Store.registerTrip(tripId);
    Store.setCurrentTripId(tripId);
    Store.markSeedLoaded(tripId);
    Store.setTripData(tripId, tripData);
    Store.set(tripId + '-data-version', ver.version);
    console.log('[App] Backend data refreshed:', tripId, tripData.days?.length, 'days, version:', ver.version);
    if (typeof API.warmTripAssets === 'function') API.warmTripAssets(tripId, tripData);
    return true;
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

  async function refreshFromBackend() {
    // Prefer a real probe when the device claims to be online
    if (navigator.onLine && typeof API !== 'undefined' && API.probe) {
      const up = await API.probe();
      if (!up) {
        // Stay on cache — do not rediscover / wipe
        if (typeof API.flushOutbox === 'function') API.flushOutbox();
        return;
      }
    } else if (!navigator.onLine) {
      return;
    }

    // Drop deleted / ACL-lost trips from local registry (BE success only).
    await reconcileTripRegistry();

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

      if (ok || Store.getTripData(tripId)) renderCurrentTab();
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

  /** Resume when network is really back (probe), not merely navigator.onLine. */
  function setupConnectivityResume() {
    let _resumeTimer = null;
    const kick = () => {
      clearTimeout(_resumeTimer);
      _resumeTimer = setTimeout(async () => {
        if (typeof API === 'undefined') return;
        const up = await API.probe();
        paintConnectivity();
        if (!up) return;
        await refreshFromBackend();
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
    window.addEventListener('online', kick);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') kick();
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

    if (['programme', 'route', 'culture', 'hotels', 'plus'].includes(tab)) {
      _updateTabUI(tab);
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

  // ── Tab switching ─────────────────────────────────────────────────────────
  function switchTab(tab) {
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
    html += `<div id="plus-leo-chat-stream"></div>`;
    html += `<div class="section-wrap plus-docs-wrap plus-experimental-wrap" id="plus-experimental-wrap"
      style="margin-top:16px;border:none;background:transparent">
      <div class="section-head collapsed plus-docs-head" id="plus-experimental-head" role="button" tabindex="0"
        aria-expanded="false" aria-controls="plus-experimental-body">
        <span class="s-title">🧪 Expérimental</span>
        <span class="s-chevron">▼</span>
      </div>
      <div class="section-body hidden plus-docs-body" id="plus-experimental-body">
        <div id="plus-chat-stream"></div>
        <div id="plus-edge-chat-stream"></div>
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
    </div>`;

    container.innerHTML = html;

    if (typeof BookingsView !== 'undefined' && BookingsView.bindDocumentsCollapse) {
      BookingsView.bindDocumentsCollapse(container);
    }
    bindExperimentalCollapse(container);

    // Render TripSelector into its placeholder, then GH seeds (needs Store trips).
    const selectorEl = document.getElementById('plus-trip-selector');
    const tripsReady = selectorEl && typeof TripSelector !== 'undefined'
      ? Promise.resolve(TripSelector.render(selectorEl))
      : Promise.resolve();

    const publishEl = document.getElementById('plus-publish-panel');
    if (publishEl && typeof PublishPanel !== 'undefined') {
      tripsReady.then(() => PublishPanel.loadSources()).then(() => {
        if (selectorEl && typeof TripSelector !== 'undefined') TripSelector.render(selectorEl);
        PublishPanel.renderSection(publishEl);
        PublishPanel.resumeIfNeeded();
      });
    }

    // Order: Léo → Bifrost → Local (edge)
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

    // If /health hasn't resolved yet (or failed earlier), retry now that the
    // Plus DOM exists — paintBackendVersion will fill #tripkit-backend-info.
    if (!_backendVersion) fetchBackendVersion();
    paintConnectivity();
    if (typeof API !== 'undefined' && API.probe) API.probe().then(() => paintConnectivity());
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
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
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
    if (typeof EdgeEngine !== 'undefined' && EdgeEngine.purge) {
      Promise.resolve(EdgeEngine.purge()).catch(() => {}).then(afterPurge);
    } else {
      afterPurge();
    }
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
  };
})();
