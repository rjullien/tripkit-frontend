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

  function isUSA(lat, lon) { return lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66; }

  function nwsToEmoji(short) {
    const s = (short || '').toLowerCase();
    if (s.includes('thunder')) return '⚡';
    if (s.includes('snow')) return '❄️';
    if (s.includes('rain') || s.includes('shower')) return '🌧️';
    if (s.includes('drizzle')) return '🌦️';
    if (s.includes('fog')) return '🌫️';
    if (s.includes('cloud') || s.includes('overcast')) return '☁️';
    if (s.includes('partly')) return '⛅';
    if (s.includes('mostly sunny') || s.includes('mostly clear')) return '🌤️';
    if (s.includes('sunny') || s.includes('clear')) return '☀️';
    return '🌤️';
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

    // Google Maps full route link
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
        html += day.highlights.map(h => `<div class="rc-highlight">• ${esc(h)}</div>`).join('');
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

    container.innerHTML = html;

    // Async: fetch weather batch
    fetchRouteWeather(tripData, days);
  }

  /**
   * Batch-fetch weather for all unique coords.
   * Step 1: Open-Meteo (all coords, up to 16 days)
   * Step 2: NWS overlay for USA coords (7 days, more accurate)
   */
  async function fetchRouteWeather(tripData, days) {
    const trip = tripData.trip || {};
    const startDate = trip.startDate;
    if (!startDate) return;

    // Check cache (3h TTL)
    const stored = localStorage.getItem('wxRouteCache-v1');
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

    // Step 1: Open-Meteo batch
    try {
      const lats = coords.map(c => c.lat).join(',');
      const lons = coords.map(c => c.lon).join(',');
      const today = new Date().toISOString().slice(0, 10);
      const maxFc = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
      const tripEnd = new Date(new Date(startDate).getTime() + (days.length + 1) * 86400000).toISOString().slice(0, 10);
      const endDate = tripEnd < maxFc ? tripEnd : maxFc;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max,weathercode&timezone=auto&start_date=${today}&end_date=${endDate}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        const results = Array.isArray(json) ? json : [json];
        results.forEach((r, i) => {
          if (r.daily && coords[i]) {
            wxCache[coords[i].key] = {
              time: r.daily.time,
              tmin: r.daily.temperature_2m_min,
              tmax: r.daily.temperature_2m_max,
              rain: r.daily.precipitation_probability_max || [],
              icon: (r.daily.weathercode || []).map(c => WMO_ICONS[c] || '🌤️'),
              source: r.daily.time.map(() => 'open-meteo')
            };
          }
        });
      }
    } catch(e) { /* silent */ }

    renderWeatherInline(days, startDate);

    // Step 2: NWS overlay for USA coords
    const usaCoords = coords.filter(c => isUSA(c.lat, c.lon));
    if (usaCoords.length) {
      const nwsPromises = usaCoords.map(async (c) => {
        try {
          const ptResp = await fetch(`https://api.weather.gov/points/${c.lat},${c.lon}`, { headers: { 'User-Agent': 'TripKit/2.6' } });
          if (!ptResp.ok) return;
          const ptJson = await ptResp.json();
          const fcUrl = ptJson.properties && ptJson.properties.forecast;
          if (!fcUrl) return;
          const fcResp = await fetch(fcUrl, { headers: { 'User-Agent': 'TripKit/2.6' } });
          if (!fcResp.ok) return;
          const fcJson = await fcResp.json();
          const periods = fcJson.properties && fcJson.properties.periods;
          if (!periods) return;

          const dailyMap = {};
          periods.forEach(p => {
            const iso = p.startTime.slice(0, 10);
            if (!dailyMap[iso]) dailyMap[iso] = {};
            const tempC = p.temperatureUnit === 'F' ? Math.round((p.temperature - 32) * 5/9) : p.temperature;
            const icon = nwsToEmoji(p.shortForecast);
            const rain = (p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value) || 0;
            if (p.isDaytime) {
              dailyMap[iso].hi = tempC;
              dailyMap[iso].icon = icon;
              dailyMap[iso].rain = Math.max(dailyMap[iso].rain || 0, rain);
            } else {
              dailyMap[iso].lo = tempC;
              dailyMap[iso].rain = Math.max(dailyMap[iso].rain || 0, rain);
            }
          });

          const loc = wxCache[c.key];
          if (!loc) return;
          Object.entries(dailyMap).forEach(([iso, nws]) => {
            const di = loc.time.indexOf(iso);
            if (di === -1) return;
            if (nws.hi != null) loc.tmax[di] = nws.hi;
            if (nws.lo != null) loc.tmin[di] = nws.lo;
            if (nws.icon) loc.icon[di] = nws.icon;
            if (nws.rain != null) loc.rain[di] = nws.rain;
            loc.source[di] = 'nws';
          });
        } catch(e) { /* silent */ }
      });

      await Promise.allSettled(nwsPromises);
      renderWeatherInline(days, startDate);
    }

    // Save cache
    try {
      localStorage.setItem('wxRouteCache-v1', JSON.stringify({ ts: Date.now(), data: wxCache }));
    } catch(e) {}
  }

  /**
   * Inject weather icons + temps into route cards.
   */
  function renderWeatherInline(days, startDate) {
    if (!wxCache) return;
    const start = new Date(startDate + 'T00:00:00');

    days.forEach((day, idx) => {
      const el = document.getElementById(`wx-${idx}`);
      if (!el || !day.geo) return;
      const k = `${day.geo.lat},${day.geo.lon}`;
      const loc = wxCache[k];
      if (!loc) return;

      const dayNum = day.day !== undefined ? day.day : idx;
      const d = new Date(start);
      d.setDate(d.getDate() + dayNum);
      const iso = d.toISOString().slice(0, 10);
      const di = loc.time.indexOf(iso);
      if (di === -1) { el.innerHTML = ''; return; }

      const icon = loc.icon[di] || '🌤️';
      const tmax = Math.round(loc.tmax[di]);
      const tmin = Math.round(loc.tmin[di]);
      const rain = loc.rain[di] || 0;
      const src = loc.source[di] || 'open-meteo';
      const srcBadge = src === 'nws' ? '<span style="font-size:.55em;color:var(--green)" title="NWS">★</span>' : '';

      el.innerHTML = `<div style="text-align:center;min-width:48px">
        <div style="font-size:1.2em">${icon}</div>
        <div style="font-size:.68em;font-weight:700">${tmin}°/${tmax}°</div>
        ${rain >= 30 ? `<div style="font-size:.6em;color:var(--accent)">🌧${rain}%</div>` : ''}
        ${srcBadge}
      </div>`;
    });
  }

  return { render };
})();
