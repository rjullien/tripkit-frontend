/**
 * construction-view.js — Construction mode tab view.
 * Sections: PhaseBar, TravelerContextBox, GuidedForm, Leo chat widget.
 */
var ConstructionView = (() => {

  let _leoInstance = null;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── PhaseBar ────────────────────────────────────────────────────────────────

  function renderPhaseBarLoading() {
    return `<div class="construction-phase-bar" id="construction-phase-bar">
      <div class="construction-loading">Chargement phase...</div>
    </div>`;
  }

  function renderPhaseBarContent(data) {
    const phase = (data && data.phase) || 1;
    const phases = [1, 2, 3, 4];
    const lastQA = data && data.lastQA;
    const blockers = (lastQA && Array.isArray(lastQA.blockers)) ? lastQA.blockers : [];

    let dotsHtml = '<div class="phase-dots">';
    phases.forEach(p => {
      const cls = p < phase ? 'phase-dot done' : (p === phase ? 'phase-dot active' : 'phase-dot');
      dotsHtml += `<span class="${cls}">Ph${p}</span>`;
    });
    dotsHtml += '</div>';

    let blockersHtml = '';
    if (blockers.length) {
      blockersHtml = '<div class="phase-blockers"><strong>Blocages :</strong><ul>';
      blockers.forEach(b => { blockersHtml += `<li>${esc(b)}</li>`; });
      blockersHtml += '</ul></div>';
    }

    return `<div class="construction-phase-bar" id="construction-phase-bar">
      <div class="phase-header">
        <span class="phase-label">Phase ${phase}</span>
        ${dotsHtml}
      </div>
      ${blockersHtml}
      <button class="btn btn-primary phase-next-btn" id="construction-phase-next"
        ${phase >= 4 ? 'disabled' : ''}>Phase suivante</button>
    </div>`;
  }

  function renderPhaseBarError(msg) {
    return `<div class="construction-phase-bar" id="construction-phase-bar">
      <div class="construction-error">${esc(msg)}</div>
    </div>`;
  }

  async function loadPhaseBar(tripId) {
    const el = document.getElementById('construction-phase-bar');
    if (!el) return;
    const res = await API.getConstruction(tripId);
    if (!res.ok) {
      el.outerHTML = renderPhaseBarError(res.status === 404 ? 'Construction non initialisee' : 'Erreur chargement phase');
      return;
    }
    el.outerHTML = renderPhaseBarContent(res.data);
    bindPhaseNext(tripId, res.data);
  }

  function bindPhaseNext(tripId, data) {
    const btn = document.getElementById('construction-phase-next');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const currentPhase = (data && data.phase) || 1;
      const nextPhase = currentPhase + 1;
      btn.disabled = true;
      btn.textContent = 'Transition...';
      const res = await API.transitionPhase(tripId, nextPhase, false);
      if (res.ok) {
        // Reload phase bar with updated data
        const container = document.getElementById('construction-phase-bar');
        if (container) {
          container.outerHTML = renderPhaseBarLoading();
          await loadPhaseBar(tripId);
        }
      } else {
        btn.disabled = false;
        btn.textContent = 'Phase suivante';
        const errMsg = (res.data && res.data.error) || res.error || 'Erreur transition';
        const errEl = document.createElement('div');
        errEl.className = 'construction-error';
        errEl.textContent = errMsg;
        btn.parentElement.appendChild(errEl);
        setTimeout(() => errEl.remove(), 4000);
      }
    });
  }

  // ── TravelerContextBox ──────────────────────────────────────────────────────

  function renderContextLoading() {
    return `<div class="construction-context-box" id="construction-context-box">
      <div class="construction-loading">Chargement profil voyageurs...</div>
    </div>`;
  }

  function renderContextContent(data) {
    const people = data.people || {};
    const profile = data.travelProfile || {};
    const ctx = data.travelersContext || {};
    const sources = data.sources || [];

    // Group composition
    let adults = 0;
    let children = [];
    Object.values(people).forEach(p => {
      if (p.age && p.age < 18) {
        children.push(p);
      } else {
        adults++;
      }
    });
    const groupLine = `${adults} adulte${adults > 1 ? 's' : ''}${children.length ? `, ${children.length} enfant${children.length > 1 ? 's' : ''}` : ''}`;
    const childAges = children.length
      ? ` (${children.map(c => c.age ? c.age + ' ans' : '').filter(Boolean).join(', ')})`
      : '';

    // Travel style
    const pace = profile.pace || ctx.pace || '';
    const maxDriving = profile.maxDrivingPerDay || ctx.maxDrivingPerDay || '';
    const budget = profile.budgetRange || ctx.budgetRange || '';

    // Interests
    const interests = profile.interests || ctx.interests || {};
    let interestsHtml = '';
    if (interests && typeof interests === 'object') {
      const entries = Object.entries(interests);
      if (entries.length) {
        interestsHtml = '<div class="ctx-interests"><strong>Centres d\'interet :</strong><ul>';
        entries.forEach(([person, prefs]) => {
          const likes = (prefs && prefs.likes) ? (Array.isArray(prefs.likes) ? prefs.likes.join(', ') : prefs.likes) : '';
          const dislikes = (prefs && prefs.dislikes) ? (Array.isArray(prefs.dislikes) ? prefs.dislikes.join(', ') : prefs.dislikes) : '';
          let line = `<strong>${esc(person)}</strong>`;
          if (likes) line += ` — aime : ${esc(likes)}`;
          if (dislikes) line += ` — n'aime pas : ${esc(dislikes)}`;
          interestsHtml += `<li>${line}</li>`;
        });
        interestsHtml += '</ul></div>';
      }
    }

    // Health notes
    const health = profile.healthNotes || ctx.healthNotes || '';
    const healthHtml = health ? `<div class="ctx-health"><strong>Sante :</strong> ${esc(health)}</div>` : '';

    // Sources
    const sourcesHtml = sources.length
      ? `<div class="ctx-sources"><em>Sources : ${esc(sources.join(', '))}</em></div>`
      : '';

    return `<div class="construction-context-box" id="construction-context-box">
      <div class="ctx-header">
        <h3>Voyageurs</h3>
        <button class="btn btn-sm" id="construction-ctx-edit" title="Modifier le profil">Modifier</button>
      </div>
      <div class="ctx-group">${esc(groupLine)}${esc(childAges)}</div>
      ${pace ? `<div class="ctx-style"><strong>Rythme :</strong> ${esc(pace)}</div>` : ''}
      ${maxDriving ? `<div class="ctx-style"><strong>Conduite max/jour :</strong> ${esc(maxDriving)}</div>` : ''}
      ${budget ? `<div class="ctx-style"><strong>Budget :</strong> ${esc(budget)}</div>` : ''}
      ${interestsHtml}
      ${healthHtml}
      ${sourcesHtml}
    </div>`;
  }

  function renderContextNotConfigured() {
    return `<div class="construction-context-box" id="construction-context-box">
      <div class="ctx-empty">
        <p>Profil non configure</p>
        <p class="ctx-hint">Renseignez le profil voyageurs pour aider Leo a personnaliser le voyage.</p>
        <button class="btn btn-sm" id="construction-ctx-edit">Configurer</button>
      </div>
    </div>`;
  }

  function renderContextError(msg) {
    return `<div class="construction-context-box" id="construction-context-box">
      <div class="construction-error">${esc(msg)}</div>
    </div>`;
  }

  async function loadTravelerContext(tripId) {
    const el = document.getElementById('construction-context-box');
    if (!el) return;
    const res = await API.getTravelProfile(tripId);
    if (!res.ok) {
      if (res.status === 404) {
        el.outerHTML = renderContextNotConfigured();
      } else {
        el.outerHTML = renderContextError('Erreur chargement profil');
      }
      bindContextEdit();
      return;
    }
    el.outerHTML = renderContextContent(res.data);
    bindContextEdit();
  }

  function bindContextEdit() {
    const btn = document.getElementById('construction-ctx-edit');
    if (!btn) return;
    btn.addEventListener('click', () => {
      showProfileEditForm();
    });
  }

  // ── Profile Edit Form ─────────────────────────────────────────────────────

  function showProfileEditForm() {
    const box = document.getElementById('construction-context-box');
    if (!box) return;

    // Prevent duplicate forms
    if (document.getElementById('profile-edit-form')) return;

    const formHtml = `<div class="profile-edit-overlay" id="profile-edit-overlay">
      <form id="profile-edit-form" class="profile-edit-form">
        <h4>Modifier le profil voyageur</h4>
        <div class="guided-field">
          <label for="profile-edit-target">Section a modifier</label>
          <select id="profile-edit-target" name="target" required>
            <option value="">-- Choisir --</option>
            <option value="travelStyle">Style de voyage</option>
            <option value="budgetRules">Budget</option>
            <option value="interests">Centres d'interet</option>
            <option value="mealPattern">Repas</option>
            <option value="lessons">Lecons apprises</option>
          </select>
        </div>
        <div class="guided-field">
          <label for="profile-edit-text">Description de la modification</label>
          <textarea id="profile-edit-text" name="text" rows="3"
            placeholder="Ex: Nous preferons un rythme lent avec des pauses frequentes..." required></textarea>
        </div>
        <div class="profile-edit-actions">
          <button type="submit" class="btn btn-primary" id="profile-edit-submit">Envoyer a Leo</button>
          <button type="button" class="btn btn-sm" id="profile-edit-cancel">Annuler</button>
        </div>
        <div id="profile-edit-status" class="profile-edit-status"></div>
      </form>
    </div>`;

    box.insertAdjacentHTML('beforeend', formHtml);

    document.getElementById('profile-edit-cancel').addEventListener('click', () => {
      const overlay = document.getElementById('profile-edit-overlay');
      if (overlay) overlay.remove();
    });

    document.getElementById('profile-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      handleProfileEditSubmit();
    });
  }

  async function handleProfileEditSubmit() {
    const targetEl = document.getElementById('profile-edit-target');
    const textEl = document.getElementById('profile-edit-text');
    const submitBtn = document.getElementById('profile-edit-submit');
    const statusEl = document.getElementById('profile-edit-status');

    const target = targetEl ? targetEl.value : '';
    const text = textEl ? textEl.value.trim() : '';

    if (!target || !text) return;

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;
    if (!tripId) return;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'En cours...';
    statusEl.textContent = 'Envoi de la demande...';
    statusEl.className = 'profile-edit-status loading';

    const res = await API.createProfileRequest(tripId, target, text);
    if (!res.ok) {
      statusEl.textContent = res.error || 'Erreur lors de la demande';
      statusEl.className = 'profile-edit-status error';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer a Leo';
      return;
    }

    const jobId = res.data && res.data.jobId;
    if (!jobId) {
      statusEl.textContent = 'Reponse inattendue du serveur';
      statusEl.className = 'profile-edit-status error';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer a Leo';
      return;
    }

    statusEl.textContent = 'Leo travaille sur la modification...';
    statusEl.className = 'profile-edit-status loading';

    // Subscribe to job stream
    subscribeProfileJob(jobId, tripId);
  }

  async function subscribeProfileJob(jobId, tripId) {
    const statusEl = document.getElementById('profile-edit-status');

    try {
      for await (const frame of API.leoJobStream(jobId, 0)) {
        if (frame.event === 'done') {
          if (statusEl) {
            statusEl.textContent = 'Modification effectuee !';
            statusEl.className = 'profile-edit-status success';
          }
          // Refresh the TravelerContextBox
          setTimeout(() => {
            const overlay = document.getElementById('profile-edit-overlay');
            if (overlay) overlay.remove();
            loadTravelerContext(tripId);
          }, 1200);
          return;
        }
        if (frame.event === 'error') {
          const errMsg = (frame.data && frame.data.error) || 'Erreur Leo';
          if (statusEl) {
            statusEl.textContent = errMsg;
            statusEl.className = 'profile-edit-status error';
          }
          const submitBtn = document.getElementById('profile-edit-submit');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reessayer';
          }
          return;
        }
        // delta events - show progress
        if (frame.event === 'delta' && frame.data && frame.data.text && statusEl) {
          statusEl.textContent = 'Leo : ' + frame.data.text.slice(0, 80);
        }
      }
    } catch (e) {
      if (statusEl) {
        statusEl.textContent = 'Connexion perdue. Reessaie.';
        statusEl.className = 'profile-edit-status error';
      }
      const submitBtn = document.getElementById('profile-edit-submit');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reessayer';
      }
    }
  }

  // ── ActionBar (checks: QA, Nuisances, Admin, Sante) ──────────────────────

  function renderActionBar() {
    return `<div class="construction-action-bar" id="construction-action-bar">
      <h3>Verifications</h3>
      <div class="action-bar-buttons">
        <button class="btn btn-sm action-bar-btn" id="action-qa" data-action="qa">QA</button>
        <button class="btn btn-sm action-bar-btn" id="action-nuisances" data-action="nuisances">Nuisances</button>
        <button class="btn btn-sm action-bar-btn" id="action-admin" data-action="admin">Admin</button>
        <button class="btn btn-sm action-bar-btn" id="action-sante" data-action="sante">Sante</button>
      </div>
      <div id="action-bar-results"></div>
    </div>`;
  }

  function bindActionBar(tripId) {
    const qaBtn = document.getElementById('action-qa');
    const nuiBtn = document.getElementById('action-nuisances');
    const adminBtn = document.getElementById('action-admin');
    const santeBtn = document.getElementById('action-sante');

    if (qaBtn) qaBtn.addEventListener('click', () => handleQA(tripId));
    if (nuiBtn) nuiBtn.addEventListener('click', () => handleNuisances(tripId));
    if (adminBtn) adminBtn.addEventListener('click', () => handleAdmin(tripId));
    if (santeBtn) santeBtn.addEventListener('click', () => handleSante(tripId));
  }

  function setButtonLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn._origText = btn.textContent;
      btn.textContent = '...';
    } else {
      btn.disabled = false;
      btn.textContent = btn._origText || btn.textContent;
    }
  }

  function showResults(html) {
    const el = document.getElementById('action-bar-results');
    if (el) el.innerHTML = html;
  }

  // ── QA check ──

  async function handleQA(tripId) {
    setButtonLoading('action-qa', true);
    const res = await API.runQA(tripId);
    setButtonLoading('action-qa', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur QA : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const data = res.data;
    const items = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);

    if (!items.length) {
      showResults(`<div class="action-result-ok">Aucun probleme detecte</div>`);
      return;
    }

    // Sort: red (blocker) first, then yellow (warning), then rest
    const severityOrder = { blocker: 0, red: 0, error: 0, warning: 1, yellow: 1, info: 2 };
    items.sort((a, b) => {
      const sa = severityOrder[String(a.severity || '').toLowerCase()] ?? 3;
      const sb = severityOrder[String(b.severity || '').toLowerCase()] ?? 3;
      return sa - sb;
    });

    let html = '<div class="action-results-qa">';
    html += `<div class="action-results-header">QA : ${items.length} probleme${items.length > 1 ? 's' : ''}</div>`;
    items.forEach(item => {
      const sev = String(item.severity || 'info').toLowerCase();
      const cls = (sev === 'blocker' || sev === 'red' || sev === 'error') ? 'qa-red'
        : (sev === 'warning' || sev === 'yellow') ? 'qa-yellow' : 'qa-info';
      const badge = cls === 'qa-red' ? '🔴' : cls === 'qa-yellow' ? '🟡' : 'ℹ️';
      html += `<div class="qa-item ${cls}">`;
      html += `<span class="qa-badge">${badge}</span>`;
      html += `<span class="qa-code">${esc(item.code || '')}</span>`;
      if (item.dayNum != null) html += ` <span class="qa-day">J${item.dayNum}</span>`;
      html += `<div class="qa-msg">${esc(item.message || item.msg || '')}</div>`;
      html += `</div>`;
    });
    html += '</div>';
    showResults(html);
  }

  // ── Nuisances check ──

  async function handleNuisances(tripId, locationIds) {
    const btnId = 'action-nuisances';
    setButtonLoading(btnId, true);
    const res = await API.runNuisanceCheck(tripId, locationIds || null);
    setButtonLoading(btnId, false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur nuisances : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const data = res.data;

    // If job-based (async), subscribe to SSE stream
    if (data && data.jobId) {
      showResults(`<div class="action-result-loading" id="nuisance-progress">Analyse en cours...</div>`);
      subscribeNuisanceJob(data.jobId, tripId);
      return;
    }

    // Synchronous result
    renderNuisanceResults(data);
  }

  async function subscribeNuisanceJob(jobId, tripId) {
    const progressEl = document.getElementById('nuisance-progress');
    try {
      for await (const frame of API.leoJobStream(jobId, 0)) {
        if (frame.event === 'done') {
          // Fetch final results
          const final = await API.getNuisanceCheck(tripId);
          if (final.ok) {
            renderNuisanceResults(final.data);
          } else {
            showResults(`<div class="action-result-ok">Analyse terminee</div>`);
          }
          return;
        }
        if (frame.event === 'error') {
          const errMsg = (frame.data && frame.data.error) || 'Erreur lors de l\'analyse';
          showResults(`<div class="construction-error">${esc(errMsg)}</div>`);
          return;
        }
        // Progress
        if (frame.event === 'delta' || frame.event === 'progress') {
          const text = (frame.data && (frame.data.text || frame.data.location || frame.data.message)) || '';
          if (progressEl && text) {
            progressEl.textContent = 'Analyse : ' + text;
          }
        }
      }
    } catch (e) {
      showResults(`<div class="construction-error">Connexion perdue. Reessaie.</div>`);
    }
  }

  function renderNuisanceResults(data) {
    if (!data) {
      showResults(`<div class="action-result-ok">Aucune donnee nuisance</div>`);
      return;
    }

    const locations = Array.isArray(data) ? data : (data.locations || data.results || []);
    const verdict = data.verdict || '';

    let html = '<div class="action-results-nuisance">';
    if (verdict) {
      const vcls = /bad|high|severe/i.test(verdict) ? 'verdict-bad'
        : /ok|low|good/i.test(verdict) ? 'verdict-ok' : 'verdict-moderate';
      html += `<div class="nuisance-verdict ${vcls}">${esc(verdict)}</div>`;
    }

    if (!locations.length && !verdict) {
      showResults(`<div class="action-result-ok">Aucune nuisance detectee</div>`);
      return;
    }

    locations.forEach(loc => {
      const name = loc.name || loc.locationId || loc.location || '';
      html += `<div class="nuisance-location">`;
      html += `<div class="nuisance-loc-name">${esc(name)}</div>`;

      const categories = loc.categories || loc.nuisances || [];
      if (Array.isArray(categories)) {
        categories.forEach(cat => {
          const emoji = cat.emoji || categoryEmoji(cat.category || cat.name || '');
          const level = cat.level || cat.severity || '';
          const distance = cat.distance || '';
          const detail = cat.detail || cat.description || '';
          html += `<div class="nuisance-cat">`;
          html += `<span class="nuisance-emoji">${emoji}</span>`;
          html += `<span class="nuisance-cat-name">${esc(cat.category || cat.name || '')}</span>`;
          if (level) html += ` <span class="nuisance-level">${esc(level)}</span>`;
          if (distance) html += ` <span class="nuisance-distance">${esc(distance)}</span>`;
          if (detail) html += `<div class="nuisance-detail">${esc(detail)}</div>`;
          html += `</div>`;
        });
      }
      html += `</div>`;
    });
    html += '</div>';
    showResults(html);
  }

  function categoryEmoji(cat) {
    const c = String(cat).toLowerCase();
    if (/bruit|noise/i.test(c)) return '🔊';
    if (/pollution|air/i.test(c)) return '💨';
    if (/construction|travaux/i.test(c)) return '🚧';
    if (/traffic|trafic/i.test(c)) return '🚗';
    if (/insect|moustique/i.test(c)) return '🦟';
    if (/odeur|smell/i.test(c)) return '👃';
    return '⚠️';
  }

  // ── Admin check ──

  async function handleAdmin(tripId) {
    setButtonLoading('action-admin', true);
    const res = await API.runAdminCheck(tripId);
    setButtonLoading('action-admin', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur admin : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const data = res.data;
    const travelers = Array.isArray(data) ? data : (data && Array.isArray(data.travelers) ? data.travelers : (data && data.results ? data.results : []));

    if (!travelers.length) {
      showResults(`<div class="action-result-ok">Aucune verification admin requise</div>`);
      return;
    }

    let html = '<div class="action-results-admin">';
    html += `<div class="action-results-header">Admin : ${travelers.length} voyageur${travelers.length > 1 ? 's' : ''}</div>`;
    travelers.forEach(traveler => {
      const name = traveler.name || traveler.traveler || '';
      html += `<div class="admin-traveler">`;
      html += `<div class="admin-traveler-name">${esc(name)}</div>`;
      const checks = traveler.checks || traveler.items || traveler.countries || [];
      if (Array.isArray(checks)) {
        checks.forEach(chk => {
          const status = chk.status || chk.state || '';
          const badge = /ok|done|valid/i.test(status) ? '✅'
            : /warning|attention/i.test(status) ? '⚠️'
            : /action|needed|missing/i.test(status) ? '🔴' : '❓';
          const label = chk.label || chk.country || chk.document || chk.name || '';
          const detail = chk.detail || chk.note || '';
          html += `<div class="admin-check-item">`;
          html += `<span class="admin-badge">${badge}</span>`;
          html += `<span class="admin-label">${esc(label)}</span>`;
          if (status) html += ` <span class="admin-status">${esc(status)}</span>`;
          if (detail) html += `<div class="admin-detail">${esc(detail)}</div>`;
          html += `</div>`;
        });
      }
      html += `</div>`;
    });
    html += '</div>';
    showResults(html);
  }

  // ── Health check ──

  async function handleSante(tripId) {
    setButtonLoading('action-sante', true);
    const res = await API.runHealthCheck(tripId);
    setButtonLoading('action-sante', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur sante : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const data = res.data;
    const recommendations = Array.isArray(data) ? data
      : (data && Array.isArray(data.recommendations) ? data.recommendations
        : (data && Array.isArray(data.results) ? data.results : []));

    if (!recommendations.length) {
      showResults(`<div class="action-result-ok">Aucun conseil necessaire</div>`);
      return;
    }

    let html = '<div class="action-results-health">';
    html += `<div class="action-results-header">Sante : ${recommendations.length} conseil${recommendations.length > 1 ? 's' : ''}</div>`;
    recommendations.forEach(rec => {
      const title = rec.title || rec.name || rec.country || '';
      const detail = rec.detail || rec.description || rec.recommendation || '';
      const severity = rec.severity || rec.level || '';
      const badge = /obligatoire|required|high/i.test(severity) ? '🔴'
        : /recommand|suggested|medium/i.test(severity) ? '🟡' : '💚';
      html += `<div class="health-item">`;
      html += `<span class="health-badge">${badge}</span>`;
      html += `<span class="health-title">${esc(title)}</span>`;
      if (severity) html += ` <span class="health-severity">${esc(severity)}</span>`;
      if (detail) html += `<div class="health-detail">${esc(detail)}</div>`;
      html += `</div>`;
    });
    html += '</div>';
    showResults(html);
  }

  // ── GuidedForm ──────────────────────────────────────────────────────────────

  function renderGuidedForm() {
    const transports = [
      { id: 'avion', label: 'Avion', emoji: '✈️' },
      { id: 'train', label: 'Train', emoji: '🚆' },
      { id: 'voiture', label: 'Voiture', emoji: '🚗' },
      { id: 'bateau', label: 'Bateau', emoji: '⛴️' },
    ];

    const checkboxes = transports.map(t =>
      `<label class="guided-transport-option">
        <input type="checkbox" name="transport" value="${t.id}">
        <span>${t.emoji} ${t.label}</span>
      </label>`
    ).join('');

    return `<div class="construction-guided-form" id="construction-guided-form">
      <h3>Parametres du voyage</h3>
      <form id="construction-guided-form-el">
        <div class="guided-field">
          <label for="guided-start-date">Date de depart</label>
          <input type="date" id="guided-start-date" name="startDate">
        </div>
        <div class="guided-field">
          <label for="guided-nb-days">Nombre de jours</label>
          <input type="number" id="guided-nb-days" name="nbDays" min="1" max="90" placeholder="ex: 14">
        </div>
        <div class="guided-field">
          <label for="guided-destination">Destination</label>
          <input type="text" id="guided-destination" name="destination" placeholder="ex: Japon, Islande...">
        </div>
        <div class="guided-field">
          <label>Transports</label>
          <div class="guided-transports">${checkboxes}</div>
        </div>
        <button type="submit" class="btn btn-primary guided-submit">Envoyer a Leo</button>
      </form>
    </div>`;
  }

  function bindGuidedForm() {
    const form = document.getElementById('construction-guided-form-el');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const startDate = form.elements.startDate ? form.elements.startDate.value : '';
      const nbDays = form.elements.nbDays ? form.elements.nbDays.value : '';
      const destination = form.elements.destination ? form.elements.destination.value.trim() : '';
      const transportEls = form.querySelectorAll('input[name="transport"]:checked');
      const transports = Array.from(transportEls).map(el => el.value);

      // Compose the ideation message for Leo
      const parts = [];
      if (destination) parts.push(`Destination : ${destination}`);
      if (startDate) parts.push(`Depart : ${startDate}`);
      if (nbDays) parts.push(`Duree : ${nbDays} jours`);
      if (transports.length) parts.push(`Transports : ${transports.join(', ')}`);

      if (!parts.length) return; // nothing to send

      const message = `Voici les parametres pour l'ideation du voyage :\n${parts.join('\n')}`;

      // Send to Leo construction chat
      if (_leoInstance && _leoInstance.send) {
        _leoInstance.send(message);
      }
    });
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;

    if (!tripId) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🏗️</div>
        <h3>Mode Construction</h3>
        <p>Aucun voyage selectionne.</p>
      </div>`;
      return;
    }

    // Build layout: PhaseBar, TravelerContextBox, GuidedForm, Leo chat, ActionBar
    container.innerHTML = `
      <div class="page-header"><h1>🏗️ Mode Construction</h1></div>
      ${renderPhaseBarLoading()}
      ${renderContextLoading()}
      ${renderGuidedForm()}
      <div id="construction-leo-section"></div>
      ${renderActionBar()}
    `;

    // Bind guided form submit
    bindGuidedForm();

    // Bind ActionBar check buttons
    bindActionBar(tripId);

    // Load async data
    loadPhaseBar(tripId);
    loadTravelerContext(tripId);

    // Create or reuse the construction Leo instance
    if (typeof LeoChatStream !== 'undefined' && LeoChatStream.create) {
      if (!_leoInstance) {
        _leoInstance = LeoChatStream.create({
          prefix: 'construction-leo',
          mode: 'construction:ideation',
          storageKey: 'tk-construction-leo',
        });
      }
      const leoEl = document.getElementById('construction-leo-section');
      if (leoEl) {
        LeoChatStream.loadStatus().then(() => {
          _leoInstance.renderSection(leoEl);
        });
      }
    }
  }

  return { render, handleNuisances };
})();
