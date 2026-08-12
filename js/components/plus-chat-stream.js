/**
 * plus-chat-stream.js — Plus « Assistant voyage » (SSE via BE → Bifrost).
 * Edge path (Wllama) when modèle en RAM + intent=local. Spec: SPEC-edge-model.md.
 */
var PlusChatStream = (() => {
  let _status = null;
  let _history = [];
  let _apiHistory = [];
  let _busy = false;
  let _abort = null;
  let _edgeUnsub = null;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function fmtSize(bytes) {
    const n = Number(bytes) || 0;
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB';
    if (n >= 1e6) return Math.round(n / 1e6) + ' MB';
    return n + ' o';
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

  function edgeStatus() {
    if (typeof EdgeEngine === 'undefined') return null;
    return EdgeEngine.status();
  }

  function edgeBarHtml() {
    if (typeof EdgeEngine === 'undefined' || typeof EdgeModelConfig === 'undefined') return '';
    const cfg = EdgeModelConfig.get();
    if (cfg.enabled === false) return '';
    const st = EdgeEngine.status();
    const size = fmtSize(st.sizeBytes || cfg.modelSizeBytes);

    if (st.state === 'downloading') {
      const pct = Math.round((st.progress || 0) * 100);
      return `<div class="edge-bar" id="edge-model-bar">
        <div class="edge-bar-title">Téléchargement modèle hors-ligne… ${pct}%</div>
        <div class="edge-progress"><div class="edge-progress-fill" style="width:${pct}%"></div></div>
        <p class="leo-hint" style="margin:8px 0 0">Le chat reste sur le serveur pendant le téléchargement.</p>
      </div>`;
    }
    if (st.state === 'loading_ram') {
      return `<div class="edge-bar" id="edge-model-bar">
        <div class="edge-bar-title">Activation du modèle en mémoire…</div>
        <p class="leo-hint" style="margin:8px 0 0">Quelques secondes — une seule fois par session.</p>
      </div>`;
    }
    if (st.inRam) {
      return `<div class="edge-bar edge-ready" id="edge-model-bar">
        <span class="edge-badge">⚡ local</span>
        <span class="leo-hint">Réponses instantanées hors-ligne (tips généraux).</span>
        <button type="button" class="btn edge-btn-secondary" id="edge-unload-btn">Libérer la mémoire</button>
      </div>`;
    }
    if (st.onDisk) {
      return `<div class="edge-bar" id="edge-model-bar">
        <span class="edge-badge">💾 prêt</span>
        <span class="leo-hint">Modèle sur l’appareil (${escapeHtml(size)})${st.needsUpdate ? ' — nouvelle version dispo' : ''}.</span>
        <div class="edge-actions">
          <button type="button" class="btn btn-primary" id="edge-warmup-btn">Activer maintenant</button>
          ${st.needsUpdate ? '<button type="button" class="btn" id="edge-update-btn">Mettre à jour</button>' : ''}
          <button type="button" class="btn edge-btn-danger" id="edge-purge-btn">Supprimer le modèle</button>
        </div>
        ${st.error ? `<p class="leo-hint" style="color:var(--orange);margin:10px 0 0;white-space:normal;overflow-wrap:anywhere">${escapeHtml(st.error)}</p>` : ''}
      </div>`;
    }
    // idle / error — load button
    return `<div class="edge-bar" id="edge-model-bar">
      <button type="button" class="btn" id="edge-download-btn">Charger le modèle hors-ligne (~${escapeHtml(size)})</button>
      <p class="leo-hint" style="margin:8px 0 0">Optionnel. Sans ça, l’assistant reste 100&nbsp;% serveur. Survit à «&nbsp;Vider le cache&nbsp;».</p>
      ${st.error ? `<p class="leo-hint" style="color:var(--orange);margin:6px 0 0">${escapeHtml(st.error)}</p>` : ''}
    </div>`;
  }

  function bindEdgeBar() {
    const dl = document.getElementById('edge-download-btn');
    if (dl) {
      dl.addEventListener('click', async () => {
        const cfg = EdgeModelConfig.get();
        const size = fmtSize(cfg.modelSizeBytes);
        if (!confirm(`Télécharger ~${size} ?\nPréférer Wi‑Fi.`)) return;
        dl.disabled = true;
        try {
          await EdgeEngine.download();
          if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ Modèle téléchargé');
        } catch (e) {
          // Error already in edge bar via EdgeEngine.status().error
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('❌ Téléchargement échoué', 'error');
          }
        }
        refreshEdgeBar();
      });
    }
    const warm = document.getElementById('edge-warmup-btn');
    if (warm) {
      warm.addEventListener('click', async () => {
        warm.disabled = true;
        warm.textContent = 'Activation…';
        try {
          await EdgeEngine.warmUp();
          if (typeof App !== 'undefined' && App.showToast) App.showToast('⚡ Modèle actif');
        } catch (e) {
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('❌ Activation échouée', 'error');
          }
        }
        refreshEdgeBar();
      });
    }
    const upd = document.getElementById('edge-update-btn');
    if (upd) {
      upd.addEventListener('click', async () => {
        if (!confirm('Mettre à jour le modèle ?')) return;
        upd.disabled = true;
        try {
          await EdgeEngine.download();
          if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ Modèle mis à jour');
        } catch (e) {
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('❌ Mise à jour échouée', 'error');
          }
        }
        refreshEdgeBar();
      });
    }
    const purge = document.getElementById('edge-purge-btn');
    if (purge) {
      purge.addEventListener('click', async () => {
        if (!confirm('Supprimer le modèle hors-ligne ?')) return;
        await EdgeEngine.purge();
        if (typeof App !== 'undefined' && App.showToast) App.showToast('🗑️ Modèle supprimé');
        refreshEdgeBar();
      });
    }
    const unload = document.getElementById('edge-unload-btn');
    if (unload) {
      unload.addEventListener('click', async () => {
        await EdgeEngine.unload();
        refreshEdgeBar();
      });
    }
  }

  function refreshEdgeBar() {
    const host = document.getElementById('edge-model-bar-host');
    if (!host) return;
    host.innerHTML = edgeBarHtml();
    bindEdgeBar();
  }

  function renderSection(container) {
    if (!container) return;
    const ready = !!(_status && _status.ready);
    const model = (_status && _status.model) || '';

    container.innerHTML = `<div class="leo-section plus-chat-section">
      <h3 class="section-title">Assistant voyage</h3>
      <p class="leo-hint">Questions sur aujourd’hui / demain (météo, hôtel, codes, bookings). Pour modifier un seed → Léo.${model ? ` · <code class="plus-chat-model">${escapeHtml(model)}</code>` : ''}</p>
      <div id="edge-model-bar-host">${edgeBarHtml()}</div>
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
    bindEdgeBar();

    if (_edgeUnsub) { try { _edgeUnsub(); } catch (_) {} _edgeUnsub = null; }
    if (typeof EdgeEngine !== 'undefined') {
      _edgeUnsub = EdgeEngine.onChange(() => refreshEdgeBar());
      EdgeEngine.refreshFromDisk().then(() => refreshEdgeBar());
    }

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

    // Offline: allow send if edge in RAM (local tips only)
    const st = edgeStatus();
    if (st && st.inRam) {
      const input = document.getElementById('plus-chat-input');
      const btn = document.getElementById('plus-chat-send');
      if (input) input.disabled = false;
      if (btn) btn.disabled = false;
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
      const who = m.role === 'user' ? 'Toi' : (err ? 'Erreur' : (m.source === 'edge' ? 'Assistant (local)' : 'Assistant'));
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
    const btn = document.getElementById('plus-chat-send');
    const input = document.getElementById('plus-chat-input');
    const wait = document.getElementById('plus-chat-wait');
    const st = edgeStatus();
    const canOffline = !!(st && st.inRam);
    const gate = !(_status && _status.ready) && !canOffline;
    if (btn) {
      btn.disabled = on || gate || (!navigator.onLine && !canOffline);
      btn.textContent = on ? 'Assistant…' : 'Envoyer';
    }
    if (input) input.disabled = on || gate || (!navigator.onLine && !canOffline);
    if (wait) wait.hidden = !on;
  }

  function setStatus(text) {
    const el = document.getElementById('plus-chat-status');
    const label = document.getElementById('plus-chat-wait-label');
    if (label) label.textContent = text || 'Assistant…';
    if (!el) return;
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = text;
  }

  async function generateLocal(text, asst, ac) {
    setStatus('Réponse locale…');
    const hist = _apiHistory.slice(0, -1); // exclude current user msg already pushed
    const reply = await EdgeEngine.generate(text, hist, {
      signal: ac ? ac.signal : undefined,
      onDelta: (delta) => {
        asst.content += delta;
        asst.source = 'edge';
        paintThread();
      },
    });
    asst.content = reply || asst.content || '(réponse vide)';
    asst.source = 'edge';
    asst.live = false;
    paintThread();
    return asst.content;
  }

  async function generateRemote(text, asst, ac) {
    setStatus('Réponse serveur…');
    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : '';
    let finalReply = '';
    let sawError = false;

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
        setStatus('Réponse serveur…');
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
        const code = data.code || '';
        let msg = data.error || 'Échec stream';
        if (code === 'cancelled') msg = 'Annulé.';
        _history.push({ role: 'assistant', kind: 'error', content: msg });
        paintThread();
      }
    }
    return { finalReply, sawError };
  }

  async function send() {
    if (_busy) return;
    const input = document.getElementById('plus-chat-input');
    const text = input ? String(input.value || '').trim() : '';
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    _history.push(userMsg);
    _apiHistory.push(userMsg);
    if (_apiHistory.length > 12) _apiHistory = _apiHistory.slice(-12);
    if (input) input.value = '';

    const asstId = 'p' + Date.now();
    const asst = { role: 'assistant', content: '', id: asstId, live: true };
    _history.push(asst);
    paintThread();
    setBusy(true);
    setStatus('Connexion…');

    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;

    let finalReply = '';
    let sawError = false;

    const intent = (typeof EdgeIntent !== 'undefined') ? EdgeIntent.classify(text) : 'remote';
    const wantEdge = intent === 'local'
      && typeof EdgeEngine !== 'undefined'
      && (EdgeEngine.isLoaded() || EdgeEngine.hasOnDisk());

    try {
      if (wantEdge) {
        try {
          if (!EdgeEngine.isLoaded()) {
            setStatus('Activation modèle…');
            await EdgeEngine.warmUp();
          }
          finalReply = await generateLocal(text, asst, ac);
        } catch (edgeErr) {
          if (ac && ac.signal && ac.signal.aborted) throw edgeErr;
          console.warn('[plus-chat] edge fallback → bifrost', edgeErr);
          asst.content = '';
          asst.source = undefined;
          const remote = await generateRemote(text, asst, ac);
          finalReply = remote.finalReply;
          sawError = remote.sawError;
        }
      } else {
        const remote = await generateRemote(text, asst, ac);
        finalReply = remote.finalReply;
        sawError = remote.sawError;
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

  return { loadStatus, renderSection, refreshEdgeBar };
})();
