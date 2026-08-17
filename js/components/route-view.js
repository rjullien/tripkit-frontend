/**
 * route-view.js — Full trip overview with expandable day cards
 * Shows phases, daily cards with emoji/weather/distance, expand for details.
 * Weather: batch-fetches Open-Meteo for all unique coords, NWS overlay for USA.
 */

var RouteView = (() => {

  const WMO_ICONS = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⚡',96:'⚡',99:'⚡'};
  let wxCache = null;
  let wxCacheTs = 0;

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /**
   * Render the route overview into a container.
   */
  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    if (!tripData || !tripData.days || !tripData.days.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🗺️</div>
        <h3>Aucun itinéraire</h3>
      </div>`;
      return;
    }

    const days = tripData.days.map(d => DayHelpers.enrich(d, tripData));
    const trip = tripData.trip || {};
    const phases = trip.phases || [];

    let html = `<div class="page-header">
      <h1>🗺️ Itinéraire</h1>
      <div class="sub">${esc(trip.name || '')}</div>
    </div>`;

    // Stats badges
    const totalKm = days.reduce((sum, d) => {
      const m = (d.dist || '').match(/(\d[\d\s]*)/);
      return sum + (m ? parseInt(m[1].replace(/\s/g, '')) : 0);
    }, 0);

    html += `<div style="text-align:center;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">`;
    html += `<span class="badge badge-accent">${days.length} jours</span>`;
    if (totalKm > 0) html += `<span class="badge badge-sec">${totalKm.toLocaleString('fr')} km</span>`;
    if (trip.travelers) html += `<span class="badge" style="background:rgba(255,255,255,.1)">${trip.travelers.length} voyageurs</span>`;
    html += `</div>`;

    // Route map image (from backend assets or static fallback)
    if (trip.mapImage) {
      let mapSrc = trip.mapImage;
      if (!mapSrc.startsWith('http') && !mapSrc.startsWith('/') && !mapSrc.startsWith('data:')) {
        mapSrc = (typeof API !== 'undefined' && API.assetUrl) ? API.assetUrl(trip.id, trip.mapImage) : trip.mapImage;
      }
      const ncq = localStorage.getItem('tripkit_nocache') === '1' ? (mapSrc.includes('?') ? '&nocache=1' : '?nocache=1') : '';
      html += `<div style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
        <img src="${mapSrc}${ncq}" alt="Carte itin\u00E9raire" style="width:100%;display:block;cursor:pointer" onclick="window.open(this.src,'_blank')" loading="lazy">
      </div>`;
    }

    // Google Maps full route link — stays at top
    if (trip.routeUrl) {
      html += `<div style="margin-bottom:16px">
        <a href="${esc(trip.routeUrl)}" class="map-btn map-btn-primary" target="_blank" style="display:block;text-align:center">🗺️ Itinéraire complet — Google Maps</a>
      </div>`;
    }

    // Phase tracking
    let currentPhaseIdx = -1;

    days.forEach((day, idx) => {
      // Phase label
      if (phases.length) {
        const phaseForDay = phases.findIndex(p => { const r = p.range || p.days; return r && idx >= r[0] && idx <= r[1]; });
        if (phaseForDay !== -1 && phaseForDay !== currentPhaseIdx) {
          currentPhaseIdx = phaseForDay;
          const phase = phases[phaseForDay];
          html += `<div class="phase-label">${esc(phase.label || phase.name || ('Phase ' + (phaseForDay + 1)))}</div>`;
        }
      }

      const cardId = `rc-${idx}`;
      const dist = day.dist && day.dist !== '0 km' ? day.dist : null;
      const dur = day.dur || '';

      // Weather placeholder
      const wxId = `wx-${idx}`;

      html += `<div class="route-card" id="${cardId}">
        <div class="rc-header" onclick="document.getElementById('${cardId}').classList.toggle('open')">
          <span class="rc-emoji">${esc(day.emoji || '📍')}</span>
          <div class="rc-info">
            <div class="rc-day">Jour ${(day.day !== undefined ? day.day : idx + 1)} — ${esc(day.dow || '')} ${esc(day.date || '')}</div>
            <div class="rc-label">${esc(day.label || day.to || '')}</div>
            ${dist ? `<div class="rc-dist">${esc(dist)}${dur ? ' · ' + esc(dur) : ''}</div>` : '<div class="rc-dist">Sur place</div>'}
          </div>
          <div id="${wxId}" class="rc-wx"></div>
          <span class="rc-arrow">›</span>
        </div>
        <div class="rc-detail">`;

      // Highlights
      if (day.highlights && day.highlights.length) {
        html += day.highlights.map(h => {
          // Allow safe links through (same as daily-view.js)
          const safe = h.replace(
            /<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
            (m, href, label) => href.startsWith('#')
              ? `<a href="${href}">${esc(label)}</a>`
              : `<a href="${href}" target="_blank">${esc(label)}</a>`
          ).replace(/<(?!\/a>)(?!a\s)[^>]+>/g, '');
          return `<div class="rc-highlight">• ${safe}</div>`;
        }).join('');
      }

      // Hotel
      if (day.hotel && day.hotel !== '—') {
        html += `<div class="rc-hotel">🏨 ${esc(day.hotel)}</div>`;
      }

      // Link to day
      html += `<div style="margin-top:10px">
        <a href="#programme/${idx}" class="btn-day-link" onclick="App.goToDay(${idx});App.switchTab('programme')">📋 Programme du jour →</a>
      </div>`;

      html += `</div></div>`;
    });

    // mapHtml at bottom — meteoHtml only when online (Route OK sans météo)
    const pendingHtmlFrames = [];
    if (trip.mapHtml) {
      const mapFrameId = 'iframe-map-' + Date.now();
      html += `<div style="margin:20px 0 16px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
        <iframe id="${mapFrameId}" style="width:100%;height:520px;border:0" title="Carte interactive" sandbox="allow-scripts allow-same-origin"></iframe>
      </div>`;
      pendingHtmlFrames.push([trip.mapHtml, mapFrameId]);
    }
    if (trip.meteoHtml && navigator.onLine) {
      const metFrameId = 'iframe-meteo-' + Date.now();
      html += `<div style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
        <iframe id="${metFrameId}" style="width:100%;height:600px;border:0" title="Météo" sandbox="allow-scripts allow-same-origin"></iframe>
      </div>`;
      pendingHtmlFrames.push([trip.meteoHtml, metFrameId]);
    }

    container.innerHTML = html;
    pendingHtmlFrames.forEach(([ref, id]) => loadHtmlIntoIframe(trip, ref, id));

    // Weather batch: local cache OK offline; live fetch only online
    fetchRouteWeather(tripData, days);
  }

  /**
   * Batch-fetch weather for all unique coords via backend (centralized routing).
   * Backend handles US→NWS, CA→MSC, default→Open-Meteo automatically.
   */
  async function fetchRouteWeather(tripData, days) {
    const trip = tripData.trip || {};
    const startDate = trip.startDate;
    if (!startDate) return;

    // Check cache (3h TTL) — reused offline when still fresh
    const stored = localStorage.getItem('wxRouteCache-v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.ts < 3 * 3600000) {
          wxCache = parsed.data;
          renderWeatherInline(days, startDate);
          return;
        }
      } catch(e) {}
    }

    // Offline or no backend: skip (itinerary stays usable)
    if (!navigator.onLine) return;
    if (typeof API === 'undefined' || !API.isReachable()) return;

    // Collect unique coords
    const seen = new Set();
    const coords = [];
    days.forEach(d => {
      if (!d.geo) return;
      const k = `${d.geo.lat},${d.geo.lon}`;
      if (seen.has(k)) return;
      seen.add(k);
      coords.push({ lat: d.geo.lat, lon: d.geo.lon, key: k });
    });
    if (!coords.length) return;

    wxCache = {};
    const country = trip.country || '';

    // Fetch all coords in parallel via backend
    const promises = coords.map(async (c) => {
      try {
        const url = API.url(`/weather/forecast?lat=${c.lat}&lon=${c.lon}&country=${encodeURIComponent(country)}&days=16`);
        const resp = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + (API.getToken ? API.getToken() : '') },
          signal: AbortSignal.timeout(12000)
        });
        if (!resp.ok) return;
        const fc = await resp.json();
        if (!fc.days || !fc.days.length) return;

        wxCache[c.key] = {
          time: fc.days.map(d => d.date),
          tmin: fc.days.map(d => d.tempMin),
          tmax: fc.days.map(d => d.tempMax),
          rain: fc.days.map(d => d.precipProbability || 0),
          icon: fc.days.map(d => WMO_ICONS[d.weatherCode] || '🌤️'),
          source: fc.days.map(d => d.provider || 'open-meteo')
        };
      } catch(e) { /* silent */ }
    });

    await Promise.allSettled(promises);
    renderWeatherInline(days, startDate);

    // Save cache
    try {
      localStorage.setItem('wxRouteCache-v2', JSON.stringify({ ts: Date.now(), data: wxCache }));
    } catch(e) {}
  }

  /**
   * Inject weather icons + temps into route cards.
   * Use DayHelpers._isoDate (UTC noon) — local T00:00:00 + toISOString
   * shifted dates for Europe/Paris and emptied Québec outlook cards.
   */
  function renderWeatherInline(days, startDate) {
    if (!wxCache) return;

    days.forEach((day, idx) => {
      const el = document.getElementById(`wx-${idx}`);
      if (!el || !day.geo) return;
      const k = `${day.geo.lat},${day.geo.lon}`;
      const loc = wxCache[k];
      if (!loc) return;

      const iso = day._isoDate
        || (typeof DayHelpers !== 'undefined' && DayHelpers.isoDate
          ? DayHelpers.isoDate(day, { startDate })
          : '');
      if (!iso) { el.innerHTML = ''; return; }

      const di = loc.time.indexOf(iso);
      // Missing day OR last-window 200 with null temps (Open-Meteo accepts
      // the date then sends empty slots — do not paint 0°/0°).
      if (di === -1 || loc.tmax[di] == null || loc.tmin[di] == null) {
        el.innerHTML = `<div style="text-align:center;min-width:48px;color:var(--muted);font-size:.62em;line-height:1.2" title="Prévisions 16j max">16j+</div>`;
        return;
      }

      const icon = loc.icon[di] || '🌤️';
      const tmax = Math.round(loc.tmax[di]);
      const tmin = Math.round(loc.tmin[di]);
      const rain = loc.rain[di] || 0;
      const src = loc.source[di] || 'open-meteo';
      const srcBadge = src === 'nws' ? '<span style="font-size:.55em;color:var(--green)" title="NWS">★</span>'
        : src === 'msc' ? '<span style="font-size:.55em;color:var(--green)" title="MSC 🇨🇦">★</span>' : '';

      el.innerHTML = `<div style="text-align:center;min-width:48px">
        <div style="font-size:1.2em">${icon}</div>
        <div style="font-size:.68em;font-weight:700">${tmin}°/${tmax}°</div>
        ${rain >= 30 ? `<div style="font-size:.6em;color:var(--accent)">🌧${rain}%</div>` : ''}
        ${srcBadge}
      </div>`;
    });
  }

  /**
   * Fetch HTML content and inject into an iframe via srcdoc/blob URL.
   * This bypasses content-type issues (e.g. backend serving text/plain or application/octet-stream).
   */
  function loadHtmlIntoIframe(trip, htmlRef, iframeId) {
    const url = htmlRef.startsWith('http') ? htmlRef
      : (typeof API !== 'undefined' && API.assetUrl ? API.assetUrl(trip.id, htmlRef) : htmlRef);

    // Use setTimeout to ensure the iframe is in the DOM after container.innerHTML is set
    setTimeout(async () => {
      const iframe = document.getElementById(iframeId);
      if (!iframe) return;
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          iframe.srcdoc = `<body style="background:#1e293b;color:#f87171;padding:2rem;font-family:sans-serif"><h3>⚠️ Erreur chargement</h3><p>${url} — ${resp.status}</p></body>`;
          return;
        }
        const html = await resp.text();
        // Use blob URL for full isolation (scripts, styles, etc.)
        const blob = new Blob([html], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
      } catch (e) {
        const offline = !navigator.onLine;
        iframe.srcdoc = `<body style="background:#1e293b;color:#94a3b8;padding:2rem;font-family:sans-serif"><h3>${offline ? '📴 Hors ligne' : '⚠️ Erreur réseau'}</h3><p>${offline ? 'Carte interactive indisponible sans réseau (l’itinéraire texte reste OK).' : (e.message || '')}</p></body>`;
      }
    }, 0);
  }

  return { render };
})();
