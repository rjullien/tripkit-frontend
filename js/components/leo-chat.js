/**
 * leo-chat.js — Legacy sync Plus chat (POST /leo/chat).
 * Removed from the UI in favor of leo-chat-stream.js. File kept for reference;
 * not loaded by index.html. BE endpoint remains for curl/debug.
 */
var LeoChat = (() => {
  let _status = null;
  /** Display thread (includes error bubbles). */
  let _history = []; // {role, content, kind?}
  /** Only successful user/assistant turns sent to the API. */
  let _apiHistory = [];
  let _busy = false;
  let _abort = null;
  let _tickTimer = null;
  let _startedAt = 0;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /**
   * One short line — never concatenate code + error + hint.
   * Prefer BE/FE `code`, then a single human string.
   */
  function formatLeoError(res) {
    const data = (res && res.data) || {};
    const status = (res && res.status) || 0;
    const code = typeof data.code === 'string' ? data.code : '';

    if (code === 'timeout' || status === 408 || status === 504) {
      return 'Léo met trop longtemps. Demande plus courte, ou Dashboard.';
    }
    if (code === 'network' || status === 0) {
      return 'Connexion coupée. Réessaie.';
    }
    if (code === 'missing_hermes_key') {
      return 'Léo non configuré (clé Hermes).';
    }
    if (code === 'cancelled') {
      return 'Annulé.';
    }

    let detail = '';
    const rawErr = data.error;
    if (typeof rawErr === 'string' && rawErr.trim()) {
      detail = rawErr.trim();
    } else if (typeof (res && res.error) === 'string' && res.error.trim()) {
      detail = res.error.trim();
    }
    if (detail && (/^\s*<(!DOCTYPE|html)/i.test(detail) || /<!DOCTYPE|<html[\s>]/i.test(detail))) {
      detail = '';
    }
    if (/fetch is aborted|aborted|timeout|délai|Client\.Timeout/i.test(detail)) {
      return 'Léo met trop longtemps. Demande plus courte, ou Dashboard.';
    }
    if (/load failed|failed to fetch|échec réseau/i.test(detail)) {
      return 'Connexion coupée. Réessaie.';
    }
    if (detail && detail.length > 120) detail = detail.slice(0, 117) + '…';
    if (detail && !/^(error|failed|Échec)$/i.test(detail)) return detail;

    if (status === 502 || status === 503) return 'Hermes injoignable. Réessaie plus tard.';
    if (status === 401) return 'Session expirée — reconnecte-toi.';
    if (status === 403) return 'Accès refusé.';
    return 'Échec Léo. Réessaie.';
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
    const ready = !!(_status && _status.ready);
    const reason = _status && _status.reason;
    const dash = (_status && _status.dashboardUrl) || 'https://hermes-leo.bapttf.com';
    const tg = _status && _status.telegramUrl;

    let html = `<div class="leo-section">
      <h3 class="section-title">Parler à Léo</h3>
      <p class="leo-hint">Mode <strong>sync</strong> — demandes courtes (timeout ~45s).
        Plus long → boîte <em>Léo streaming</em> dessous, ou
        <a href="${escapeHtml(dash)}" target="_blank" rel="noopener">Dashboard</a>${
          tg ? ` / <a href="${escapeHtml(tg)}" target="_blank" rel="noopener">Telegram</a>` : ''
        }.</p>`;

    if (!ready) {
      html += `<div class="leo-banner">
        Léo n’est pas prêt côté serveur
        ${reason ? ` (<code>${escapeHtml(reason)}</code>)` : ''}.
        <div class="leo-fallback">
          <a class="btn" href="${escapeHtml(dash)}" target="_blank" rel="noopener">Dashboard Léo</a>
          ${tg ? `<a class="btn" href="${escapeHtml(tg)}" target="_blank" rel="noopener">Telegram</a>` : ''}
        </div>
      </div>`;
    }

    html += `<div class="leo-thread" id="leo-thread"></div>
      <div class="leo-wait" id="leo-wait" hidden>
        <span id="leo-wait-label">Léo réfléchit…</span>
        <button type="button" class="btn" id="leo-cancel">Annuler</button>
      </div>
      <form class="leo-compose" id="leo-compose">
        <textarea id="leo-input" rows="2" placeholder="Ex. Québec — ajoute une note Day 12 sur le ferry"
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
    const cancel = document.getElementById('leo-cancel');
    if (cancel) {
      cancel.addEventListener('click', () => {
        if (_abort) {
          try { _abort.abort(); } catch (_) {}
        }
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
      const err = m.kind === 'error';
      const cls = m.role === 'user' ? 'leo-msg user' : (err ? 'leo-msg assistant error' : 'leo-msg assistant');
      const who = m.role === 'user' ? 'Toi' : (err ? 'Erreur' : 'Léo');
      return `<div class="${cls}"><div class="leo-who">${who}</div><div class="leo-bubble">${escapeHtml(m.content)}</div></div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function setBusy(on) {
    _busy = on;
    const btn = document.getElementById('leo-send');
    const input = document.getElementById('leo-input');
    const wait = document.getElementById('leo-wait');
    if (btn) btn.disabled = on || !(_status && _status.ready) || !navigator.onLine;
    if (input) input.disabled = on || !(_status && _status.ready) || !navigator.onLine;
    if (btn) btn.textContent = on ? 'En cours…' : 'Envoyer';
    if (wait) wait.hidden = !on;
    if (!on) {
      clearInterval(_tickTimer);
      _tickTimer = null;
      const label = document.getElementById('leo-wait-label');
      if (label) label.textContent = 'Léo réfléchit…';
    }
  }

  function startWaitTick() {
    _startedAt = Date.now();
    const label = document.getElementById('leo-wait-label');
    const paint = () => {
      if (!label) return;
      const s = Math.round((Date.now() - _startedAt) / 1000);
      label.textContent = s < 3 ? 'Léo réfléchit…' : `Léo réfléchit… ${s}s`;
    };
    paint();
    clearInterval(_tickTimer);
    _tickTimer = setInterval(paint, 1000);
  }

  async function send() {
    if (_busy) return;
    const input = document.getElementById('leo-input');
    const text = input ? String(input.value || '').trim() : '';
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    _history.push(userMsg);
    _apiHistory.push(userMsg);
    // Keep API payload small (BE also caps).
    if (_apiHistory.length > 12) _apiHistory = _apiHistory.slice(-12);
    if (input) input.value = '';
    paintThread();
    setBusy(true);
    startWaitTick();

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : '';

    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;

    const res = await API.leoChat({
      tripId: tripId || undefined,
      messages: _apiHistory.slice(),
      signal: ac ? ac.signal : undefined,
    });

    _abort = null;

    if (!res.ok) {
      // Don't push errors into _apiHistory (would poison the next Hermes turn).
      const cancelled = !!(ac && ac.signal && ac.signal.aborted)
        || (res.data && res.data.code === 'cancelled');
      _history.push({
        role: 'assistant',
        kind: 'error',
        content: cancelled && res.data && res.data.code !== 'timeout'
          ? 'Annulé.'
          : formatLeoError(res),
      });
      paintThread();
      setBusy(false);
      return;
    }

    const reply = (res.data && res.data.reply) || '(réponse vide)';
    const asst = { role: 'assistant', content: reply };
    _history.push(asst);
    _apiHistory.push(asst);
    paintThread();
    setBusy(false);
  }

  return { loadStatus, renderSection };
})();
