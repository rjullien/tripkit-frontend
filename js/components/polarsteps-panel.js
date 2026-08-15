/**
 * polarsteps-panel.js — Plus « Polarsteps » (journal du jour, texte à coller).
 * Visible only when GET /trips/:id/polarsteps/status says enabled.
 */
var PolarstepsPanel = (() => {
  const JOB_KEY = 'tk-polarsteps-job';
  const SEQ_KEY = 'tk-polarsteps-seq';

  let _status = null;
  let _busy = false;
  let _edited = false;
  let _baseline = '';
  let _jobId = null;
  let _lastSeq = 0;
  let _abort = null;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function currentTripId() {
    return (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;
  }

  async function loadStatus() {
    const tripId = currentTripId();
    if (!tripId || typeof API === 'undefined' || !API.getPolarstepsStatus) {
      _status = { enabled: false, ready: false, reason: 'no_trip' };
      return _status;
    }
    const res = await API.getPolarstepsStatus(tripId);
    if (!res.ok || !res.data) {
      _status = { enabled: false, ready: false, reason: res.error || 'unreachable' };
      return _status;
    }
    _status = res.data;
    return _status;
  }

  function backendUp() {
    if (typeof API !== 'undefined' && API.isReachable) return API.isReachable();
    return navigator.onLine;
  }

  function renderSection(container) {
    if (!container) return;
    const enabled = !!(_status && _status.enabled);
    if (!enabled) {
      container.innerHTML = '';
      return;
    }
    const ready = !!(_status && _status.ready) && navigator.onLine && backendUp();
    const tripUrl = (_status && _status.tripUrl) || '';
    const link = tripUrl
      ? `<p class="leo-hint"><a href="${escapeHtml(tripUrl)}" target="_blank" rel="noopener">Ouvrir Polarsteps</a></p>`
      : '';

    container.innerHTML = `<div class="publish-section polarsteps-section">
      <h3 class="section-title">Polarsteps</h3>
      <p class="leo-hint">Journal à coller dans Polarsteps. Plusieurs steps par jour OK — on ne répète pas ce qui a déjà été généré.</p>
      <div class="leo-compose">
        <textarea id="polarsteps-note" rows="2"
          placeholder="ex. on a vu 3 baleines, resto changé, Baptiste à YUL"
          ${!ready || _busy ? 'disabled' : ''}></textarea>
        <button type="button" class="btn btn-primary" id="polarsteps-generate"
          ${!ready || _busy ? 'disabled' : ''}>Générer le texte</button>
      </div>
      <div id="polarsteps-error" class="publish-errors polarsteps-error" hidden></div>
      <div id="polarsteps-result-wrap" hidden>
        <textarea id="polarsteps-result" class="polarsteps-result" rows="8"></textarea>
        <p id="polarsteps-qa-hint" class="leo-hint" hidden></p>
        <div class="polarsteps-actions">
          <button type="button" class="btn btn-primary" id="polarsteps-copy">Copier</button>
        </div>
      </div>
      ${link}
    </div>`;

    const gen = document.getElementById('polarsteps-generate');
    if (gen) gen.addEventListener('click', (e) => { e.preventDefault(); generate(); });
    const copy = document.getElementById('polarsteps-copy');
    if (copy) copy.addEventListener('click', (e) => { e.preventDefault(); copyResult(); });
    const result = document.getElementById('polarsteps-result');
    if (result) {
      result.addEventListener('input', () => {
        _edited = result.value !== _baseline;
      });
    }

    loadLast();
    resumeIfNeeded();
  }

  async function loadLast() {
    const tripId = currentTripId();
    if (!tripId || typeof API === 'undefined' || !API.getPolarstepsCaption) return;
    const res = await API.getPolarstepsCaption(tripId);
    if (!res.ok || !res.data || !res.data.text) return;
    paintResult(res.data.text, res.data.qa, false);
  }

  function setBusy(on) {
    _busy = !!on;
    const gen = document.getElementById('polarsteps-generate');
    const note = document.getElementById('polarsteps-note');
    const ready = !!(_status && _status.ready) && navigator.onLine && backendUp();
    if (gen) {
      gen.disabled = _busy || !ready;
      gen.textContent = _busy ? 'Génération…' : 'Générer le texte';
    }
    if (note) note.disabled = _busy || !ready;
  }

  function showError(msg) {
    const el = document.getElementById('polarsteps-error');
    if (!el) return;
    el.hidden = !msg;
    el.innerHTML = msg ? `<strong>${escapeHtml(msg)}</strong>` : '';
  }

  function paintResult(text, qa, fromGenerate) {
    const wrap = document.getElementById('polarsteps-result-wrap');
    const ta = document.getElementById('polarsteps-result');
    const hint = document.getElementById('polarsteps-qa-hint');
    if (!wrap || !ta) return;
    wrap.hidden = !text;
    ta.value = text || '';
    _baseline = text || '';
    _edited = false;
    if (hint) {
      const warn = qa && (qa.verdict === 'WARNING' || qa.Verdict === 'WARNING');
      hint.hidden = !warn;
      hint.textContent = warn ? ((qa.summary || qa.Summary || 'QA WARNING')) : '';
    }
    if (fromGenerate) showError('');
  }

  function persistJob() {
    try {
      if (!_jobId) {
        sessionStorage.removeItem(JOB_KEY);
        sessionStorage.removeItem(SEQ_KEY);
        return;
      }
      sessionStorage.setItem(JOB_KEY, _jobId);
      sessionStorage.setItem(SEQ_KEY, String(_lastSeq || 0));
    } catch (_) {}
  }

  function clearJob() {
    _jobId = null;
    _lastSeq = 0;
    persistJob();
  }

  async function generate() {
    const tripId = currentTripId();
    if (!tripId || _busy) return;
    const ta = document.getElementById('polarsteps-result');
    if (_edited && ta && ta.value.trim() && !window.confirm('Remplacer le texte déjà modifié ?')) {
      return;
    }
    const noteEl = document.getElementById('polarsteps-note');
    const userNote = noteEl ? String(noteEl.value || '').trim() : '';
    setBusy(true);
    showError('');
    try {
      const posted = await API.postPolarstepsCaption(tripId, {
        userNote,
        clientNowISO: new Date().toISOString(),
      });
      const jobId = posted && posted.data && posted.data.jobId;
      // Mixed rollout: old BE still answers 200 {text,qa} on the POST.
      if (posted && posted.ok && !jobId && posted.data && posted.data.text) {
        paintResult(posted.data.text, posted.data.qa, true);
        setBusy(false);
        return;
      }
      if (!posted || !posted.ok || !jobId) {
        const msg = (posted && (posted.data && posted.data.error || posted.error))
          || 'Génération impossible';
        paintResult('', null, true);
        showError(msg);
        setBusy(false);
        return;
      }
      _jobId = jobId;
      _lastSeq = 0;
      persistJob();
      await followJob(jobId, 0);
    } catch (e) {
      showError((e && e.message) || 'Génération impossible');
      setBusy(false);
    }
  }

  async function followJob(jobId, after) {
    if (!jobId || typeof API === 'undefined' || !API.leoJobStream) {
      setBusy(false);
      return;
    }
    if (_abort) {
      try { _abort.abort(); } catch (_) {}
    }
    const ac = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    _abort = ac;
    setBusy(true);
    try {
      for await (const ev of API.leoJobStream(jobId, after, { signal: ac ? ac.signal : undefined })) {
        if (ev && ev.data && typeof ev.data.seq === 'number') {
          _lastSeq = ev.data.seq;
          persistJob();
        }
        if (ev.event === 'error') {
          const msg = (ev.data && (ev.data.error || ev.data.detail)) || 'Génération impossible';
          paintResult('', (ev.data && ev.data.tool && ev.data.tool.qa) || null, true);
          showError(msg);
          clearJob();
          return;
        }
        if (ev.event === 'done') {
          let data = null;
          if (ev.data && ev.data.reply) {
            try { data = JSON.parse(ev.data.reply); } catch (_) { data = null; }
          }
          if (data && data.text) {
            paintResult(data.text, data.qa, true);
          } else if (data && !data.text) {
            paintResult('', data.qa, true);
            showError((data.qa && data.qa.summary) || data.error || 'QA FAILED');
          } else {
            await loadLast();
          }
          clearJob();
          return;
        }
      }
      await recoverFromStore();
    } catch (_) {
      await recoverFromStore();
    } finally {
      if (_abort === ac) _abort = null;
      if (!_jobId) setBusy(false);
    }
  }

  async function recoverFromStore() {
    const before = _baseline;
    await loadLast();
    const ta = document.getElementById('polarsteps-result');
    const now = ta ? ta.value : '';
    if (now && now !== before) {
      clearJob();
      showError('');
      return;
    }
    // Job still running (Safari lock) — keep busy, resume on visibility.
    if (_jobId) setBusy(true);
    else setBusy(false);
  }

  function resumeIfNeeded() {
    if (_busy && _abort) return;
    let id = _jobId;
    let seq = _lastSeq;
    try {
      if (!id) id = sessionStorage.getItem(JOB_KEY);
      if (id && !seq) seq = Number(sessionStorage.getItem(SEQ_KEY) || 0) || 0;
    } catch (_) {}
    if (!id) return;
    _jobId = id;
    _lastSeq = seq || 0;
    followJob(id, _lastSeq);
  }

  function fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, el.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    document.body.removeChild(el);
    return ok;
  }

  async function copyResult() {
    const ta = document.getElementById('polarsteps-result');
    const text = ta ? ta.value : '';
    if (!text) return;
    let ok = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (_) {
        ok = fallbackCopy(text);
      }
    } else {
      ok = fallbackCopy(text);
    }
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(ok ? '📋 Copié' : 'Copie impossible', ok ? 'success' : 'error');
    }
  }

  return { loadStatus, renderSection, resumeIfNeeded };
})();
