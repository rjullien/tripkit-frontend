/**
 * weather.js — Weather component (Open-Meteo API)
 * Inline weather box (in day header) + detailed modal (click to expand)
 * Ported from voyage-app
 */
var Weather = (() => {

  const WMO_ICONS = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⚡',96:'⚡',99:'⚡'};
  const WMO_DESC = {0:'Ciel dégagé',1:'Peu nuageux',2:'Partiellement nuageux',3:'Couvert',45:'Brouillard',48:'Brouillard givrant',51:'Bruine légère',53:'Bruine',55:'Bruine forte',61:'Pluie légère',63:'Pluie',65:'Forte pluie',71:'Neige légère',73:'Neige',75:'Forte neige',80:'Averses légères',81:'Averses',82:'Averses violentes',95:'Orage',96:'Orage grêle',99:'Orage grêle forte'};

  /**
   * Open-Meteo covers today + 15 days = 16 calendar days inclusive.
   * Same cap as route-view (`Date.now() + 15 * 86400000`).
   * Day 16 (today+16) is out of range — do not fetch, do not paint 0°/Inconnu.
   */
  const FORECAST_MAX_DAYS = 16;
  const MSG_TOO_FAR = 'Météo pas encore dispo (prévisions 16j max)';
  const MSG_OFFLINE = 'Météo indisponible hors ligne';
  const MSG_ERROR = 'Météo indisponible';
  const MSG_PAST = 'Météo indisponible (jour passé)';

  /** Track auth reload to avoid infinite loop — one attempt per page load. */
  let _authReloadDone = false;

  const cache = {};
  const detailCache = {};

  function mutedMsg(text) {
    return `<div style="text-align:center;color:var(--muted);font-size:.82em;padding:8px"><em>${text}</em></div>`;
  }

  /**
   * Resolve trip start date dynamically from Store.
   */
  function getTripStart() {
    const tripId = Store.getCurrentTripId();
    if (!tripId) return null;
    const tripData = Store.getTripData(tripId);
    if (tripData && tripData.trip && tripData.trip.startDate) {
      return new Date(tripData.trip.startDate + 'T00:00:00');
    }
    return null;
  }

  function toISODateLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function todayISO() {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    return toISODateLocal(t);
  }

  /**
   * Get ISO date string for a given day number.
   * Prefer DayHelpers._isoDate when present (UTC-safe).
   */
  function dayDate(dayNum, day) {
    if (day && day._isoDate) return day._isoDate;
    if (day && day.isoDate) return day.isoDate;
    // Primary: compute from trip start date
    // startDate = Day 1, so date = startDate + (dayNum - 1)
    const start = getTripStart();
    if (start) {
      const d = new Date(start);
      d.setDate(d.getDate() + dayNum - 1);
      return toISODateLocal(d);
    }
    return todayISO();
  }

  /** Days from local today to isoDate (positive = future). */
  function daysFromToday(isoDate) {
    if (!isoDate) return 0;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const d = new Date(String(isoDate).slice(0, 10) + 'T12:00:00');
    if (isNaN(d.getTime())) return 0;
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  }

  /**
   * Forecast APIs only cover today onward. A date in the past (TZ / UTC
   * mismatch, or an earlier trip day) must keep the current day — not fail.
   */
  function clampForecastDate(isoDate) {
    if (!isoDate) return todayISO();
    if (daysFromToday(isoDate) < 0) return todayISO();
    return String(isoDate).slice(0, 10);
  }

  function isBeyondForecast(isoDate) {
    return daysFromToday(isoDate) >= FORECAST_MAX_DAYS;
  }

  /** True when Open-Meteo returned a real daily slot, not nulls painted as 0°. */
  function dailySlotUsable(daily, i) {
    if (!daily || !Array.isArray(daily.time) || daily.time[i] == null) return false;
    const code = daily.weathercode && daily.weathercode[i];
    const tMin = daily.temperature_2m_min && daily.temperature_2m_min[i];
    const tMax = daily.temperature_2m_max && daily.temperature_2m_max[i];
    if (code == null || Number.isNaN(Number(code))) return false;
    if (tMin == null || tMax == null) return false;
    if (Number.isNaN(Number(tMin)) || Number.isNaN(Number(tMax))) return false;
    return true;
  }

  function paintUnavailable(container, msg) {
    container.innerHTML = mutedMsg(msg);
    container.style.cursor = 'default';
    container.onclick = null;
  }

  function isOutOfRangeReason(reason) {
    return /out of allowed range/i.test(String(reason || ''));
  }

  /**
   * Open-Meteo "errors" are not always HTTP 4xx:
   * - 400 `{error:true, reason:"... out of allowed range ..."}`
   * - 200 `{error:true, reason}` — treat the flag, ignore status
   * - 200 with daily.time set but weathercode/temps all `null` (last
   *   allowed day: the model accepts the date, then sends empty slots —
   *   that painted Inconnu / 0° / UV 0 on the Jour banner).
   * Returns a user message, or null if the daily slot is usable.
   */
  function forecastFailure(resp, data) {
    if (data && data.error) {
      // Backend returns {error: "message"} (string) ; Open-Meteo returns {error: true, reason: "..."}
      const msg = (typeof data.error === 'string') ? data.error : (data.reason || 'API error');
      return errorMessage(new Error(msg), data);
    }
    if (resp && !resp.ok) {
      const reason = (data && data.reason) || (data && data.error_message) || ('HTTP ' + resp.status);
      return errorMessage(new Error(reason), data);
    }
    if (!dailySlotUsable(data && data.daily, 0)) return MSG_TOO_FAR;
    return null;
  }

  /**
   * User-facing message for a failed weather fetch.
   * Too-far / API range ≠ offline. Shows real error for debugging.
   */
  function errorMessage(err, apiBody) {
    if (!navigator.onLine) return MSG_OFFLINE;
    const reason = (apiBody && (apiBody.reason || (typeof apiBody.error === 'string' && apiBody.error))) || (err && err.message) || '';
    if (isOutOfRangeReason(reason) || (err && err.code === 'TOO_FAR')) return MSG_TOO_FAR;
    // Show the actual error so we can diagnose
    if (reason) return 'Météo erreur : ' + String(reason).slice(0, 80);
    if (err && err.name === 'TimeoutError') return 'Météo erreur : timeout (10s)';
    if (err && err.name === 'AbortError') return 'Météo erreur : requête annulée';
    return MSG_ERROR + (err ? ' (' + (err.status || err.name || 'unknown') + ')' : '');
  }

  /**
   * Fetch and render inline weather box for a day
   * @param {HTMLElement} container — element to render into
   * @param {object} day — day object with .geo, .day, .to, .from
   */
  async function renderInline(container, day) {
    if (!container || !day || !day.geo) return;

    // Offline: hide box (Jour stays clean — no error flash)
    if (!navigator.onLine) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    const rawDate = dayDate(day.day, day);
    const cacheKey = `${day.geo.lat},${day.geo.lon},${rawDate}`;

    // Beyond Open-Meteo window — don't pretend we're offline, don't paint 0°
    if (isBeyondForecast(rawDate)) {
      paintUnavailable(container, MSG_TOO_FAR);
      return;
    }

    // Past dates (incl. "today" shifted to yesterday by UTC) → keep today
    const dateStr = clampForecastDate(rawDate);

    // Show loading
    container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.85em;padding:8px">🌤️ Chargement météo…</div>';
    container.style.cursor = 'pointer';
    container.onclick = () => openModal(day);

    if (cache[cacheKey]) { container.innerHTML = cache[cacheKey]; return; }

    try {
      // Use backend centralized weather service (routes to correct provider per country)
      const country = (function() {
        const tripId = Store.getCurrentTripId();
        if (!tripId) return '';
        const td = Store.getTripData(tripId);
        return (td && td.trip && td.trip.country) || '';
      })();
      const tz = day.geo.tz || 'UTC';
      const url = (typeof API !== 'undefined' && API.isReachable())
        ? API.url(`/weather/forecast?lat=${day.geo.lat}&lon=${day.geo.lon}&country=${encodeURIComponent(country)}&days=16&date=${dateStr}&tz=${encodeURIComponent(tz)}`)
        : `https://api.open-meteo.com/v1/forecast?latitude=${day.geo.lat}&longitude=${day.geo.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,uv_index_max&timezone=${encodeURIComponent(tz)}&start_date=${dateStr}&end_date=${dateStr}`;

      const headers = {};
      if (url.includes('/weather/forecast') && typeof API !== 'undefined' && API.getToken) {
        headers['Authorization'] = 'Bearer ' + API.getToken();
      }
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });

      // Detect auth redirect (Authelia 302 followed by fetch → HTML login page)
      if (resp.redirected && resp.url && resp.url.includes('auth.')) {
        if (!_authReloadDone) {
          _authReloadDone = true;
          window.location.reload();
          return;
        }
        paintUnavailable(container, 'Session expirée — <a href="javascript:location.reload()" style="color:var(--accent)">recharger</a>');
        return;
      }

      let data = null;
      try { data = await resp.json(); } catch (_) { data = null; }

      // If resp is OK but data is null (HTML body, not JSON) → likely auth issue
      if (resp.ok && data === null) {
        if (!_authReloadDone) {
          _authReloadDone = true;
          window.location.reload();
          return;
        }
        paintUnavailable(container, 'Session expirée — <a href="javascript:location.reload()" style="color:var(--accent)">recharger</a>');
        return;
      }

      // Check for failure (works with both backend and Open-Meteo responses)
      const fail = forecastFailure(resp, data);
      if (fail && !(data && data.days && data.days.length)) {
        paintUnavailable(container, fail);
        return;
      }

      // Normalize response: backend returns {days: [{...}]}, Open-Meteo returns {daily: {...}}
      let code, tMax, tMin, rain, wind, uv, provider;
      if (data && data.days && data.days.length) {
        const d = data.days[0];
        code = d.weatherCode;
        tMax = Math.round(d.tempMax);
        tMin = Math.round(d.tempMin);
        rain = d.precipProbability || 0;
        wind = Math.round(d.windMaxKmh || 0);
        uv = d.uvMax ? Math.round(d.uvMax) : null;
        provider = d.provider || '';
      } else if (data && data.daily && dailySlotUsable(data.daily, 0)) {
        const daily = data.daily;
        code = daily.weathercode[0];
        tMax = Math.round(daily.temperature_2m_max[0]);
        tMin = Math.round(daily.temperature_2m_min[0]);
        rain = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
        wind = Math.round((daily.windspeed_10m_max && daily.windspeed_10m_max[0]) || 0);
        uv = daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : null;
        provider = 'open-meteo';
      } else {
        paintUnavailable(container, MSG_TOO_FAR);
        return;
      }

      const icon = WMO_ICONS[code] || '🌤️';
      const desc = WMO_DESC[code] || 'Inconnu';

      let html = `<div style="font-size:2em;margin:8px 0">${icon}</div>`;
      html += `<div style="font-size:1.1em;font-weight:600;color:var(--text)">${esc(desc)}</div>`;
      html += `<div style="margin:8px 0;font-size:1.2em">🌡️ <strong>${tMin}°</strong> → <strong>${tMax}°C</strong></div>`;
      html += `<div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap">`;
      if (rain > 0) html += `<span>🌧️ ${rain}%</span>`;
      html += `<span>💨 ${wind} km/h</span>`;
      if (uv !== null) html += `<span>${uv >= 8 ? '🔴' : uv >= 6 ? '🟠' : uv >= 3 ? '🟡' : '🟢'} UV ${uv}</span>`;
      html += `</div>`;
      const provLabel = provider === 'msc' ? 'Météo Canada' : provider === 'nws' ? 'NWS' : 'Open-Meteo';
      html += `<div style="margin-top:6px;font-size:.72em;color:var(--muted)">📍 ${esc(day.to || day.from)} · ${provLabel} · Tap pour détails</div>`;

      cache[cacheKey] = html;
      container.innerHTML = html;
    } catch (e) {
      const msg = (e && e.name === 'TimeoutError') ? 'Météo erreur : timeout (10s)'
        : (e && e.name === 'AbortError') ? 'Météo erreur : requête annulée'
        : (e && e.message) ? 'Météo erreur : ' + String(e.message).slice(0, 80)
        : errorMessage(e);
      paintUnavailable(container, msg);
    }
  }

  /**
   * Open detailed weather modal (hourly + 3-day + dress advice)
   */
  async function openModal(day) {
    if (!day || !day.geo) return;
    if (!navigator.onLine) return;

    const rawDate = dayDate(day.day, day);
    const dateStr = clampForecastDate(rawDate);
    const tz = day.geo.tz || 'UTC';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'weather-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="weather-modal">
      <button class="wm-close" onclick="this.closest('.weather-modal-overlay').remove()">✕</button>
      <div class="wm-title">🌤️ Météo — ${esc(day.dow || '')} ${esc(day.date || '')} · ${esc(day.to || day.from || '')}</div>
      <div id="wmContent" style="color:var(--muted);text-align:center;padding:20px 0">Chargement…</div>
    </div>`;
    document.body.appendChild(overlay);

    if (isBeyondForecast(rawDate)) {
      document.getElementById('wmContent').innerHTML = `<em>${MSG_TOO_FAR}</em>`;
      return;
    }

    const cacheKey = `detail_${day.geo.lat},${day.geo.lon},${dateStr}`;
    let data = detailCache[cacheKey];
    if (!data) {
      try {
        const end = new Date(dateStr + 'T12:00:00');
        end.setDate(end.getDate() + 2);
        const endStr = toISODateLocal(end);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${day.geo.lat}&longitude=${day.geo.lon}&hourly=temperature_2m,weathercode,precipitation_probability,precipitation,apparent_temperature&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,uv_index_max,sunrise,sunset&current_weather=true&timezone=${encodeURIComponent(tz)}&start_date=${dateStr}&end_date=${endStr}`;
        const resp = await fetch(url);
        let body = null;
        try { body = await resp.json(); } catch (_) { body = null; }
        const fail = forecastFailure(resp, body);
        if (fail) {
          document.getElementById('wmContent').innerHTML = `<em>${fail}</em>`;
          return;
        }
        data = body;
        detailCache[cacheKey] = data;
      } catch (e) {
        document.getElementById('wmContent').innerHTML = `<em>${errorMessage(e)}</em>`;
        return;
      }
    }

    const daily = data.daily;
    const hourly = data.hourly;
    if (!dailySlotUsable(daily, 0)) {
      document.getElementById('wmContent').innerHTML = `<em>${MSG_TOO_FAR}</em>`;
      return;
    }

    const code = daily.weathercode[0];
    const icon = WMO_ICONS[code] || '🌤️';
    const desc = WMO_DESC[code] || '';
    const tMax = Math.round(daily.temperature_2m_max[0]);
    const tMin = Math.round(daily.temperature_2m_min[0]);
    const rain = daily.precipitation_probability_max[0] || 0;
    const wind = Math.round(daily.windspeed_10m_max[0] || 0);
    const uv = daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : null;
    const sunrise = daily.sunrise ? daily.sunrise[0].split('T')[1] : null;
    const sunset = daily.sunset ? daily.sunset[0].split('T')[1] : null;

    // Hourly 6h-22h
    const hourlyStart = hourly.time.findIndex(t => t.startsWith(dateStr + 'T06'));
    const hourlyEnd = hourly.time.findIndex(t => t.startsWith(dateStr + 'T22'));
    const hLen = (hourlyStart >= 0 && hourlyEnd > hourlyStart) ? hourlyEnd - hourlyStart + 1 : 17;
    const hStart = hourlyStart >= 0 ? hourlyStart : hourly.time.findIndex(t => t.startsWith(dateStr));
    const hSlice = hStart >= 0 ? hourly.time.slice(hStart, hStart + hLen) : [];
    const hTemps = hStart >= 0 ? hourly.temperature_2m.slice(hStart, hStart + hLen) : [];
    const hCodes = hStart >= 0 ? hourly.weathercode.slice(hStart, hStart + hLen) : [];
    const hRain = hStart >= 0 ? hourly.precipitation_probability.slice(hStart, hStart + hLen) : [];
    const hPrecipMm = hStart >= 0 && hourly.precipitation ? hourly.precipitation.slice(hStart, hStart + hLen) : [];

    // Dress advice
    let dress = [];
    if (tMax >= 32) dress.push('☀️ Très chaud — crème solaire SPF50, hydratation ++');
    else if (tMax >= 25) dress.push('😎 Chaud — t-shirt, lunettes de soleil');
    else if (tMax >= 15) dress.push('🧥 Frais — une couche supplémentaire conseillée');
    else dress.push('🧣 Froid — veste chaude, couches multiples');
    if (rain >= 60) dress.push('🌂 Pluie probable — imperméable indispensable');
    else if (rain >= 30) dress.push('🌂 Risque de pluie — prévoir imperméable');
    if (uv && uv >= 8) dress.push('🔴 UV extrême ! Crème solaire, chapeau obligatoire');
    else if (uv && uv >= 6) dress.push('🟠 UV élevés — protection solaire recommandée');
    if (wind >= 40) dress.push('💨 Vent fort — attention aux parois');

    let html = `<div class="wm-current">
      <div class="wm-icon">${icon}</div>
      <div>
        <div class="wm-temps">${tMin}° → ${tMax}°C</div>
        <div class="wm-desc">${esc(desc)}</div>
      </div>
    </div>
    <div class="wm-grid">
      ${rain > 0 ? `<div class="wm-stat"><div class="ws-val">🌧️ ${rain}%</div><div class="ws-lbl">Précipitations</div></div>` : ''}
      <div class="wm-stat"><div class="ws-val">💨 ${wind}</div><div class="ws-lbl">km/h vent</div></div>
      ${uv !== null ? `<div class="wm-stat"><div class="ws-val">${uv >= 8 ? '🔴' : uv >= 6 ? '🟠' : uv >= 3 ? '🟡' : '🟢'} ${uv}</div><div class="ws-lbl">Indice UV</div></div>` : ''}
      ${sunrise ? `<div class="wm-stat"><div class="ws-val">🌅 ${sunrise}</div><div class="ws-lbl">Lever</div></div>` : ''}
      ${sunset ? `<div class="wm-stat"><div class="ws-val">🌇 ${sunset}</div><div class="ws-lbl">Coucher</div></div>` : ''}
    </div>`;

    // Hourly
    if (hSlice.length > 0) {
      html += `<div class="wm-section">🕐 Prévisions horaires</div><div class="wm-hourly">`;
      hSlice.forEach((t, i) => {
        const hour = t.split('T')[1]?.slice(0, 5) || '';
        const hIcon = WMO_ICONS[hCodes[i]] || '🌤️';
        const hTemp = Math.round(hTemps[i]);
        const hr = hRain[i] || 0;
        html += `<div class="wm-hour">
          <div class="wh-time">${hour}</div>
          <div class="wh-icon">${hIcon}</div>
          <div class="wh-temp">${hTemp}°</div>
          ${hr > 20 ? `<div class="wh-rain">${hr}%</div>` : ''}
        </div>`;
      });
      html += `</div>`;

      // Precipitation mm bars
      const hasRain = hPrecipMm.some(v => v > 0);
      if (hasRain) {
        html += `<div class="wm-section" style="margin-top:8px">🌧️ Précipitations (mm/h)</div><div class="wm-hourly">`;
        hSlice.forEach((t, i) => {
          const hour = t.split('T')[1]?.slice(0, 5) || '';
          const mm = hPrecipMm[i] || 0;
          const barH = Math.min(mm * 10, 40);
          const color = mm >= 5 ? '#e94560' : mm >= 1 ? '#f0a500' : '#4ecdc4';
          html += `<div class="wm-hour">
            <div class="wh-time">${hour}</div>
            <div style="height:40px;display:flex;align-items:flex-end;justify-content:center">
              <div style="width:14px;height:${barH}px;background:${color};border-radius:3px 3px 0 0;min-height:${mm > 0 ? 3 : 0}px"></div>
            </div>
            <div style="font-size:.7em;color:${color};font-weight:600">${mm > 0 ? mm.toFixed(1) : '-'}</div>
          </div>`;
        });
        html += `</div>`;
      }
    }

    // 3-day forecast
    if (daily.time.length > 1) {
      html += `<div class="wm-section">📅 Prévisions</div>`;
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      for (let di = 0; di < Math.min(3, daily.time.length); di++) {
        const dt = new Date(daily.time[di] + 'T12:00:00');
        const dCode = daily.weathercode[di];
        const dIcon = WMO_ICONS[dCode] || '🌤️';
        const dMax = Math.round(daily.temperature_2m_max[di]);
        const dMin = Math.round(daily.temperature_2m_min[di]);
        const dRain = daily.precipitation_probability_max[di] || 0;
        html += `<div class="wm-day">
          <div class="wd-icon">${dIcon}</div>
          <div class="wd-date">${dayNames[dt.getDay()]} ${daily.time[di].slice(8, 10)}/${daily.time[di].slice(5, 7)}${dRain > 30 ? ' 🌧️' + dRain + '%' : ''}</div>
          <div class="wd-temps">${dMin}° → ${dMax}°</div>
        </div>`;
      }
    }

    // Dress advice
    if (dress.length > 0) {
      html += `<div class="wm-section">👗 Quoi mettre</div>
      <div class="wm-dress">${dress.join('<br>')}</div>`;
    }

    document.getElementById('wmContent').innerHTML = html;
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { renderInline, openModal, isBeyondForecast, dailySlotUsable, forecastFailure, errorMessage, clampForecastDate, daysFromToday, MSG_TOO_FAR, MSG_OFFLINE };
})();
