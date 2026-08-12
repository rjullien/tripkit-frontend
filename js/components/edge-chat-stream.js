/**
 * edge-chat-stream.js — Plus « Local » (Wllama on-device).
 * Separate from Bifrost. Spec: SPEC-edge-model.md — Léo → Bifrost → Local.
 */
var EdgeChatStream = (() => {
  let _history = [];
  let _apiHistory = [];
  let _busy = false;
  let _abort = null;
  let _edgeUnsub = null;
  let _paintScheduled = false;

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

  function edgeStatus() {
    if (typeof EdgeEngine === 'undefined') return null;
    return EdgeEngine.status();
  }

  function canSend() {
    const st = edgeStatus();
    return !!(st && st.inRam && !_busy);
  }

  function edgeBarHtml() {
    if (typeof EdgeEngine === 'undefined' || typeof EdgeModelConfig === 'undefined') {
      return `<div class="edge-bar"><p class="leo-hint">Runtime local indisponible.</p></div>`;
    }
    const cfg = EdgeModelConfig.get();
    if (cfg.enabled === false) {
      return `<div class="edge-bar"><p class="leo-hint">Modèle local désactivé.</p></div>`;
    }
    const st = EdgeEngine.status();
    const size = fmtSize(st.sizeBytes || cfg.modelSizeBytes);

    if (st.state === 'downloading') {
      const pct = Math.round((st.progress || 0) * 100);
      return `<div class="edge-bar" id="edge-model-bar">
        <div class="edge-bar-title">Téléchargement… ${pct}%</div>
        <div class="edge-progress"><div class="edge-progress-fill" style="width:${pct}%"></div></div>
      </div>`;
    }
    if (st.state === 'loading_ram') {
      const pct = Math.round((st.progress || 0) * 100);
      const elapsed = st.elapsedSec || 0;
      const phase = st.phase || 'Activation…';
      const detail = st.detail || '';
      const hint = st.hint || '';
      const known = pct > 0;
      return `<div class="edge-bar" id="edge-model-bar">
        <div class="edge-bar-title">${escapeHtml(phase)}${known ? ' · ' + pct + '%' : ''}</div>
        <div class="edge-progress${known ? '' : ' indeterminate'}">
          <div class="edge-progress-fill" style="${known ? 'width:' + pct + '%' : ''}"></div>
        </div>
        <p class="leo-hint" style="margin:8px 0 0">
          <strong style="color:var(--text)">${elapsed}s</strong>
          ${hint ? ' — ' + escapeHtml(hint) : ''}
        </p>
        ${detail ? `<p class="leo-hint" style="margin:6px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78em;overflow-wrap:anywhere">${escapeHtml(detail)}</p>` : ''}
        <button type="button" class="btn edge-btn-secondary" id="edge-cancel-warmup-btn" style="margin-top:10px">Annuler</button>
      </div>`;
    }
    if (st.inRam) {
      return `<div class="edge-bar edge-ready" id="edge-model-bar">
        <span class="edge-badge">⚡ actif</span>
        <span class="leo-hint">Tips généraux hors-ligne (pas de météo / bookings).</span>
        <button type="button" class="btn edge-btn-secondary" id="edge-unload-btn">Libérer la mémoire</button>
      </div>`;
    }
    if (st.onDisk) {
      return `<div class="edge-bar" id="edge-model-bar">
        <span class="edge-badge">💾 prêt</span>
        <span class="leo-hint">Sur l’appareil (${escapeHtml(size)})${st.needsUpdate ? ' — <strong style="color:var(--orange)">nouvelle version</strong>' : ''}.</span>
        <div class="edge-actions">
          ${st.needsUpdate
            ? '<button type="button" class="btn btn-primary" id="edge-update-btn">Remplacer le modèle</button>'
            : '<button type="button" class="btn btn-primary" id="edge-warmup-btn">Activer maintenant</button>'}
          <button type="button" class="btn edge-btn-danger" id="edge-purge-btn">Supprimer</button>
        </div>
        ${st.error ? `<p class="leo-hint" style="color:var(--orange);margin:10px 0 0;white-space:normal;overflow-wrap:anywhere">${escapeHtml(st.error)}</p>` : ''}
      </div>`;
    }
    return `<div class="edge-bar" id="edge-model-bar">
      <button type="button" class="btn" id="edge-download-btn">Charger le modèle (~${escapeHtml(size)})</button>
      <p class="leo-hint" style="margin:8px 0 0">Optionnel. Survit à «&nbsp;Vider le cache&nbsp;». Bifrost reste disponible au-dessus.</p>
      ${st.error ? `<p class="leo-hint" style="color:var(--orange);margin:6px 0 0">${escapeHtml(st.error)}</p>` : ''}
    </div>`;
  }

  function bindEdgeBar() {
    const dl = document.getElementById('edge-download-btn');
    if (dl) {
      dl.addEventListener('click', async () => {
        const cfg = EdgeModelConfig.get();
        if (!confirm(`Télécharger ~${fmtSize(cfg.modelSizeBytes)} ?\nPréférer Wi‑Fi.`)) return;
        dl.disabled = true;
        try {
          await EdgeEngine.download();
          if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ Modèle téléchargé');
        } catch (_) {
          if (typeof App !== 'undefined' && App.showToast) App.showToast('❌ Téléchargement échoué', 'error');
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
        } catch (_) {
          if (typeof App !== 'undefined' && App.showToast) App.showToast('❌ Activation échouée', 'error');
        }
        refreshEdgeBar();
      });
    }
    const upd = document.getElementById('edge-update-btn');
    if (upd) {
      upd.addEventListener('click', async () => {
        if (!confirm('Remplacer le modèle OPFS par la version actuelle ?')) return;
        upd.disabled = true;
        try {
          await EdgeEngine.download();
          if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ Modèle mis à jour');
        } catch (_) {
          if (typeof App !== 'undefined' && App.showToast) App.showToast('❌ Mise à jour échouée', 'error');
        }
        refreshEdgeBar();
      });
    }
    const purge = document.getElementById('edge-purge-btn');
    if (purge) {
      purge.addEventListener('click', async () => {
        if (!confirm('Supprimer le modèle de cet appareil ?')) return;
        await EdgeEngine.purge();
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
    const cancelWarm = document.getElementById('edge-cancel-warmup-btn');
    if (cancelWarm) {
      cancelWarm.addEventListener('click', async () => {
        await EdgeEngine.cancelWarmUp();
        refreshEdgeBar();
      });
    }
    syncComposeEnabled();
  }

  function refreshEdgeBar() {
    const host = document.getElementById('edge-model-bar-host');
    if (!host) return;
    host.innerHTML = edgeBarHtml();
    bindEdgeBar();
  }

  function patchEdgeLoading(st) {
    const bar = document.getElementById('edge-model-bar');
    if (!bar || !st) return false;
    const title = bar.querySelector('.edge-bar-title');
    const pct = Math.round((st.progress || 0) * 100);
    const known = pct > 0;
    if (title) {
      title.textContent = (st.phase || 'Activation…') + (known ? ' · ' + pct + '%' : '');
    }
    const hints = bar.querySelectorAll('.leo-hint');
    if (hints[0]) {
      hints[0].innerHTML = `<strong style="color:var(--text)">${st.elapsedSec || 0}s</strong>`
        + (st.hint ? ' — ' + escapeHtml(st.hint) : '');
    }
    if (st.detail) {
      let det = hints[1];
      if (!det || !det.classList.contains('edge-detail')) {
        det = document.createElement('p');
        det.className = 'leo-hint edge-detail';
        det.style.cssText = 'margin:6px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78em;overflow-wrap:anywhere';
        hints[0] && hints[0].after(det);
      }
      det.textContent = st.detail;
    }
    const fill = bar.querySelector('.edge-progress-fill');
    const prog = bar.querySelector('.edge-progress');
    if (prog) prog.classList.toggle('indeterminate', !known);
    if (fill && known) fill.style.width = pct + '%';
    return true;
  }

  function onEdgeChange() {
    const st = edgeStatus();
    if (st && st.state === 'loading_ram' && document.getElementById('edge-model-bar')) {
      if (patchEdgeLoading(st)) {
        syncComposeEnabled();
        return;
      }
    }
    refreshEdgeBar();
  }

  function syncComposeEnabled() {
    const input = document.getElementById('edge-chat-input');
    const btn = document.getElementById('edge-chat-send');
    const ok = canSend();
    if (input) input.disabled = !ok;
    if (btn) btn.disabled = !ok;
  }

  function renderSection(container) {
    if (!container) return;
    container.innerHTML = `<div class="leo-section edge-chat-section">
      <h3 class="section-title">Local (appareil)</h3>
      <p class="leo-hint">Smoke-test ~19&nbsp;Mo (self-host). Qualité tips nulle — juste Activer + 1 réponse. Bifrost / Léo au-dessus.</p>
      <div id="edge-model-bar-host">${edgeBarHtml()}</div>
      <div class="leo-thread" id="edge-chat-thread"></div>
      <div class="leo-stream-status" id="edge-chat-status" hidden></div>
      <div class="leo-wait" id="edge-chat-wait" hidden>
        <span id="edge-chat-wait-label">Réponse locale…</span>
        <button type="button" class="btn" id="edge-chat-cancel">Annuler</button>
      </div>
      <form class="leo-compose" id="edge-chat-compose">
        <textarea id="edge-chat-input" rows="2"
          placeholder="Ex. Que faire un jour de pluie à Québec ?"
          disabled></textarea>
        <button type="submit" class="btn btn-primary" id="edge-chat-send" disabled>Envoyer</button>
      </form>
    </div>`;

    paintThread();
    bindEdgeBar();

    if (_edgeUnsub) { try { _edgeUnsub(); } catch (_) {} _edgeUnsub = null; }
    if (typeof EdgeEngine !== 'undefined') {
      _edgeUnsub = EdgeEngine.onChange(() => onEdgeChange());
      EdgeEngine.refreshFromDisk().then(() => refreshEdgeBar());
    }

    const form = document.getElementById('edge-chat-compose');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        send();
      });
    }
    const cancel = document.getElementById('edge-chat-cancel');
    if (cancel) {
      cancel.addEventListener('click', () => {
        if (_abort) {
          try { _abort.abort(); } catch (_) {}
        }
      });
    }
  }

  function paintThread() {
    const el = document.getElementById('edge-chat-thread');
    if (!el) return;
    if (!_history.length) {
      el.innerHTML = `<div class="leo-empty">Active le modèle puis pose une question tip.</div>`;
      return;
    }
    el.innerHTML = _history.map(m => {
      const err = m.kind === 'error';
      const cls = m.role === 'user' ? 'leo-msg user' : (err ? 'leo-msg assistant error' : 'leo-msg assistant');
      const who = m.role === 'user' ? 'Toi' : (err ? 'Erreur' : 'Local');
      return `<div class="${cls}"><div class="leo-msg-who">${who}</div><div class="leo-msg-body">${escapeHtml(m.content)}${m.live ? ' ▍' : ''}</div></div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function schedulePaint() {
    if (_paintScheduled) return;
    _paintScheduled = true;
    const run = () => {
      _paintScheduled = false;
      paintThread();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 50);
  }

  function setBusy(on) {
    _busy = !!on;
    const wait = document.getElementById('edge-chat-wait');
    if (wait) wait.hidden = !_busy;
    syncComposeEnabled();
  }

  function setStatus(text) {
    const el = document.getElementById('edge-chat-status');
    const label = document.getElementById('edge-chat-wait-label');
    if (label) label.textContent = text || 'Réponse locale…';
    if (!el) return;
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = text;
  }

  async function send() {
    if (_busy || !canSend()) return;
    const input = document.getElementById('edge-chat-input');
    const text = String((input && input.value) || '').trim();
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    _history.push(userMsg);
    _apiHistory.push(userMsg);
    if (_apiHistory.length > 6) _apiHistory = _apiHistory.slice(-6);
    if (input) input.value = '';

    const asst = { role: 'assistant', content: '', id: 'e' + Date.now(), live: true, source: 'edge' };
    _history.push(asst);
    paintThread();
    setBusy(true);
    setStatus('Réponse locale…');

    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;

    try {
      const hist = _apiHistory.slice(0, -1);
      const reply = await EdgeEngine.generate(text, hist, {
        signal: ac ? ac.signal : undefined,
        maxTokens: 48,
        onDelta: (delta) => {
          asst.content += delta;
          schedulePaint();
        },
      });
      asst.content = reply || asst.content || '(réponse vide)';
      asst.live = false;
      _apiHistory.push({ role: 'assistant', content: asst.content });
      paintThread();
    } catch (e) {
      asst.live = false;
      _history.pop();
      const aborted = ac && ac.signal && ac.signal.aborted;
      const msg = aborted ? 'Annulé.' : ((e && e.message) || 'génération locale interrompue (mémoire ?)');
      _history.push({ role: 'assistant', kind: 'error', content: msg });
      paintThread();
      // Free WASM RAM after crash so Bifrost/Léo stay usable
      if (!aborted && typeof EdgeEngine !== 'undefined' && EdgeEngine.unload) {
        try { await EdgeEngine.unload(); } catch (_) { /* ignore */ }
        refreshEdgeBar();
      }
    }

    _abort = null;
    setStatus('');
    setBusy(false);
  }

  return { renderSection, refreshEdgeBar };
})();
