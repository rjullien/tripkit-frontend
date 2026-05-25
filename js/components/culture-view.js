/**
 * culture-view.js — Cultural guide with multi-carnet swipe + expandable zones
 * Data comes from tripData.culture[] (array of zones with sections & facts)
 * 
 * Carnet 1: Road Trip (zones 0..N-1)
 * Carnet 2: Last zone = Montréal (if title contains 'Montréal' or 'Québec')
 */

var CultureView = (() => {

  let currentCarnet = 0;
  let carnetCount = 1;

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /**
   * Render the culture view with multi-carnet support.
   */
  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    const culture = tripData?.culture;

    if (!culture || !culture.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">📚</div>
        <h3>Carnet culturel</h3>
        <p style="color:var(--muted)">Pas encore de contenu culturel chargé.</p>
      </div>`;
      return;
    }

    // Split: detect if last zone is a separate carnet (e.g. Montréal)
    const lastZone = culture[culture.length - 1];
    const lastIsSeparate = lastZone.title && (
      lastZone.title.includes('Montréal') || lastZone.title.includes('Québec') || lastZone.title.includes('Montreal')
    );
    const roadTripZones = lastIsSeparate ? culture.slice(0, -1) : culture;
    const mtlZone = lastIsSeparate ? lastZone : null;
    carnetCount = mtlZone ? 2 : 1;
    currentCarnet = 0;

    let html = `<div class="page-header">
      <h1>📚 Carnet Culturel</h1>
      <div class="sub">Swipe ou tap pour changer de carnet</div>
    </div>`;

    // Carnet tabs (only if 2 carnets)
    if (carnetCount > 1) {
      html += `<div class="carnet-switcher">
        <div class="carnet-tabs">
          <button class="carnet-tab active" onclick="CultureView.switchCarnet(0)">🗺️ Road Trip</button>
          <button class="carnet-tab" onclick="CultureView.switchCarnet(1)">🍁 Montréal</button>
        </div>
      </div>`;
    }

    // Swipe container
    html += `<div id="carnetSwipe" class="carnet-swipe">`;
    html += `<div id="carnetTrack" class="carnet-track">`;

    // ── Carnet 1: Road Trip ──
    html += `<div class="carnet-panel" id="cultureList">`;
    html += renderZones(roadTripZones, 'rt');
    html += `</div>`;

    // ── Carnet 2: Montréal ──
    if (mtlZone) {
      html += `<div class="carnet-panel" id="cultureListMtl">`;
      html += `<div style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(233,69,96,.1),rgba(78,205,196,.1));border-radius:var(--radius);margin-bottom:14px">
        <div style="font-size:2em;margin-bottom:4px">🍁</div>
        <div style="font-size:1.1em;font-weight:700;color:var(--accent)">Bienvenue à Montréal !</div>
        <div style="color:var(--muted);font-size:.8em;margin-top:4px">Phase 3 • Jours 15-19 • La Belle Province</div>
      </div>`;
      html += renderZones([mtlZone], 'mtl');
      html += `</div>`;
    }

    html += `</div></div>`; // carnet-track, carnet-swipe

    // Dots
    if (carnetCount > 1) {
      html += `<div class="carnet-dots">
        <div class="dot active"></div>
        <div class="dot"></div>
      </div>`;
    }

    container.innerHTML = html;

    // Setup swipe
    if (carnetCount > 1) setupSwipe();
  }

  function renderZones(zones, prefix) {
    let html = '';
    zones.forEach((zone, zi) => {
      const zoneId = `cz-${prefix}-${zi}`;
      html += `<div class="culture-zone" id="${zoneId}">
        <div class="cz-header" onclick="document.getElementById('${zoneId}').classList.toggle('open')">
          <div class="cz-title">${esc(zone.title)}</div>
          ${zone.sub ? `<div class="cz-sub">${esc(zone.sub)}</div>` : ''}
          <span class="cz-arrow">›</span>
        </div>
        <div class="cz-body">`;

      if (zone.sections && zone.sections.length) {
        zone.sections.forEach((sec, si) => {
          const secId = `cs-${prefix}-${zi}-${si}`;
          html += `<div class="culture-section" id="${secId}">
            <div class="cs-header" onclick="document.getElementById('${secId}').classList.toggle('open')">
              <span class="cs-title">${esc(sec.h)}</span>
              <span class="cs-toggle">+</span>
            </div>
            <div class="cs-body"><p>${esc(sec.p)}</p></div>
          </div>`;
        });
      }

      if (zone.facts && zone.facts.length) {
        html += `<div class="culture-facts"><div class="cf-title">💡 Le saviez-vous ?</div>`;
        zone.facts.forEach(f => { html += `<div class="cf-item">${esc(f)}</div>`; });
        html += `</div>`;
      }

      html += `</div></div>`;
    });
    return html;
  }

  function switchCarnet(idx) {
    currentCarnet = idx;
    const track = document.getElementById('carnetTrack');
    if (track) track.style.transform = `translateX(-${idx * 100}%)`;
    document.querySelectorAll('.carnet-tab').forEach((t,i) => t.classList.toggle('active', i===idx));
    document.querySelectorAll('.carnet-dots .dot').forEach((d,i) => d.classList.toggle('active', i===idx));
  }

  function setupSwipe() {
    const el = document.getElementById('carnetSwipe');
    if (!el) return;
    let startX=0, dx=0, moving=false;
    el.addEventListener('touchstart', e => { startX=e.touches[0].clientX; dx=0; moving=false; }, {passive:true});
    el.addEventListener('touchmove', e => {
      const mx = e.touches[0].clientX - startX;
      const my = e.touches[0].clientY - (startX ? e.touches[0].clientY : 0); // approx
      if (!moving && Math.abs(mx) > 10) moving = true;
      if (moving) {
        dx = mx;
        const track = document.getElementById('carnetTrack');
        if (track) track.style.transform = `translateX(calc(-${currentCarnet*100}% + ${dx}px))`;
        e.preventDefault();
      }
    }, {passive:false});
    el.addEventListener('touchend', () => {
      if (Math.abs(dx) > 60) {
        if (dx < 0 && currentCarnet < carnetCount - 1) switchCarnet(currentCarnet + 1);
        else if (dx > 0 && currentCarnet > 0) switchCarnet(currentCarnet - 1);
        else switchCarnet(currentCarnet);
      } else {
        switchCarnet(currentCarnet);
      }
    }, {passive:true});
  }

  return { render, switchCarnet };
})();
