/**
 * polarsteps-panel.js — Plus « Polarsteps » (journal du jour, texte à coller).
 * Visible only when GET /trips/:id/polarsteps/status says enabled.
 */
var PolarstepsPanel = (() => {
  let _status = null;
  let _busy = false;
  let _edited = false;
  let _baseline = '';

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
      <p class="leo-hint">Journal du jour, à coller dans Polarsteps.</p>
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
      const res = await API.postPolarstepsCaption(tripId, {
        userNote,
        clientNowISO: new Date().toISOString(),
      });
      if (!res.ok) {
        const msg = (res.data && (res.data.error || (res.data.qa && res.data.qa.summary)))
          || res.error
          || 'Génération impossible';
        paintResult('', null, true);
        showError(msg);
        return;
      }
      const data = res.data || {};
      if (!data.text) {
        paintResult('', data.qa, true);
        showError((data.qa && data.qa.summary) || 'QA FAILED');
        return;
      }
      paintResult(data.text, data.qa, true);
    } finally {
      setBusy(false);
    }
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

  return { loadStatus, renderSection };
})();
