/**
 * publish-panel.js — Créer / Mettre à jour un voyage depuis git (family publish)
 */
var PublishPanel = (() => {
  let _jobId = null;
  let _pollTimer = null;
  let _sources = [];

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function loadSources() {
    const res = await API.getPublishSources();
    if (!res.ok || !Array.isArray(res.data)) {
      _sources = [];
      return _sources;
    }
    _sources = res.data;
    return _sources;
  }

  function sources() { return _sources; }

  function renderSection(container) {
    if (!container) return;
    if (!_sources.length) {
      container.innerHTML = '';
      return;
    }
    let html = `<div class="publish-section">
      <h3 class="section-title">Publier depuis git</h3>
      <p class="publish-hint">Créer ou mettre à jour un voyage depuis le repo famille (après QA).</p>`;
    _sources.forEach(s => {
      const label = s.operation === 'create' ? 'Créer le voyage' : 'Mettre à jour le voyage';
      const disabled = !s.enabled || !navigator.onLine;
      const badge = s.enabled ? '' : ' <span class="publish-badge">inactif</span>';
      html += `<div class="publish-row" data-source="${escapeHtml(s.sourceId)}" data-trip="${escapeHtml(s.tripId)}">
        <div class="publish-meta">
          <div class="publish-name">${escapeHtml(s.title || s.tripId)}${badge}</div>
          <div class="publish-sub">${escapeHtml(s.repo)} · ${escapeHtml(s.seedPath)} · ${escapeHtml(s.operation)}</div>
        </div>
        <button type="button" class="btn btn-primary publish-btn"
          ${disabled ? 'disabled' : ''}
          data-action="publish"
          data-source="${escapeHtml(s.sourceId)}"
          data-trip="${escapeHtml(s.tripId)}"
          data-op="${escapeHtml(s.operation)}">${escapeHtml(label)}</button>
      </div>`;
    });
    html += `<div id="publish-job-status" class="publish-job-status" hidden></div></div>`;
    container.innerHTML = html;
    container.querySelectorAll('[data-action="publish"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceId = btn.dataset.source;
        const tripId = btn.dataset.trip;
        const op = btn.dataset.op;
        if (op === 'create') openCreateModal(sourceId, tripId);
        else startJob({ sourceId, tripId, confirmCreate: false });
      });
    });
  }

  function openCreateModal(sourceId, tripId) {
    const src = _sources.find(s => s.sourceId === sourceId && s.tripId === tripId);
    const overlay = document.createElement('div');
    overlay.className = 'weather-modal-overlay publish-modal-overlay';
    overlay.innerHTML = `<div class="weather-modal publish-modal" role="dialog">
      <button type="button" class="wm-close" aria-label="Fermer">×</button>
      <h2>Créer « ${escapeHtml(src?.title || tripId)} » ?</h2>
      <ul class="publish-modal-list">
        <li>Source : ${escapeHtml(src?.repo || '')} @ ${escapeHtml(src?.ref || 'main')}</li>
        <li>Fichier : ${escapeHtml(src?.seedPath || '')}</li>
        <li>Famille : ${escapeHtml(src?.family || '')}</li>
      </ul>
      <p class="publish-hint">La QA tourne avant l'import. En cas d'erreur, la prod reste intacte.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-act="cancel">Annuler</button>
        <button type="button" class="btn btn-primary" data-act="confirm">Vérifier puis créer</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.wm-close').onclick = close;
    overlay.querySelector('[data-act="cancel"]').onclick = close;
    overlay.querySelector('[data-act="confirm"]').onclick = () => {
      close();
      startJob({ sourceId, tripId, confirmCreate: true });
    };
  }

  async function startJob({ sourceId, tripId, confirmCreate }) {
    stopPoll();
    const statusEl = document.getElementById('publish-job-status');
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.innerHTML = `<div class="progress-wrap publish-steps">
        <div class="progress-bar"><div class="progress-fill" style="width:10%"></div></div>
        <ol class="publish-step-list"><li class="active">Mise en file…</li></ol>
      </div>`;
    }
    document.querySelectorAll('.publish-btn').forEach(b => { b.disabled = true; });

    const res = await API.createPublishJob({ sourceId, tripId, confirmCreate: !!confirmCreate });
    if (!res.ok) {
      showErrors(statusEl, res);
      document.querySelectorAll('.publish-btn').forEach(b => { b.disabled = !navigator.onLine; });
      return;
    }
    _jobId = res.data.id;
    try { sessionStorage.setItem('tk-publish-job', _jobId); } catch (_) {}
    pollJob();
  }

  function showErrors(el, res) {
    if (!el) return;
    const errs = (res.data && res.data.errors) || [];
    const msg = res.error || 'Échec';
    let body = `<div class="publish-errors"><strong>${escapeHtml(msg)}</strong>`;
    if (errs.length) {
      body += `<pre>${escapeHtml(errs.map(e => e.message || e).join('\n'))}</pre>`;
    } else if (res.data && res.data.error) {
      body += `<pre>${escapeHtml(res.data.error)}</pre>`;
    }
    body += `<button type="button" class="btn" onclick="this.closest('.publish-errors').remove()">Fermer</button></div>`;
    el.innerHTML = body;
    el.hidden = false;
  }

  function pollJob() {
    stopPoll();
    _pollTimer = setInterval(async () => {
      if (!_jobId) return;
      const res = await API.getPublishJob(_jobId);
      if (!res.ok) return;
      const job = res.data;
      renderJobProgress(job);
      if (job.status === 'succeeded' || job.status === 'failed') {
        stopPoll();
        document.querySelectorAll('.publish-btn').forEach(b => { b.disabled = !navigator.onLine; });
        try { sessionStorage.removeItem('tk-publish-job'); } catch (_) {}
        if (job.status === 'succeeded') {
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(job.operation === 'create' ? '✅ Voyage créé' : `Mis à jour · v${job.dataVersion || ''}`);
          }
          if (typeof TripSelector !== 'undefined' && TripSelector.render) {
            const host = document.getElementById('plus-trip-selector');
            if (host) TripSelector.render(host);
          }
          if (job.tripId && typeof App !== 'undefined' && App.selectTrip) {
            App.selectTrip(job.tripId);
          }
        }
      }
    }, 1500);
  }

  function renderJobProgress(job) {
    const el = document.getElementById('publish-job-status');
    if (!el) return;
    if (job.status === 'failed') {
      showErrors(el, { ok: false, error: job.errorCode || 'failed', data: job });
      return;
    }
    const pct = Math.max(5, Math.min(100, job.progress || 0));
    el.hidden = false;
    el.innerHTML = `<div class="progress-wrap publish-steps">
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <ol class="publish-step-list">
        <li class="${job.stage ? 'done' : ''}">Fetch repo…</li>
        <li class="${job.stage === 'validating' || job.stage === 'applying' || job.stage === 'acl' || job.status === 'succeeded' ? 'done' : (job.stage === 'parsing' ? 'active' : '')}">Parse / QA…</li>
        <li class="${job.stage === 'applying' || job.stage === 'acl' || job.status === 'succeeded' ? 'done' : (job.stage === 'applying' ? 'active' : '')}">Import…</li>
        <li class="${job.status === 'succeeded' ? 'done' : (job.stage === 'acl' ? 'active' : '')}">ACL…</li>
      </ol>
      <div class="progress-text">${escapeHtml(job.stage || job.status)} · ${pct}%</div>
    </div>`;
  }

  function stopPoll() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  }

  async function resumeIfNeeded() {
    try {
      const id = sessionStorage.getItem('tk-publish-job');
      if (!id) return;
      _jobId = id;
      pollJob();
    } catch (_) {}
  }

  return { loadSources, sources, renderSection, resumeIfNeeded, startJob };
})();
