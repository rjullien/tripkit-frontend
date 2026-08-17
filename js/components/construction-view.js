/**
 * construction-view.js — Construction mode tab view.
 * Sections: PhaseBar, TravelerContextBox, GuidedForm, Leo chat widget.
 */
var ConstructionView = (() => {

  let _leoInstance = null;
  // Un seul flux nuisances vivant à la fois : annulé avant d'en ouvrir un autre,
  // et au ré-affichage de la vue ou au changement de voyage.
  let _nuisanceAbort = null;
  let _currentTripId = null;
  // Voyageurs du dernier profil chargé (repli admin si travelers[] absent).
  let _people = null;
  // Dernière erreur de transition : reste affichée jusqu'à dismiss / succès /
  // changement de voyage. Le setTimeout 6 s faisait disparaître les blocages QA
  // avant qu'on puisse les lire (surtout une liste).
  let _phaseError = null;

  const PIN_LABEL = 'Épingler dans le seed';
  const PROFILE_SUBMIT_LABEL = 'Envoyer à Léo';

  // La base de règles administratives ne couvre qu'une douzaine de destinations et
  // quelques listes de nationalités. Zéro item pour un passeport ne veut donc PAS
  // dire « rien à faire » : ça veut dire « pas de règle connue ». Un ✅ vert à cet
  // endroit annoncerait à un passeport chinois parti aux États-Unis qu'il n'a
  // aucune démarche, alors qu'il lui faut un visa B1/B2. Le silence d'un moteur
  // partiel ne se rend jamais en vert, ici comme pour les nuisances.
  const ADMIN_UNKNOWN_TRAVELER = "⚠️ Aucune règle connue pour ce passeport : à vérifier auprès du consulat ou de l'ambassade du pays de destination.";
  const ADMIN_UNKNOWN_TRIP = "⚠️ Aucune règle connue pour cette destination : à vérifier auprès des sources officielles. Ce silence n'est pas un feu vert.";
  // Limite assumée du moteur : la PRÉSENCE d'un item est décidée sur l'union des
  // nationalités du voyage (un seul passeport américain dans le groupe retire
  // l'ESTA pour tout le monde), seule son ATTRIBUTION est par voyageur. Tant que
  // le backend ne produit pas les items par voyageur, la personne concernée doit
  // le lire dans le panneau, pas seulement dans un doc de suivi.
  const ADMIN_UNION_NOTE = "Liste indicative : la présence d'un item est calculée sur l'ensemble des nationalités du voyage, pas passeport par passeport. Un item peut donc manquer pour l'un si un autre passeport du groupe en dispense.";
  // `countries` vide, côté admin comme côté santé, veut dire que DetectCountries
  // n'a reconnu aucun pays dans le seed : le moteur n'a rien analysé du tout.
  // C'est un cas différent de la destination connue sans rien à signaler, que la
  // spec (construction/SPEC.md §7.2) autorise à rester silencieuse. Annoncer
  // « rien pour cette destination » affirmerait une destination que le backend
  // n'a jamais eue.
  const UNKNOWN_DESTINATION = "⚠️ Destination non identifiée : aucun pays n'a pu être déduit du voyage, donc aucun contrôle n'a été fait. À compléter dans le seed, puis relancer.";

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function tripOf(tripData) {
    return (tripData && tripData.trip) || {};
  }

  function localTripData(tripId) {
    if (typeof Store === 'undefined' || !Store.getTripData) return null;
    return Store.getTripData(tripId || _currentTripId) || null;
  }

  // Construction methodology phases (SPEC §5). Distinct from trip.phases,
  // which are the geographic loop (Québec & Charlevoix, Gaspésie, …).
  const CONSTRUCTION_PHASES = [
    { n: 1, short: 'Ph1', name: 'Idéation' },
    { n: 2, short: 'Ph2', name: 'Tracé' },
    { n: 3, short: 'Ph3', name: 'Hôtels' },
    { n: 4, short: 'Ph4', name: 'Activités' },
    { n: 5, short: 'Live', name: 'Live' },
  ];

  function formatTripDates(start, end, days) {
    const parts = [];
    if (start) parts.push(start);
    if (end && end !== start) parts.push(end);
    const range = parts.join(' → ');
    if (days) return range ? `${range} · ${days} j` : `${days} j`;
    return range;
  }

  // Seed loop already on the device (Route tab). Construction used to ignore
  // it and only show an empty GuidedForm + generic Ph1–Ph4 pills.
  function renderTripLoop(tripData) {
    const trip = tripOf(tripData);
    const name = trip.name || '';
    const c = trip.construction || {};
    const dates = c.dates || {};
    const start = dates.startDate || trip.startDate || '';
    const end = trip.endDate || '';
    const days = Number(dates.days) || (tripData && tripData.days && tripData.days.length) || 0;
    const phases = Array.isArray(trip.phases) ? trip.phases : [];
    if (!name && !phases.length && !start && !days) return '';

    let phasesHtml = '';
    if (phases.length) {
      phasesHtml = '<ol class="construction-loop-phases">';
      phases.forEach((p) => {
        const r = (p && (p.range || p.days)) || [];
        const span = (Array.isArray(r) && r.length === 2) ? `J${r[0]}–J${r[1]}` : '';
        const label = (p && (p.name || p.label)) || '';
        if (!label) return;
        phasesHtml += `<li><span class="loop-phase-name">${esc(label)}</span>`;
        if (span) phasesHtml += ` <span class="loop-phase-range">${esc(span)}</span>`;
        phasesHtml += '</li>';
      });
      phasesHtml += '</ol>';
    }

    const dateLine = formatTripDates(start, end, days);
    return `<div class="construction-trip-box" id="construction-trip-box">
      <h3>${esc(trip.emoji || '🗺️')} ${esc(name || 'Voyage')}</h3>
      ${dateLine ? `<p class="construction-trip-dates">${esc(dateLine)}</p>` : ''}
      ${phasesHtml}
    </div>`;
  }

  function prefillGuidedForm(tripData) {
    const trip = tripOf(tripData);
    const dates = (trip.construction && trip.construction.dates) || {};
    const start = dates.startDate || trip.startDate || '';
    const days = dates.days || (tripData && tripData.days && tripData.days.length) || '';
    const dest = (trip.destination && (trip.destination.name || trip.destination)) || trip.name || '';
    const startEl = document.getElementById('guided-start-date');
    const daysEl = document.getElementById('guided-nb-days');
    const destEl = document.getElementById('guided-destination');
    if (startEl && start) startEl.value = start;
    if (daysEl && days) daysEl.value = days;
    if (destEl && dest) destEl.value = dest;
  }

  function abortNuisanceStream() {
    if (_nuisanceAbort) {
      _nuisanceAbort.abort();
      _nuisanceAbort = null;
    }
    if (typeof NuisanceStream !== 'undefined' && NuisanceStream.stopFollow) {
      NuisanceStream.stopFollow();
    }
  }

  function peopleForTrip(tripId) {
    if (_people) return _people;
    if (typeof Store !== 'undefined' && Store.getTripData) {
      const data = Store.getTripData(tripId);
      if (data && data.people) return data.people;
    }
    return null;
  }

  // ── PhaseBar ────────────────────────────────────────────────────────────────

  function renderPhaseBarLoading() {
    return `<div class="construction-phase-bar" id="construction-phase-bar">
      <div class="construction-loading">Chargement phase...</div>
    </div>`;
  }

  function currentPhaseOf(data) {
    // Le backend démarre à 0 (voyage non encore entré en construction) et 0 est
    // falsy : `(data && data.phase) || 1` faisait donc sauter la phase 1.
    const phase = ConstructionContract.readPhase(data);
    return phase === null ? 1 : phase;
  }

  /** Spec modes: ideation (0–1), route (2), activities (3–4), profile-edit (form). */
  function leoModeForPhase(phase) {
    const n = Number(phase);
    if (!Number.isFinite(n) || n <= 1) return 'construction:ideation';
    if (n === 2) return 'construction:route';
    return 'construction:activities';
  }

  function phaseModeFromDom() {
    const bar = document.getElementById('construction-phase-bar');
    const raw = bar && bar.getAttribute('data-phase');
    return leoModeForPhase(raw == null ? 1 : Number(raw));
  }

  function mountConstructionLeo(mode) {
    const wanted = mode || 'construction:ideation';
    const paint = () => {
      if (typeof LeoChatStream === 'undefined' || !LeoChatStream.create) return;
      if (_leoInstance && _leoInstance.mode !== wanted) {
        try { _leoInstance.destroy(); } catch (_) {}
        _leoInstance = null;
      }
      if (!_leoInstance) {
        _leoInstance = LeoChatStream.create({
          prefix: 'construction-leo',
          mode: wanted,
          storageKey: 'tk-construction-leo',
        });
      }
      const leoEl = document.getElementById('construction-leo-section');
      if (leoEl) {
        LeoChatStream.loadStatus().then(() => {
          if (_leoInstance) _leoInstance.renderSection(leoEl);
        });
      }
    };
    if (typeof LeoChatStream !== 'undefined' && LeoChatStream.create) {
      paint();
      return;
    }
    if (typeof App !== 'undefined' && typeof App.ensureEdgeBundle === 'function') {
      App.ensureEdgeBundle().then(ok => { if (ok) paint(); });
    }
  }

  function blockerText(b) {
    if (b && typeof b === 'object') {
      const code = b.code ? `${b.code} : ` : '';
      return code + (b.message || b.detail || '');
    }
    return String(b == null ? '' : b);
  }

  function constructionPhaseLabel(phase) {
    if (phase <= 0) return 'Construction pas encore démarrée';
    const meta = CONSTRUCTION_PHASES.find(p => p.n === phase);
    if (phase === 5) return 'Phase 5 — Live';
    return meta ? `Phase ${phase} — ${meta.name}` : `Phase ${phase}`;
  }

  function renderPhaseBarContent(data) {
    const phase = currentPhaseOf(data);
    const lastQA = data && data.lastQA;
    const blockers = (lastQA && Array.isArray(lastQA.blockers)) ? lastQA.blockers : [];

    let dotsHtml = '<div class="phase-dots">';
    CONSTRUCTION_PHASES.forEach(p => {
      const cls = p.n < phase ? 'phase-dot done' : (p.n === phase ? 'phase-dot active' : 'phase-dot');
      dotsHtml += `<span class="${cls}">${esc(p.short)}</span>`;
    });
    dotsHtml += '</div>';

    let blockersHtml = '';
    if (blockers.length) {
      blockersHtml = '<div class="phase-blockers"><strong>Blocages :</strong><ul>';
      blockers.forEach(b => { blockersHtml += `<li>${esc(blockerText(b))}</li>`; });
      blockersHtml += '</ul></div>';
    }

    return `<div class="construction-phase-bar" id="construction-phase-bar" data-phase="${phase}">
      <div class="phase-header">
        <span class="phase-label">${esc(constructionPhaseLabel(phase))}</span>
        ${dotsHtml}
      </div>
      ${blockersHtml}
      <button class="btn btn-primary phase-next-btn" id="construction-phase-next"
        ${phase >= 5 ? 'disabled' : ''}>Phase suivante</button>
      ${phaseErrorBoxHtml()}
    </div>`;
  }

  function renderPhaseBarError(msg) {
    return `<div class="construction-phase-bar" id="construction-phase-bar">
      <div class="construction-error">${esc(msg)}</div>
    </div>`;
  }

  function localConstructionState(tripId) {
    const td = localTripData(tripId);
    const c = td && td.trip && td.trip.construction;
    return c && typeof c === 'object' ? c : null;
  }

  function rememberConstruction(tripId, data) {
    if (!tripId || !data || typeof Store === 'undefined' || !Store.getTripData || !Store.setTripData) return;
    const td = Store.getTripData(tripId);
    if (!td) return;
    const copy = Object.assign({}, data);
    delete copy.seedPush;
    td.trip = td.trip || {};
    td.trip.construction = Object.assign({}, td.trip.construction, copy);
    Store.setTripData(tripId, td);
  }

  async function loadPhaseBar(tripId) {
    const el = document.getElementById('construction-phase-bar');
    if (!el) return;
    const local = localConstructionState(tripId);
    const res = await API.getConstruction(tripId);
    if (!res.ok) {
      if (local) {
        el.outerHTML = renderPhaseBarContent(local);
        bindPhaseNext(tripId, local);
        bindPhaseErrorDismiss();
        mountConstructionLeo(leoModeForPhase(currentPhaseOf(local)));
        return;
      }
      el.outerHTML = renderPhaseBarError(res.status === 404 ? 'Construction non initialisée' : 'Erreur chargement phase');
      return;
    }
    const data = Object.assign({}, local || {}, res.data || {});
    rememberConstruction(tripId, data);
    el.outerHTML = renderPhaseBarContent(data);
    bindPhaseNext(tripId, data);
    bindPhaseErrorDismiss();
    mountConstructionLeo(leoModeForPhase(currentPhaseOf(data)));
  }

  function bindPhaseNext(tripId, data) {
    const btn = document.getElementById('construction-phase-next');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      // Phase 0 (défaut backend) -> on demande bien la phase 1.
      const nextPhase = currentPhaseOf(data) + 1;
      btn.disabled = true;
      btn.textContent = 'Transition...';
      const res = await API.transitionPhase(tripId, nextPhase, false);
      if (res.ok) {
        const payload = Object.assign({}, res.data || {});
        const seedPush = payload.seedPush;
        delete payload.seedPush;
        rememberConstruction(tripId, payload);
        if (seedPush && seedPush.ok === false) {
          _phaseError = { tripId: tripId || _currentTripId, body: seedPushWarningBody(seedPush) };
        } else {
          clearPhaseError();
        }
        const container = document.getElementById('construction-phase-bar');
        if (container) {
          container.outerHTML = renderPhaseBarLoading();
          await loadPhaseBar(tripId);
        }
      } else {
        btn.disabled = false;
        btn.textContent = 'Phase suivante';
        showTransitionError(tripId, res);
      }
    });
  }

  function phaseErrorBoxHtml() {
    if (!_phaseError || !_phaseError.body || _phaseError.tripId !== _currentTripId) return '';
    return `<div class="phase-error-box phase-transition-error" id="phase-transition-error" role="alert">
      <div class="phase-error-box-head">
        <div class="phase-error-box-body">${_phaseError.body}</div>
        <button type="button" class="phase-error-dismiss" id="phase-transition-error-dismiss" aria-label="Fermer">×</button>
      </div>
    </div>`;
  }

  function clearPhaseError() {
    _phaseError = null;
    const el = document.getElementById('phase-transition-error');
    if (el) el.remove();
  }

  function bindPhaseErrorDismiss() {
    const btn = document.getElementById('phase-transition-error-dismiss');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => clearPhaseError());
  }

  /**
   * Un 409 porte ses blocages structurés dans res.data.blockers : on les rend
   * avec les mêmes badges que la liste QA. Le JSON brut ne doit jamais atterrir
   * dans le DOM (revue finding 12). La boîte reste jusqu'à fermeture, une
   * transition réussie, ou un changement de voyage — pas un timer.
   */
  function showTransitionError(tripId, res) {
    let body = '';
    const blockers = ConstructionContract.parseBlockers(res.data);
    if (res.status === 409 && blockers && blockers.length) {
      body = `<div class="phase-blocked-title">Transition bloquée : ${blockers.length} blocage${blockers.length > 1 ? 's' : ''}</div>`
        + violationsHtml(blockers);
    } else if (res.status === 403) {
      body = esc('Transition forcée réservée à un administrateur.');
    } else {
      const raw = (res.data && typeof res.data.error === 'string') ? res.data.error : (res.error || '');
      body = esc(errorLabel(raw) || 'Erreur transition');
    }
    _phaseError = { tripId: tripId || _currentTripId, body };
    const bar = document.getElementById('construction-phase-bar');
    const existing = document.getElementById('phase-transition-error');
    const html = phaseErrorBoxHtml();
    if (existing) existing.outerHTML = html;
    else if (bar) bar.insertAdjacentHTML('beforeend', html);
    bindPhaseErrorDismiss();
  }

  function seedPushWarningBody(seedPush) {
    const detail = (seedPush && typeof seedPush.error === 'string' && seedPush.error)
      ? seedPush.error
      : 'écriture git refusée';
    return `<div class="phase-blocked-title">Phase enregistrée, pas dans le repo seed</div>`
      + `<p>${esc('La phase est à jour dans TripKit, mais le fichier seed n\'a pas été modifié : ' + detail)}</p>`;
  }

  /** Traduit les codes d'erreur du backend en phrase lisible. */
  function errorLabel(code) {
    switch (code) {
      case 'transition_blocked': return 'Transition bloquée par la QA.';
      case 'admin_required': return 'Transition forcée réservée à un administrateur.';
      case 'not_implemented': return 'Pas encore disponible.';
      case 'missing_hermes_key': return 'Léo n\'est pas configuré (clé Hermes).';
      default: return code;
    }
  }

  // ── TravelerContextBox ──────────────────────────────────────────────────────

  function renderContextLoading() {
    return `<div class="construction-context-box" id="construction-context-box">
      <div class="construction-loading">Chargement profil voyageurs...</div>
    </div>`;
  }

  function renderContextContent(data) {
    const people = data.people || {};
    // Mémorisé pour la checklist admin par voyageur.
    _people = data.people || null;
    const profile = data.travelProfile || {};
    const ctx = data.travelersContext || {};
    const sources = data.sources || [];

    // Group composition
    let adults = 0;
    let children = [];
    Object.values(people).forEach(p => {
      if (p.age && p.age < 18) {
        children.push(p);
      } else if (p) {
        adults++;
      }
    });
    let groupLine = adults || children.length
      ? `${adults} adulte${adults > 1 ? 's' : ''}${children.length ? `, ${children.length} enfant${children.length > 1 ? 's' : ''}` : ''}`
      : '';
    if (!groupLine) {
      const travelers = tripOf(localTripData()).travelers;
      if (Array.isArray(travelers) && travelers.length) {
        groupLine = `${travelers.length} voyageur${travelers.length > 1 ? 's' : ''}`;
      }
    }
    const childAges = children.length
      ? ` (${children.map(c => c.age ? c.age + ' ans' : '').filter(Boolean).join(', ')})`
      : '';

    const natsPeople = ConstructionContract.normalizePeople(people);
    const natsLine = natsPeople
      .filter(p => p.nationalities.length)
      .map(p => `${p.name} (${p.nationalities.join(', ')})`)
      .join(' · ');

    // travel-profile.js (famille Jullien) stores style under travelStyle /
    // budgetRules. Older fixtures still put pace at the root.
    const style = profile.travelStyle || {};
    const pace = style.pace || profile.pace || ctx.pace || '';
    const maxDriving = style.maxDrivingPerDay || profile.maxDrivingPerDay || ctx.maxDrivingPerDay || '';
    const budgetRules = profile.budgetRules || {};
    const acc = budgetRules.accommodation || {};
    const budget = profile.budgetRange || ctx.budgetRange
      || (acc.maxPerNight ? `hébergement ≤ ${acc.maxPerNight} ${acc.currency || '€'}/nuit` : '');

    // Interests
    const interests = profile.interests || ctx.interests || {};
    let interestsHtml = '';
    if (interests && typeof interests === 'object') {
      const entries = Object.entries(interests);
      if (entries.length) {
        interestsHtml = '<div class="ctx-interests"><strong>Centres d\'intérêt :</strong><ul>';
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
    const healthHtml = health ? `<div class="ctx-health"><strong>Santé :</strong> ${esc(health)}</div>` : '';

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
      ${natsLine ? `<div class="ctx-nats"><strong>Nationalités :</strong> ${esc(natsLine)}</div>` : ''}
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
        <p>Profil non configuré</p>
        <p class="ctx-hint">Renseignez le profil voyageurs pour aider Léo à personnaliser le voyage.</p>
        <button class="btn btn-sm" id="construction-ctx-edit">Configurer</button>
      </div>
    </div>`;
  }

  function renderContextError(msg) {
    return `<div class="construction-context-box" id="construction-context-box">
      <div class="construction-error">${esc(msg)}</div>
    </div>`;
  }

  function localProfileFallback(tripId) {
    const td = localTripData(tripId);
    if (!td) return null;
    const profile = td.travelProfile || (td.trip && td.trip.travelProfile) || null;
    const people = td.people || null;
    if (!profile && !people) return null;
    return { people: people || {}, travelProfile: profile || {}, sources: ['seed'] };
  }

  function hasProfileContent(data) {
    if (!data) return false;
    if (data.people && Object.keys(data.people).length) return true;
    if (data.travelProfile && Object.keys(data.travelProfile).length) return true;
    if (data.travelersContext && Object.keys(data.travelersContext).length) return true;
    return false;
  }

  async function loadTravelerContext(tripId) {
    const el = document.getElementById('construction-context-box');
    if (!el) return;
    const local = localProfileFallback(tripId);
    const res = await API.getTravelProfile(tripId);
    if (!res.ok) {
      if (local && hasProfileContent(local)) {
        el.outerHTML = renderContextContent(local);
        bindContextEdit();
        return;
      }
      if (res.status === 404) {
        el.outerHTML = renderContextNotConfigured();
      } else {
        el.outerHTML = renderContextError('Erreur chargement profil');
      }
      bindContextEdit();
      return;
    }
    const data = Object.assign({}, local || {}, res.data || {});
    if (local && local.travelProfile && !hasProfileContent({ travelProfile: data.travelProfile })) {
      data.travelProfile = local.travelProfile;
    }
    if (local && local.people && !hasProfileContent({ people: data.people })) {
      data.people = local.people;
    }
    if (!hasProfileContent(data)) {
      el.outerHTML = renderContextNotConfigured();
      bindContextEdit();
      return;
    }
    el.outerHTML = renderContextContent(data);
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
          <label for="profile-edit-target">Section à modifier</label>
          <select id="profile-edit-target" name="target" required>
            <option value="">-- Choisir --</option>
            <option value="travelStyle">Style de voyage</option>
            <option value="budgetRules">Budget</option>
            <option value="interests">Centres d'intérêt</option>
            <option value="mealPattern">Repas</option>
            <option value="lessons">Leçons apprises</option>
          </select>
        </div>
        <div class="guided-field">
          <label for="profile-edit-text">Description de la modification</label>
          <textarea id="profile-edit-text" name="text" rows="3"
            placeholder="Ex : nous préférons un rythme lent avec des pauses fréquentes..." required></textarea>
        </div>
        <div class="profile-edit-actions">
          <button type="submit" class="btn btn-primary" id="profile-edit-submit">${PROFILE_SUBMIT_LABEL}</button>
          <button type="button" class="btn btn-sm" id="profile-edit-cancel">Annuler</button>
        </div>
        <div id="profile-edit-status" class="profile-edit-status"></div>
      </form>
    </div>`;

    box.insertAdjacentHTML('beforeend', formHtml);

    mountConstructionLeo('construction:profile-edit');

    document.getElementById('profile-edit-cancel').addEventListener('click', () => {
      const overlay = document.getElementById('profile-edit-overlay');
      if (overlay) overlay.remove();
      mountConstructionLeo(phaseModeFromDom());
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

    // 501 : la demande n'est pas traitée, on ne peint aucun succès.
    if (isNotImplemented(res)) {
      statusEl.textContent = 'Pas encore disponible : ' + notImplementedDetail(res);
      statusEl.className = 'profile-edit-status unavailable';
      submitBtn.disabled = true;
      submitBtn.title = notImplementedDetail(res);
      submitBtn.textContent = 'Pas encore disponible';
      return;
    }

    if (!res.ok) {
      const msg = (res.status === 503)
        ? (errorLabel(res.data && res.data.code) || res.error || 'Léo n\'est pas configuré.')
        : (res.error || 'Erreur lors de la demande');
      statusEl.textContent = msg;
      statusEl.className = 'profile-edit-status error';
      submitBtn.disabled = false;
      submitBtn.textContent = PROFILE_SUBMIT_LABEL;
      return;
    }

    const jobId = res.data && res.data.jobId;
    if (!jobId) {
      statusEl.textContent = 'Réponse inattendue du serveur';
      statusEl.className = 'profile-edit-status error';
      submitBtn.disabled = false;
      submitBtn.textContent = PROFILE_SUBMIT_LABEL;
      return;
    }

    statusEl.textContent = 'Léo travaille sur la modification...';
    statusEl.className = 'profile-edit-status loading';

    // Subscribe to job stream
    subscribeProfileJob(jobId, tripId);
  }

  function profileEditFailed(statusEl, msg) {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.className = 'profile-edit-status error';
    }
    const submitBtn = document.getElementById('profile-edit-submit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Réessayer';
    }
  }

  async function subscribeProfileJob(jobId, tripId) {
    const statusEl = document.getElementById('profile-edit-status');
    let done = false;

    try {
      for await (const frame of API.leoJobStream(jobId, 0)) {
        if (frame.event === 'done') {
          done = true;
          break;
        }
        if (frame.event === 'error') {
          profileEditFailed(statusEl, (frame.data && frame.data.error) || 'Erreur Léo');
          return;
        }
        // delta events - show progress
        if (frame.event === 'delta' && frame.data && frame.data.text && statusEl) {
          statusEl.textContent = 'Léo : ' + frame.data.text.slice(0, 80);
        }
      }
    } catch (e) {
      profileEditFailed(statusEl, 'Connexion perdue. Réessaie.');
      return;
    }

    // Le succès ne s'affiche qu'après une vraie trame `done`.
    if (!done) {
      profileEditFailed(statusEl, 'Flux interrompu avant la fin. Réessaie.');
      return;
    }

    if (statusEl) {
      statusEl.textContent = 'Modification effectuée !';
      statusEl.className = 'profile-edit-status success';
    }
    // Refresh the TravelerContextBox
    setTimeout(() => {
      const overlay = document.getElementById('profile-edit-overlay');
      if (overlay) overlay.remove();
      loadTravelerContext(tripId);
    }, 1200);
  }

  // ── ActionBar (checks: QA, Nuisances, Admin, Santé) ──────────────────────

  let _activeView = null; // 'qa' | 'nuisances' | 'admin' | 'sante'

  function renderActionBar() {
    return `<div class="construction-action-bar" id="construction-action-bar">
      <h3>Vérifications</h3>
      <div class="action-bar-buttons">
        <button class="btn btn-sm action-bar-btn" id="action-qa" data-action="qa">QA</button>
        <button class="btn btn-sm action-bar-btn" id="action-nuisances" data-action="nuisances">Nuisances</button>
        <button class="btn btn-sm action-bar-btn" id="action-admin" data-action="admin">Admin</button>
        <button class="btn btn-sm action-bar-btn" id="action-sante" data-action="sante">Santé</button>
      </div>
      <div id="action-bar-sub-actions" class="action-bar-sub-actions" style="display:none"></div>
      <div id="action-bar-results"></div>
    </div>`;
  }

  function setActiveButton(action) {
    _activeView = action;
    document.querySelectorAll('.action-bar-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.action === action);
    });
  }

  function showSubActions(html) {
    const el = document.getElementById('action-bar-sub-actions');
    if (!el) return;
    if (html) {
      el.innerHTML = html;
      el.style.display = '';
    } else {
      el.innerHTML = '';
      el.style.display = 'none';
    }
  }

  function renderQASubActions() {
    return `<button class="btn btn-xs action-sub-btn" id="sub-qa-run">🔄 Relancer</button>`;
  }

  function renderNuisanceSubActions() {
    return `<button class="btn btn-xs action-sub-btn" id="sub-nui-run">🔄 Relancer</button>
            <button class="btn btn-xs action-sub-btn" id="sub-nui-refresh">🔁 Rafraîchir manques</button>`;
  }

  function bindActionBar(tripId) {
    const qaBtn = document.getElementById('action-qa');
    const nuiBtn = document.getElementById('action-nuisances');
    const adminBtn = document.getElementById('action-admin');
    const santeBtn = document.getElementById('action-sante');

    if (qaBtn) qaBtn.addEventListener('click', () => viewQA(tripId));
    if (nuiBtn) nuiBtn.addEventListener('click', () => viewNuisances(tripId));
    if (adminBtn) adminBtn.addEventListener('click', () => handleAdmin(tripId));
    if (santeBtn) santeBtn.addEventListener('click', () => handleSante(tripId));
  }

  // ── View QA (GET only, no POST) ──

  async function viewQA(tripId) {
    setActiveButton('qa');
    showSubActions(renderQASubActions());
    bindQASubActions(tripId);

    // GET stored QA
    setButtonLoading('action-qa', true);
    const res = await API.getQA(tripId);
    setButtonLoading('action-qa', false);

    if (!res || !res.ok || !res.data) {
      showResults(`<div class="action-result-muted">Aucun résultat QA. Cliquez « Relancer » pour lancer l'analyse.</div>`);
      return;
    }
    const parsed = ConstructionContract.parseQA(res.data);
    if (!parsed.ok) {
      showResults(`<div class="action-result-muted">Aucun résultat QA en cache.</div>`);
      return;
    }
    paintQA(parsed);
  }

  function bindQASubActions(tripId) {
    const runBtn = document.getElementById('sub-qa-run');
    if (runBtn) runBtn.addEventListener('click', () => handleQA(tripId));
  }

  // ── View Nuisances (GET only, no POST) ──

  async function viewNuisances(tripId) {
    setActiveButton('nuisances');
    showSubActions(renderNuisanceSubActions());
    bindNuisanceSubActions(tripId);

    // GET stored nuisance results
    const el = document.getElementById('action-bar-results');
    if (typeof NuisanceStream !== 'undefined' && NuisanceStream.hydrate) {
      const parsed = await NuisanceStream.hydrate(el, {
        tripId,
        onRendered: () => appendPinButton(el),
      });
      const hasSomething = !!(parsed && parsed.locations && parsed.locations.length);
      if (!hasSomething) {
        showResults(`<div class="action-result-muted">Aucun résultat nuisances. Cliquez « Relancer » pour lancer l'analyse.</div>`);
      }
    } else {
      showResults(`<div class="action-result-muted">Aucun résultat nuisances.</div>`);
    }
  }

  function bindNuisanceSubActions(tripId) {
    const runBtn = document.getElementById('sub-nui-run');
    const refreshBtn = document.getElementById('sub-nui-refresh');
    if (runBtn) runBtn.addEventListener('click', () => handleNuisances(tripId));
    if (refreshBtn) refreshBtn.addEventListener('click', () => handleNuisanceRefresh(tripId));
  }

  async function handleNuisanceRefresh(tripId) {
    const btnId = 'sub-nui-refresh';
    setButtonLoading(btnId, true);
    const res = await API.refreshNuisanceCheck(tripId);
    setButtonLoading(btnId, false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur rafraîchissement : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    // If nothing to refresh (200 with message instead of 202 with jobId)
    if (res.data && !res.data.jobId) {
      showResults(`<div class="action-result-ok">${esc(res.data.message || 'Tous les résultats sont à jour.')}</div>`);
      return;
    }

    // Job started — subscribe to SSE
    abortNuisanceStream();
    const ac = new AbortController();
    _nuisanceAbort = ac;

    const el = document.getElementById('action-bar-results');
    await NuisanceStream.start(el, {
      tripId,
      data: res.data,
      signal: ac.signal,
      onRendered: () => appendPinButton(el),
    });
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

  /** Liste de QAViolation avec badges — partagée par le panneau QA et les blocages 409. */
  function violationsHtml(violations) {
    let html = '';
    ConstructionContract.sortViolations(violations).forEach(item => {
      const sev = String((item && item.severity) || 'info').toLowerCase();
      const cls = (sev === 'blocker' || sev === 'red' || sev === 'error') ? 'qa-red'
        : (sev === 'warning' || sev === 'yellow') ? 'qa-yellow' : 'qa-info';
      const badge = cls === 'qa-red' ? '🔴' : cls === 'qa-yellow' ? '🟡' : 'ℹ️';
      html += `<div class="qa-item ${cls}">`;
      html += `<span class="qa-badge">${badge}</span>`;
      html += `<span class="qa-code">${esc(item && item.code)}</span>`;
      if (item && item.dayNum != null) html += ` <span class="qa-day">J${esc(item.dayNum)}</span>`;
      html += `<div class="qa-msg">${esc((item && (item.message || item.msg)) || '')}</div>`;
      if (item && item.detail) {
        html += `<div class="qa-detail">${esc(item.detail)}</div>`;
      }
      // Actionable link for nuisance violations: direct user to Résa tab
      if (item && (item.code === 'nuisance_unresolved' || item.code === 'nuisance_indeterminate')) {
        const action = item.code === 'nuisance_unresolved'
          ? `<a href="#" class="qa-action-link" data-action="goto-resa">→ Aller dans l'onglet Résa</a>`
          : `<a href="#" class="qa-action-link" data-action="refresh-nuisance">→ Rafraîchir l'analyse</a>`;
        html += `<div class="qa-action">${action}</div>`;
      }
      html += `</div>`;
    });
    return html;
  }

  /** Erreur explicite : une enveloppe non reconnue ne doit jamais rassurer. */
  function showUnrecognized(what) {
    showResults(`<div class="construction-error unrecognized-payload">Réponse inattendue du serveur : impossible d'afficher ${esc(what)}.</div>`);
  }

  function paintQA(parsed) {
    if (!parsed.violations.length) {
      showResults(`<div class="action-result-ok">Aucun problème détecté</div>`);
      return;
    }
    const n = parsed.violations.length;
    let html = '<div class="action-results-qa">';
    html += `<div class="action-results-header">QA : ${n} problème${n > 1 ? 's' : ''}${parsed.phase !== null ? ` (phase ${parsed.phase})` : ''}</div>`;
    html += violationsHtml(parsed.violations);
    html += '</div>';
    showResults(html);
    bindQAActionLinks();
  }

  function bindQAActionLinks() {
    const el = document.getElementById('action-bar-results');
    if (!el) return;
    el.querySelectorAll('.qa-action-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = link.dataset.action;
        if (action === 'goto-resa' && typeof App !== 'undefined' && App.switchTab) {
          App.switchTab('hotels');
        } else if (action === 'refresh-nuisance') {
          const tripId = _currentTripId;
          if (tripId) handleNuisanceRefresh(tripId);
        }
      });
    });
  }

  async function handleQA(tripId) {
    setButtonLoading('action-qa', true);
    const res = await API.runQA(tripId);
    setButtonLoading('action-qa', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur QA : ${esc(errorLabel((res.data && res.data.error) || '') || res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const parsed = ConstructionContract.parseQA(res.data);
    if (!parsed.ok) {
      showUnrecognized('le résultat QA');
      return;
    }
    paintQA(parsed);
  }

  function resultsPaneIsEmpty() {
    const el = document.getElementById('action-bar-results');
    return !el || !el.innerHTML || !el.innerHTML.trim();
  }

  /** GET du dernier QA. Silence si rien en cache ou enveloppe inconnue — ne
   *  pas voler le panneau avec une erreur au simple ouverture d'onglet.
   *  Relit le panneau après le GET : un clic Admin/QA pendant l'aller-retour
   *  ne doit pas se faire écraser. */
  async function hydrateQA(tripId) {
    if (!tripId || typeof API === 'undefined' || !API.getQA) return false;
    try {
      const res = await API.getQA(tripId);
      if (!res || !res.ok || !res.data || res.data.cached !== true) return false;
      if (tripId !== _currentTripId || !resultsPaneIsEmpty()) return false;
      const parsed = ConstructionContract.parseQA(res.data);
      if (!parsed.ok) return false;
      if (tripId !== _currentTripId || !resultsPaneIsEmpty()) return false;
      paintQA(parsed);
      return true;
    } catch (_) {
      return false;
    }
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

    // Un clic annule l'analyse précédente : deux flux vivants écriraient dans le
    // même #action-bar-results et se disputeraient le rendu final.
    abortNuisanceStream();
    const ac = new AbortController();
    _nuisanceAbort = ac;

    const el = document.getElementById('action-bar-results');
    await NuisanceStream.start(el, {
      tripId,
      data: res.data,
      signal: ac.signal,
      onRendered: () => appendPinButton(el),
    });
  }

  function appendPinButton(el) {
    if (!el) return;
    if (el.querySelector && el.querySelector('#nuisance-pin-btn')) return;
    el.insertAdjacentHTML('beforeend',
      `<div class="nuisance-pin-wrap"><button type="button" class="btn btn-accent nuisance-pin-btn" id="nuisance-pin-btn">${PIN_LABEL}</button></div>`);
    const pinBtn = document.getElementById('nuisance-pin-btn');
    if (pinBtn) pinBtn.addEventListener('click', () => handlePinNuisance(pinBtn));
  }

  /**
   * Épingler écrit hotels[].nuisance + lastQa (200). Un 501 d'un backend plus
   * ancien reste affiché comme indisponible.
   */
  async function handlePinNuisance(btn) {
    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;
    if (!tripId) return;

    btn.disabled = true;
    btn.textContent = 'Enregistrement…';

    const res = await API.pinNuisanceToSeed(tripId);

    if (isNotImplemented(res)) {
      btn.textContent = 'Pas encore disponible';
      btn.classList.add('unavailable');
      btn.title = notImplementedDetail(res);
      btn.disabled = true;
      return;
    }

    if (!res || !res.ok) {
      resetPinButton(btn, 'Erreur');
      return;
    }

    btn.textContent = 'Épinglé ✓';
    btn.disabled = true;
    btn.classList.remove('unavailable');
    const seedPush = res.data && res.data.seedPush;
    const wrap = btn.closest('.nuisance-pin-wrap') || btn.parentNode;
    const old = wrap && wrap.querySelector && wrap.querySelector('.nuisance-pin-warn');
    if (old) old.remove();
    if (seedPush && seedPush.ok === false && wrap) {
      const detail = (typeof seedPush.error === 'string' && seedPush.error)
        ? seedPush.error
        : 'écriture git refusée';
      wrap.insertAdjacentHTML('beforeend',
        `<p class="nuisance-pin-warn">Enregistré dans TripKit, pas dans le repo seed : ${esc(detail)}</p>`);
    }
  }

  function resetPinButton(btn, msg) {
    btn.textContent = msg;
    setTimeout(() => {
      btn.textContent = PIN_LABEL;
      btn.removeAttribute('title');
      btn.disabled = false;
    }, 2500);
  }

  /** 501 (ou corps {error:'not_implemented'}) : fonctionnalité pas encore branchée. */
  function isNotImplemented(res) {
    if (!res) return false;
    return res.status === 501 || !!(res.data && res.data.error === 'not_implemented');
  }

  function notImplementedDetail(res) {
    const detail = res && res.data && res.data.detail;
    return (typeof detail === 'string' && detail) ? detail : "Léo n'écrit pas encore dans le seed.";
  }

  // ── Admin check ──

  // Vocabulaire backend uniquement (`ok` / `warning` / `action_required`).
  // Une regex `/ok|done|valid/` faisait retomber `invalid` et `not_ok` sur ✅
  // (lot #76). Une valeur inconnue rend ❓, jamais un tick vert.
  function statusBadge(status) {
    switch (String(status || '').toLowerCase()) {
      case 'ok': return '✅';
      case 'warning': return '⚠️';
      case 'action_required': return '🔴';
      case 'none': return '';
      default: return '❓';
    }
  }

  function statusLabel(status) {
    switch (String(status || '').toLowerCase()) {
      case 'ok': return 'OK';
      case 'warning': return 'À vérifier';
      case 'action_required': return 'Action requise';
      default: return String(status || '');
    }
  }

  function verdictSentence(verdict) {
    switch (String(verdict || '').toLowerCase()) {
      case 'ok': return '✅ Rien à faire';
      case 'warning': return '⚠️ Points à vérifier';
      case 'action_required': return '🔴 Démarches à effectuer';
      case 'none': return '';
      default: return esc(verdict || '');
    }
  }

  /** Item admin : pays, libellé, badge de statut, détail, coût et lien officiel. */
  function adminItemHtml(item) {
    let html = `<div class="admin-check-item">`;
    html += `<span class="check-badge">${statusBadge(item.status)}</span>`;
    if (item.country) html += `<span class="admin-country">${esc(item.country)}</span> `;
    html += `<span class="admin-label">${esc(item.label || item.type || '')}</span>`;
    if (item.status) html += ` <span class="admin-status">${esc(statusLabel(item.status))}</span>`;
    if (item.detail) html += `<div class="admin-detail">${esc(item.detail)}</div>`;
    if (item.deadline) html += `<div class="admin-deadline">Échéance : ${esc(item.deadline)}</div>`;
    if (item.cost && item.cost !== item.detail) html += `<div class="admin-cost">Coût : ${esc(item.cost)}</div>`;
    if (item.url) html += `<div class="admin-url"><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Site officiel</a></div>`;
    html += `</div>`;
    return html;
  }

  /**
   * Checklist admin par voyageur (construction/SPEC.md §7). Prefer travelers[]
   * from the server (D-D). Fallback: regroup items via people + union note.
   */
  async function handleAdmin(tripId) {
    setButtonLoading('action-admin', true);
    const res = await API.runAdminCheck(tripId);
    setButtonLoading('action-admin', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur admin : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const parsed = ConstructionContract.parseAdminCheck(res.data);
    if (!parsed.ok) {
      showUnrecognized('la checklist administrative');
      return;
    }

    let html = '<div class="action-results-admin">';
    html += `<div class="action-results-header">Formalités administratives</div>`;
    if (parsed.countries.length) {
      html += `<div class="admin-countries">Pays détectés : ${esc(parsed.countries.join(', '))}</div>`;
    }
    // Le verdict ne se rend QUE s'il porte sur des items. `AdminCheck` renvoie
    // verdict "ok" avec zéro item dès qu'aucun pays n'est détecté, qu'aucune
    // nationalité n'est connue (le cas ordinaire : `nationalities` est optionnel
    // dans un seed) ou qu'aucune règle ne matche. « ✅ Rien à faire » y serait
    // exactement le faux feu vert que l'avertissement juste dessous corrige, et
    // il s'afficherait au-dessus de lui.
    const sentence = parsed.items.length ? verdictSentence(parsed.verdict) : '';
    if (sentence) html += `<div class="admin-verdict admin-verdict-${esc(parsed.verdict)}">${sentence}</div>`;
    if (parsed.summary) html += `<div class="admin-summary action-result-summary">${esc(parsed.summary)}</div>`;

    if (!parsed.items.length) {
      const empty = parsed.countries.length ? ADMIN_UNKNOWN_TRIP : UNKNOWN_DESTINATION;
      html += `<div class="admin-unknown">${empty}</div></div>`;
      showResults(html);
      return;
    }

    const groups = ConstructionContract.groupAdminItemsByTraveler(parsed.items, peopleForTrip(tripId));
    const serverTravelers = Array.isArray(parsed.travelers) ? parsed.travelers : [];

    function travelerBlock(t) {
      let block = `<div class="admin-traveler">`;
      block += `<div class="admin-traveler-name">${esc(t.name)}${t.nationalities && t.nationalities.length ? ` <span class="admin-nats">(${esc(t.nationalities.join(', '))})</span>` : ''}</div>`;
      if (t.items && t.items.length) {
        t.items.forEach(item => { block += adminItemHtml(item); });
      } else {
        block += `<div class="admin-check-item admin-unknown">${ADMIN_UNKNOWN_TRAVELER}</div>`;
      }
      block += `</div>`;
      return block;
    }

    if (serverTravelers.length) {
      serverTravelers.forEach(t => { html += travelerBlock(t); });
    } else if (groups.grouped) {
      groups.travelers.forEach(t => { html += travelerBlock(t); });
      if (groups.everyone.length) {
        html += `<div class="admin-traveler admin-everyone"><div class="admin-traveler-name">Tous les voyageurs</div>`;
        groups.everyone.forEach(item => { html += adminItemHtml(item); });
        html += `</div>`;
      }
      if (groups.unassigned.length) {
        html += `<div class="admin-traveler admin-unassigned"><div class="admin-traveler-name">Nationalités non rattachées à un voyageur</div>`;
        groups.unassigned.forEach(item => { html += adminItemHtml(item); });
        html += `</div>`;
      }
      html += `<div class="admin-limitation">ℹ️ ${ADMIN_UNION_NOTE}</div>`;
    } else {
      html += `<div class="admin-traveler admin-flat"><div class="admin-traveler-name">Voyageurs inconnus : liste par pays</div>`;
      groups.everyone.forEach(item => { html += adminItemHtml(item); });
      html += `</div>`;
      html += `<div class="admin-limitation">ℹ️ ${ADMIN_UNION_NOTE}</div>`;
    }

    html += '</div>';
    showResults(html);
  }

  // ── Health check ──

  async function handleSante(tripId) {
    setButtonLoading('action-sante', true);
    const res = await API.runHealthCheck(tripId);
    setButtonLoading('action-sante', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur santé : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const parsed = ConstructionContract.parseHealthCheck(res.data);
    if (!parsed.ok) {
      showUnrecognized('les recommandations santé');
      return;
    }

    // Deux silences distincts, que le backend renvoie tous les deux avec
    // verdict "none" et zéro item :
    //  - pays détecté, aucune recommandation : silence voulu par la spec
    //    (construction/SPEC.md §7.2, « le check répond rien de particulier et
    //    n'affiche pas de section ») -> le ✅ vert reste légitime ;
    //  - `countries` vide, donc aucun pays déduit du voyage : le moteur n'a rien
    //    analysé. Le rendre en vert annoncerait « rien à faire » pour une
    //    destination inconnue, exactement le faux feu vert corrigé côté admin.
    if (!parsed.items.length && !parsed.countries.length) {
      showResults(`<div class="health-unknown">${UNKNOWN_DESTINATION}</div>`);
      return;
    }
    if (!parsed.items.length || String(parsed.verdict).toLowerCase() === 'none') {
      showResults(`<div class="action-result-ok">Aucune recommandation santé pour cette destination</div>`);
      return;
    }

    const n = parsed.items.length;
    let html = '<div class="action-results-health">';
    html += `<div class="action-results-header">Santé : ${n} recommandation${n > 1 ? 's' : ''}</div>`;
    if (parsed.countries.length) {
      html += `<div class="health-countries">Pays détectés : ${esc(parsed.countries.join(', '))}</div>`;
    }
    if (parsed.summary) html += `<div class="health-summary action-result-summary">${esc(parsed.summary)}</div>`;
    parsed.items.forEach(item => {
      html += `<div class="health-item">`;
      html += `<span class="check-badge">${statusBadge(item.status)}</span>`;
      if (item.country && item.country !== '*') html += `<span class="health-country">${esc(item.country)}</span> `;
      html += `<span class="health-title">${esc(item.label || item.type || '')}</span>`;
      if (item.status) html += ` <span class="health-status">${esc(statusLabel(item.status))}</span>`;
      if (item.detail) html += `<div class="health-detail">${esc(item.detail)}</div>`;
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
      <h3>Paramètres du voyage</h3>
      <form id="construction-guided-form-el">
        <div class="guided-field">
          <label for="guided-start-date">Date de départ</label>
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
        <button type="submit" class="btn btn-primary guided-submit">Envoyer à Léo</button>
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
      if (startDate) parts.push(`Départ : ${startDate}`);
      if (nbDays) parts.push(`Durée : ${nbDays} jours`);
      if (transports.length) parts.push(`Transports : ${transports.join(', ')}`);

      if (!parts.length) return; // nothing to send

      const message = `Voici les paramètres pour l'idéation du voyage :\n${parts.join('\n')}`;

      // Send to Leo construction chat
      if (_leoInstance && _leoInstance.send) {
        _leoInstance.send(message);
      }
    });
  }

  function mountConstructionDiscovery(tripId, tripData) {
    const el = document.getElementById('construction-discovery');
    if (!el || typeof DiscoveryPanel === 'undefined' || !DiscoveryPanel.firstCorridorLeg) return;
    const found = DiscoveryPanel.firstCorridorLeg(tripData);
    if (!found) {
      el.innerHTML = '';
      return;
    }
    const day = (typeof DayHelpers !== 'undefined' && DayHelpers.enrich)
      ? DayHelpers.enrich(found.day, tripData)
      : found.day;
    DiscoveryPanel.render(el, {
      tripId,
      day,
      tripData,
      corridorOnly: true,
      leg: found.leg,
    });
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;

    // Tout ré-affichage (et a fortiori un changement de voyage) coupe le flux
    // nuisances en cours : sinon une trame `done` périmée afficherait les
    // résultats du voyage précédent dans la nouvelle vue.
    abortNuisanceStream();
    if (tripId !== _currentTripId) {
      _people = null;
      clearPhaseError();
      _currentTripId = tripId;
    }

    if (!tripId) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🏗️</div>
        <h3>Mode Construction</h3>
        <p>Aucun voyage sélectionné.</p>
      </div>`;
      return;
    }

    // Build layout: trip loop (seed), PhaseBar, TravelerContextBox, GuidedForm, Leo, ActionBar
    container.innerHTML = `
      <div class="page-header">
        <h1>🏗️ Mode Construction</h1>
        <button type="button" class="btn btn-sm" id="construction-quit-mode">Quitter le mode</button>
      </div>
      ${renderTripLoop(tripData)}
      ${renderPhaseBarLoading()}
      ${renderContextLoading()}
      ${renderGuidedForm()}
      <div id="construction-discovery"></div>
      <div id="construction-leo-section"></div>
      ${renderActionBar()}
    `;

    // Bind guided form submit
    bindGuidedForm();
    prefillGuidedForm(tripData);

    // Bind ActionBar check buttons
    bindActionBar(tripId);

    const quit = document.getElementById('construction-quit-mode');
    if (quit) {
      quit.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.toggleConstructionMode) {
          App.toggleConstructionMode(false);
        }
      });
    }

    // Load async data
    loadPhaseBar(tripId);
    loadTravelerContext(tripId);
    mountConstructionDiscovery(tripId, tripData);

    mountConstructionLeo('construction:ideation');
    const resumed = typeof NuisanceStream !== 'undefined' && NuisanceStream.resumeIfNeeded
      && NuisanceStream.resumeIfNeeded();
    const resultsEl = document.getElementById('action-bar-results');
    (async () => {
      if (resumed) { setActiveButton('nuisances'); showSubActions(renderNuisanceSubActions()); bindNuisanceSubActions(tripId); return; }
      // On tab open: try nuisances first (most actionable), then QA.
      let nuisancePainted = false;
      if (typeof NuisanceStream !== 'undefined' && NuisanceStream.hydrate) {
        const parsed = await NuisanceStream.hydrate(resultsEl, {
          tripId,
          onRendered: () => appendPinButton(resultsEl),
        });
        nuisancePainted = !!(parsed && parsed.locations && parsed.locations.length);
      }
      if (nuisancePainted) {
        setActiveButton('nuisances');
        showSubActions(renderNuisanceSubActions());
        bindNuisanceSubActions(tripId);
        return;
      }
      // Fallback to QA
      const qaShown = await hydrateQA(tripId);
      if (qaShown) {
        setActiveButton('qa');
        showSubActions(renderQASubActions());
        bindQASubActions(tripId);
      }
    })();
  }

  return { render, handleNuisances, handleAdmin, handleSante, abortNuisanceStream, leoModeForPhase, statusBadge };
})();
