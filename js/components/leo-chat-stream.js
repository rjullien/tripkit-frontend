/**
 * leo-chat-stream.js — Plus « Construire le voyage avec Léo » (SSE via BE → Hermes).
 * The sync LeoChat box was removed from the UI; BE POST /leo/chat remains for curl.
 */
var LeoChatStream = (() => {
  let _status = null;
  let _history = []; // display
  let _apiHistory = [];
  let _busy = false;
  let _abort = null;
  let _toolLine = '';

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
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
    const dash = (_status && _status.dashboardUrl) || 'https://hermes-leo.bapttf.com';

    container.innerHTML = `<div class="leo-section leo-stream-section">
      <h3 class="section-title">Construire le voyage avec Léo</h3>
      <p class="leo-hint">Demande la création ou modification du seed voyage.</p>
      <div class="leo-thread" id="leo-stream-thread"></div>
      <div class="leo-stream-status" id="leo-stream-status" hidden></div>
      <div class="leo-wait" id="leo-stream-wait" hidden>
        <span id="leo-stream-wait-label">Connexion…</span>
        <button type="button" class="btn" id="leo-stream-cancel">Annuler</button>
      </div>
      <form class="leo-compose" id="leo-stream-compose">
        <textarea id="leo-stream-input" rows="2"
          placeholder="Ex. Dans quebec-2026, ajoute une note Day 12…"
          ${!ready || !navigator.onLine ? 'disabled' : ''}></textarea>
        <button type="submit" class="btn btn-primary" id="leo-stream-send"
          ${!ready || !navigator.onLine ? 'disabled' : ''}>Envoyer</button>
      </form>
      ${!ready ? `<div class="leo-banner">Léo non prêt — <a href="${escapeHtml(dash)}" target="_blank" rel="noopener">Dashboard</a></div>` : ''}
    </div>`;

    paintThread();
    const form = document.getElementById('leo-stream-compose');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        send();
      });
    }
    const cancel = document.getElementById('leo-stream-cancel');
    if (cancel) {
      cancel.addEventListener('click', () => {
        if (_abort) {
          try { _abort.abort(); } catch (_) {}
        }
      });
    }
  }

  function paintThread() {
    const el = document.getElementById('leo-stream-thread');
    if (!el) return;
    if (!_history.length) {
      el.innerHTML = `<div class="leo-empty">Aucun message stream pour l’instant.</div>`;
      return;
    }
    el.innerHTML = _history.map(m => {
      const err = m.kind === 'error';
      const cls = m.role === 'user' ? 'leo-msg user' : (err ? 'leo-msg assistant error' : 'leo-msg assistant');
      const who = m.role === 'user' ? 'Toi' : (err ? 'Erreur' : 'Léo');
      const live = m.live ? ' leo-live' : '';
      return `<div class="${cls}${live}" data-id="${escapeHtml(m.id || '')}">
        <div class="leo-who">${who}</div>
        <div class="leo-bubble">${escapeHtml(m.content)}</div>
      </div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function setBusy(on) {
    _busy = on;
    const btn = document.getElementById('leo-stream-send');
    const input = document.getElementById('leo-stream-input');
    const wait = document.getElementById('leo-stream-wait');
    if (btn) {
      btn.disabled = on || !(_status && _status.ready) || !navigator.onLine;
      btn.textContent = on ? 'Léo…' : 'Envoyer';
    }
    if (input) input.disabled = on || !(_status && _status.ready) || !navigator.onLine;
    if (wait) wait.hidden = !on;
  }

  function setStatus(text) {
    const el = document.getElementById('leo-stream-status');
    const label = document.getElementById('leo-stream-wait-label');
    if (label) label.textContent = text || 'Léo…';
    if (!el) return;
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = text;
  }

  function toolLabel(tool) {
    if (!tool) return 'outil…';
    if (typeof tool === 'string') return tool;
    const name = tool.name || tool.tool || tool.toolName || '';
    const status = tool.status || tool.state || '';
    return [name, status].filter(Boolean).join(' · ') || 'outil…';
  }

  async function send() {
    if (_busy) return;
    const input = document.getElementById('leo-stream-input');
    const text = input ? String(input.value || '').trim() : '';
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    _history.push(userMsg);
    _apiHistory.push(userMsg);
    if (_apiHistory.length > 12) _apiHistory = _apiHistory.slice(-12);
    if (input) input.value = '';

    const asstId = 's' + Date.now();
    const asst = { role: 'assistant', content: '', id: asstId, live: true };
    _history.push(asst);
    paintThread();
    setBusy(true);
    setStatus('Connexion au stream…');
    _toolLine = '';

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : '';
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;

    let finalReply = '';
    let sawError = false;

    try {
      for await (const ev of API.leoChatStream({
        tripId: tripId || undefined,
        messages: _apiHistory.slice(),
        signal: ac ? ac.signal : undefined,
      })) {
        const event = ev.event;
        const data = ev.data || {};
        if (event === 'delta' && data.text) {
          asst.content += data.text;
          finalReply = asst.content;
          setStatus(_toolLine ? `✎ ${_toolLine}` : 'Réponse…');
          paintThread();
        } else if (event === 'tool') {
          _toolLine = toolLabel(data.tool);
          setStatus(`🔧 ${_toolLine}`);
        } else if (event === 'done') {
          finalReply = (data.reply != null && data.reply !== '') ? data.reply : asst.content;
          asst.content = finalReply || '(réponse vide)';
          asst.live = false;
          paintThread();
        } else if (event === 'error') {
          sawError = true;
          asst.live = false;
          // Replace live bubble with error
          _history.pop();
          const code = data.code || '';
          let msg = data.error || 'Échec stream';
          if (code === 'cancelled') msg = 'Annulé.';
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
