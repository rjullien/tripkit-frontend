/**
 * daily-view.js — Day-by-day programme view
 * Renders a full day: header, chips, timeline, hotel card, restaurant.
 *
 * dayIndex: 0-based array index into tripData.days[]
 */

var DailyView = (() => {

  /**
   * Render a day view into a container element.
   * @param {HTMLElement} container
   * @param {Object} tripData — { trip, days[], restaurants?, lists? }
   * @param {number} dayIndex — 0-based index into tripData.days[]
   */
  function render(container, tripData, dayIndex) {
    if (!container) return;

    if (!tripData || !tripData.days || !tripData.days.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">📅</div>
        <h3>Aucun programme</h3>
        <p>Les données du voyage ne sont pas encore chargées.</p>
      </div>`;
      return;
    }

    const days = tripData.days;
    const idx = Math.max(0, Math.min(dayIndex, days.length - 1));
    const day = DayHelpers.enrich(days[idx], tripData);

    if (!day) {
      container.innerHTML = `<div class="empty-state"><div class="empty-emoji">🗓️</div><h3>Jour introuvable</h3></div>`;
      return;
    }

    const totalDays = days.length;
    const hasPrev = idx > 0;
    const hasNext = idx < totalDays - 1;

    let html = '';

    // ── Navigation arrows ──────────────────────────────────────────────────
    html += `<div class="day-nav">
      <button onclick="App.goToDay(${idx - 1})" ${hasPrev ? '' : 'disabled'} aria-label="Jour précédent">◀</button>
      <span style="color:var(--muted);font-size:.8em">${idx + 1} / ${totalDays}</span>
      <button onclick="App.goToDay(${idx + 1})" ${hasNext ? '' : 'disabled'} aria-label="Jour suivant">▶</button>
    </div>`;

    // ── Countdown / Trip status banner ──────────────────────────────────────
    if (typeof DayResolver !== 'undefined' && tripData.trip) {
      const state = DayResolver.tripState(tripData.trip);
      const countdown = DayResolver.getCountdown(tripData.trip);
      let bannerText = '';
      let bannerGradient = '';
      if (state === 'before' && countdown && countdown.active) {
        if (countdown.days === 0) {
          bannerText = "C'est demain ! \ud83c\udf89";
        } else {
          bannerText = `J-${countdown.days} avant le d\u00e9part ! \ud83c\udf89`;
        }
        bannerGradient = 'linear-gradient(135deg, rgba(233,69,96,.15), rgba(78,205,196,.15))';
      } else if (state === 'during') {
        const dayNum = day.day !== undefined ? day.day : idx + 1;
        bannerText = `Jour ${dayNum} du voyage ! \ud83c\udf1f`;
        bannerGradient = 'linear-gradient(135deg, rgba(78,205,196,.15), rgba(88,166,255,.15))';
      } else if (state === 'after') {
        bannerText = `Voyage termin\u00e9 ! \ud83d\udcab ${days.length} jours de souvenirs`;
        bannerGradient = 'linear-gradient(135deg, rgba(139,92,246,.15), rgba(233,69,96,.15))';
      }
      if (bannerText) {
        html += `<div style="text-align:center;padding:12px 16px;margin-bottom:12px;border-radius:var(--radius);background:${bannerGradient};border:1px solid rgba(255,255,255,.08)">`;
        html += `<div style="font-size:1.1em;font-weight:700;color:var(--text)">${bannerText}</div>`;
        html += `</div>`;
      }
    }

    // ── Day header ─────────────────────────────────────────────────────────
    // day.day field (from seed) is 1-based display number, or we use idx+1
    const displayNum = day.day !== undefined ? day.day : idx + 1;
    // ── Hero image (data-driven) ──
    let heroUrl = day.heroImage || null;
    if (day.day === 0 && day.heroImages) {
      const userId = Store.get('user-id');
      const userCfg = userId && tripData.trip && tripData.trip.users ? tripData.trip.users[userId] : null;
      const city = userCfg ? userCfg.city : null;
      heroUrl = (city && day.heroImages[city]) || day.heroImages._default || heroUrl;
    }
    const heroClass = heroUrl ? ' has-hero' : '';
    
    html += `<div class="day-header${heroClass}">`;
    if (heroUrl) {
      html += `<div class="hero-bg" id="hero-bg-${day.day}"></div>`;
      html += `<div class="hero-overlay"></div>`;
    }
    html += `<div class="day-number">Jour ${displayNum}</div>
      <div class="day-date">${esc(day.dow || '')} ${esc(day.date || '')}</div>
      <div class="day-emoji">${esc(day.emoji || '📅')}</div>
      <div class="day-label">${esc(day.label || '')}</div>
    </div>`;

    // ── Info chips ─────────────────────────────────────────────────────────
    const hasChips = (day.from && day.to && day.from !== day.to)
                   || (day.dist && day.dist !== '0 km' && day.dist !== '-')
                   || (day.dur  && day.dur  !== '-');
    if (hasChips) {
      html += `<div class="info-chips">`;
      if (day.from && day.to && day.from !== day.to) {
        html += `<div class="info-chip">📍 ${esc(day.from)} → ${esc(day.to)}</div>`;
      } else if (day.from) {
        html += `<div class="info-chip">📍 ${esc(day.from)}</div>`;
      }
      if (day.dist && day.dist !== '0 km' && day.dist !== '-') {
        html += `<div class="info-chip">🛣️ ${esc(day.dist)}</div>`;
      }
      if (day.dur && day.dur !== '-') {
        html += `<div class="info-chip">⏱️ ${esc(day.dur)}</div>`;
      }
      html += `</div>`;
    }

    // ── Google Maps + CarPlay + Apple Maps links ───────────────────────────
    if (day.mapUrl) {
      const dest = day.to || day.label || '';
      const dayPad = String(displayNum).padStart(2, '0');
      const tripId = window.Store ? Store.getCurrentTripId() : "";
      html += `<div class="card" style="padding:0;overflow:hidden">`;
      // Only show route image for trips with real map assets (check routeImage flag)
      if (day.routeImage !== false) {
        html += `<a href="${escAttr(day.mapUrl)}" target="_blank" style="display:block">`;
        const ncq = localStorage.getItem('tripkit_nocache') === '1' ? '?nocache=1' : '';
        html += `<img src="/api/trips/${tripId}/assets/day-${dayPad}-route.jpg${ncq}" alt="Trajet ${esc(day.from)} \u2192 ${esc(day.to)}" style="width:100%;border-radius:var(--radius) var(--radius) 0 0;display:block;min-height:60px" onerror="this.onerror=null;this.parentElement.style.display='none'" loading="lazy">`;
        html += `</a>`;
      }
      if (day.from && day.to && day.from !== day.to) {
        html += `<div style="padding:8px 12px 4px;font-weight:600;font-size:.9em">${esc(day.from)} \u2192 ${esc(day.to)}</div>`;
        html += `<div style="padding:0 12px 8px;color:var(--muted);font-size:.78em">🚗 ${esc(day.dist)} \u2022 ${esc(day.dur)}</div>`;
      }
      html += `<div class="map-actions" style="margin:0;padding:8px 12px 12px">`;
      html += `<a href="${escAttr(day.mapUrl)}" class="map-btn map-btn-primary" target="_blank">🗺️ Google Maps</a>`;
      html += `<a href="${escAttr(carplayUrl(day.mapUrl, dest))}" class="map-btn map-btn-secondary" target="_blank">🚗 CarPlay</a>`;
      html += `<a href="${escAttr(appleMapsUrl(dest))}" class="map-btn map-btn-secondary">🍎 Apple Maps</a>`;
      html += `</div></div>`;
    }

    // ── Weather box (async, filled after render) ───────────────────────────
    if (day.geo) {
      html += `<div id="weatherBox" class="card" style="margin-top:12px;text-align:center;color:var(--muted);font-size:.85em">🌤️ Chargement météo…</div>`;
    }

    // ── Timeline ───────────────────────────────────────────────────────────
    if (day.timeline && day.timeline.length) {
      html += `<div class="section-title">📋 Programme</div>`;
      html += Timeline.render(day.timeline, { restaurants: tripData.restaurants || {} });
    }

    // ── Highlights ─────────────────────────────────────────────────────────
    if (day.highlights && day.highlights.length) {
      html += `<div class="section-title">⭐ Points forts</div>`;
      html += `<div class="card"><ul class="highlights-list">`;
      day.highlights.forEach(h => {
        // Allow safe links through. Validate the URL scheme (block javascript:,
        // data:, etc.) and escape the href so it cannot break out of the
        // attribute. Then strip any other tags.
        const safe = h.replace(
          /<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
          (m, href, label) => {
            const trimmed = String(href).trim();
            const safeHref = /^(https?:|mailto:|\/)/i.test(trimmed) ? trimmed : '#';
            return `<a href="${escAttr(safeHref)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
          }
        ).replace(/<(?!\/a>)[^>]+>/g, '');
        html += `<li>${safe}</li>`;
      });
      html += `</ul></div>`;
    }

    // ── Generic departure cards (from day.departures[]) ─────────────────
    if (day.departures && day.departures.length) {
      day.departures.forEach(dep => {
        const color = dep.color || '#f0a500';
        html += `<div class="departure-card" style="border-left-color:${escAttr(color)}">`;
        html += `<h3>${esc(dep.emoji || '✈️')} Départ ${esc(dep.traveler)}</h3>`;
        if (dep.subtitle) html += `<div style="font-size:.85em;color:var(--muted);margin-bottom:10px">${esc(dep.subtitle)}</div>`;
        if (dep.steps && dep.steps.length) {
          html += `<div class="departure-steps">`;
          dep.steps.forEach(step => {
            if (step.time) {
              html += `<div><b>${esc(step.time)}</b> — ${esc(step.desc)}</div>`;
            } else {
              html += `<div>${esc(step.desc)}</div>`;
            }
          });
          html += `</div>`;
        }
        if (dep.footer) {
          html += `<div class="departure-info" style="border-color:${escAttr(color)}33;color:${escAttr(color)}">${esc(dep.footer)}</div>`;
        }
        html += `</div>`;
      });
    }

    // Culture is in the dedicated Culture tab (tripData.culture[])

    // ── Poem (collapsible) ────────────────────────────────────────────────────
    if (day.poem) {
      const p = day.poem;
      const poemId = `poem-${displayNum}`;
      html += `<div class="card poem-card">`;
      if (p.title) {
        html += `<div class="poem-title" style="cursor:pointer;user-select:none" onclick="var b=document.getElementById('${poemId}');var a=this.querySelector('.parr');if(b.style.display==='none'){b.style.display='block';a.textContent='\u25bc'}else{b.style.display='none';a.textContent='\u25b6'}">${esc(p.title)} <span class="parr" style="font-size:.7em;margin-left:6px">\u25bc</span></div>`;
      }
      if (p.lines && p.lines.length) {
        html += `<div id="${poemId}" class="poem-body">${p.lines.map(l => esc(l)).join('<br>')}</div>`;
      }
      if (p.author) html += `<div class="poem-author">— ${esc(p.author)}</div>`;
      html += `</div>`;
    }

    // ── Hotel card ─────────────────────────────────────────────────────────
    const hotelData = HotelCard.fromDay(day, tripData.hotels);
    if (hotelData) {
      // Show full card (with WiFi QR) only on check-in day, compact otherwise
      const isFirstDayAtHotel = dayIndex === 0 || (() => {
        const prevDay = tripData.days[dayIndex - 1];
        const prevData = prevDay ? (typeof prevDay.data === "string" ? JSON.parse(prevDay.data) : prevDay.data) : null;
        return !prevData || prevData.hotelId !== day.hotelId;
      })();
      html += `<div class="section-title">🏨 Hébergement</div>`;
      html += HotelCard.render(hotelData, { compact: !isFirstDayAtHotel });
    }

    // ── Special cards per day ──────────────────────────────────────────────
    html += renderSpecialCard(displayNum);

    // ── Restaurant ─────────────────────────────────────────────────────────
    // restaurants keyed by day.day (1-based display number)
    const restoKey = day.day !== undefined ? day.day : idx + 1;
    const resto = tripData.restaurants && tripData.restaurants[restoKey];
    if (resto) {
      html += renderRestaurant(resto);
    }

    // ── Shopping list shortcut ─────────────────────────────────────────────
    // Key the list by the CURRENT trip id (not a hardcoded one) so the shortcut
    // works for every trip. Falls back to "usa2026" to preserve legacy keys.
    const currentTripId = (window.Store && Store.getCurrentTripId()) || 'usa2026';
    const shoppingListId = `courses-day${displayNum}-${currentTripId}`;
    if (tripData.lists && tripData.lists[shoppingListId]) {
      html += `<div style="margin:12px 0">
        <button class="btn btn-accent" style="width:100%" onclick="App.openList('${shoppingListId}');App.switchTab('listes')">
          🛒 Courses Day ${displayNum}
        </button>
      </div>`;
    }

    
    // ── Day-specific cards (rental pickup/return, tickets, etc.) ────────
    if (day.cards && day.cards.length && typeof DayCards !== 'undefined') {
      html += DayCards.renderAll(day.cards);
    }

    // ── Conference sessions ────────────────────────────────────────────────
    if (day.conference && typeof ConferenceView !== 'undefined') {
      const userId = Store.get('user-id');
      const userCfg = userId && tripData.trip && tripData.trip.users ? tripData.trip.users[userId] : null;
      const defaultPerson = userCfg && userCfg.defaultConf ? userCfg.defaultConf : undefined;
      html += ConferenceView.render(day.conference, { defaultPerson, dayNum: day.day });
    }

    container.innerHTML = html;
    container.scrollTop = 0;

    // Load hero image async (after DOM render)
    if (heroUrl) {
      const img = new Image();
      const bgEl = document.getElementById('hero-bg-' + day.day);
      img.onload = () => { if (bgEl) bgEl.style.backgroundImage = "url('" + heroUrl + "')"; };
      img.onerror = () => { if (bgEl) bgEl.style.display = 'none'; };
      img.src = heroUrl;
    }

    // Fetch weather async (after DOM render)
    if (day.geo && typeof Weather !== 'undefined') {
      const wb = document.getElementById('weatherBox');
      if (wb) Weather.renderInline(wb, day);
    }

    // Swipe gesture — navigate between days
    setupSwipe(container, idx, totalDays);
  }

  // ── Swipe handler for day navigation ──────────────────────────────────────
  function setupSwipe(el, idx, totalDays) {
    let startX = 0, dx = 0, moving = false;
    el.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX; dx = 0; moving = false;
    }, {passive: true});
    el.addEventListener('touchmove', e => {
      const mx = e.touches[0].clientX - startX;
      const my = e.touches[0].clientY - (e.touches[0]._sy || e.touches[0].clientY);
      if (!moving && Math.abs(mx) > Math.abs(my) && Math.abs(mx) > 12) moving = true;
      if (moving) { dx = mx; e.preventDefault(); }
    }, {passive: false});
    el.addEventListener('touchend', () => {
      if (!moving) return;
      if (dx < -60 && idx < totalDays - 1) { App.goToDay(idx + 1); }
      else if (dx > 60 && idx > 0) { App.goToDay(idx - 1); }
    }, {passive: true});
  }
  // ── Special cards per day (deprecated — use timeline data) ──────────────
  function renderSpecialCard(dayNum) {
    return '';
  }















































































  // ── Restaurant card ────────────────────────────────────────────────────────
  function renderRestaurant(resto) {
    let html = `<div class="section-title">🍽️ Restaurants</div>`;

    if (resto.breakfast) {
      html += `<div class="card" style="font-size:.84em;color:var(--muted)">🌅 Petit-déj: ${esc(resto.breakfast)}</div>`;
    }
    if (resto.lunch) {
      html += `<div class="card" style="font-size:.84em;color:var(--muted)">🥗 Déjeuner: ${esc(resto.lunch)}</div>`;
    }
    if (resto.main) {
      const m = resto.main;
      html += `<div class="resto-card">
        <div class="resto-header">
          <span class="resto-icon">${esc(m.icon || '🍽️')}</span>
          <div style="flex:1">
            <div class="resto-name">${esc(m.name || '')}
              ${m.booked ? '<span class="resto-badge resto-booked">Réservé ✓</span>' : ''}
              ${m.stars  ? `<span class="resto-badge resto-stars">⭐ ${esc(m.stars)}</span>` : ''}
              ${m.price  ? `<span class="resto-badge" style="background:rgba(255,255,255,.07);color:var(--muted)">${esc(m.price)}</span>` : ''}
            </div>
            <div class="resto-note">${esc(m.note || '')}${m.ref ? ` · Réf: <strong>${esc(m.ref)}</strong>` : ''}</div>
          </div>
        </div>
        ${m.maps ? `<div style="margin-top:8px"><a href="${escAttr(m.maps)}" class="hotel-link-btn" target="_blank">🗺️ Maps</a></div>` : ''}
      </div>`;
    }
    if (resto.alts && resto.alts.length) {
      html += `<div class="card" style="font-size:.82em">
        <div style="color:var(--muted);margin-bottom:8px;font-weight:600;font-size:.9em">Alternatives</div>`;
      resto.alts.forEach(a => {
        html += `<div class="resto-alt">
          <div>
            <div class="ra-name">${esc(a.name || '')}</div>
            <div class="ra-note">${esc(a.note || '')}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            ${a.stars ? `<div class="ra-meta">⭐ ${esc(a.stars)}</div>` : ''}
            ${a.price ? `<div class="ra-meta">${esc(a.price)}</div>` : ''}
          </div>
        </div>`;
      });
      html += `</div>`;
    }
    return html;
  }

  // ── URL helpers ────────────────────────────────────────────────────────────
  function carplayUrl(mapUrl, destination) {
    // Strip departure from Google Maps dir URL — leaves only destination segment
    try {
      const parts = mapUrl.split('/dir/')[1].split('/').filter(Boolean);
      if (parts.length < 2) return 'https://www.google.com/maps/dir/' + encodeURIComponent(destination);
      return 'https://www.google.com/maps/dir/' + parts.slice(1).join('/');
    } catch(e) {
      return 'https://www.google.com/maps/search/' + encodeURIComponent(destination);
    }
  }

  function appleMapsUrl(address) {
    return 'maps://maps.apple.com/?daddr=' + encodeURIComponent(address) + '&dirflg=d';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(s) {
    return String(s || '').replace(/"/g, '&quot;');
  }

  return { render };
})();
