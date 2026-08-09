/**
 * leo-chat.js — Chat Plus → TripKit BE proxy → Hermes Léo
 * Ask Léo for seed-repo modifications (not a substitute for Publish).
 */
var LeoChat = (() => {
  let _status = null;
  let _history = []; // {role, content} for API (user/assistant only)
  let _busy = false;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /** Human-readable Leo/Hermes failure (avoid bare « Erreur : error »). */
  function formatLeoError(res) {
    const data = (res && res.data) || {};
    const status = (res && res.status) || 0;
    const code = typeof data.code === 'string' ? data.code : '';

    let detail = '';
    const rawErr = data.error;
    if (typeof rawErr === 'string' && rawErr.trim()) {
      detail = rawErr.trim();
    } else if (rawErr && typeof rawErr === 'object') {
      detail = String(rawErr.message || rawErr.msg || '').trim()
        || JSON.stringify(rawErr);
    } else if (typeof data.raw === 'string' && data.raw.trim()) {
      detail = data.raw.trim().slice(0, 240);
    } else if (typeof (res && res.error) === 'string' && res.error.trim()) {
      detail = res.error.trim();
    }

    // requestJSON / fetch fallbacks that are not useful alone
    if (/^(error|failed|Échec)$/i.test(detail)) detail = '';

    const byCode = {
      missing_hermes_key: 'clé Hermes absente (Infisical hermes-api-key)',
      leo_chat_failed: 'échec de l’appel à Hermes',
    };
    const byStatus = {
      0: 'réseau ou délai dépassé',
      401: 'session non authentifiée',
      403: 'accès refusé',
      408: 'délai dépassé',
      502: 'Hermes injoignable (Bad Gateway)',
      503: 'Léo indisponible côté serveur',
      504: 'délai dépassé vers Hermes',
    };

    const parts = [];
    if (status) parts.push(`HTTP ${status}`);
    if (detail) {
      if (code && !detail.includes(code)) parts.push(code);
      parts.push(detail);
    } else if (code && byCode[code]) {
      parts.push(byCode[code]);
    } else if (byStatus[status]) {
      parts.push(byStatus[status]);
    } else if (code) {
      parts.push(code);
    } else {
      parts.push('échec sans détail (réponse vide)');
    }
    if (typeof data.hint === 'string' && data.hint.trim()) {
      parts.push(data.hint.trim());
    }
    return parts.join(' — ');
  }

  async function loadStatus() {
    const res = await API.getLeoStatus();
    if (!res.ok || !res.data) {
      _status = { ready: false, reason: res.error || 'unreachable' };
      return _status;
    }
    _status = res.data;
    return _status;
  }

  function renderSection(container) {
    if (!container) return;
    const ready = !!( _status && _status.ready);
    const reason = _status && _status.reason;
    const dash = (_status && _status.dashboardUrl) || 'https://hermes-leo.bapttf.com';
    const tg = _status && _status.telegramUrl;

    let html = `<div class="leo-section">
      <h3 class="section-title">Parler à Léo</h3>
      <p class="leo-hint">Demande des modifs dans les repos seed (Québec, Baléares…).
        Pour un simple reseed prod → utilise <strong>Publier depuis git</strong> au-dessus.</p>`;

    if (!ready) {
      html += `<div class="leo-banner">
        Léo n’est pas prêt côté serveur
        ${reason ? ` (<code>${escapeHtml(reason)}</code>)` : ''}.
        Ajoute la clé Hermes dans Infisical (<code>hermes-api-key</code>), ou utilise un fallback :
        <div class="leo-fallback">
          <a class="btn" href="${escapeHtml(dash)}" target="_blank" rel="noopener">Dashboard Léo</a>
          ${tg ? `<a class="btn" href="${escapeHtml(tg)}" target="_blank" rel="noopener">Telegram</a>` : ''}
        </div>
      </div>`;
    }

    html += `<div class="leo-thread" id="leo-thread"></div>
      <form class="leo-compose" id="leo-compose">
        <textarea id="leo-input" rows="3" placeholder="Ex. Dans quebec-2026, ajoute une note Day 12 sur le ferry…"
          ${!ready || !navigator.onLine ? 'disabled' : ''}></textarea>
        <button type="submit" class="btn btn-primary" id="leo-send"
          ${!ready || !navigator.onLine ? 'disabled' : ''}>Envoyer</button>
      </form>
    </div>`;

    container.innerHTML = html;
    paintThread();
    const form = document.getElementById('leo-compose');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        send();
      });
    }
  }

  function paintThread() {
    const el = document.getElementById('leo-thread');
    if (!el) return;
    if (!_history.length) {
      el.innerHTML = `<div class="leo-empty">Aucun message pour l’instant.</div>`;
      return;
    }
    el.innerHTML = _history.map(m => {
      const cls = m.role === 'user' ? 'leo-msg user' : 'leo-msg assistant';
      const who = m.role === 'user' ? 'Toi' : 'Léo';
      return `<div class="${cls}"><div class="leo-who">${who}</div><div class="leo-bubble">${escapeHtml(m.content)}</div></div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function setBusy(on) {
    _busy = on;
    const btn = document.getElementById('leo-send');
    const input = document.getElementById('leo-input');
    if (btn) btn.disabled = on || !(_status && _status.ready) || !navigator.onLine;
    if (input) input.disabled = on || !(_status && _status.ready) || !navigator.onLine;
    if (btn) btn.textContent = on ? 'Léo réfléchit…' : 'Envoyer';
  }

  async function send() {
    if (_busy) return;
    const input = document.getElementById('leo-input');
    const text = input ? String(input.value || '').trim() : '';
    if (!text) return;

    _history.push({ role: 'user', content: text });
    if (input) input.value = '';
    paintThread();
    setBusy(true);

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : '';

    const res = await API.leoChat({
      tripId: tripId || undefined,
      messages: _history.slice(),
    });

    if (!res.ok) {
      _history.push({
        role: 'assistant',
        content: 'Erreur : ' + formatLeoError(res),
      });
      paintThread();
      setBusy(false);
      return;
    }

    const reply = (res.data && res.data.reply) || '(réponse vide)';
    _history.push({ role: 'assistant', content: reply });
    paintThread();
    setBusy(false);
  }

  return { loadStatus, renderSection };
})();
