/**
 * bookings-view.js — Onglet Résa : vols, voiture, ferry, events, hôtels.
 * Documents voyageurs → onglet Plus (section repliable).
 *
 * Tags: same language as hotel amenities — `.badge` chips + cancellation 🟢🔴⚠️.
 */

var BookingsView = (() => {

  const _hotelNuisanceAborts = new Map();

  function abortHotelNuisanceStreams() {
    _hotelNuisanceAborts.forEach(ac => { try { ac.abort(); } catch (_) { /* déjà terminé */ } });
    _hotelNuisanceAborts.clear();
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z');
    if (isNaN(d)) return esc(iso);
    const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
    return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
  }

  function formatDateTime(iso) {
    if (!iso) return '';
    const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (m) return formatDate(m[1]) + ' · ' + m[2];
    return formatDate(iso);
  }

  /** Parse leading 🟢🔴⚠️ from cancellation → badge class + short label. */
  function cancellationBadge(cancellation) {
    if (!cancellation) return '';
    const raw = String(cancellation).trim();
    let cls = 'badge-orange';
    let label = '⚠️ À vérifier';
    if (raw.startsWith('🟢')) {
      cls = 'badge-green';
      label = '🟢 Flexible';
    } else if (raw.startsWith('🔴')) {
      cls = 'badge-red';
      label = '🔴 Non remboursable';
    } else if (raw.startsWith('⚠️') || raw.startsWith('⚠')) {
      cls = 'badge-orange';
      label = '⚠️ À vérifier';
    } else {
      // No emoji prefix — still show a muted chip, full text in details
      cls = 'badge-muted';
      label = 'Annulation';
    }
    return `<span class="badge ${cls}" title="${esc(raw)}">${label}</span>`;
  }

  /**
   * Type chip + cancellation + tags[] (+ optional derived).
   * @param {{ typeLabel: string, cancellation?: string, tags?: string[]|string, derived?: string[] }}
   */
  function renderBookingTags({ typeLabel, cancellation, tags, derived }) {
    const chips = [];
    if (typeLabel) chips.push(`<span class="badge badge-accent">${esc(typeLabel)}</span>`);
    const cancelChip = cancellationBadge(cancellation);
    if (cancelChip) chips.push(cancelChip);

    const list = Array.isArray(tags) ? tags : tags ? [tags] : [];
    list.forEach(t => {
      if (t) chips.push(`<span class="badge badge-green">${esc(t)}</span>`);
    });
    (derived || []).forEach(t => {
      if (t) chips.push(`<span class="badge badge-green">${esc(t)}</span>`);
    });

    if (!chips.length) return '';
    return `<div class="booking-tags">${chips.join('')}</div>`;
  }

  function bookingCard({ icon, title, metaLines, tagsHtml, detailsHtml }) {
    let html = `<div class="booking-card">`;
    html += `<div class="booking-header">`;
    html += `<span class="booking-icon">${icon || '📋'}</span>`;
    html += `<span class="booking-title">${esc(title)}</span>`;
    html += `</div>`;
    if (metaLines && metaLines.length) {
      html += `<div class="booking-meta">`;
      metaLines.forEach(line => { if (line) html += `<div>${line}</div>`; });
      html += `</div>`;
    }
    if (tagsHtml) html += tagsHtml;
    if (detailsHtml) html += `<div class="booking-details">${detailsHtml}</div>`;
    html += `</div>`;
    return html;
  }

  function sectionTitle(emoji, label) {
    return `<div class="booking-section-title">${emoji} ${esc(label)}</div>`;
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  /** True when a flight leg has real booking data (not seed placeholders like n/a). */
  function isRealFlightLeg(leg) {
    if (!leg || typeof leg !== 'object') return false;
    const na = (v) => {
      const s = String(v == null ? '' : v).trim().toLowerCase();
      return !s || s === 'n/a' || s === 'na' || s === '-' || s === '?';
    };
    const segs = Array.isArray(leg.segments) ? leg.segments : [];
    if (segs.length > 0) {
      return segs.some(s => s && !na(s.from) && !na(s.to) && !na(s.dep));
    }
    // Flat leg: need a real route + departure (ignore airline/pnr = "n/a")
    if (!na(leg.from) && !na(leg.to) && !na(leg.dep)) return true;
    if (!na(leg.dep) && !na(leg.flight) && !na(leg.airline)) return true;
    return false;
  }

  /** Count traveler documents for Plus header badge. */
  function countDocuments(tripData) {
    if (typeof PeopleHelpers === 'undefined') return 0;
    let n = 0;
    PeopleHelpers.withDocuments(tripData).forEach((person) => {
      (person.documents || []).forEach((doc) => {
        if (doc && typeof doc === 'object') n++;
      });
    });
    return n;
  }

  /** Document booking cards (shared body for Plus collapse). */
  function renderDocumentsCards(tripData) {
    if (typeof PeopleHelpers === 'undefined') return '';
    const folks = PeopleHelpers.withDocuments(tripData);
    if (!folks.length) return '';

    let html = '';
    folks.forEach((person) => {
      (person.documents || []).forEach((doc) => {
        if (!doc || typeof doc !== 'object') return;
        const meta = [];
        if (doc.number) meta.push(`🔖 ${esc(doc.number)}`);
        if (doc.passport) meta.push(`🛂 Passeport ${esc(doc.passport)}`);
        if (doc.expiry || doc.passportExpiry) {
          meta.push(`📅 Exp. ${formatDate(doc.expiry || doc.passportExpiry)}`);
        }
        if (doc.approved) meta.push(`✅ Approuvé ${formatDate(doc.approved)}`);
        if (doc.caseRef) meta.push(`📁 Dossier ${esc(doc.caseRef)}`);

        let details = '';
        if (doc.fullName) details += `<div>👤 ${esc(doc.fullName)}</div>`;
        if (doc.note) details += `<div class="booking-note">${esc(doc.note)}</div>`;
        if (Array.isArray(person.loyalty) && person.loyalty.length && doc.type === 'passport') {
          person.loyalty.forEach((L) => {
            if (L && L.program) {
              details += `<div>✈️ ${esc(L.program)}${L.number ? ' · ' + esc(L.number) : ''}</div>`;
            }
          });
        }

        html += bookingCard({
          icon: doc.type === 'eta-canada' ? '🇨🇦' : (doc.type === 'esta-usa' ? '🇺🇸' : '🛂'),
          title: `${person.emoji || ''} ${esc(person.name || '')} — ${esc(doc.label || doc.type || 'Document')}`.trim(),
          metaLines: meta,
          tagsHtml: renderBookingTags({
            typeLabel: doc.type === 'eta-canada' ? 'AVE' : (doc.type === 'esta-usa' ? 'ESTA' : 'Document'),
            cancellation: doc.note && /🔴|⚠️/.test(doc.note) ? doc.note : null,
            tags: doc.tags,
          }),
          detailsHtml: details,
        });
      });
    });
    return html;
  }

  /**
   * Plus tab: Documents collapsed by default (click header to expand).
   * Empty when no traveler docs on this trip.
   */
  function renderDocumentsCollapsed(tripData) {
    const cards = renderDocumentsCards(tripData);
    if (!cards) return '';
    const n = countDocuments(tripData);
    // Same rhythm as Listes / Voyage actif: section title is the click target.
    return `<div class="section-wrap plus-docs-wrap" id="plus-docs-wrap" style="margin-top:24px;border:none;background:transparent">
        <div class="section-head collapsed plus-docs-head" id="plus-docs-head" role="button" tabindex="0"
          aria-expanded="false" aria-controls="plus-docs-body">
          <span class="s-emoji">🛂</span>
          <span class="s-title">Documents</span>
          <span class="s-count">${n}</span>
          <span class="s-chevron">▼</span>
        </div>
        <div class="section-body hidden plus-docs-body" id="plus-docs-body">${cards}</div>
      </div>`;
  }

  function bindDocumentsCollapse(root) {
    const head = (root || document).querySelector('#plus-docs-head');
    const body = (root || document).querySelector('#plus-docs-body');
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

  function renderFlightsSection(flights) {
    if (!flights) return '';
    const outbound = flights.outbound || flights.aller;
    const inbound = flights.inbound || flights.return || flights.retour;
    const outOk = isRealFlightLeg(outbound);
    const inOk = isRealFlightLeg(inbound);
    if (!outOk && !inOk) return '';

    let html = sectionTitle('✈️', 'Transport principal');

    const effectiveFlightStatus = flights.bookingStatus || (flights.bookingRef ? 'booked' : '');
    if (effectiveFlightStatus && typeof HotelCard !== 'undefined') {
      html += HotelCard.renderStatusBadge(effectiveFlightStatus);
    }
    if (flights.bookingUrl) {
      html += `<div style="margin:0 0 8px 12px"><a href="${esc(flights.bookingUrl)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px">🔗 Agence / Compagnie</a></div>`;
    }
    if (flights.bookingRef && !effectiveFlightStatus) {
      html += `<div style="margin:0 0 8px 12px">🔖 Ref: <strong>${esc(flights.bookingRef)}</strong></div>`;
    }

    function flightCard(leg, label) {
      if (!isRealFlightLeg(leg)) return '';
      const segs = Array.isArray(leg.segments) ? leg.segments : null;
      let route = '';
      let when = '';
      if (segs && segs.length) {
        route = segs[0].from + ' → ' + segs[segs.length - 1].to;
        when = formatDateTime(segs[0].dep);
      } else {
        route = (leg.from || '') + (leg.to ? ' → ' + leg.to : '');
        when = formatDateTime(leg.dep);
      }
      const meta = [];
      if (when) meta.push(`📅 ${when}`);
      if (leg.pnr) meta.push(`🔖 PNR: <strong>${esc(leg.pnr)}</strong>`);
      if (leg.price) meta.push(`💶 ${esc(leg.price)}`);
      if (leg.airline) meta.push(`✈️ ${esc(leg.airline)}${leg.class ? ' · ' + esc(leg.class) : ''}`);

      const legStatus = leg.bookingStatus || (leg.bookingRef ? 'booked' : '');

      let details = '';
      if (legStatus && typeof HotelCard !== 'undefined') {
        details += HotelCard.renderStatusBadge(legStatus);
      }
      if (leg.bookingUrl) {
        details += `<div><a href="${esc(leg.bookingUrl)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px">🔗 Réserver</a></div>`;
      }

      if (segs && segs.length) {
        details += segs.map(s =>
          `<div>${esc(s.flight || '')} ${esc(s.from)}→${esc(s.to)} · ${esc(formatDateTime(s.dep))} → ${esc(formatDateTime(s.arr))}${s.duration ? ' (' + esc(s.duration) + ')' : ''}</div>`
        ).join('');
      } else if (leg.arr) {
        details += `<div>🛬 Arrivée: ${esc(formatDateTime(leg.arr))}${leg.duration ? ' (' + esc(leg.duration) + ')' : ''}</div>`;
      }
      if (leg.layover) details += `<div>🔁 Escales: ${esc(leg.layover)}</div>`;
      if (leg.note) details += `<div class="booking-note">${esc(leg.note)}</div>`;
      if (leg.cancellation) details += `<div class="booking-note">${esc(leg.cancellation)}</div>`;

      return bookingCard({
        icon: '✈️',
        title: `${label}${route ? ' — ' + route : ''}`,
        metaLines: meta,
        tagsHtml: renderBookingTags({
          typeLabel: 'Vol',
          cancellation: leg.cancellation,
          tags: leg.tags,
        }),
        detailsHtml: details,
      });
    }

    if (outOk) html += flightCard(outbound, 'Vol aller');
    if (inOk) html += flightCard(inbound, 'Vol retour');
    return html;
  }

  function renderCarRentalSection(car) {
    if (!car) return '';
    let html = sectionTitle('🚗', 'Location de voiture');

    const effectiveStatus = car.bookingStatus || (car.bookingRef ? 'booked' : '');

    const pickup = car.pickup || {};
    const ret = car.return || {};
    const meta = [];
    if (pickup.date || ret.date) {
      meta.push(`📅 ${formatDate(pickup.date)}${pickup.time ? ' ' + esc(pickup.time) : ''} → ${formatDate(ret.date)}${ret.time ? ' ' + esc(ret.time) : ''}`);
    }
    if (car.bookingRef) meta.push(`🔖 Réf: <strong>${esc(car.bookingRef)}</strong>`);
    if (car.avisRef) meta.push(`Avis #${esc(car.avisRef)}`);
    if (car.price) meta.push(`💶 ${esc(car.price)}`);
    if (car.vehicle) meta.push(`🚙 ${esc(car.vehicle)}`);

    const derived = [];
    if (car.fuelPolicy && /plein/i.test(car.fuelPolicy)) derived.push('Plein fait');
    if (car.mileage && /illimit/i.test(car.mileage)) derived.push('Km illimité');

    const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    let details = '';

    if (effectiveStatus && typeof HotelCard !== 'undefined') {
      details += HotelCard.renderStatusBadge(effectiveStatus);
    }
    if (car.bookingUrl) {
      details += `<div><a href="${esc(car.bookingUrl)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px;margin-bottom:6px">🔗 Agence</a></div>`;
    }

    if (pickup.agency || pickup.address) {
      const addr = pickup.address || '';
      details += `<div>📍 Prise: ${esc(pickup.agency || '')}${addr ? ' — ' + esc(addr) + ' <a href="' + mapsUrl(addr) + '" target="_blank" class="hotel-link-btn">📍 Maps</a>' : ''}</div>`;
    }
    if (ret.agency || ret.address) {
      const addr = ret.address || '';
      details += `<div>📍 Retour: ${esc(ret.agency || '')}${addr ? ' — ' + esc(addr) + ' <a href="' + mapsUrl(addr) + '" target="_blank" class="hotel-link-btn">📍 Maps</a>' : ''}</div>`;
    }
    if (car.driver) details += `<div>👤 ${esc(car.driver)}</div>`;
    if (car.documents) details += `<div>📋 ${esc(car.documents)}</div>`;
    if (car.cancellation) details += `<div class="booking-note">${esc(car.cancellation)}</div>`;
    if (car.notes) details += `<div class="booking-note">${esc(car.notes)}</div>`;

    html += bookingCard({
      icon: '🚗',
      title: (car.provider || 'Location') + (car.vehicle ? ' — ' + car.vehicle : ''),
      metaLines: meta,
      tagsHtml: renderBookingTags({
        typeLabel: 'Voiture',
        cancellation: car.cancellation,
        tags: car.tags,
        derived,
      }),
      detailsHtml: details,
    });
    return html;
  }

  function renderFerrySection(ferryOrList) {
    const list = Array.isArray(ferryOrList)
      ? ferryOrList
      : (ferryOrList ? [ferryOrList] : []);
    if (!list.length) return '';

    let html = sectionTitle('⛴️', list.length > 1 ? 'Ferrys / Traversées' : 'Ferry / Traversier');

    list.forEach((ferry) => {
      if (!ferry || typeof ferry !== 'object') return;
      const meta = [];
      if (ferry.date) meta.push(`📅 ${formatDate(ferry.date)}${ferry.time ? ' · ' + esc(ferry.time) : ''}`);
      if (ferry.arrDate || ferry.arr) {
        meta.push(`🛬 ${formatDate(ferry.arrDate || ferry.arr)}${ferry.arrTime ? ' · ' + esc(ferry.arrTime) : ''}`);
      }
      if (ferry.orderRef) meta.push(`🔖 #${esc(ferry.orderRef)}`);
      if (ferry.total) meta.push(`💶 ${esc(ferry.total)}`);
      if (ferry.operator) meta.push(`⛴️ ${esc(ferry.operator)}`);
      if (ferry.vehicle) meta.push(`🚙 ${esc(ferry.vehicle)}`);

      const derived = [];
      if (ferry.balance) derived.push('Solde au quai');
      if (ferry.cabin) derived.push('Cabine');

      let details = '';
      if (ferry.deposit) details += `<div>💳 Acompte: ${esc(ferry.deposit)}</div>`;
      if (ferry.balance) details += `<div>💰 Solde: ${esc(ferry.balance)}</div>`;
      if (ferry.cabin) details += `<div>🛏️ ${esc(ferry.cabin)}</div>`;
      if (ferry.note) details += `<div class="booking-note">${esc(ferry.note)}</div>`;
      if (ferry.cancellation) details += `<div class="booking-note">${esc(ferry.cancellation)}</div>`;

      html += bookingCard({
        icon: '⛴️',
        title: ferry.route || ferry.operator || 'Ferry',
        metaLines: meta,
        tagsHtml: renderBookingTags({
          typeLabel: 'Ferry',
          cancellation: ferry.cancellation,
          tags: ferry.tags,
          derived,
        }),
        detailsHtml: details,
      });
    });
    return html;
  }

  function renderEventsSection(events) {
    if (!events || typeof events !== 'object') return '';
    const entries = Object.entries(events).filter(([, e]) => e && e.name);
    if (!entries.length) return '';

    entries.sort(([, a], [, b]) => String(a.date || '').localeCompare(String(b.date || '')));

    let html = sectionTitle('🎪', 'Événements');
    entries.forEach(([, evt]) => {
      const meta = [];
      if (evt.date) meta.push(`📅 ${formatDate(evt.date)}${evt.time ? ' · ' + esc(evt.time) : ''}`);
      if (evt.orderRef) meta.push(`🔖 #${esc(evt.orderRef)}`);
      if (evt.total) meta.push(`💶 ${esc(evt.total)}`);
      if (evt.seats) meta.push(`💺 ${esc(evt.seats)}`);
      if (evt.phone) meta.push(`📞 <a href="tel:${esc(evt.phone)}">${esc(evt.phone)}</a>`);

      let details = '';
      if (Array.isArray(evt.items) && evt.items.length) {
        details += evt.items.map(it =>
          `<div>• ${esc(it.name)}${it.time ? ' · ' + esc(it.time) : ''}${it.qty ? ' ×' + esc(it.qty) : ''}${it.total ? ' — ' + esc(it.total) : ''}</div>`
        ).join('');
      }
      if (evt.cancellation) details += `<div class="booking-note">${esc(evt.cancellation)}</div>`;

      html += bookingCard({
        icon: '🎪',
        title: evt.name,
        metaLines: meta,
        tagsHtml: renderBookingTags({
          typeLabel: 'Event',
          cancellation: evt.cancellation,
          tags: evt.tags,
        }),
        detailsHtml: details,
      });
    });
    return html;
  }

  function renderHotelsSection(tripData) {
    if (!tripData || !tripData.days) return '';

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId() : null;

    let body = '';
    const seen = new Set();
    const days = tripData.days.map(d => (typeof DayHelpers !== 'undefined' ? DayHelpers.enrich(d, tripData) : d));

    // J0 = veille à la maison (pas de hotelId) — ancrage calendrier
    const day0 = days.find(d => d.day === 0);
    if (day0 && !day0.hotelId && !day0.hotel) {
      body += `<div class="booking-hotel-day">Jour 0 · ${esc(day0.date || '')} — Maison</div>`;
      body += `<div class="booking-note" style="margin:0 0 12px">🏠 Préparation à la maison (veille du départ)</div>`;
    }

    days.forEach(day => {
      // Normalized seeds: only hotelId (ignore legacy day.hotel pollution from stale merges)
      const key = day.hotelId;
      if (!key || key === '—' || key === '') return;
      if (seen.has(key)) return;
      seen.add(key);
      const hotelData = typeof HotelCard !== 'undefined' ? HotelCard.fromDay(day, tripData.hotels) : null;
      if (!hotelData) return;

      let headerDate = day.date || '';
      if (hotelData.dates && hotelData.dates.checkin) {
        headerDate = formatDate(hotelData.dates.checkin);
      }
      let headerCity = day.to || '';
      if (!headerCity && day.locationId) {
        headerCity = day.locationId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      if (!headerCity) headerCity = day.from || '';

      // day.day is already the calendar day index (0 = veille, 1 = startDate)
      body += `<div class="booking-hotel-day">Jour ${day.day} · ${esc(headerDate)} — ${esc(headerCity)}</div>`;
      body += HotelCard.render(hotelData);

      // Cible de l'analyse : l'HÔTEL d'abord, l'étape en repli. Le backend
      // accepte les deux ids ; avec l'id d'hôtel, un hôtel réservé est analysé à
      // sa propre adresse et deux hôtels d'une même ville ont enfin deux
      // verdicts distincts (avant, l'id d'étape donnait le même à tous).
      const targetId = key || day.locationId;
      if (targetId) {
        body += `<div class="hotel-nuisance-action" style="margin:-4px 0 12px;padding:0 12px">
          <button class="btn btn-sm hotel-nuisance-btn" data-location-id="${esc(targetId)}" data-trip-id="${esc(tripId || '')}">
            ⚠️ Nuisances
          </button>
          <div class="hotel-nuisance-result" data-loc="${esc(targetId)}"></div>
        </div>`;
      }
    });

    if (!body) return '';
    return sectionTitle('🏨', 'Hébergements') + body;
  }

  function themeEmoji(theme) {
    if (!theme) return '🎯';
    const map = {
      eau: '🌊', water: '🌊',
      nature: '🌿', randonnee: '🥾', hiking: '🥾',
      culture: '🏛️', histoire: '🏛️', history: '🏛️',
      sport: '⚽', aventure: '🧗', adventure: '🧗',
      gastronomie: '🍷', food: '🍽️',
      famille: '👨‍👩‍👧‍👦', family: '👨‍👩‍👧‍👦',
      detente: '🧘', relaxation: '🧘',
      animaux: '🐻', wildlife: '🐻',
      urbain: '🏙️', city: '🏙️',
      musique: '🎵', music: '🎵',
    };
    return map[theme.toLowerCase()] || '🎯';
  }

  function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  function renderActivitiesSection(tripData) {
    if (!tripData || !tripData.activities) return '';

    const activities = tripData.activities;
    const entries = Object.values(activities).filter(a => a && a.name);
    if (!entries.length) return '';

    const byDay = {};
    entries.forEach(act => {
      const d = act.dayNum || 0;
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(act);
    });

    const dayKeys = Object.keys(byDay).map(Number).sort((a, b) => a - b);

    let html = sectionTitle('🎯', 'Activités');

    dayKeys.forEach(dayNum => {
      html += `<div class="booking-hotel-day">Jour ${dayNum}</div>`;
      byDay[dayNum].forEach(act => {
        const emoji = themeEmoji(act.theme);
        const duration = formatDuration(act.durationMin);
        const price = act.price ? `${act.price} ${esc(act.currency || '')}` : '';

        const meta = [];
        if (duration) meta.push(`⏱️ ${esc(duration)}`);
        if (price) meta.push(`💶 ${esc(price)}`);
        if (act.locationId) {
          const loc = act.locationId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          meta.push(`📍 ${esc(loc)}`);
        }

        let details = '';
        if (act.bookingStatus && typeof HotelCard !== 'undefined') {
          details += HotelCard.renderStatusBadge(act.bookingStatus);
        }
        if (act.bookingUrl) {
          details += `<div><a href="${esc(act.bookingUrl)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px">🔗 Réserver</a></div>`;
        }
        if (act.url) {
          details += `<div><a href="${esc(act.url)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px">🌐 Info</a></div>`;
        }
        if (act.bookingRef) {
          details += `<div style="margin-top:4px">🔖 Réf: <strong>${esc(act.bookingRef)}</strong></div>`;
        }

        html += bookingCard({
          icon: emoji,
          title: act.name,
          metaLines: meta,
          tagsHtml: renderBookingTags({
            typeLabel: act.theme ? esc(act.theme) : 'Activité',
            tags: [],
          }),
          detailsHtml: details,
        });
      });
    });

    return html;
  }

  /**
   * @param {string} containerId
   * @param {Object} tripData
   */
  function render(containerId, tripData) {
    const container = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : containerId;
    if (!container) return;

    abortHotelNuisanceStreams();

    if (!tripData) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">📋</div>
        <h3>Aucune réservation</h3>
      </div>`;
      return;
    }

    let html = `<div class="page-header">
      <h1>📋 Réservations</h1>
      <div class="sub">${tripData.trip ? esc(tripData.trip.name) : ''}</div>
    </div>`;

    html += renderFlightsSection(tripData.flights);
    html += renderCarRentalSection(tripData.carRental);
    html += renderFerrySection(tripData.ferries || tripData.ferry);
    html += renderEventsSection(tripData.events);
    html += renderHotelsSection(tripData);
    html += renderActivitiesSection(tripData);

    const hasAnything = /booking-card|hotel-card/.test(html);
    if (!hasAnything) {
      html += `<div class="empty-state"><div class="empty-emoji">📋</div><h3>Aucune réservation</h3></div>`;
    }

    container.innerHTML = html;
    bindHotelNuisanceButtons(container);
  }

  function bindHotelNuisanceButtons(container) {
    if (!container) return;
    container.querySelectorAll('.hotel-nuisance-btn').forEach(btn => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const locId = btn.dataset.locationId;
        const tripId = btn.dataset.tripId || (typeof Store !== 'undefined' && Store.getCurrentTripId ? Store.getCurrentTripId() : null);
        if (!locId || !tripId) return;

        const resultEl = btn.parentElement.querySelector('.hotel-nuisance-result');
        btn.disabled = true;
        btn.textContent = '...';

        const res = await API.runNuisanceCheck(tripId, [locId]);

        btn.disabled = false;
        btn.textContent = '⚠️ Nuisances';

        if (!res.ok) {
          if (resultEl) resultEl.innerHTML = `<div class="construction-error" style="font-size:.82em;margin-top:6px">${esc(res.error || 'Erreur')}</div>`;
          return;
        }

        const previous = _hotelNuisanceAborts.get(locId) || btn._nuisanceAbort;
        if (previous) previous.abort();
        const ac = new AbortController();
        btn._nuisanceAbort = ac;
        _hotelNuisanceAborts.set(locId, ac);

        try {
          await NuisanceStream.start(resultEl, {
            tripId,
            data: res.data,
            signal: ac.signal,
            compact: true,
            locationId: locId,
          });
        } finally {
          if (_hotelNuisanceAborts.get(locId) === ac) _hotelNuisanceAborts.delete(locId);
        }
      });
    });
  }

  return {
    render,
    abortHotelNuisanceStreams,
    renderBookingTags,
    cancellationBadge,
    renderDocumentsCollapsed,
    bindDocumentsCollapse,
  };
})();
