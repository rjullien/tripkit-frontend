/**
 * leo-chat-stream.js — Plus « Construire le voyage avec Léo » (SSE via BE → Hermes).
 * The sync LeoChat box was removed from the UI; BE POST /leo/chat remains for curl.
 *
 * V1 jobs: POST /leo/chat/stream still streams live (delta + tool) while the
 * app is open. Lock-phone / dropped SSE only drops the listener; Hermes keeps
 * running. Reconnect GET /leo/jobs/{id}/stream?after=N. Annuler → POST cancel.
 */
var LeoChatStream = (() => {
  const JOB_KEY = 'tk-leo-job';
  const SEQ_KEY = 'tk-leo-seq';
  const HIST_KEY = 'tk-leo-hist';
  const API_HIST_KEY = 'tk-leo-api-hist';
  const MODEL_KEY = 'tk-leo-model';

  let _status = null;
  let _history = []; // display
  let _apiHistory = [];
  let _busy = false;
  let _abort = null;
  let _toolLine = '';
  let _jobId = null;
  let _lastSeq = 0;
  let _wantCancel = false;
  let _pausing = false;
  let _resumeTimer = null;
  let _listening = false;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function persistJob() {
    try {
      if (!_jobId) {
        sessionStorage.removeItem(JOB_KEY);
        sessionStorage.removeItem(SEQ_KEY);
        sessionStorage.removeItem(HIST_KEY);
        sessionStorage.removeItem(API_HIST_KEY);
        return;
      }
      sessionStorage.setItem(JOB_KEY, _jobId);
      sessionStorage.setItem(SEQ_KEY, String(_lastSeq || 0));
      sessionStorage.setItem(HIST_KEY, JSON.stringify(_history));
      sessionStorage.setItem(API_HIST_KEY, JSON.stringify(_apiHistory));
    } catch (_) {}
  }

  function clearJob() {
    _jobId = null;
    _lastSeq = 0;
    persistJob();
  }

  function restoreFromSession() {
    try {
      const id = sessionStorage.getItem(JOB_KEY);
      if (!id) return;
      _jobId = id;
      _lastSeq = Number(sessionStorage.getItem(SEQ_KEY) || 0) || 0;
      const hist = sessionStorage.getItem(HIST_KEY);
      if (hist) _history = JSON.parse(hist);
      const api = sessionStorage.getItem(API_HIST_KEY);
      if (api) _apiHistory = JSON.parse(api);
    } catch (_) {}
  }

  restoreFromSession();

  function allowedModels() {
    const list = (_status && Array.isArray(_status.models)) ? _status.models : [];
    return list.filter(m => m && m.id);
  }

  function defaultModelId() {
    const d = _status && _status.defaultModel;
    if (d && allowedModels().some(m => m.id === d)) return d;
    const first = allowedModels()[0];
    return first ? first.id : '';
  }

  function selectedModelId() {
    const allowed = allowedModels();
    if (!allowed.length) return '';
    const sel = document.getElementById('leo-stream-model');
    if (sel && sel.value && allowed.some(m => m.id === sel.value)) return sel.value;
    let saved = '';
    try { saved = localStorage.getItem(MODEL_KEY) || ''; } catch (_) {}
    if (saved && allowed.some(m => m.id === saved)) return saved;
    return defaultModelId();
  }

  function persistModel(id) {
    if (!id) return;
    try { localStorage.setItem(MODEL_KEY, id); } catch (_) {}
  }

  function modelLabel(id) {
    if (!id) return '';
    const m = allowedModels().find(x => x.id === id);
    return (m && m.label) || id;
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
    const models = allowedModels();
    const selected = selectedModelId();
    const modelRow = models.length
      ? `<div class="leo-compose-row">
        <label class="leo-model-label">Modèle
          <select id="leo-stream-model" ${!ready || !navigator.onLine ? 'disabled' : ''}>
            ${models.map(m => `<option value="${escapeHtml(m.id)}"${m.id === selected ? ' selected' : ''}>${escapeHtml(m.label || m.id)}</option>`).join('')}
          </select>
        </label>
        <button type="submit" class="btn btn-primary" id="leo-stream-send"
          ${!ready || !navigator.onLine ? 'disabled' : ''}>Envoyer</button>
      </div>`
      : `<button type="submit" class="btn btn-primary" id="leo-stream-send"
          ${!ready || !navigator.onLine ? 'disabled' : ''}>Envoyer</button>`;

    container.innerHTML = `<div class="leo-section leo-stream-section">
      <h3 class="section-title">Léo</h3>
      <p class="leo-hint">Créer / modifier le seed voyage (Hermes).</p>
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
        ${modelRow}
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
    const sel = document.getElementById('leo-stream-model');
    if (sel) {
      sel.addEventListener('change', () => persistModel(sel.value));
    }
    const cancel = document.getElementById('leo-stream-cancel');
    if (cancel) {
      cancel.addEventListener('click', () => { cancelJob(); });
    }
    if (_jobId || _busy) {
      setBusy(true);
      resumeIfNeeded();
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
      const model = (m.role === 'assistant' && !err && m.model)
        ? ` <span class="leo-msg-model">${escapeHtml(modelLabel(m.model))}</span>`
        : '';
      return `<div class="${cls}${live}" data-id="${escapeHtml(m.id || '')}">
        <div class="leo-who">${who}${model}</div>
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
    const sel = document.getElementById('leo-stream-model');
    const blocked = on || !(_status && _status.ready) || !navigator.onLine;
    if (btn) {
      btn.disabled = blocked;
      btn.textContent = on ? 'Léo…' : 'Envoyer';
    }
    if (input) input.disabled = blocked;
    if (sel) sel.disabled = blocked;
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

  function liveAsst() {
    for (let i = _history.length - 1; i >= 0; i--) {
      const m = _history[i];
      if (m && m.role === 'assistant' && m.live) return m;
    }
    return null;
  }

  function ensureLiveBubble() {
    let asst = liveAsst();
    if (asst) return asst;
    asst = { role: 'assistant', content: '', id: 's' + Date.now(), live: true };
    _history.push(asst);
    paintThread();
    return asst;
  }

  function noteModel(asst, data) {
    if (!asst || !data || !data.model) return;
    asst.model = data.model;
  }

  function noteSeq(data) {
    if (!data) return;
    if (data.jobId) _jobId = data.jobId;
    const seq = Number(data.seq);
    if (Number.isFinite(seq) && seq > _lastSeq) _lastSeq = seq;
    persistJob();
  }

  function finishIdle() {
    _abort = null;
    _pausing = false;
    _wantCancel = false;
    _toolLine = '';
    setStatus('');
    setBusy(false);
  }

  function showError(asst, msg) {
    if (asst && _history[_history.length - 1] === asst) _history.pop();
    else if (asst) asst.live = false;
    _history.push({ role: 'assistant', kind: 'error', content: msg });
    paintThread();
  }

  async function consume(iter, asst) {
    let finalReply = asst.content || '';
    try {
      for await (const ev of iter) {
        const event = ev.event;
        const data = ev.data || {};
        noteSeq(data);
        if (event === 'meta') {
          noteModel(asst, data);
          if (data.model) paintThread();
          setStatus(_toolLine ? `🔧 ${_toolLine}` : 'Léo…');
        } else if (event === 'delta' && data.text) {
          asst.content += data.text;
          finalReply = asst.content;
          noteModel(asst, data);
          setStatus(_toolLine ? `✎ ${_toolLine}` : 'Réponse…');
          paintThread();
          persistJob();
        } else if (event === 'tool') {
          _toolLine = toolLabel(data.tool);
          setStatus(`🔧 ${_toolLine}`);
        } else if (event === 'done') {
          finalReply = (data.reply != null && data.reply !== '') ? data.reply : asst.content;
          asst.content = finalReply || '(réponse vide)';
          asst.live = false;
          noteModel(asst, data);
          paintThread();
          return { outcome: 'done', reply: asst.content };
        } else if (event === 'error') {
          const code = data.code || '';
          if (code === 'job_not_found') {
            return { outcome: 'expired' };
          }
          if (_wantCancel || (code === 'cancelled' && !_pausing)) {
            return { outcome: 'cancelled' };
          }
          if (_pausing || code === 'network' || code === 'timeout') {
            return { outcome: 'drop' };
          }
          let msg = data.error || 'Échec stream';
          if (typeof API !== 'undefined' && API.netFailMessage) {
            msg = API.netFailMessage({ message: msg }, code === 'cancelled');
          }
          return { outcome: 'error', message: msg };
        }
      }
    } catch (e) {
      if (_wantCancel) return { outcome: 'cancelled' };
      if (_pausing || _jobId) return { outcome: 'drop' };
      return {
        outcome: 'error',
        message: (typeof API !== 'undefined' && API.netFailMessage)
          ? API.netFailMessage(e, false)
          : ((e && e.message) || 'stream interrompu'),
      };
    }
    if (_wantCancel) return { outcome: 'cancelled' };
    if (_jobId && !_wantCancel) return { outcome: 'drop' };
    return { outcome: 'done', reply: finalReply };
  }

  function scheduleResume() {
    clearTimeout(_resumeTimer);
    _resumeTimer = setTimeout(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      resumeIfNeeded();
    }, 600);
  }

  function pauseListener() {
    if (!_jobId || _wantCancel) return;
    _pausing = true;
    if (_abort) {
      try { _abort.abort(); } catch (_) {}
      _abort = null;
    }
    setStatus('En arrière-plan…');
    persistJob();
  }

  async function cancelJob() {
    _wantCancel = true;
    const id = _jobId;
    if (id && typeof API !== 'undefined' && API.cancelLeoJob) {
      try { await API.cancelLeoJob(id); } catch (_) {}
    }
    if (_abort) {
      try { _abort.abort(); } catch (_) {}
    }
  }

  async function listenGet(asst) {
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;
    _pausing = false;
    return consume(API.leoJobStream(_jobId, _lastSeq, { signal: ac ? ac.signal : undefined }), asst);
  }

  async function handleOutcome(result, asst) {
    const outcome = (result && result.outcome) || 'drop';
    if (outcome === 'drop') {
      _abort = null;
      setBusy(true);
      setStatus('Reconnexion…');
      persistJob();
      scheduleResume();
      return;
    }
    if (outcome === 'done') {
      asst.live = false;
      asst.content = result.reply || asst.content || '(réponse vide)';
      _apiHistory.push({ role: 'assistant', content: asst.content });
      if (_apiHistory.length > 12) _apiHistory = _apiHistory.slice(-12);
      paintThread();
      clearJob();
      finishIdle();
      return;
    }
    asst.live = false;
    if (outcome === 'cancelled') {
      showError(asst, 'Annulé.');
    } else if (outcome === 'expired') {
      showError(asst, 'Session Léo expirée. Réessaie.');
    } else {
      showError(asst, (result && result.message) || 'Échec stream');
    }
    clearJob();
    finishIdle();
  }

  async function resumeIfNeeded() {
    restoreFromSession();
    if (!_jobId || _wantCancel) return;
    if (_abort || _listening) return;
    _listening = true;
    try {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        setBusy(true);
        setStatus('En arrière-plan…');
        return;
      }
      if (!navigator.onLine) {
        setBusy(true);
        setStatus('Reconnexion…');
        return;
      }
      const asst = ensureLiveBubble();
      setBusy(true);
      setStatus('Reconnexion…');
      const result = await listenGet(asst);
      await handleOutcome(result, asst);
    } finally {
      _listening = false;
    }
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

    const asst = { role: 'assistant', content: '', id: 's' + Date.now(), live: true };
    _history.push(asst);
    paintThread();
    setBusy(true);
    setStatus('Connexion au stream…');
    _toolLine = '';
    _wantCancel = false;
    _pausing = false;
    _lastSeq = 0;
    _jobId = null;

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : '';
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;
    _listening = true;
    const model = selectedModelId();
    persistModel(model);

    let result;
    try {
      result = await consume(API.leoChatStream({
        tripId: tripId || undefined,
        messages: _apiHistory.slice(),
        model: model || undefined,
        signal: ac ? ac.signal : undefined,
      }), asst);
    } finally {
      _listening = false;
    }
    await handleOutcome(result, asst);
  }

  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') pauseListener();
      else resumeIfNeeded();
    });
  }

  return { loadStatus, renderSection, resumeIfNeeded };
})();
