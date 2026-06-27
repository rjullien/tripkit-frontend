/**
 * hotel-card.js — Hotel card component
 * Renders rich hotel info: name, address, booking ref, amenities, links, WiFi, phone.
 *
 * Data model:
 * - Normalized: day.hotelId → tripData.hotels[hotelId]
 * - Legacy: day.hotel, day.hotelAddr, etc. (inline fields)
 * - fromDay() handles both formats
 */

var HotelCard = (() => {

  /**
   * Render a hotel card.
   * @param {Object} hotelData — { name, addr, booking, ref, checkin, wifi, ... }
   * @returns {string} HTML string
   */
  function render(hotelData, opts) {
    const { compact = false } = opts || {};
    if (!hotelData || !hotelData.name) return '';

    const {
      name, note, addr, address, city, booking, ref, phone,
      checkin, checkout, extras, amenities = [],
      links = [], price, rooms, host, notes, access, wifi,
    } = hotelData;

    const actualAddr = addr || address;
    const mapsUrl = actualAddr
      ? `https://www.google.com/maps/search/${encodeURIComponent(actualAddr)}`
      : null;

    let html = `<div class="hotel-card">`;
    html += `<div class="hotel-name">\ud83c\udfe8 ${esc(name)}</div>`;
    html += `<div class="hotel-meta">`;

    if (city && !actualAddr) html += `<div>\ud83d\udccd ${esc(city)}</div>`;
    if (note) html += `<div>${esc(note)}</div>`;

    if (actualAddr) {
      const addrHtml = mapsUrl
        ? `<a href="${escAttr(mapsUrl)}" target="_blank">${esc(actualAddr)}</a>`
        : esc(actualAddr);
      html += `<div>\ud83d\udccd ${addrHtml}</div>`;
    }

    if (booking || ref) {
      html += `<div>`;
      if (booking) html += `<strong>${esc(booking)}</strong>`;
      if (booking && ref) html += ` \u00b7 `;
      if (ref) html += `R\u00e9f: <strong>${esc(ref)}</strong>`;
      html += `</div>`;
    }

    if (checkin || checkout) {
      html += `<div>`;
      if (checkin)  html += `\ud83d\udd11 Check-in: <strong>${esc(checkin)}</strong>`;
      if (checkin && checkout) html += ` &nbsp; `;
      if (checkout) html += `\ud83d\udeaa Check-out: <strong>${esc(checkout)}</strong>`;
      html += `</div>`;
    }

    if (price) html += `<div>\ud83d\udcb6 ${esc(price)}</div>`;
    if (rooms && rooms.detail) html += `<div>\ud83d\udecf\ufe0f ${esc(rooms.detail)}</div>`;
    if (phone) html += `<div>\ud83d\udcde <a href="tel:${escAttr(phone)}">${esc(phone)}</a></div>`;
    if (extras) html += `<div style="margin-top:5px;font-size:.78em;color:var(--orange)">\u2139\ufe0f ${esc(extras)}</div>`;
    if (access) html += `<div style="margin-top:5px;font-size:.82em;font-weight:600">${esc(access)}</div>`;
    if (host && host.bio) html += `<div style="margin-top:4px;font-size:.78em">\ud83c\udfe0 ${esc(host.bio)}</div>`;
    if (notes && notes !== note) html += `<div style="margin-top:4px;font-size:.78em;font-style:italic;color:var(--muted)">${esc(notes)}</div>`;
    html += `</div>`; // .hotel-meta

    // Amenities
    const amenityList = Array.isArray(amenities) ? amenities : amenities ? [amenities] : [];
    if (amenityList.length) {
      html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">`;
      amenityList.forEach(a => { html += `<span class="badge badge-green">${esc(a)}</span>`; });
      html += `</div>`;
    }

    // Hotel access codes (yellow warning box)
    if (access) {
      html += `<div style="margin-top:8px;padding:10px 12px;background:rgba(255,193,7,.12);border:1px solid rgba(255,193,7,.25);border-radius:8px;font-size:.82em;color:#ffc107;line-height:1.5">\ud83d\udd11 ${esc(access)}</div>`;
    }

    // WiFi Connect
    if (wifi && wifi.ssid && !compact) {
      var ssid = esc(wifi.ssid);
      var pass = esc(wifi.pass || '');
      var rawPass = String(wifi.pass || '').replace(/'/g, "\\'");
      var rawSsid = String(wifi.ssid).replace(/'/g, "\\'");
      html += '<div style="margin-top:8px;padding:12px;background:rgba(78,205,196,.08);border:1px solid rgba(78,205,196,.25);border-radius:10px">';
      html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
      html += '<span style="font-size:1.3em">\ud83d\udcf6</span>';
      html += '<div><div style="font-size:.9em;font-weight:700;color:var(--sec)">' + ssid + '</div>';
      html += '<div style="font-size:.72em;color:var(--muted)">WiFi h\u00e9bergement</div></div></div>';
      html += '<button onclick="HotelCard.wifiConnect(\'' + rawSsid + '\',\'' + rawPass + '\')" style="width:100%;padding:10px 14px;background:var(--sec);color:#000;border:none;border-radius:8px;font-size:.88em;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">\ud83d\udd17 Copier le mot de passe</button>';
      html += '<div style="margin-top:8px;font-size:.75em;color:var(--muted)">mdp : <code style="color:var(--text);background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px;user-select:all">' + pass + '</code>';
      html += ' <button onclick="navigator.clipboard.writeText(\'' + rawPass + '\');this.textContent=\'\u2705\';setTimeout(()=>this.textContent=\'\ud83d\udccb\',1500)" style="background:none;border:none;font-size:1em;cursor:pointer;padding:0">\ud83d\udccb</button></div>';
      // QR code
      var _wifiQR = 'WIFI:T:WPA;S:' + wifi.ssid + ';P:' + (wifi.pass || '') + ';;';
      var _qrId = 'wifi-qr-' + wifi.ssid.replace(/\W/g, '') + '-' + Math.random().toString(36).slice(2, 8);
      html += '<div id="' + _qrId + '" style="margin-top:10px;text-align:center"></div>';
      html += '<div style="margin-top:6px;font-size:.68em;color:var(--muted)">\ud83d\udcf1 Scannez le QR ou copiez le mdp \u2192 R\u00e9glages \u2192 WiFi</div>';
      html += '</div>';
      // Defer QR rendering after DOM
      (function(qrStr, elId) {
        setTimeout(function() {
          var qrEl = document.getElementById(elId);
          if (qrEl && !qrEl.hasChildNodes() && typeof QRCode === 'function') {
            try {
              var svg = QRCode({ msg: qrStr, dim: 160, pad: 2, pal: ['#4ecdc4', '#16213e'] });
              qrEl.appendChild(svg);
            } catch(e) {}
          }
        }, 50);
      })(_wifiQR, _qrId);
    }

    // Search links (booking platforms) — shown when not booked
    if (hotelData.booked === false && hotelData.searchLinks) {
      const sl = hotelData.searchLinks;
      const dates = hotelData.dates || {};
      const nightsLabel = dates.nights ? `${dates.nights} nuit${dates.nights > 1 ? 's' : ''}` : '';
      const dateLabel = dates.checkin && dates.checkout
        ? `${dates.checkin.slice(5)} → ${dates.checkout.slice(5)}`
        : '';
      html += `<div style="margin-top:10px;padding:12px;background:rgba(255,193,7,.08);border:1px solid rgba(255,193,7,.2);border-radius:10px">`;
      html += `<div style="font-size:.82em;font-weight:700;color:#ffc107;margin-bottom:8px">`;
      html += `🔍 Chercher un hébergement`;
      if (dateLabel) html += ` <span style="font-weight:400;color:var(--muted)">(${esc(nightsLabel)}, ${esc(dateLabel)})</span>`;
      html += `</div>`;
      html += `<div style="display:flex;flex-wrap:wrap;gap:6px">`;
      if (sl.airbnb) html += `<a href="${escAttr(sl.airbnb)}" target="_blank" class="hotel-link-btn" style="background:rgba(255,88,93,.15);border-color:rgba(255,88,93,.3);color:#ff585d">🏠 Airbnb</a>`;
      if (sl.booking) html += `<a href="${escAttr(sl.booking)}" target="_blank" class="hotel-link-btn" style="background:rgba(0,53,128,.15);border-color:rgba(0,53,128,.3);color:#4a9fd5">🏨 Booking</a>`;
      if (sl.hotelscom) html += `<a href="${escAttr(sl.hotelscom)}" target="_blank" class="hotel-link-btn" style="background:rgba(214,0,28,.1);border-color:rgba(214,0,28,.2);color:#d6001c">🏨 Hotels.com</a>`;
      if (sl.kayak) html += `<a href="${escAttr(sl.kayak)}" target="_blank" class="hotel-link-btn" style="background:rgba(255,94,0,.12);border-color:rgba(255,94,0,.25);color:#ff5e00">🔍 Kayak</a>`;
      if (sl.expedia) html += `<a href="${escAttr(sl.expedia)}" target="_blank" class="hotel-link-btn" style="background:rgba(255,204,0,.12);border-color:rgba(255,204,0,.25);color:#ffc107">✈️ Expedia</a>`;
      if (sl.terroirSaveurs) html += `<a href="${escAttr(sl.terroirSaveurs)}" target="_blank" class="hotel-link-btn" style="background:rgba(76,175,80,.12);border-color:rgba(76,175,80,.25);color:#4caf50">🧀 Terroir & Saveurs</a>`;
      html += `</div></div>`;
    }

    // Links
    const allLinks = [...(Array.isArray(links) ? links : [])];
    if (mapsUrl && !allLinks.find(l => l.url && l.url.includes('maps'))) {
      allLinks.unshift({ label: '\ud83d\uddfa\ufe0f Google Maps', url: mapsUrl });
    }
    if (allLinks.length || actualAddr) {
      html += `<div class="hotel-links">`;
      allLinks.forEach(link => {
        if (!link.url) return;
        html += `<a href="${escAttr(link.url)}" class="hotel-link-btn" target="_blank">${esc(link.label || link.url)}</a>`;
      });
      // CarPlay button
      if (actualAddr) {
        html += `<a href="${escAttr('comgooglemaps://?q=' + encodeURIComponent(actualAddr))}" class="hotel-link-btn">\ud83d\ude97 CarPlay</a>`;
        html += `<a href="${escAttr('maps://maps.apple.com/?daddr=' + encodeURIComponent(actualAddr) + '&dirflg=d')}" class="hotel-link-btn">\ud83c\udf4e Apple Maps</a>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Copy WiFi password to clipboard and show toast.
   */
  function wifiConnect(ssid, pass) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pass).then(() => {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('\u2705 Mot de passe ' + ssid + ' copi\u00e9 !');
        }
      }).catch(() => {
        // Fallback: prompt
        prompt('Mot de passe WiFi ' + ssid + ' :', pass);
      });
    } else {
      prompt('Mot de passe WiFi ' + ssid + ' :', pass);
    }
  }

  /**
   * Resolve hotel data from a day + hotels dict.
   * Supports both normalized (hotelId → hotels[id]) and legacy (inline fields).
   * @param {Object} day
   * @param {Object} [hotelsDict] — tripData.hotels
   * @returns {Object|null} hotel data for render()
   */
  function fromDay(day, hotelsDict) {
    if (!day) return null;

    // Normalized: day has hotelId, resolve from dict
    if (day.hotelId && hotelsDict && hotelsDict[day.hotelId]) {
      const hotel = hotelsDict[day.hotelId];
      // Merge wifi from day if not in hotel dict
      if (!hotel.wifi && (day.hotelWifi || day.wifi)) {
        hotel.wifi = day.hotelWifi || day.wifi;
      }
      return hotel;
    }

    // Legacy: inline fields
    const name = day.hotel;
    if (!name || name === '\u2014' || name === '' || name === '-') return null;

    const rawAmenities = day.hotelAmenities;
    return {
      name,
      note:     day.hotelNote     || null,
      addr:     day.hotelAddr     || null,
      booking:  day.hotelBooking  || null,
      ref:      day.hotelRef      || null,
      phone:    day.hotelPhone    || null,
      checkin:  day.hotelCheckin  || null,
      checkout: day.hotelCheckout || null,
      extras:   day.hotelExtras   || null,
      price:    day.hotelPrice    || null,
      access:   day.hotelAccess   || null,
      wifi:     day.hotelWifi     || day.wifi || null,
      amenities: rawAmenities ? (Array.isArray(rawAmenities) ? rawAmenities : [rawAmenities]) : [],
      links:    day.hotelLinks    || [],
    };
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) {
    return String(s || '').replace(/"/g,'&quot;');
  }

  return { render, fromDay, wifiConnect };
})();
