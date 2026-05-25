/**
 * day-cards.js — Generic card renderer for day-specific content
 *
 * Renders day.cards[] — each card has a type and data.
 * New card types are added here, not in daily-view.js.
 *
 * Supported types:
 *   - rental-pickup: Car rental pickup (barcode, steps)
 *   - rental-return: Car rental return (address, deadline)
 *   - info: Generic info card
 *   - warning: Warning/alert card
 *   - ticket: Event ticket with barcode/QR
 */

var DayCards = (() => {

  function renderAll(cards) {
    if (!cards || !cards.length) return '';
    return cards.map(card => renderCard(card)).join('');
  }

  function renderCard(card) {
    switch (card.type) {
      case 'rental-pickup':  return renderRentalPickup(card);
      case 'rental-return':  return renderRentalReturn(card);
      case 'info':           return renderInfo(card);
      case 'warning':        return renderWarning(card);
      case 'ticket':         return renderTicket(card);
      default:               return renderGeneric(card);
    }
  }

  function renderRentalPickup(card) {
    const d = card.data || {};
    let html = `<div class="card" style="margin-top:16px;text-align:center">
      <h3>${esc(card.title)}</h3>`;
    if (d.confirmation) {
      html += `<div style="font-size:.82em;color:var(--orange);font-weight:700;margin-bottom:8px">
        Confirmation #${esc(d.confirmation)}</div>`;
    }
    if (d.ticketImage) {
      html += `<img src="${esc(d.ticketImage)}" alt="Barcode" 
        style="width:100%;max-width:360px;border-radius:12px;margin:8px auto;display:block" />`;
    }
    if (d.steps && d.steps.length) {
      html += `<div style="text-align:left;font-size:.82em;color:var(--muted);margin-top:12px;line-height:1.6">
        <div style="font-weight:700;color:var(--text);margin-bottom:6px">📋 Instructions :</div>`;
      d.steps.forEach((step, i) => {
        // Support **bold** in steps
        const formatted = step.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
        html += `<div>${i + 1}. ${formatted}</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderRentalReturn(card) {
    const d = card.data || {};
    let html = `<div class="card" style="margin-top:16px">
      <h3>${esc(card.title)}</h3>`;
    if (d.company || d.location) {
      html += `<div style="font-size:.85em;color:var(--muted);margin-bottom:8px">
        ${esc(d.company || '')}${d.location ? ' — ' + esc(d.location) : ''}</div>`;
    }
    html += `<div style="font-size:.82em;line-height:1.6">`;
    if (d.address)      html += `<div>📍 ${esc(d.address)}</div>`;
    if (d.returnBefore) html += `<div>🕐 Retour avant <b>${esc(d.returnBefore)}</b></div>`;
    if (d.phone)        html += `<div>📞 ${esc(d.phone)}</div>`;
    if (d.fuelPolicy)   html += `<div>⛽ <b>${esc(d.fuelPolicy)}</b></div>`;
    html += `</div>`;
    if (d.mapUrl || d.carplayUrl) {
      html += `<div style="display:flex;gap:8px;margin-top:10px">`;
      if (d.mapUrl) html += `<a href="${esc(d.mapUrl)}" target="_blank" class="hotel-link-btn">📍 Maps</a>`;
      if (d.carplayUrl) html += `<a href="${esc(d.carplayUrl)}" class="hotel-link-btn">🚗 CarPlay</a>`;
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderInfo(card) {
    return `<div class="card" style="margin-top:16px;border-left:3px solid var(--orange)">
      <h3>${esc(card.title)}</h3>
      <div style="font-size:.85em;line-height:1.6">${card.data?.html || esc(card.data?.text || '')}</div>
    </div>`;
  }

  function renderWarning(card) {
    return `<div class="card" style="margin-top:16px;border-left:3px solid #ff4444;background:rgba(255,68,68,.05)">
      <h3>⚠️ ${esc(card.title)}</h3>
      <div style="font-size:.85em;line-height:1.6">${card.data?.html || esc(card.data?.text || '')}</div>
    </div>`;
  }

  function renderTicket(card) {
    const d = card.data || {};
    let html = `<div class="card" style="margin-top:16px;text-align:center">
      <h3>${esc(card.title)}</h3>`;
    if (d.ref) html += `<div style="font-size:.82em;font-weight:700;color:var(--orange)">${esc(d.ref)}</div>`;
    if (d.image) html += `<img src="${esc(d.image)}" alt="Ticket" style="width:100%;max-width:360px;border-radius:12px;margin:8px auto;display:block" />`;
    if (d.text) html += `<div style="font-size:.82em;color:var(--muted);margin-top:8px">${esc(d.text)}</div>`;
    html += `</div>`;
    return html;
  }

  function renderGeneric(card) {
    return `<div class="card" style="margin-top:16px">
      <h3>${esc(card.title || card.type)}</h3>
      <pre style="font-size:.75em;overflow:auto">${esc(JSON.stringify(card.data, null, 2))}</pre>
    </div>`;
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { renderAll, renderCard };
})();
