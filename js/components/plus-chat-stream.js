/**
 * plus-chat-stream.js — Plus « Assistant Bifrost » (SSE via BE → Bifrost).
 * Always remote. Local edge has its own box (edge-chat-stream.js).
 */
var PlusChatStream = (() => {
  let _status = null;
  let _history = [];
  let _apiHistory = [];
  let _busy = false;
  let _abort = null;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function loadStatus() {
    const res = await API.getPlusChatStatus();
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
    const model = (_status && _status.model) || '';

    container.innerHTML = `<div class="leo-section plus-chat-section">
      <h3 class="section-title">Assistant Bifrost</h3>
      <p class="leo-hint">Aujourd’hui / demain : météo, hôtel, codes, bookings (serveur). Seed → Léo. Tips hors-ligne → Local.${model ? ` · <code class="plus-chat-model">${escapeHtml(model)}</code>` : ''}</p>
      <div class="leo-thread" id="plus-chat-thread"></div>
      <div class="leo-stream-status" id="plus-chat-status" hidden></div>
      <div class="leo-wait" id="plus-chat-wait" hidden>
        <span id="plus-chat-wait-label">Connexion…</span>
        <button type="button" class="btn" id="plus-chat-cancel">Annuler</button>
      </div>
      <form class="leo-compose" id="plus-chat-compose">
        <textarea id="plus-chat-input" rows="2"
          placeholder="Ex. Code wifi / pin Airbnb demain ? Météo lundi ?"
          ${!ready || !navigator.onLine ? 'disabled' : ''}></textarea>
        <button type="submit" class="btn btn-primary" id="plus-chat-send"
          ${!ready || !navigator.onLine ? 'disabled' : ''}>Envoyer</button>
      </form>
      ${!ready ? `<div class="leo-banner">Assistant non prêt${_status && _status.reason ? ` (${escapeHtml(_status.reason)})` : ''}.</div>` : ''}
    </div>`;

    paintThread();

    const form = document.getElementById('plus-chat-compose');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        send();
      });
    }
    const cancel = document.getElementById('plus-chat-cancel');
    if (cancel) {
      cancel.addEventListener('click', () => {
        if (_abort) {
          try { _abort.abort(); } catch (_) {}
        }
      });
    }

    if (!navigator.onLine) {
      const input = document.getElementById('plus-chat-input');
      const btn = document.getElementById('plus-chat-send');
      if (input) input.disabled = true;
      if (btn) btn.disabled = true;
    }
  }

  function paintThread() {
    const el = document.getElementById('plus-chat-thread');
    if (!el) return;
    if (!_history.length) {
      el.innerHTML = `<div class="leo-empty">Aucun message pour l’instant.</div>`;
      return;
    }
    el.innerHTML = _history.map(m => {
      const err = m.kind === 'error';
      const cls = m.role === 'user' ? 'leo-msg user' : (err ? 'leo-msg assistant error' : 'leo-msg assistant');
      const who = m.role === 'user' ? 'Toi' : (err ? 'Erreur' : 'Bifrost');
      return `<div class="${cls}"><div class="leo-msg-who">${who}</div><div class="leo-msg-body">${escapeHtml(m.content)}${m.live ? ' ▍' : ''}</div></div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function setBusy(on) {
    _busy = !!on;
    const btn = document.getElementById('plus-chat-send');
    const input = document.getElementById('plus-chat-input');
    const wait = document.getElementById('plus-chat-wait');
    if (btn) btn.disabled = _busy || !navigator.onLine || !(_status && _status.ready);
    if (input) input.disabled = _busy || !navigator.onLine || !(_status && _status.ready);
    if (wait) wait.hidden = !_busy;
  }

  function setStatus(text) {
    const el = document.getElementById('plus-chat-status');
    const label = document.getElementById('plus-chat-wait-label');
    if (label) label.textContent = text || 'Bifrost…';
    if (!el) return;
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = text;
  }

  async function send() {
    if (_busy) return;
    const input = document.getElementById('plus-chat-input');
    const text = String((input && input.value) || '').trim();
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    _history.push(userMsg);
    _apiHistory.push(userMsg);
    if (_apiHistory.length > 12) _apiHistory = _apiHistory.slice(-12);
    if (input) input.value = '';

    const asst = { role: 'assistant', content: '', id: 'p' + Date.now(), live: true };
    _history.push(asst);
    paintThread();
    setBusy(true);
    setStatus('Réponse serveur…');

    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;

    let finalReply = '';
    let sawError = false;
    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : '';

    try {
      for await (const ev of API.plusChatStream({
        tripId: tripId || undefined,
        messages: _apiHistory.slice(),
        signal: ac ? ac.signal : undefined,
      })) {
        const event = ev.event;
        const data = ev.data || {};
        if (event === 'delta' && data.text) {
          asst.content += data.text;
          finalReply = asst.content;
          paintThread();
        } else if (event === 'done') {
          finalReply = (data.reply != null && data.reply !== '') ? data.reply : asst.content;
          asst.content = finalReply || '(réponse vide)';
          asst.live = false;
          paintThread();
        } else if (event === 'error') {
          sawError = true;
          asst.live = false;
          _history.pop();
          let msg = data.error || 'Échec stream';
          if (data.code === 'cancelled') msg = 'Annulé.';
          _history.push({ role: 'assistant', kind: 'error', content: msg });
          paintThread();
        }
      }
    } catch (e) {
      sawError = true;
      asst.live = false;
      _history.pop();
      _history.push({
        role: 'assistant',
        kind: 'error',
        content: (ac && ac.signal && ac.signal.aborted) ? 'Annulé.' : ((e && e.message) || 'stream interrompu'),
      });
      paintThread();
    }

    _abort = null;
    if (!sawError) {
      asst.live = false;
      asst.content = finalReply || asst.content || '(réponse vide)';
      _apiHistory.push({ role: 'assistant', content: asst.content });
      paintThread();
    }
    setStatus('');
    setBusy(false);
  }

  return { loadStatus, renderSection };
})();
