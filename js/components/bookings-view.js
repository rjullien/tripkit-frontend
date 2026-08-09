/**
 * bookings-view.js — Onglet Résa : vols, voiture, ferry, events, hôtels.
 *
 * Tags: same language as hotel amenities — `.badge` chips + cancellation 🟢🔴⚠️.
 */

var BookingsView = (() => {

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

  function renderFlightsSection(flights) {
    if (!flights) return '';
    const outbound = flights.outbound || flights.aller;
    const inbound = flights.inbound || flights.return || flights.retour;
    if (!outbound && !inbound) return '';

    let html = sectionTitle('✈️', 'Vols');

    function flightCard(leg, label) {
      if (!leg) return '';
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

      let details = '';
      if (segs && segs.length) {
        details += segs.map(s =>
          `<div>${esc(s.flight || '')} ${esc(s.from)}→${esc(s.to)} · ${esc(formatDateTime(s.dep))} → ${esc(formatDateTime(s.arr))}${s.duration ? ' (' + esc(s.duration) + ')' : ''}</div>`
        ).join('');
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

    html += flightCard(outbound, 'Vol aller');
    html += flightCard(inbound, 'Vol retour');
    return html;
  }

  function renderCarRentalSection(car) {
    if (!car) return '';
    let html = sectionTitle('🚗', 'Location voiture');

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

    let details = '';
    if (pickup.agency || pickup.address) {
      details += `<div>📍 Prise: ${esc(pickup.agency || '')}${pickup.address ? ' — ' + esc(pickup.address) : ''}</div>`;
    }
    if (ret.agency || ret.address) {
      details += `<div>📍 Retour: ${esc(ret.agency || '')}${ret.address ? ' — ' + esc(ret.address) : ''}</div>`;
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

  function renderFerrySection(ferry) {
    if (!ferry) return '';
    let html = sectionTitle('⛴️', 'Traversier');

    const meta = [];
    if (ferry.date) meta.push(`📅 ${formatDate(ferry.date)}${ferry.time ? ' · ' + esc(ferry.time) : ''}`);
    if (ferry.orderRef) meta.push(`🔖 #${esc(ferry.orderRef)}`);
    if (ferry.total) meta.push(`💶 ${esc(ferry.total)}`);
    if (ferry.vehicle) meta.push(`🚙 ${esc(ferry.vehicle)}`);

    const derived = [];
    if (ferry.balance) derived.push('Solde au quai');

    let details = '';
    if (ferry.deposit) details += `<div>💳 Acompte: ${esc(ferry.deposit)}</div>`;
    if (ferry.balance) details += `<div>💰 Solde: ${esc(ferry.balance)}</div>`;
    if (ferry.note) details += `<div class="booking-note">${esc(ferry.note)}</div>`;
    if (ferry.cancellation) details += `<div class="booking-note">${esc(ferry.cancellation)}</div>`;

    html += bookingCard({
      icon: '⛴️',
      title: ferry.route || 'Traversier',
      metaLines: meta,
      tagsHtml: renderBookingTags({
        typeLabel: 'Ferry',
        cancellation: ferry.cancellation,
        tags: ferry.tags,
        derived,
      }),
      detailsHtml: details,
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
      const key = day.hotelId || day.hotel;
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
    });

    if (!body) return '';
    return sectionTitle('🏨', 'Hébergements') + body;
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
    html += renderFerrySection(tripData.ferry);
    html += renderEventsSection(tripData.events);
    html += renderHotelsSection(tripData);

    const hasAnything = /booking-card|hotel-card/.test(html);
    if (!hasAnything) {
      html += `<div class="empty-state"><div class="empty-emoji">📋</div><h3>Aucune réservation</h3></div>`;
    }

    container.innerHTML = html;
  }

  return { render, renderBookingTags, cancellationBadge };
})();
