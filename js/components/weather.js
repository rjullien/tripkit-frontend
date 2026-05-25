/**
 * weather.js — Weather component (Open-Meteo API)
 * Inline weather box (in day header) + detailed modal (click to expand)
 * Ported from voyage-app
 */
var Weather = (() => {

  const WMO_ICONS = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⚡',96:'⚡',99:'⚡'};
  const WMO_DESC = {0:'Ciel dégagé',1:'Peu nuageux',2:'Partiellement nuageux',3:'Couvert',45:'Brouillard',48:'Brouillard givrant',51:'Bruine légère',53:'Bruine',55:'Bruine forte',61:'Pluie légère',63:'Pluie',65:'Forte pluie',71:'Neige légère',73:'Neige',75:'Forte neige',80:'Averses légères',81:'Averses',82:'Averses violentes',95:'Orage',96:'Orage grêle',99:'Orage grêle forte'};

  const cache = {};
  const detailCache = {};

  /**
   * Resolve trip start date dynamically from Store.
   * Falls back to day.date string ("18 avr" etc.) if available,
   * or returns null if no data found.
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

  /**
   * Get ISO date string for a given day number.
   * Uses trip.startDate from backend data — no hardcoded dates.
   * Falls back to approximate date if day has geo.tz (for forecast queries).
   */
  function dayDate(dayNum, day) {
    // Primary: compute from trip start date
    const start = getTripStart();
    if (start) {
      const d = new Date(start);
      d.setDate(d.getDate() + dayNum);
      return d.toISOString().split('T')[0];
    }
    // Fallback: if the day object has a parseable date field (e.g. "2026-04-18")
    if (day && day.isoDate) return day.isoDate;
    // Last resort: today (weather for "today" is always available)
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Fetch and render inline weather box for a day
   * @param {HTMLElement} container — element to render into
   * @param {object} day — day object with .geo, .day, .to, .from
   */
  async function renderInline(container, day) {
    if (!container || !day || !day.geo) return;

    const dateStr = dayDate(day.day, day);
    const cacheKey = `${day.geo.lat},${day.geo.lon},${dateStr}`;

    // Show loading
    container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.85em;padding:8px">🌤️ Chargement météo…</div>';
    container.style.cursor = 'pointer';
    container.onclick = () => openModal(day);

    if (cache[cacheKey]) { container.innerHTML = cache[cacheKey]; return; }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${day.geo.lat}&longitude=${day.geo.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,uv_index_max&timezone=${encodeURIComponent(day.geo.tz || 'UTC')}&start_date=${dateStr}&end_date=${dateStr}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      const daily = data.daily;

      if (!daily || !daily.time || daily.time.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.82em;padding:8px"><em>Météo pas encore dispo (prévisions 16j max)</em></div>';
        return;
      }

      const code = daily.weathercode[0];
      const icon = WMO_ICONS[code] || '🌤️';
      const desc = WMO_DESC[code] || 'Inconnu';
      const tMax = Math.round(daily.temperature_2m_max[0]);
      const tMin = Math.round(daily.temperature_2m_min[0]);
      const rain = daily.precipitation_probability_max[0];
      const wind = Math.round(daily.windspeed_10m_max[0]);
      const uv = daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : null;

      let html = `<div style="font-size:2em;margin:8px 0">${icon}</div>`;
      html += `<div style="font-size:1.1em;font-weight:600;color:var(--text)">${esc(desc)}</div>`;
      html += `<div style="margin:8px 0;font-size:1.2em">🌡️ <strong>${tMin}°</strong> → <strong>${tMax}°C</strong></div>`;
      html += `<div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap">`;
      if (rain > 0) html += `<span>🌧️ ${rain}%</span>`;
      html += `<span>💨 ${wind} km/h</span>`;
      if (uv !== null) html += `<span>${uv >= 8 ? '🔴' : uv >= 6 ? '🟠' : uv >= 3 ? '🟡' : '🟢'} UV ${uv}</span>`;
      html += `</div>`;
      html += `<div style="margin-top:6px;font-size:.72em;color:var(--muted)">📍 ${esc(day.to || day.from)} · Tap pour détails</div>`;

      cache[cacheKey] = html;
      container.innerHTML = html;
    } catch(e) {
      container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.82em;padding:8px"><em>Météo indisponible hors ligne</em></div>';
    }
  }

  /**
   * Open detailed weather modal (hourly + 3-day + dress advice)
   */
  async function openModal(day) {
    if (!day || !day.geo) return;

    const dateStr = dayDate(day.day, day);
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

    const cacheKey = `detail_${day.geo.lat},${day.geo.lon},${dateStr}`;
    let data = detailCache[cacheKey];
    if (!data) {
      try {
        const start = getTripStart() || new Date();
        const end = new Date(start); end.setDate(start.getDate() + day.day + 2);
        const endStr = end.toISOString().split('T')[0];
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${day.geo.lat}&longitude=${day.geo.lon}&hourly=temperature_2m,weathercode,precipitation_probability,precipitation,apparent_temperature&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,uv_index_max,sunrise,sunset&current_weather=true&timezone=${encodeURIComponent(tz)}&start_date=${dateStr}&end_date=${endStr}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('API error');
        data = await resp.json();
        detailCache[cacheKey] = data;
      } catch(e) {
        document.getElementById('wmContent').innerHTML = '<em>Météo indisponible hors ligne</em>';
        return;
      }
    }

    const daily = data.daily;
    const hourly = data.hourly;
    if (!daily || !daily.time || daily.time.length === 0) {
      document.getElementById('wmContent').innerHTML = '<em>Météo pas encore dispo</em>';
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

  return { renderInline, openModal };
})();
