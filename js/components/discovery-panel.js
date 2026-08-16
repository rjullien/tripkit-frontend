/**
 * discovery-panel.js — « Autour de … » in the Jour view (Phase 0).
 * Collapsed by default. Scope = the day on screen (◀ ▶ / swipe).
 * Geo themes via Overpass; editorial (festivals / spectacles) via Léo web search.
 */
var DiscoveryPanel = (() => {
  const aborts = new WeakMap();

  // L'écriture dans le seed par Léo n'est pas branchée : POST /discovery/retain
  // répond 501. Le bouton le dit AVANT le clic. Le bouton reste cliquable
  // (la réponse 501 porte le détail exact du backend).
  const DEFERRED_HINT = "Pas encore branché : Léo n'écrit pas encore dans le seed, rien ne sera enregistré.";
  const RETAIN_LABEL = 'Retenir ⏳';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function placeOf(day) {
    return String(day.to || day.from || day.label || '').trim();
  }

  function corridorLeg(days, idx, tripData) {
    if (!Array.isArray(days) || idx < 1) return null;
    const day = days[idx] || {};
    const prev = days[idx - 1] || {};
    const fromId = prev.locationId;
    const toId = day.locationId;
    if (!fromId || !toId || fromId === toId) return null;
    const locs = (tripData && tripData.locations) || {};
    const from = locs[fromId];
    const to = locs[toId];
    if (!from || from.lat == null || from.lon == null || !to || to.lat == null || to.lon == null) return null;
    const fromLabel = String(prev.to || prev.label || from.name || fromId).trim();
    const toLabel = String(day.to || day.label || to.name || toId).trim();
    return { fromId, toId, fromLabel, toLabel };
  }

  function firstCorridorLeg(tripData) {
    const days = (tripData && tripData.days) || [];
    for (let i = 1; i < days.length; i++) {
      const leg = corridorLeg(days, i, tripData);
      if (leg) return { day: days[i], idx: i, leg };
    }
    return null;
  }

  function cancel(root) {
    const ac = aborts.get(root);
    if (ac) {
      ac.abort();
      aborts.delete(root);
    }
  }

  /**
   * @param {HTMLElement} container
   * @param {{ tripId: string, day: object, tripData: object, corridorOnly?: boolean }} opts
   */
  function render(container, opts) {
    if (!container) return;
    cancel(container);
    const tripId = opts && opts.tripId;
    const day = (opts && opts.day) || {};
    const tripData = (opts && opts.tripData) || {};
    const trip = tripData.trip || {};
    const days = tripData.days || [];
    const idx = days.findIndex(d => d && d.day === day.day);
    const leg = idx >= 0 ? corridorLeg(days, idx, tripData) : (opts && opts.leg) || null;
    const corridorOnly = !!(opts && opts.corridorOnly);
    if (!tripId || (!day.geo && !leg)) {
      container.innerHTML = '';
      return;
    }
    // Jour hides discovery once the trip is over. Construction still needs the
    // along-the-drive search while editing a finished itinerary.
    if (!corridorOnly && typeof DayResolver !== 'undefined' && DayResolver.tripState(trip) === 'after') {
      container.innerHTML = '';
      return;
    }
    const place = placeOf(day);
    const dateLabel = [day.dow, day.date].filter(Boolean).join(' ');
    const dayNum = day.day;
    const dateISO = day._isoDate || '';
    const aroundTitle = place ? `Autour de ${place}` : 'Autour de ce jour';
    const trajetTitle = leg ? `Sur le trajet ${leg.fromLabel} → ${leg.toLabel}` : '';
    const title = corridorOnly && trajetTitle ? trajetTitle : aroundTitle;
    const sub = dateLabel ? ` · ${dateLabel}` : '';
    const modeToggle = (!corridorOnly && leg)
      ? `<div class="discovery-modes" role="tablist">
          <button type="button" class="discovery-mode is-on" data-mode="around">Autour</button>
          <button type="button" class="discovery-mode" data-mode="corridor">Sur le trajet</button>
        </div>`
      : '';

    container.innerHTML = `<div class="discovery-wrap section-wrap" id="discovery-wrap">
      <button type="button" class="discovery-toggle" id="discovery-toggle"
        aria-expanded="false" aria-controls="discovery-body">
        <span class="discovery-toggle-label">🛍️ ${esc(title)}${esc(sub)}</span>
        <span class="discovery-chevron" aria-hidden="true">▸</span>
      </button>
      <div class="section-body hidden discovery-body" id="discovery-body">
        ${modeToggle}
        <div class="discovery-themes" id="discovery-themes"></div>
        <button type="button" class="btn btn-accent discovery-search" id="discovery-search" disabled>Chercher</button>
        <p class="discovery-status" id="discovery-status" hidden></p>
        <div class="discovery-results" id="discovery-results"></div>
      </div>
    </div>`;

    container._disc = {
      tripId, dayNum, dateISO, leg, mode: corridorOnly ? 'corridor' : 'around',
      aroundTitle, sub,
    };

    const toggle = container.querySelector('#discovery-toggle');
    const body = container.querySelector('#discovery-body');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      body.classList.toggle('hidden', open);
      toggle.querySelector('.discovery-chevron').textContent = open ? '▸' : '▾';
      if (!open) loadThemesAndCache(container);
    });
    container.querySelectorAll('.discovery-mode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMode(container, btn.getAttribute('data-mode'));
      });
    });
  }

  function setMode(root, mode) {
    const st = root._disc || {};
    st.mode = mode;
    root._disc = st;
    root.querySelectorAll('.discovery-mode').forEach(b => {
      b.classList.toggle('is-on', b.getAttribute('data-mode') === mode);
    });
    const label = root.querySelector('.discovery-toggle-label');
    if (label) {
      const title = (mode === 'corridor' && st.leg)
        ? `Sur le trajet ${st.leg.fromLabel} → ${st.leg.toLabel}`
        : (st.aroundTitle || 'Autour de ce jour');
      label.textContent = `🛍️ ${title}${st.sub || ''}`;
    }
    const wrap = root.querySelector('#discovery-results');
    if (wrap) wrap.innerHTML = '';
    loadThemesAndCache(root);
  }

  async function loadThemesAndCache(root) {
    const st = root._disc || {};
    const { tripId, dayNum, dateISO, leg, mode } = st;
    const themesEl = root.querySelector('#discovery-themes');
    const status = root.querySelector('#discovery-status');
    const btn = root.querySelector('#discovery-search');
    if (!themesEl || typeof API === 'undefined') return;
    try {
      const dataRes = await API.getDiscoveryThemes(tripId);
      let themes = (dataRes && dataRes.ok && dataRes.data && dataRes.data.themes) || [];
      if (mode === 'corridor') {
        themes = themes.filter(t => t && t.engine === 'geo' && t.corridor);
      }
      paintThemes(themesEl, themes);
      if (btn) {
        btn.disabled = false;
        btn.onclick = () => runSearch(root);
      }
      const cachedOpts = mode === 'corridor' && leg
        ? { fromLoc: leg.fromId, toLoc: leg.toId, dateISO }
        : { dayNum };
      const cached = await API.getDiscoveryResults(tripId, cachedOpts);
      if (cached && cached.ok && cached.data && cached.data.items && cached.data.items.length) {
        paintResults(root, cached.data);
      }
    } catch (e) {
      if (status) {
        status.hidden = false;
        status.textContent = (e && e.message) || 'Catalogue indisponible.';
      }
    }
  }

  function paintThemes(el, themes) {
    el.innerHTML = themes.map((t) => {
      return `<label class="discovery-chip">
        <input type="checkbox" value="${esc(t.id)}"${t.engine === 'editorial' ? '' : ' checked'}>
        <span>${esc(t.emoji || '')} ${esc(t.label || t.id)}</span>
      </label>`;
    }).join('');
  }

  function selectedThemeIds(root) {
    return Array.from(root.querySelectorAll('#discovery-themes input[type="checkbox"]:checked:not(:disabled)'))
      .map((i) => i.value);
  }

  async function runSearch(root) {
    const st = root._disc || {};
    const { tripId, dayNum, dateISO, leg, mode } = st;
    const status = root.querySelector('#discovery-status');
    const btn = root.querySelector('#discovery-search');
    const themes = selectedThemeIds(root);
    if (!themes.length) {
      if (status) { status.hidden = false; status.textContent = 'Choisis au moins un thème.'; }
      return;
    }
    if (!navigator.onLine) {
      if (status) { status.hidden = false; status.textContent = 'Hors-ligne — réessaie avec le réseau.'; }
      return;
    }
    cancel(root);
    const ac = new AbortController();
    aborts.set(root, ac);
    if (btn) btn.disabled = true;
    if (status) { status.hidden = false; status.textContent = 'Recherche…'; }
    const scope = (mode === 'corridor' && leg)
      ? { corridor: [leg.fromId, leg.toId], dateISO }
      : { dayNum, dateISO };
    try {
      const posted = await API.postDiscoverySearch(tripId, { themes, scope });
      if (!posted || !posted.ok || !posted.data || !posted.data.jobId) {
        const msg = (posted && posted.error) || 'Recherche impossible.';
        if (status) status.textContent = msg;
        return;
      }
      const jobId = posted.data.jobId;
      let result = null;
      for await (const ev of API.leoJobStream(jobId, 0, { signal: ac.signal })) {
        if (ev.event === 'theme' && ev.data) {
          const label = ev.data.text || (ev.data.tool && ev.data.tool.label) || '';
          if (status) status.textContent = label ? `${label}…` : 'Recherche…';
          if (ev.data.tool && Array.isArray(ev.data.tool.items)) {
            mergeThemeItems(root, ev.data.tool.themeId, ev.data.tool.items);
          }
        }
        if (ev.event === 'result' && ev.data && ev.data.reply) {
          try { result = JSON.parse(ev.data.reply); } catch (_) {}
        }
        if (ev.event === 'error') {
          const msg = (ev.data && (ev.data.error || ev.data.detail)) || 'Recherche impossible.';
          if (status) status.textContent = msg;
          return;
        }
        if (ev.event === 'done') break;
      }
      if (result) paintResults(root, result);
      else {
        const cachedOpts = (mode === 'corridor' && leg)
          ? { fromLoc: leg.fromId, toLoc: leg.toId, dateISO }
          : { dayNum };
        const cached = await API.getDiscoveryResults(tripId, cachedOpts);
        if (cached && cached.ok && cached.data) paintResults(root, cached.data);
      }
      if (status) status.hidden = true;
    } catch (e) {
      if (status) {
        status.hidden = false;
        status.textContent = (typeof API !== 'undefined' && API.netFailMessage)
          ? API.netFailMessage(e, ac.signal.aborted)
          : ((e && e.message) || 'Recherche impossible.');
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function mergeThemeItems(root, themeId, items) {
    const wrap = root.querySelector('#discovery-results');
    if (!wrap || !themeId || !items || !items.length) return;
    const existing = wrap._items || [];
    const rest = existing.filter((it) => it.themeId !== themeId);
    wrap._items = rest.concat(items);
    paintResults(root, { items: wrap._items });
  }

  function paintResults(root, res) {
    const wrap = root.querySelector('#discovery-results');
    if (!wrap) return;
    const items = (res && res.items) || [];
    wrap._items = items;
    if (!items.length) {
      wrap.innerHTML = `<p class="discovery-empty">${(root._disc && root._disc.mode === 'corridor')
        ? 'Rien trouvé sur le trajet pour ces thèmes.'
        : 'Rien trouvé autour pour ces thèmes.'}</p>`;
      return;
    }
    wrap.innerHTML = items.map((it, idx) => {
      const editorial = it.source === 'editorial';
      const km = (!editorial && typeof it.distKm === 'number' && it.distKm > 0)
        ? `${String(it.distKm).replace('.', ',')} km` : '';
      const detour = (!editorial && it.detourEstimated && typeof it.detourKm === 'number')
        ? `~+${String(it.detourKm).replace('.', ',')} km de détour (estimé)` : '';
      const when = it.when ? esc(it.when) : '';
      const linkLabel = editorial ? 'Lien' : 'Maps';
      const link = it.url
        ? `<a class="discovery-maps" href="${esc(it.url)}" target="_blank" rel="noopener">${linkLabel}</a>`
        : '';
      const meta = [when, detour || km, link].filter(Boolean).join(' · ');
      const note = it.note ? `<div class="discovery-item-note">${esc(it.note)}</div>` : '';
      const retainBtn = `<button type="button" class="btn btn-sm discovery-retain-btn deferred" data-idx="${idx}"
        title="${DEFERRED_HINT}">${RETAIN_LABEL}</button>`;
      return `<div class="discovery-item">
        <div class="discovery-item-row">
          <div class="discovery-item-name">${esc(it.name || '')}</div>
          ${retainBtn}
        </div>
        ${meta ? `<div class="discovery-item-meta">${meta}</div>` : ''}
        ${note}
      </div>`;
    }).join('');

    wrap.querySelectorAll('.discovery-retain-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const item = wrap._items[idx];
        if (item) handleRetain(btn, item);
      });
    });
  }

  async function handleRetain(btn, item) {
    const tripId = getTripIdForDiscovery();
    if (!tripId) return;

    btn.disabled = true;
    btn.textContent = 'Envoi à Léo...';

    const res = await API.retainDiscoveryItem(tripId, {
      id: item.id || '',
      name: item.name || '',
      themeId: item.themeId || '',
      lat: item.lat || 0,
      lon: item.lon || 0,
      distKm: item.distKm || 0,
      url: item.url || '',
      source: item.source || '',
    });

    // L'endpoint renvoie 501 not_implemented : rien n'est écrit dans le seed,
    // donc pas de « Retenu ✓ ».
    if (res && (res.status === 501 || (res.data && res.data.error === 'not_implemented'))) {
      btn.textContent = 'Pas encore disponible';
      btn.className = 'btn btn-sm discovery-retain-btn unavailable';
      btn.title = (res.data && typeof res.data.detail === 'string' && res.data.detail)
        || "Léo n'écrit pas encore dans le seed.";
      btn.disabled = true;
      return;
    }

    if (!res || !res.ok || !res.data || !res.data.jobId) {
      retainFailed(btn, 'Erreur');
      return;
    }

    let done = false;
    try {
      for await (const ev of API.leoJobStream(res.data.jobId, 0)) {
        if (ev.event === 'done') { done = true; break; }
        if (ev.event === 'error') {
          retainFailed(btn, 'Erreur');
          return;
        }
      }
    } catch (_) {
      retainFailed(btn, 'Connexion perdue');
      return;
    }

    if (!done) {
      retainFailed(btn, 'Erreur');
      return;
    }

    btn.textContent = 'Retenu ✓';
    btn.className = 'btn btn-sm discovery-retain-btn done';
  }

  function retainFailed(btn, msg) {
    btn.textContent = msg;
    btn.className = 'btn btn-sm discovery-retain-btn error';
    setTimeout(() => {
      btn.textContent = RETAIN_LABEL;
      btn.disabled = false;
      btn.className = 'btn btn-sm discovery-retain-btn deferred';
      btn.title = DEFERRED_HINT;
    }, 2500);
  }

  function getTripIdForDiscovery() {
    if (typeof Store !== 'undefined' && Store.getCurrentTripId) {
      return Store.getCurrentTripId();
    }
    return null;
  }

  return { render, firstCorridorLeg, corridorLeg };
})();
