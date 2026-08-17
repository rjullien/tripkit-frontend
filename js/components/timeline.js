/**
 * timeline.js — Vertical timeline component
 * Renders a list of timeline events with dots and times.
 *
 * Event types:
 *   - Standard: { t, d } or { time, text }
 *   - Departure marker: { t, d, type: 'departure', ref: 'traveler-id' }
 *   - With restaurant ref: { t, d, restaurantRef: N }
 *   - With culture badge: { t, d, culture: { icon, title, text } }
 *   - Cross-TZ: { t, d, tz, date? } — local t primary; homeTz secondary via TzHelpers
 */

var Timeline = (() => {

  /**
   * Render timeline events.
   * @param {Array} events
   * @param {Object} [opts] — { restaurants?, homeTz?, dayDate? }
   * @returns {string} HTML string
   */
  function render(events, opts) {
    if (!events || !events.length) return '';
    const restaurants = (opts && opts.restaurants) || {};
    const homeTz = (opts && opts.homeTz)
      || (typeof TzHelpers !== 'undefined' ? TzHelpers.DEFAULT_HOME_TZ : 'Europe/Paris');
    const dayDate = (opts && opts.dayDate) || '';

    const items = events.map(ev => {
      const time = ev.time || ev.t || '';
      const desc = ev.text || ev.d || '';
      const link = ev.link || null;
      const timeBlock = renderTimeBlock(time, ev, { homeTz, dayDate });

      // ── Departure marker ──
      if (ev.type === 'departure') {
        return `<div class="timeline-item departure-marker" data-dep-ref="${escapeAttr(ev.ref || '')}">
          ${timeBlock}
          <span class="tl-desc"><strong>${escapeAndLink(desc)}</strong></span>
        </div>`;
      }

      // ── Detect accent/green ──
      const isAccent = ev.accent || /^DÉPART|^Arrivée|^✈️|^🛬|^🚗/.test(desc);
      const isGreen  = ev.green  || /^⭐|^✅/.test(desc);

      let dotClass = '';
      if (isAccent) dotClass = 'accent';
      else if (isGreen) dotClass = 'green';

      // ── Build description ──
      let descHtml = escapeAndLink(desc);

      // Culture badge (clickable → overlay modal)
      if (ev.culture) {
        const c = ev.culture;
        const cIcon = escapeHtml(c.icon || '\ud83d\udcda');
        const cTitle = escapeAttr(c.title || '');
        const cText = escapeAttr(c.text || '');
        descHtml += ` <span class="badge badge-culture" style="font-size:.7em;vertical-align:middle;cursor:pointer;background:rgba(78,205,196,.15);color:var(--sec);padding:2px 8px;border-radius:8px" onclick="Timeline.showCulture('${cIcon}','${cTitle}','${cText}')">${cIcon} Culture</span>`;
      }

      // Restaurant ref badge
      if (ev.restaurantRef != null && restaurants[ev.restaurantRef]) {
        const r = restaurants[ev.restaurantRef];
        const rName = r.main ? r.main.name : (r.name || '');
        if (rName) {
          descHtml += ` <span class="badge badge-orange" style="font-size:.7em;vertical-align:middle">\ud83c\udf7d\ufe0f ${escapeHtml(rName)}</span>`;
        }
      }

      if (link) {
        descHtml += ` <a href="${link}" class="btn btn-muted" style="font-size:.75em;padding:3px 8px;margin-left:4px" target="_blank">\u2192</a>`;
      }

      const mapsHref = mapsHrefFor(ev);
      if (mapsHref) {
        descHtml += ` <a href="${escapeAttr(mapsHref)}" class="tl-maps" target="_blank" rel="noopener" title="Ouvrir dans Google Maps">\ud83d\udccd</a>`;
      }

      return `<div class="timeline-item ${dotClass}">
        ${timeBlock}
        <span class="tl-desc">${descHtml}</span>
      </div>`;
    });

    return `<div class="timeline">${items.join('')}</div>`;
  }

  /**
   * Local time (primary) + optional home/Nice time (secondary).
   * Dual display only when entry.tz is set (seed contract) and conversion differs.
   */
  function renderTimeBlock(time, ev, ctx) {
    if (!time) {
      return `<span class="tl-time" style="min-width:48px"></span>`;
    }
    let homeHtml = '';
    if (ev && ev.tz && typeof TzHelpers !== 'undefined') {
      const label = TzHelpers.homeTimeLabel({
        t: time,
        tz: ev.tz,
        date: ev.date || ctx.dayDate,
        homeTz: ctx.homeTz,
      });
      if (label && label.text) {
        homeHtml = `<span class="tl-time-home" title="Heure Nice / maison">${escapeHtml(label.text)}</span>`;
      }
    }
    return `<span class="tl-time">${escapeHtml(time)}${homeHtml}</span>`;
  }

  /**
   * Show a culture overlay modal (called from inline onclick).
   * Replicates the voyage-app culture overlay behavior.
   * @param {string} icon — Emoji icon
   * @param {string} title — Culture topic title
   * @param {string} text — Culture text content
   */
  function showCulture(icon, title, text) {
    // Decode escaped quotes from HTML attributes
    const cleanTitle = String(title).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const cleanText = String(text).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

    const overlay = document.createElement('div');
    overlay.className = 'culture-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = '<div class="culture-card">'
      + '<h3>' + escapeHtml(icon) + ' ' + escapeHtml(cleanTitle) + '</h3>'
      + '<p>' + escapeHtml(cleanText) + '</p>'
      + '<div class="close-culture" onclick="this.closest(\'.culture-overlay\').remove()">Fermer \u2715</div>'
      + '</div>';
    document.body.appendChild(overlay);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function escapeAndLink(s) {
    if (!s) return '';
    return s.replace(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g, (match, href, label) => {
      const safeHref = href.replace(/"/g, '&quot;');
      return `<a href="${safeHref}" target="_blank">${escapeHtml(label)}</a>`;
    }).replace(/<(?!\/a>)[^>]+>/g, '');
  }

  function mapsHrefFor(ev) {
    if (typeof StepsMap !== 'undefined' && StepsMap.mapsUrlFor) {
      return StepsMap.mapsUrlFor(ev);
    }
    if (!ev) return null;
    if (typeof ev.lat === 'number' && typeof ev.lon === 'number') {
      return 'https://www.google.com/maps/search/' + encodeURIComponent(ev.lat + ',' + ev.lon);
    }
    if (ev.place && typeof ev.place === 'string' && ev.place.trim()) {
      return 'https://www.google.com/maps/search/' + encodeURIComponent(ev.place.trim());
    }
    return null;
  }

  return { render, showCulture };
})();
