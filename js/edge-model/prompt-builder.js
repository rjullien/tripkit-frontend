/**
 * Edge prompt builder — system prompt + trip context from local Store
 * (same facts as Bifrost today/tomorrow, compact for n_ctx 2048 / leftover 1024).
 */
var EdgePrompt = (() => {
  const MAX_CONTEXT_CHARS = 1200;
  const MAX_TIMELINE = 5;
  const MAX_CALENDAR = 6;
  const MAX_HISTORY = 1;
  const MAX_TURN_CHARS = 240;

  const SYSTEM = [
    'Assistant voyage TripKit hors-ligne. Français, court.',
    'CONTEXTE = vérité (aujourd’hui, demain, hôtel, codes). N’invente pas wifi/pin/adresse.',
    'Météo live / prix → Bifrost. Modifier le voyage → Léo.',
  ].join(' ');

  function str(v) {
    if (v == null) return '';
    return String(v).trim();
  }

  function todayISO(tz) {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: tz || 'Europe/Paris' });
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function homeTz(trip) {
    if (typeof TzHelpers !== 'undefined' && TzHelpers.homeTz) return TzHelpers.homeTz(trip || {});
    return str(trip && trip.homeTz) || 'Europe/Paris';
  }

  function tripDayNumber(startDate, iso) {
    if (!startDate || !iso) return null;
    const start = Date.parse(startDate + 'T12:00:00Z');
    const day = Date.parse(iso + 'T12:00:00Z');
    if (!Number.isFinite(start) || !Number.isFinite(day)) return null;
    return Math.round((day - start) / 86400000) + 1;
  }

  function findDay(days, num) {
    if (!Array.isArray(days) || num == null) return null;
    return days.find(d => d && d.day === num) || null;
  }

  function isoForDay(day, trip) {
    if (typeof DayHelpers !== 'undefined' && DayHelpers.isoDate) {
      return DayHelpers.isoDate(day, trip) || '';
    }
    return '';
  }

  function enrich(day, tripData) {
    if (typeof DayHelpers !== 'undefined' && DayHelpers.enrich) {
      return DayHelpers.enrich(day, tripData);
    }
    return day;
  }

  function resolveHotel(day, tripData) {
    if (!day) return null;
    const dict = (tripData && tripData.hotels) || {};
    if (day.hotelId && dict[day.hotelId]) {
      const hotel = dict[day.hotelId];
      if (hotel.wifi || day.hotelWifi || day.wifi) {
        return Object.assign({}, hotel, { wifi: hotel.wifi || day.hotelWifi || day.wifi });
      }
      return hotel;
    }
    if (day.hotel && day.hotel !== '—' && day.hotel !== '-') {
      return {
        name: day.hotel,
        addr: day.hotelAddr,
        wifi: day.hotelWifi || day.wifi,
        access: day.access,
        ref: day.hotelRef,
        checkin: day.checkin,
      };
    }
    return null;
  }

  function formatWifi(wifi) {
    if (!wifi) return '';
    if (typeof wifi === 'string') return wifi;
    const ssid = str(wifi.ssid);
    const pass = str(wifi.pass || wifi.password);
    if (!ssid && !pass) return '';
    return (ssid ? 'SSID ' + ssid : '') + (ssid && pass ? ' / ' : '') + (pass ? 'mdp ' + pass : '');
  }

  function formatHotel(hotel) {
    if (!hotel || !hotel.name) return '';
    const bits = ['Hôtel: ' + str(hotel.name)];
    const addr = str(hotel.addr || hotel.address);
    if (addr) bits.push('Adresse: ' + addr);
    const wifi = formatWifi(hotel.wifi);
    if (wifi) bits.push('Wifi: ' + wifi);
    const access = str(hotel.access);
    if (access) bits.push('Accès/pin: ' + access);
    const ref = str(hotel.confirmationNumber || hotel.ref || hotel.booking);
    if (ref) bits.push('Réf: ' + ref);
    if (hotel.checkin) bits.push('Check-in: ' + str(hotel.checkin));
    if (hotel.checkout) bits.push('Check-out: ' + str(hotel.checkout));
    if (hotel.phone) bits.push('Tél: ' + str(hotel.phone));
    return bits.join('\n');
  }

  function formatTimeline(day) {
    const tl = Array.isArray(day && day.timeline) ? day.timeline.slice(0, MAX_TIMELINE) : [];
    if (!tl.length) return '';
    const lines = tl.map(ev => {
      const t = str(ev && ev.t);
      const d = str(ev && ev.d);
      if (!t && !d) return '';
      return '- ' + (t ? t + ' ' : '') + d;
    }).filter(Boolean);
    return lines.length ? 'Programme:\n' + lines.join('\n') : '';
  }

  function formatResto(day, tripData) {
    const rest = tripData && tripData.restaurants;
    if (!rest || day == null || day.day == null) return '';
    const block = rest[String(day.day)] || rest[day.day];
    if (!block) return '';
    const main = block.main || block;
    const name = str(main.name);
    if (!name) return '';
    const extra = [str(main.note), str(main.price)].filter(Boolean).join(', ');
    return 'Resto: ' + name + (extra ? ' (' + extra + ')' : '');
  }

  function formatHighlights(day) {
    const hs = Array.isArray(day && day.highlights) ? day.highlights.slice(0, 3) : [];
    if (!hs.length) return '';
    return 'Notes: ' + hs.map(h => str(h)).filter(Boolean).join(' · ');
  }

  function formatDayBlock(role, day, tripData, opts) {
    if (!day) return '';
    const en = enrich(day, tripData);
    const head = [
      role,
      'J' + (day.day != null ? day.day : '?'),
      str(en.dow),
      str(en.date) || isoForDay(day, (tripData && tripData.trip) || {}),
      str(day.label),
    ].filter(Boolean).join(' ');
    const parts = [head];
    if (day.from || day.to) {
      parts.push('Trajet: ' + [str(day.from), str(day.to)].filter(Boolean).join(' → '));
    }
    const tl = formatTimeline(en);
    if (tl) parts.push(tl);
    if (!(opts && opts.skipHotel)) {
      const hotel = formatHotel(resolveHotel(day, tripData));
      if (hotel) parts.push(hotel);
    }
    const resto = formatResto(day, tripData);
    if (resto) parts.push(resto);
    const hi = formatHighlights(day);
    if (hi) parts.push(hi);
    return parts.join('\n');
  }

  function formatCalendar(days, trip, aroundDay) {
    if (!Array.isArray(days) || !days.length) return '';
    const center = aroundDay != null ? aroundDay : days[0].day;
    const nearby = days.filter(d => d.day >= center - 1 && d.day <= center + 2);
    const slice = (nearby.length ? nearby : days).slice(0, MAX_CALENDAR);
    const rows = slice.map(d => {
      const en = enrich(d, { trip: trip, days: days });
      const iso = isoForDay(d, trip);
      return 'J' + d.day + ' ' + (en.dow || '') + ' ' + (iso || en.date || '') + ' — ' + str(d.label);
    });
    return 'Calendrier:\n' + rows.join('\n');
  }

  function formatFlights(tripData, today, tomorrow) {
    const f = tripData && tripData.flights;
    if (!f) return '';
    const lines = [];
    ['outbound', 'return', 'inbound'].forEach(k => {
      const fl = f[k];
      if (!fl) return;
      const dep = str(fl.dep).slice(0, 10);
      if (dep && dep !== today && dep !== tomorrow) return;
      lines.push(
        (k === 'outbound' ? 'Vol aller' : 'Vol retour')
        + ': ' + str(fl.from) + '→' + str(fl.to)
        + (fl.dep ? ' ' + str(fl.dep) : '')
        + (fl.pnr ? ' PNR ' + str(fl.pnr) : '')
      );
    });
    return lines.join('\n');
  }

  function tripContext(opts) {
    try {
      if (typeof Store === 'undefined') return '';
      const tripId = Store.getCurrentTripId && Store.getCurrentTripId();
      if (!tripId) return '';
      const data = Store.getTripData && Store.getTripData(tripId);
      if (!data) return '';
      const trip = data.trip || {};
      const days = Array.isArray(data.days) ? data.days : [];
      const tz = homeTz(trip);
      const nowISO = (opts && opts.nowISO) || todayISO(tz);
      const n = tripDayNumber(trip.startDate, nowISO);
      const dayNums = days.map(d => d.day).filter(x => x != null);
      const minDay = dayNums.length ? Math.min.apply(null, dayNums) : 1;
      const maxDay = dayNums.length ? Math.max.apply(null, dayNums) : 1;
      let state = '';
      if (n != null) {
        if (n < minDay) state = 'before';
        else if (n > maxDay) state = 'after';
        else state = 'during';
      }
      let todayDay = findDay(days, n);
      if (!todayDay && days.length) {
        todayDay = (n != null && n < minDay) ? days[0] : days[days.length - 1];
      }
      const tomorrowNum = todayDay && todayDay.day != null ? todayDay.day + 1 : null;
      const tomorrowDay = findDay(days, tomorrowNum);

      const parts = [];
      const name = str(trip.name || trip.title || tripId);
      parts.push('Voyage: ' + name
        + (trip.startDate ? ' (' + trip.startDate + (trip.endDate ? ' → ' + trip.endDate : '') + ')' : ''));
      parts.push('Maintenant: ' + nowISO + (state ? ' (' + state + ')' : '') + ' TZ ' + tz);
      const cal = formatCalendar(days, trip, todayDay && todayDay.day);
      if (cal) parts.push(cal);
      const todayBlock = formatDayBlock('AUJOURD’HUI', todayDay, data);
      if (todayBlock) parts.push(todayBlock);
      const sameHotel = !!(todayDay && tomorrowDay && todayDay.hotelId && todayDay.hotelId === tomorrowDay.hotelId);
      const tomBlock = formatDayBlock('DEMAIN', tomorrowDay, data, { skipHotel: sameHotel });
      if (tomBlock) parts.push(tomBlock);
      const flights = formatFlights(data, nowISO,
        tomorrowDay ? isoForDay(tomorrowDay, trip) : '');
      if (flights) parts.push(flights);

      let out = parts.filter(Boolean).join('\n\n');
      if (out.length > MAX_CONTEXT_CHARS) out = out.slice(0, MAX_CONTEXT_CHARS - 1) + '…';
      return out;
    } catch (_) {
      return '';
    }
  }

  /**
   * @param {string} userText
   * @param {{role:string,content:string}[]} [history]
   * @param {{nowISO?:string,now?:Date}} [opts]
   * @returns {{role:string,content:string}[]}
   */
  function buildMessages(userText, history, opts) {
    const ctx = tripContext(opts);
    const sys = SYSTEM + (ctx ? '\n\nCONTEXTE\n' + ctx : '\n\n(Pas de voyage chargé.)');
    const msgs = [{ role: 'system', content: sys }];
    const hist = Array.isArray(history) ? history.slice(-MAX_HISTORY) : [];
    for (const m of hist) {
      if (!m || !m.content) continue;
      if (m.role === 'user' || m.role === 'assistant') {
        msgs.push({ role: m.role, content: String(m.content).slice(0, MAX_TURN_CHARS) });
      }
    }
    msgs.push({ role: 'user', content: String(userText || '').slice(0, MAX_TURN_CHARS) });
    return msgs;
  }

  return { SYSTEM, tripContext, buildMessages };
})();
