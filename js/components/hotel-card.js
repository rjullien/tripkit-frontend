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
   * Render a booking status badge.
   * @param {string} status — 'candidate', 'to_book', 'booked'
   * @returns {string} HTML badge or empty string
   */
  function renderStatusBadge(status) {
    if (!status) return '';
    let cls = 'badge-muted';
    let label = '';
    switch (status) {
      case 'candidate':
        cls = 'badge-muted';
        label = 'Candidat';
        break;
      case 'to_book':
        cls = 'badge-orange';
        label = 'À réserver';
        break;
      case 'booked':
        cls = 'badge-green';
        label = 'Réservé';
        break;
      default:
        return '';
    }
    return `<div class="booking-tags" style="margin:4px 0 6px"><span class="badge ${cls}">${label}</span></div>`;
  }

  /**
   * Un hôtel n'est « réservé » que si le statut le dit.
   * Nom + adresse (un candidat identifié) ne compte PAS. Construction compare
   * plusieurs `to_book` : leurs liens de recherche / booking doivent rester.
   *
   * Precedence: bookingStatus > booked boolean > bookingRef/confirmationNumber.
   */
  function isBooked(hotelData) {
    if (!hotelData) return false;
    const status = String(hotelData.bookingStatus || '').trim().toLowerCase();
    if (status === 'booked') return true;
    if (status === 'to_book' || status === 'candidate') return false;
    if (hotelData.booked === true) return true;
    if (hotelData.booked === false) return false;
    const ref = String(hotelData.bookingRef || hotelData.confirmationNumber || hotelData.ref || '').trim();
    return ref !== '';
  }

  function generateSearchLinks(dest, checkin, checkout, adults) {
    const enc = encodeURIComponent(String(dest || '').trim());
    if (!enc) return null;
    const a = adults || 2;
    const inD = checkin ? String(checkin).slice(0, 10) : '';
    const outD = checkout ? String(checkout).slice(0, 10) : '';
    const datesOk = inD && outD;
    return {
      airbnb: datesOk
        ? `https://www.airbnb.com/s/${enc}/homes?checkin=${inD}&checkout=${outD}&adults=${a}`
        : `https://www.airbnb.com/s/${enc}/homes?adults=${a}`,
      booking: datesOk
        ? `https://www.booking.com/searchresults.html?ss=${enc}&checkin=${inD}&checkout=${outD}&group_adults=${a}&no_rooms=1`
        : `https://www.booking.com/searchresults.html?ss=${enc}&group_adults=${a}&no_rooms=1`,
      hotelscom: datesOk
        ? `https://www.hotels.com/Hotel-Search?destination=${enc}&startDate=${inD}&endDate=${outD}&rooms=1&adults=${a}`
        : `https://www.hotels.com/Hotel-Search?destination=${enc}&rooms=1&adults=${a}`,
      kayak: datesOk
        ? `https://www.kayak.com/hotels/${enc}/${inD}/${outD}/${a}adults`
        : `https://www.kayak.com/hotels/${enc}`,
      expedia: datesOk
        ? `https://www.expedia.com/Hotel-Search?destination=${enc}&startDate=${inD}&endDate=${outD}&rooms=1&adults=${a}`
        : `https://www.expedia.com/Hotel-Search?destination=${enc}&rooms=1&adults=${a}`,
    };
  }

  function resolveSearchLinks(hotelData) {
    const sl = hotelData && hotelData.searchLinks;
    if (sl && typeof sl === 'object' && Object.keys(sl).some(k => sl[k])) return sl;
    const dest = (hotelData && (hotelData.addr || hotelData.address || hotelData.city || hotelData.name)) || '';
    const dates = (hotelData && hotelData.dates) || {};
    return generateSearchLinks(dest, dates.checkin, dates.checkout, hotelData && hotelData.adults);
  }

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
      cancellation, confirmationNumber, bookingStatus, bookingRef, bookingUrl,
    } = hotelData;

    const actualAddr = addr || address;
    const mapsUrl = actualAddr
      ? `https://www.google.com/maps/search/${encodeURIComponent(actualAddr)}`
      : null;

    const effectiveStatus = hotelData.bookingStatus
      || (isBooked(hotelData) ? 'booked' : (hotelData.booked === false ? 'to_book' : ''));
    const booked = isBooked(hotelData);

    let html = `<div class="hotel-card">`;
    html += `<div class="hotel-name">\ud83c\udfe8 ${esc(name)}</div>`;

    if (effectiveStatus) {
      const statusBadge = renderStatusBadge(effectiveStatus);
      if (statusBadge) html += statusBadge;
    }

    html += `<div class="hotel-meta">`;

    if (city && !actualAddr) html += `<div>\ud83d\udccd ${esc(city)}</div>`;
    if (note) html += `<div>${esc(note)}</div>`;

    if (!actualAddr) {
      html += `<div class="hotel-addr-missing">⚠️ Pas d'adresse — ajoutez <code>hotels[].addr</code>. Le check nuisances cherchera le nom et affichera le point trouvé (à vérifier).</div>`;
    }

    if (actualAddr) {
      const addrHtml = mapsUrl
        ? `<a href="${escAttr(mapsUrl)}" target="_blank">${esc(actualAddr)}</a>`
        : esc(actualAddr);
      html += `<div>\ud83d\udccd ${addrHtml}</div>`;
    }

    if (booking || ref || confirmationNumber) {
      html += `<div>`;
      if (booking) html += `<strong>${esc(booking)}</strong>`;
      const refVal = confirmationNumber || ref;
      if (booking && refVal) html += ` \u00b7 `;
      if (refVal) html += `R\u00e9f: <strong>${esc(refVal)}</strong>`;
      html += `</div>`;
    }

    if (bookingUrl) {
      const bookLabel = booked ? 'Voir la réservation' : 'Réserver';
      html += `<div><a href="${escAttr(bookingUrl)}" target="_blank" class="hotel-link-btn hotel-booking-url" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px">\ud83d\udd17 ${esc(bookLabel)}</a></div>`;
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

    // Tags: cancellation (🟢🔴⚠️) + amenities — same chip language as Résa
    const amenityList = Array.isArray(amenities) ? amenities : amenities ? [amenities] : [];
    const tagChips = [];
    if (cancellation) {
      const raw = String(cancellation).trim();
      let cls = 'badge-muted';
      let label = 'Annulation';
      if (raw.startsWith('🟢')) { cls = 'badge-green'; label = '🟢 Flexible'; }
      else if (raw.startsWith('🔴')) { cls = 'badge-red'; label = '🔴 Non remboursable'; }
      else if (raw.startsWith('⚠️') || raw.startsWith('⚠')) { cls = 'badge-orange'; label = '⚠️ À vérifier'; }
      tagChips.push(`<span class="badge ${cls}" title="${escAttr(raw)}">${label}</span>`);
    }
    amenityList.forEach(a => { tagChips.push(`<span class="badge badge-green">${esc(a)}</span>`); });
    if (tagChips.length) {
      html += `<div class="booking-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${tagChips.join('')}</div>`;
    }

    // ── Ligne obligatoire : petit-déj, piscine, spa, parking ──
    const mandatoryItems = [];
    if (hotelData.breakfast !== undefined && hotelData.breakfast !== null) {
      const val = String(hotelData.breakfast);
      const icon = val.startsWith('oui') ? '✅' : val === 'non' ? '❌' : '❓';
      mandatoryItems.push(`${icon} Petit-déj`);
    }
    if (hotelData.pool !== undefined && hotelData.pool !== null) {
      const val = String(hotelData.pool);
      const icon = val.startsWith('oui') ? '✅' : val === 'non' ? '❌' : '❓';
      mandatoryItems.push(`${icon} Piscine`);
    }
    if (hotelData.spa !== undefined && hotelData.spa !== null) {
      const val = String(hotelData.spa);
      const icon = val.startsWith('oui') ? '✅' : val === 'non' ? '❌' : '❓';
      mandatoryItems.push(`${icon} Spa`);
    }
    if (hotelData.parking !== undefined && hotelData.parking !== null) {
      const val = String(hotelData.parking);
      const hasParking = val !== 'non';
      const icon = hasParking ? '✅' : '❌';
      const label = hasParking && val !== 'oui' && val !== 'gratuit' && val !== '?'
        ? `Parking (${hotelData.parking})`
        : val === 'gratuit' ? 'Parking gratuit' : val === '?' ? '❓ Parking' : '✅ Parking';
      mandatoryItems.push(label);
    }
    if (mandatoryItems.length) {
      html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.82em">`;
      mandatoryItems.forEach((item, i) => {
        html += `<span style="color:var(--muted)">${esc(item)}</span>`;
        if (i < mandatoryItems.length - 1) html += `<span style="color:rgba(255,255,255,.15)"> | </span>`;
      });
      html += `</div>`;
    }

    // Hotel access codes (yellow warning box)
    if (access) {
      html += `<div style="margin-top:8px;padding:10px 12px;background:rgba(255,193,7,.12);border:1px solid rgba(255,193,7,.25);border-radius:8px;font-size:.82em;color:#ffc107;line-height:1.5">\ud83d\udd11 ${esc(access)}</div>`;
    }

    // WiFi Connect
    if (wifi && wifi.ssid && !compact) {
      var _wifiPass = wifi.pass || wifi.password || '';
      var ssid = esc(wifi.ssid);
      var pass = esc(_wifiPass);
      var rawPass = String(_wifiPass).replace(/'/g, "\\'");
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
      var _wifiQR = 'WIFI:T:WPA;S:' + wifi.ssid + ';P:' + (_wifiPass || '') + ';;';
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

    // Search + book platform links: keep them for every hotel that is NOT
    // booked. A to_book / candidate with a name and an address is still to
    // book — that is the whole point of construction alternatives.
    const sl = !booked ? resolveSearchLinks(hotelData) : null;
    if (sl) {
      const dates = hotelData.dates || {};
      const nightsLabel = dates.nights ? `${dates.nights} nuit${dates.nights > 1 ? 's' : ''}` : '';
      const dateLabel = dates.checkin && dates.checkout
        ? `${dates.checkin.slice(5)} → ${dates.checkout.slice(5)}`
        : '';
      html += `<div class="hotel-search-links" style="margin-top:10px;padding:12px;background:rgba(255,193,7,.08);border:1px solid rgba(255,193,7,.2);border-radius:10px">`;
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

    const altList = Array.isArray(hotelData.alternatives) ? hotelData.alternatives.filter(a => a && a.name) : [];
    if (!booked && altList.length) {
      html += `<div class="hotel-alternatives" style="margin-top:10px">`;
      html += `<div style="font-size:.82em;font-weight:700;color:var(--muted);margin-bottom:6px">Autres options</div>`;
      altList.forEach(alt => {
        html += render({
          ...alt,
          bookingStatus: alt.bookingStatus || 'to_book',
          booked: false,
          alternatives: [],
          searchLinks: alt.searchLinks,
          bookingUrl: alt.bookingUrl || alt.url,
        }, { compact: true });
      });
      html += `</div>`;
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

  return { render, fromDay, wifiConnect, renderStatusBadge, isBooked, generateSearchLinks };
})();
