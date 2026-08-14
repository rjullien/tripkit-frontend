/**
 * discovery-panel.js — « Autour de … » in the Jour view (Phase 0).
 * Collapsed by default. Scope = the day on screen (◀ ▶ / swipe).
 * Geo themes via Overpass; editorial (festivals / spectacles) via Léo web search.
 */
var DiscoveryPanel = (() => {
  let abort = null;

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function placeOf(day) {
    return String(day.to || day.from || day.label || '').trim();
  }

  /**
   * @param {HTMLElement} container
   * @param {{ tripId: string, day: object, tripData: object }} opts
   */
  function render(container, opts) {
    if (!container) return;
    if (abort) { abort.abort(); abort = null; }
    const tripId = opts && opts.tripId;
    const day = (opts && opts.day) || {};
    const tripData = (opts && opts.tripData) || {};
    const trip = tripData.trip || {};
    if (!tripId || !day.geo) {
      container.innerHTML = '';
      return;
    }
    if (typeof DayResolver !== 'undefined' && DayResolver.tripState(trip) === 'after') {
      container.innerHTML = '';
      return;
    }
    const place = placeOf(day);
    const dateLabel = [day.dow, day.date].filter(Boolean).join(' ');
    const dayNum = day.day;
    const dateISO = day._isoDate || '';
    const title = place
      ? `Autour de ${place}`
      : 'Autour de ce jour';
    const sub = dateLabel ? ` · ${dateLabel}` : '';

    container.innerHTML = `<div class="discovery-wrap section-wrap" id="discovery-wrap">
      <button type="button" class="discovery-toggle" id="discovery-toggle"
        aria-expanded="false" aria-controls="discovery-body">
        <span class="discovery-toggle-label">🛍️ ${esc(title)}${esc(sub)}</span>
        <span class="discovery-chevron" aria-hidden="true">▸</span>
      </button>
      <div class="section-body hidden discovery-body" id="discovery-body">
        <div class="discovery-themes" id="discovery-themes"></div>
        <button type="button" class="btn btn-accent discovery-search" id="discovery-search" disabled>Chercher</button>
        <p class="discovery-status" id="discovery-status" hidden></p>
        <div class="discovery-results" id="discovery-results"></div>
      </div>
    </div>`;

    const toggle = container.querySelector('#discovery-toggle');
    const body = container.querySelector('#discovery-body');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      body.classList.toggle('hidden', open);
      toggle.querySelector('.discovery-chevron').textContent = open ? '▸' : '▾';
      if (!open) loadThemesAndCache(tripId, dayNum, dateISO);
    });
  }

  async function loadThemesAndCache(tripId, dayNum, dateISO) {
    const themesEl = document.getElementById('discovery-themes');
    const status = document.getElementById('discovery-status');
    const btn = document.getElementById('discovery-search');
    if (!themesEl || typeof API === 'undefined') return;
    try {
      const dataRes = await API.getDiscoveryThemes(tripId);
      const themes = (dataRes && dataRes.ok && dataRes.data && dataRes.data.themes) || [];
      paintThemes(themesEl, themes);
      if (btn) {
        btn.disabled = false;
        btn.onclick = () => runSearch(tripId, dayNum, dateISO);
      }
      const cached = await API.getDiscoveryResults(tripId, { dayNum });
      if (cached && cached.ok && cached.data && cached.data.items && cached.data.items.length) {
        paintResults(cached.data);
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
        <input type="checkbox" value="${esc(t.id)}" checked>
        <span>${esc(t.emoji || '')} ${esc(t.label || t.id)}</span>
      </label>`;
    }).join('');
  }

  function selectedThemeIds() {
    return Array.from(document.querySelectorAll('#discovery-themes input[type="checkbox"]:checked:not(:disabled)'))
      .map((i) => i.value);
  }

  async function runSearch(tripId, dayNum, dateISO) {
    const status = document.getElementById('discovery-status');
    const btn = document.getElementById('discovery-search');
    const themes = selectedThemeIds();
    if (!themes.length) {
      if (status) { status.hidden = false; status.textContent = 'Choisis au moins un thème.'; }
      return;
    }
    if (!navigator.onLine) {
      if (status) { status.hidden = false; status.textContent = 'Hors-ligne — réessaie avec le réseau.'; }
      return;
    }
    if (abort) abort.abort();
    abort = new AbortController();
    if (btn) btn.disabled = true;
    if (status) { status.hidden = false; status.textContent = 'Recherche…'; }
    try {
      const posted = await API.postDiscoverySearch(tripId, {
        themes,
        scope: { dayNum, dateISO },
      });
      if (!posted || !posted.ok || !posted.data || !posted.data.jobId) {
        const msg = (posted && posted.error) || 'Recherche impossible.';
        if (status) status.textContent = msg;
        return;
      }
      const jobId = posted.data.jobId;
      let result = null;
      for await (const ev of API.leoJobStream(jobId, 0, { signal: abort.signal })) {
        if (ev.event === 'theme' && ev.data) {
          const label = ev.data.text || (ev.data.tool && ev.data.tool.label) || '';
          if (status) status.textContent = label ? `${label}…` : 'Recherche…';
          if (ev.data.tool && Array.isArray(ev.data.tool.items)) {
            mergeThemeItems(ev.data.tool.themeId, ev.data.tool.items);
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
      if (result) paintResults(result);
      else {
        const cached = await API.getDiscoveryResults(tripId, { dayNum });
        if (cached && cached.ok && cached.data) paintResults(cached.data);
      }
      if (status) status.hidden = true;
    } catch (e) {
      if (status) {
        status.hidden = false;
        status.textContent = (typeof API !== 'undefined' && API.netFailMessage)
          ? API.netFailMessage(e, abort && abort.signal.aborted)
          : ((e && e.message) || 'Recherche impossible.');
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function mergeThemeItems(themeId, items) {
    const wrap = document.getElementById('discovery-results');
    if (!wrap || !themeId || !items || !items.length) return;
    const existing = wrap._items || [];
    const rest = existing.filter((it) => it.themeId !== themeId);
    wrap._items = rest.concat(items);
    paintResults({ items: wrap._items });
  }

  function paintResults(res) {
    const wrap = document.getElementById('discovery-results');
    if (!wrap) return;
    const items = (res && res.items) || [];
    wrap._items = items;
    if (!items.length) {
      wrap.innerHTML = `<p class="discovery-empty">Rien trouvé autour pour ces thèmes.</p>`;
      return;
    }
    wrap.innerHTML = items.map((it) => {
      const editorial = it.source === 'editorial';
      const km = (!editorial && typeof it.distKm === 'number' && it.distKm > 0)
        ? `${String(it.distKm).replace('.', ',')} km` : '';
      const when = it.when ? esc(it.when) : '';
      const linkLabel = editorial ? 'Lien' : 'Maps';
      const link = it.url
        ? `<a class="discovery-maps" href="${esc(it.url)}" target="_blank" rel="noopener">${linkLabel}</a>`
        : '';
      const meta = [when, km, link].filter(Boolean).join(' · ');
      const note = it.note ? `<div class="discovery-item-note">${esc(it.note)}</div>` : '';
      return `<div class="discovery-item">
        <div class="discovery-item-name">${esc(it.name || '')}</div>
        ${meta ? `<div class="discovery-item-meta">${meta}</div>` : ''}
        ${note}
      </div>`;
    }).join('');
  }

  return { render };
})();
