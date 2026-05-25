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

    // Fetch backend version (non-blocking)
    if (navigator.onLine) {
      const baseUrl = (typeof API !== 'undefined' && API.getBaseUrl) ? API.getBaseUrl() : window.location.origin;
      fetch(baseUrl + '/health', { signal: AbortSignal.timeout(3000) })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.version) {
            const el = document.getElementById('tripkit-backend-info');
            if (el) el.innerHTML = `🖥️ Backend: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(data.version.startsWith('v') ? data.version : 'v' + data.version)}</code>`;
          }
        })
        .catch(() => {});
    }

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
  }

  // ── No static seed — data comes from backend, cached in localStorage ─────
  // First visit: backend fetch → localStorage. Subsequent visits: localStorage cache.
  // Offline after first visit: works from cache. Never-visited + offline: empty state shown.

  // ── Backend refresh (version-gated, data decoupled from code) ─────────────
  async function refreshFromBackend() {
    if (!navigator.onLine) return;

    // Resolve trip ID: cached or from config (first visit)
    let tripId = Store.getCurrentTripId();
    if (!tripId) {
      // First visit — resolve default trip
      // 1. From Docker config
      if (typeof TRIPKIT_CONFIG !== 'undefined' && TRIPKIT_CONFIG.defaultTripId &&
          TRIPKIT_CONFIG.defaultTripId !== '${DEFAULT_TRIP_ID}') {
        tripId = TRIPKIT_CONFIG.defaultTripId;
      } else {
        // 2. Ask backend for first available trip
        const trips = await API.getTrips();
        if (trips && trips.length) tripId = trips[0].id;
      }
      if (!tripId) return; // No trips anywhere — nothing to load
    }

    try {
      // Step 1: Lightweight version check (3s timeout, ~50 bytes)
      const ver = await API.checkVersion(tripId);
      if (!ver) {
        console.debug('[App] Version check skipped (offline/slow/unavailable)');
        // Still sync list check states if possible
        if (typeof API !== 'undefined') API.backgroundSyncTrip(tripId);
        return;
      }

      // Step 2: Compare with cached version
      const cachedVersion = Store.get(tripId + '-data-version');
      if (cachedVersion && String(cachedVersion) === String(ver.version)) {
        console.debug('[App] Data up to date (v' + ver.version + ') — skip refresh');
        if (typeof API !== 'undefined') API.backgroundSyncTrip(tripId);
        return;
      }

      console.log('[App] Data version changed:', cachedVersion, '→', ver.version, '— fetching...');

      // Step 3: Full seed fetch (only on version change)
      const seed = await API.fetchSeed(tripId);
      if (!seed) return;

      const tripData = Store.getTripData(tripId) || {};

      // Days: backend stores each day as {day_num, data:{...}}
      if (seed.days && seed.days.length) {
        tripData.days = seed.days.map(d => {
          const raw = d.data;
          return typeof raw === 'string' ? JSON.parse(raw) : (raw || d);
        }).filter(d => d.label && d.label !== '_deleted')
          .sort((a, b) => (a.day || 0) - (b.day || 0));
      }

      // Trip metadata
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
        // Restaurants and culture may be in trip.data
        if (extra.restaurants) tripData.restaurants = extra.restaurants;
        if (extra.culture) tripData.culture = extra.culture;
        if (extra.hotels) {
          // Normalize array format [{id, ...}] to dict {id: {...}} for HotelCard.fromDay()
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

      // Hotels: merge into days by day_num
      if (seed.hotels && seed.hotels.length) {
        seed.hotels.forEach(h => {
          const hData = typeof h.data === 'string' ? JSON.parse(h.data) : (h.data || {});
          const day = tripData.days?.find(d => d.day === h.day_num);
          if (day) Object.assign(day, hData);
        });
      }

      // Lists: backend lists override seed lists (structure only, not check state)
      if (seed.lists && seed.lists.length) {
        tripData.lists = tripData.lists || {};
        seed.lists.forEach(l => {
          const lData = typeof l.data === 'string' ? JSON.parse(l.data) : (l.data || {});
          tripData.lists[l.id] = {
            id: l.id,
            type: l.type,
            title: l.title,
            ...lData,
          };
        });
      }

      // Register trip if first visit
      if (!Store.getCurrentTripId()) {
        Store.registerTrip(tripId);
        Store.setCurrentTripId(tripId);
        Store.markSeedLoaded(tripId);
      }
      Store.setTripData(tripId, tripData);

      // Save version to skip future unnecessary fetches
      Store.set(tripId + '-data-version', ver.version);
      console.log('[App] Backend data refreshed:', tripId, tripData.days?.length, 'days, version:', ver.version);

      // Re-render with fresh data
      renderCurrentTab();
    } catch (e) {
      console.debug('[App] Backend refresh failed (using cached):', e.message);
    }

    // Also sync list check states
    if (typeof API !== 'undefined') {
      API.backgroundSyncTrip(tripId);
    }
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

  // ── Hotels tab ────────────────────────────────────────────────────────────
  function renderHotels(tripData) {
    const container = document.getElementById('hotels-content');
    if (!tripData || !tripData.days) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🏨</div><h3>Aucun hébergement</h3></div>`;
      return;
    }

    let html = `<div class="page-header">
      <h1>🏨 Hébergements</h1>
      <div class="sub">${tripData.trip ? esc(tripData.trip.name) : ''}</div>
    </div>`;

    const seen = new Set();
    tripData.days.map(d => DayHelpers.enrich(d, tripData)).forEach(day => {
      // Normalized: hotelId ref. Legacy: day.hotel inline.
      const key = day.hotelId || day.hotel;
      if (!key || key === '—' || key === '') return;
      if (seen.has(key)) return;
      seen.add(key);
      const hotelData = HotelCard.fromDay(day, tripData.hotels);
      if (hotelData) {
        html += `<div style="font-size:.75em;color:var(--muted);margin:14px 0 4px 4px">
          Jour ${day.day + 1} · ${esc(day.date || '')} — ${esc(day.to || day.from || '')}</div>`;
        html += HotelCard.render(hotelData);
      }
    });

    if (seen.size === 0) {
      html += `<div class="empty-state"><div class="empty-emoji">🏨</div><h3>Aucun hébergement</h3></div>`;
    }

    container.innerHTML = html;
  }

  // ── Plus tab (listes + settings) ──────────────────────────────────────────
  function renderPlus(tripData) {
    const container = document.getElementById('plus-content');

    // If viewing a specific list
    if (currentListId && tripData?.lists?.[currentListId]) {
      ListComponent.render('plus-content', tripData.lists[currentListId]);
      return;
    }

    let html = `<div class="page-header"><h1>⚙️ Plus</h1></div>`;

    // ── Lists section ──
    if (tripData?.lists && Object.keys(tripData.lists).length > 0) {
      html += `<div class="section-title">📋 Listes</div>`;
      Object.entries(tripData.lists).forEach(([id, list]) => {
        const checks = Store.getChecks(id);
        let total = 0, checked = 0;
        (list.sections || []).forEach(s => {
          (s.items || []).forEach(it => { total++; if (checks[it.id]?.checked) checked++; });
        });
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
        const typeEmoji = list.type === 'shopping' ? '🛒' : list.type === 'packing' ? '🧳' : '📋';
        html += `<div class="trip-item" onclick="App.openList('${escAttr(id)}')">
          <span class="trip-emoji">${typeEmoji}</span>
          <div class="trip-info">
            <div class="trip-name">${esc(list.title)}</div>
            <div class="trip-dates">${checked}/${total} coché${checked !== 1 ? 's' : ''} — ${pct}%</div>
          </div>
          <span class="trip-arrow">›</span>
        </div>`;
      });
    }

    // ── Checklist valise (standalone page) ──
    html += `<div class="section-title" style="margin-top:24px">🧳 Valise</div>`;
    html += `<a href="checklist.html" class="trip-item" style="text-decoration:none;color:var(--text)">
      <span class="trip-emoji">🧳</span>
      <div class="trip-info">
        <div class="trip-name">Checklist Valise interactive</div>
        <div class="trip-dates">Par personne · Progression sauvegardée</div>
      </div>
      <span class="trip-arrow">›</span>
    </a>`;

    // ── Quiz (only if quiz exists for current trip) ──
    const tripsWithQuiz = ['usa-2026']; // trips that have a questions.json quiz
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

    // ── Trip selector ──
    html += `<div class="section-title" style="margin-top:24px">🌍 Voyage actif</div>`;
    html += `<div id="plus-trip-selector"></div>`;

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
    html += `<div class="section-title" style="margin-top:24px">ℹ️ Infos app</div>
      <div class="card"><div style="font-size:.84em;color:var(--muted);line-height:2">
        <div>📱 <strong style="color:var(--text)">Juju's Adventures</strong> — PWA offline-first</div>
        <div id="tripkit-version-info">🏷️ Soft: <code style="font-size:.82em;color:var(--sec);font-weight:600">v${esc(ver.soft)}</code> · Data: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(ver.data)}</code> · Cache: <code style="font-size:.82em;color:var(--sec)">${ver.cache || '?'}</code></div>
        <div id="tripkit-backend-info">🖥️ Backend: <code style="font-size:.82em;color:var(--muted)">…</code></div>
        <div>💾 Device: <code style="font-size:.78em;color:var(--sec)">${Store.getDeviceId()}</code></div>
        <div>🌐 ${navigator.onLine ? '<span style="color:var(--green)">En ligne</span>' : '<span style="color:var(--orange)">Hors ligne</span>'}</div>
      </div></div>`;

    html += `<div class="btn-row" style="margin-top:12px;gap:8px;flex-direction:column">
      <button class="btn" style="background:var(--accent);color:#000;font-weight:700;width:100%" onclick="App.updateApp()">
        🚀 Mettre à jour l'app
      </button>
      <div style="display:flex;gap:8px">
        <button class="btn" style="background:var(--sec);color:#000;font-weight:600;flex:1" onclick="App.clearCache()">🔄 Vider cache</button>
        <button class="btn" style="flex:1;background:#f85149;color:#fff;font-weight:600" onclick="App.confirmClearData()">🗑️ Effacer données</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 12px;background:var(--card);border-radius:var(--radius)">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;color:var(--text);font-size:.85em">
          <input type="checkbox" id="nocache-toggle" ${localStorage.getItem('tripkit_nocache') === '1' ? 'checked' : ''} onchange="App.toggleNoCache(this.checked)" style="width:18px;height:18px">
          🛠️ Mode dev (pas de cache images)
        </label>
      </div>
    </div>`;

    container.innerHTML = html;

    // Render TripSelector into its placeholder
    const selectorEl = document.getElementById('plus-trip-selector');
    if (selectorEl) TripSelector.render(selectorEl);
  }

  function openList(listId) {
    currentListId = listId;
    window.location.hash = 'plus/listes/' + listId;
  }

  function selectTrip(tripId) {
    const prevTripId = Store.getCurrentTripId();
    Store.setCurrentTripId(tripId);
    currentListId = null;
    currentDayIndex = 0;

    // PURGE cached trip data to avoid stale/mixed data
    // Forces a clean re-fetch from backend on every switch
    if (prevTripId !== tripId) {
      Store.clearTripData(tripId);
      Store.set(tripId + '-data-version', null);
    }

    // Load fresh from backend
    tripData = {};
    switchTab('programme');
    showToast('✅ Chargement...');
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
    if (!confirm('⚠️ Vider le cache local ?\nLes données seront retéléchargées depuis le serveur.')) return;
    // Remove cached versions so next reload forces a fresh backend fetch
    // but do NOT wipe tripkit-trips or user-id — just version markers
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('tripkit-version-') || k.endsWith('-data-version') || k.startsWith('tripkit-trip-')) {
        localStorage.removeItem(k);
      }
    });
    // Also clear SW cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => location.reload(true));
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
  function clearCache() {
    if (!confirm('Vider le cache et recharger ?')) return;
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
    if (el) el.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">\u23f3</div>
      <h3>Chargement...</h3>
      <p style="color:var(--muted)">R\u00e9cup\u00e9ration des donn\u00e9es depuis le serveur...</p>
    </div>`;
    // Auto-retry after 2s (backend may just be slow)
    setTimeout(() => location.reload(), 2000);
  }

  function showToast(msg, type = 'success') {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    wrap.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
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
