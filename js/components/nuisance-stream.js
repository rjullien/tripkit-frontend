/**
 * nuisance-stream.js — Flux d'analyse des nuisances : une seule implémentation
 * de « je m'abonne au job, j'affiche la progression, je récupère et j'affiche
 * le résultat final ».
 *
 * Partagé par js/app.js (panneau Plus, variante compacte) et
 * js/components/construction-view.js (onglet Construction). La revue avait
 * relevé que ce flux existait en double et que le correctif AbortController
 * n'avait atterri que sur la copie de app.js : ici il n'y a plus qu'une copie.
 *
 * L'abandon reste la responsabilité de l'appelant : chacun garde son propre
 * AbortController, l'annule avant d'ouvrir un nouveau flux et le passe en
 * `signal`. Un flux annulé n'écrit plus rien dans le DOM, donc une trame `done`
 * périmée ne peut plus afficher les résultats du voyage précédent.
 */
var NuisanceStream = (() => {

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function aborted(signal) {
    return !!(signal && signal.aborted);
  }

  function paint(el, html) {
    if (el) el.innerHTML = html;
  }

  // Léo Plus pattern: the job lives in the BE. sessionStorage remembers which
  // one we started so a Safari lock / tab switch can reattach. Aborting the
  // SSE must not look like a product error and must not cancel Overpass.
  const JOB_KEY = 'tk-nuisance-job';
  const SEQ_KEY = 'tk-nuisance-seq';
  const CTX_KEY = 'tk-nuisance-ctx';

  let _jobId = null;
  let _lastSeq = 0;
  let _ctx = null;
  let _following = false;
  let _followAC = null;

  function stopFollow() {
    if (_followAC) {
      try { _followAC.abort(); } catch (_) {}
      _followAC = null;
    }
    _following = false;
  }

  function attachFollow(caller) {
    const ac = new AbortController();
    _followAC = ac;
    if (caller) {
      if (caller.aborted) ac.abort();
      else if (typeof caller.addEventListener === 'function') {
        caller.addEventListener('abort', () => ac.abort());
      }
    }
    return ac.signal;
  }

  function inferPanel(o) {
    if (o && o.locationId) return 'hotels';
    if (o && o.compact) return 'plus';
    return 'construction';
  }

  function ctxFrom(o) {
    return {
      tripId: (o && o.tripId) || '',
      locationId: (o && o.locationId) || '',
      compact: !!(o && o.compact),
      panel: (o && o.panel) || inferPanel(o),
    };
  }

  function persistJob() {
    try {
      if (!_jobId) {
        sessionStorage.removeItem(JOB_KEY);
        sessionStorage.removeItem(SEQ_KEY);
        sessionStorage.removeItem(CTX_KEY);
        return;
      }
      sessionStorage.setItem(JOB_KEY, _jobId);
      sessionStorage.setItem(SEQ_KEY, String(_lastSeq || 0));
      if (_ctx) sessionStorage.setItem(CTX_KEY, JSON.stringify(_ctx));
    } catch (_) {}
  }

  function rememberJob(jobId, seq, ctx) {
    _jobId = jobId || null;
    _lastSeq = seq || 0;
    _ctx = ctx || null;
    persistJob();
  }

  function clearJob() {
    _jobId = null;
    _lastSeq = 0;
    _ctx = null;
    persistJob();
  }

  function readJob() {
    if (_jobId) return { jobId: _jobId, seq: _lastSeq, ctx: _ctx };
    try {
      const id = sessionStorage.getItem(JOB_KEY);
      if (!id) return null;
      const seq = Number(sessionStorage.getItem(SEQ_KEY) || 0) || 0;
      const raw = sessionStorage.getItem(CTX_KEY);
      const ctx = raw ? JSON.parse(raw) : null;
      return { jobId: id, seq, ctx };
    } catch (_) {
      return null;
    }
  }

  function targetEl(ctx) {
    if (!ctx || typeof document === 'undefined') return null;
    if (ctx.locationId) {
      return document.querySelector('.hotel-nuisance-result[data-loc="' + ctx.locationId + '"]');
    }
    if (ctx.panel === 'plus') return document.getElementById('plus-nuisance-result');
    return document.getElementById('action-bar-results');
  }

  function panelVisible(ctx) {
    if (!ctx || typeof document === 'undefined') return false;
    const id = ctx.panel === 'hotels' ? 'tab-hotels'
      : ctx.panel === 'plus' ? 'tab-plus'
      : 'tab-construction';
    const view = document.getElementById(id);
    return !!(view && view.classList.contains('active'));
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────

  function loadingHtml(compact) {
    // Progression repérée par une classe, jamais par un id : plusieurs panneaux
    // (un par hôtel dans Résa) peuvent analyser en parallèle.
    return compact
      ? `<div class="nuisance-progress" style="font-size:.82em;color:var(--muted)">Analyse en cours...</div>`
      : `<div class="action-result-loading nuisance-progress">Analyse en cours...</div>`;
  }

  function errorHtml(msg, compact) {
    return compact
      ? `<div class="construction-error" style="font-size:.82em">${esc(msg)}</div>`
      : `<div class="construction-error">${esc(msg)}</div>`;
  }

  function neutralHtml(msg, compact) {
    return compact
      ? `<div style="font-size:.82em;color:var(--green)">${esc(msg)}</div>`
      : `<div class="action-result-ok">${esc(msg)}</div>`;
  }

  function verdictClass(verdict) {
    switch (String(verdict || '').toUpperCase()) {
      case 'ELEVE': return 'verdict-bad';
      case 'MODERE': return 'verdict-moderate';
      case 'INDETERMINE': return 'verdict-unknown';
      case 'FAIBLE': return 'verdict-ok';
      default: return 'verdict-moderate';
    }
  }

  function verdictLabel(verdict) {
    switch (String(verdict || '').toUpperCase()) {
      case 'ELEVE': return 'Nuisances élevées';
      case 'MODERE': return 'Nuisances modérées';
      case 'INDETERMINE': return 'Analyse incomplète';
      case 'FAIBLE': return 'Nuisances faibles';
      default: return String(verdict || '');
    }
  }

  function categoryHtml(cat, compact) {
    const emoji = cat.emoji || '⚠️';
    const name = cat.category || cat.name || '';
    const level = cat.level || '';
    const detail = cat.detail || '';
    const dist = (typeof cat.distance === 'number' && cat.distance > 0) ? `${Math.round(cat.distance)} m` : '';
    const count = (typeof cat.count === 'number' && cat.count > 0) ? `${cat.count}` : '';

    if (compact) {
      const bits = [level, dist].filter(Boolean).map(esc).join(' · ');
      return `<div style="margin:2px 0 2px 8px">${emoji} ${esc(name)}${bits ? ' — ' + bits : ''}</div>`;
    }

    const cls = cat.unavailable === true
      ? 'nuisance-cat nuisance-cat-unavailable'
      : (String(level).toUpperCase() === 'INDETERMINE' ? 'nuisance-cat nuisance-cat-unknown' : 'nuisance-cat');
    let html = `<div class="${cls}">`;
    html += `<span class="nuisance-emoji">${emoji}</span>`;
    html += `<span class="nuisance-cat-name">${esc(name)}</span>`;
    if (level) html += ` <span class="nuisance-level">${esc(level)}</span>`;
    if (count) html += ` <span class="nuisance-count">${esc(count)}</span>`;
    if (dist) html += ` <span class="nuisance-distance">${esc(dist)}</span>`;
    if (detail) html += `<div class="nuisance-detail">${esc(detail)}</div>`;
    html += `</div>`;
    return html;
  }

  /**
   * Dit OÙ la mesure a été prise. « Trains à 76 m » ne veut pas dire la même
   * chose devant la porte de l'hôtel et au centre de la ville qui l'entoure :
   * un verdict dont on ignore le point de mesure n'est pas exploitable.
   *
   * - `addressSource: "hotel"` → adresse du seed (candidate / to_book / booked)
   * - `addressSource: "guessed"` → point trouvé via le nom, à vérifier
   * - `addressSource: "missing"` → pas de bâtiment : on réclame hotels[].addr
   * - `addressSource: "step"` + `addressNote` → repli sur le point d'étape
   * - `step` sans note → simple lieu d'étape sans hébergement : rien à signaler
   */
  function addressHtml(loc, compact) {
    const source = String(loc.addressSource || '');
    const note = loc.addressNote || '';
    const addr = loc.addressUsed || '';

    if (source === 'hotel') {
      const txt = `📍 Analysé à l'adresse de l'hôtel${addr ? ' : ' + addr : ''}`;
      return compact
        ? `<div style="font-size:.9em;color:var(--muted);margin:2px 0 2px 8px">${esc(txt)}</div>`
        : `<div class="nuisance-address">${esc(txt)}</div>`;
    }
    if (source === 'guessed') {
      const txt = `📍 Adresse proposée (pas dans le seed)${addr ? ' : ' + addr : ''} — dites si ce n'est pas le bon bâtiment`;
      return compact
        ? `<div style="font-size:.9em;color:var(--warn,#e0a800);margin:2px 0 2px 8px">${esc(txt)}</div>`
        : `<div class="nuisance-address nuisance-address-fallback nuisance-address-guessed">${esc(txt)}</div>`;
    }
    if (source === 'missing' || note) {
      const txt = `📍 ${note || "Adresse manquante : ajoutez hotels[].addr"}`;
      const cls = source === 'missing' ? 'nuisance-address nuisance-address-missing' : 'nuisance-address nuisance-address-fallback';
      return compact
        ? `<div style="font-size:.9em;color:var(--warn,#e0a800);margin:2px 0 2px 8px">${esc(txt)}</div>`
        : `<div class="${cls}">${esc(txt)}</div>`;
    }
    return '';
  }

  function resultsHtml(parsed, compact) {
    const wrapOpen = compact ? `<div style="font-size:.82em">` : `<div class="action-results-nuisance">`;
    let html = wrapOpen;

    if (parsed.verdict) {
      const label = `${parsed.verdictEmoji ? parsed.verdictEmoji + ' ' : ''}${verdictLabel(parsed.verdict)}`;
      html += compact
        ? `<div style="font-weight:600;margin-bottom:4px">${esc(label)}</div>`
        : `<div class="nuisance-verdict ${verdictClass(parsed.verdict)}">${esc(label)}</div>`;
    }

    if (parsed.incomplete) {
      const failed = parsed.failedCategories.length
        ? ` Catégories non vérifiées : ${parsed.failedCategories.join(', ')}.`
        : '';
      const warn = `⚪ Analyse incomplète : certaines données n'ont pas pu être récupérées.${failed}`;
      html += compact
        ? `<div style="color:var(--warn,#e0a800)">${esc(warn)}</div>`
        : `<div class="nuisance-incomplete nuisance-partial-warning">${esc(warn)}</div>`;
    }

    parsed.locations.forEach(loc => {
      const name = loc.locationName || loc.name || loc.locationId || '';
      const emoji = loc.verdictEmoji || '';
      const head = `${emoji ? emoji + ' ' : ''}${name}`;
      html += compact
        ? `<div style="margin-top:6px;font-weight:600">${esc(head)}</div>`
        : `<div class="nuisance-location"><div class="nuisance-loc-name">${esc(head)}</div>`;

      html += addressHtml(loc, compact);

      const cats = Array.isArray(loc.categories) ? loc.categories : [];
      cats.forEach(cat => { html += categoryHtml(cat, compact); });

      if (!compact) {
        if (loc.recommendation) html += `<div class="nuisance-recommendation nuisance-reco">${esc(loc.recommendation)}</div>`;
        if (Array.isArray(loc.alternatives) && loc.alternatives.length) {
          html += `<div class="nuisance-alts">Alternatives : ${loc.alternatives.map(a => esc(a)).join(', ')}</div>`;
        }
        html += `</div>`;
      }
    });

    html += '</div>';
    return html;
  }

  /**
   * Restreint un résultat à un hébergement (bouton par hôtel dans Résa).
   * `id` peut être un id d'hôtel ou un id d'étape : le bouton envoie l'id
   * d'hôtel quand il en a un, et l'historique de l'app envoie l'id d'étape.
   */
  function filterLocation(parsed, id) {
    const locations = parsed.locations.filter(l =>
      (l.hotelId || '') === id
      || (l.locationId || '') === id
      || (l.locationName || l.name || '') === id);
    const verdict = ConstructionContract.worstNuisanceVerdict(locations.map(l => l.verdict));
    const failed = [];
    let incomplete = false;
    locations.forEach(l => {
      if (l.incomplete === true) incomplete = true;
      (Array.isArray(l.failedCategories) ? l.failedCategories : []).forEach(c => {
        if (failed.indexOf(c) === -1) failed.push(c);
      });
      (Array.isArray(l.categories) ? l.categories : []).forEach(cat => {
        if (cat && (cat.unavailable === true || String(cat.level).toUpperCase() === 'INDETERMINE')) incomplete = true;
      });
    });
    return {
      ok: true,
      locations,
      verdict,
      verdictEmoji: ConstructionContract.nuisanceEmoji(verdict),
      incomplete,
      failedCategories: failed,
    };
  }

  /**
   * Affiche une charge utile nuisance dans `el`. Renvoie le résultat analysé
   * ({ok:false} si l'enveloppe n'est pas reconnue : on affiche alors une erreur,
   * jamais un « aucune nuisance détectée » rassurant).
   */
  function render(el, data, opts) {
    const o = opts || {};
    const compact = !!o.compact;
    if (aborted(o.signal)) return null;

    let parsed = ConstructionContract.parseNuisance(data);
    if (parsed.ok && o.locationId) {
      parsed = filterLocation(parsed, o.locationId);
    }
    if (!parsed.ok) {
      paint(el, errorHtml("Réponse inattendue du serveur : impossible d'afficher l'analyse des nuisances.", compact));
      return parsed;
    }
    if (!parsed.locations.length) {
      // Zéro lieu analysé n'est pas un satisfecit : on le dit tel quel.
      paint(el, neutralHtml(o.locationId
        ? "Pas encore de résultat pour cet hébergement."
        : 'Aucun hébergement à analyser.', compact));
      return parsed;
    }
    paint(el, resultsHtml(parsed, compact));
    if (typeof o.onRendered === 'function') o.onRendered(parsed);
    return parsed;
  }

  // ── Abonnement SSE ──────────────────────────────────────────────────────────

  /**
   * Affiche l'erreur, mais pas au prix du travail déjà fait : le backend
   * interroge Overpass lieu par lieu et enregistre chaque résultat au fur et à
   * mesure, donc un job qui casse en route (temps imparti dépassé, redémarrage
   * du pod) laisse des résultats partiels lisibles en base. On les récupère et
   * on les affiche SOUS l'erreur — jamais à la place, l'analyse reste incomplète.
   */
  async function paintPartialOrError(el, opts, msg) {
    const o = opts || {};
    const compact = !!o.compact;
    try {
      const stored = await API.getNuisanceCheck(o.tripId);
      if (aborted(o.signal)) return;
      if (stored && stored.ok) {
        let parsed = ConstructionContract.parseNuisance(stored.data);
        if (parsed.ok && o.locationId) parsed = filterLocation(parsed, o.locationId);
        if (parsed.ok && parsed.locations.length) {
          paint(el, errorHtml(msg + ' Résultats partiels ci-dessous.', compact) + resultsHtml(parsed, compact));
          if (typeof o.onRendered === 'function') o.onRendered(parsed);
          return;
        }
      }
    } catch (_) {
      // Rien de récupérable : on s'en tient à l'erreur.
    }
    if (aborted(o.signal)) return;
    paint(el, errorHtml(msg, compact));
  }

  /**
   * SSE tombé (iPhone lock, idle proxy) : le job continue en BE. On relit le
   * store. S'il y a déjà des lieux, on les montre sans crier à l'erreur. S'il
   * n'y a rien, on laisse « Analyse en cours » — resumeIfNeeded réattachera.
   */
  async function recoverFromStore(el, opts) {
    const o = opts || {};
    if (aborted(o.signal)) return false;
    try {
      const stored = await API.getNuisanceCheck(o.tripId);
      if (aborted(o.signal)) return false;
      if (stored && stored.ok) {
        let parsed = ConstructionContract.parseNuisance(stored.data);
        if (parsed.ok && o.locationId) parsed = filterLocation(parsed, o.locationId);
        if (parsed.ok && parsed.locations.length) {
          paint(el, resultsHtml(parsed, !!o.compact));
          if (typeof o.onRendered === 'function') o.onRendered(parsed);
          return true;
        }
      }
    } catch (_) {}
    if (!aborted(o.signal) && el && !(el.querySelector && el.querySelector('.nuisance-progress'))) {
      paint(el, loadingHtml(!!o.compact));
    }
    return false;
  }

  /**
   * Suit un job d'analyse jusqu'à sa trame `done`, puis récupère et affiche le
   * résultat définitif. `signal` (obligatoire côté appelant) coupe la lecture
   * SSE — pas le job. Un abandon (onglet, lock) n'est pas une erreur produit.
   */
  async function subscribe(el, opts) {
    const o = opts || {};
    const compact = !!o.compact;
    const signal = attachFollow(o.signal);
    if (o.jobId) rememberJob(o.jobId, o.after || _lastSeq || 0, ctxFrom(o));

    try {
      for await (const frame of API.leoJobStream(o.jobId, o.after || 0, { signal })) {
        if (aborted(signal)) return;

        if (frame && frame.data && typeof frame.data.seq === 'number') {
          _lastSeq = frame.data.seq;
          persistJob();
        }

        if (frame.event === 'done') {
          const final = await API.getNuisanceCheck(o.tripId);
          if (aborted(signal)) return;
          if (final.ok) {
            render(el, final.data, o);
          } else {
            paint(el, errorHtml('Analyse terminée mais résultats indisponibles : ' + (final.error || 'HTTP ' + final.status), compact));
          }
          clearJob();
          return;
        }

        if (frame.event === 'error') {
          // Une annulation volontaire n'est pas une erreur à afficher.
          if ((frame.data && frame.data.code === 'cancelled') || aborted(signal)) return;
          await paintPartialOrError(el, Object.assign({}, o, { signal }), (frame.data && frame.data.error) || "Erreur lors de l'analyse");
          clearJob();
          return;
        }

        if (frame.event === 'delta' || frame.event === 'progress') {
          const text = (frame.data && (frame.data.text || frame.data.location || frame.data.message)) || '';
          const progressEl = (el && el.querySelector && el.querySelector('.nuisance-progress')) || el;
          if (text && progressEl) progressEl.textContent = 'Analyse : ' + text;
        }
      }
      // Stream closed without `done` (Safari lock, proxy idle). Job still runs.
      if (!aborted(signal)) await recoverFromStore(el, Object.assign({}, o, { signal }));
    } catch (e) {
      if (aborted(signal)) return;
      await recoverFromStore(el, Object.assign({}, o, { signal }));
    }
  }

  /**
   * Point d'entrée unique après un POST nuisance-check : job asynchrone -> on
   * s'abonne, résultat synchrone -> on affiche directement.
   */
  function start(el, opts) {
    const o = opts || {};
    if (o.data && o.data.jobId) {
      stopFollow();
      rememberJob(o.data.jobId, 0, ctxFrom(o));
      paint(el, loadingHtml(!!o.compact));
      _following = true;
      return subscribe(el, Object.assign({}, o, { jobId: o.data.jobId, after: 0 }))
        .finally(() => { _following = false; });
    }
    render(el, o.data, o);
    return Promise.resolve();
  }

  /**
   * Réattache le job mémorisé quand l'onglet est de nouveau visible.
   * No-op si le panneau n'est pas à l'écran (on ne repeint pas un onglet caché).
   */
  function resumeIfNeeded() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
    const saved = readJob();
    if (!saved || !saved.jobId || !saved.ctx) return false;
    if (!panelVisible(saved.ctx)) return false;
    const el = targetEl(saved.ctx);
    if (!el) return false;
    if (_following) return true;
    _jobId = saved.jobId;
    _lastSeq = saved.seq || 0;
    _ctx = saved.ctx;
    _following = true;
    const o = Object.assign({}, saved.ctx, {
      jobId: saved.jobId,
      after: saved.seq || 0,
    });
    subscribe(el, o).finally(() => { _following = false; });
    return true;
  }

  /**
   * Recharge le dernier résultat persisté (construction_checks). Un job
   * terminé n'est plus dans sessionStorage : sans ça, quitter l'onglet
   * ou un refreshFromBackend (touchTrip en fin d'analyse) vide le panneau.
   * No-op s'il n'y a rien en base — on ne peint pas « aucun hébergement ».
   */
  async function hydrate(el, opts) {
    const o = opts || {};
    if (!el || !o.tripId || typeof API === 'undefined' || !API.getNuisanceCheck) return null;
    if (aborted(o.signal)) return null;
    try {
      const stored = await API.getNuisanceCheck(o.tripId);
      if (aborted(o.signal)) return null;
      if (!stored || !stored.ok) return null;
      let parsed = ConstructionContract.parseNuisance(stored.data);
      if (parsed.ok && o.locationId) parsed = filterLocation(parsed, o.locationId);
      if (!parsed.ok || !parsed.locations.length) return null;
      paint(el, resultsHtml(parsed, !!o.compact));
      if (typeof o.onRendered === 'function') o.onRendered(parsed);
      return parsed;
    } catch (_) {
      return null;
    }
  }

  /**
   * Une GET pour tout le voyage, puis peinture de chaque carte hôtel.
   * Shows a compact nuisance verdict summary with an Accept button for
   * elevated verdicts (user acknowledges risk → QA gate stops blocking).
   */
  async function hydrateHotels(root, tripId) {
    if (!root || !tripId || typeof API === 'undefined' || !API.getNuisanceCheck) return;
    const nodes = root.querySelectorAll && root.querySelectorAll('.hotel-nuisance-result[data-loc]');
    if (!nodes || !nodes.length) return;
    try {
      const stored = await API.getNuisanceCheck(tripId);
      if (!stored || !stored.ok) return;
      const parsed = ConstructionContract.parseNuisance(stored.data);
      if (!parsed.ok || !parsed.locations.length) return;
      nodes.forEach((el) => {
        const id = el.getAttribute('data-loc');
        if (!id) return;
        const one = filterLocation(parsed, id);
        if (!one.locations.length) return;
        // Show compact verdict + accept button for ELEVE
        const loc = one.locations[0];
        const verdict = loc.verdict || one.verdict || '';
        const emoji = loc.verdictEmoji || ConstructionContract.nuisanceEmoji(verdict) || '';
        const accepted = loc.accepted === true;
        const mainIssue = (Array.isArray(loc.categories) && loc.categories.length)
          ? loc.categories.filter(c => c.level === 'ELEVE' || c.level === 'MODERE')
              .map(c => `${c.emoji || ''} ${c.category || c.name || ''} ${c.distance ? Math.round(c.distance) + 'm' : ''}`).join(' · ')
          : '';
        let html = `<div class="hotel-nuisance-summary" style="font-size:.82em;margin:4px 0;padding:4px 8px;border-radius:4px;background:var(--surface-alt,#f5f5f5)">`;
        html += `<span>${emoji} ${esc(verdictLabel(verdict))}${accepted ? ' ✓ accepté' : ''}</span>`;
        if (mainIssue) html += `<div style="color:var(--muted);font-size:.9em">${esc(mainIssue)}</div>`;
        if (verdict === 'ELEVE' && !accepted) {
          html += `<button class="btn btn-xs nuisance-accept-btn" data-trip-id="${esc(tripId)}" data-loc-id="${esc(id)}" style="margin-top:4px">✓ Accepter le risque</button>`;
        }
        html += `</div>`;
        paint(el, html);
      });
      // Bind accept buttons
      bindAcceptButtons(root);
    } catch (_) {}
  }

  function bindAcceptButtons(root) {
    if (!root) return;
    root.querySelectorAll('.nuisance-accept-btn').forEach(btn => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const tripId = btn.dataset.tripId;
        const locId = btn.dataset.locId;
        if (!tripId || !locId) return;
        btn.disabled = true;
        btn.textContent = '...';
        const res = await API.acceptNuisanceCheck(tripId, locId);
        if (res && res.ok) {
          btn.textContent = '✓ Accepté';
          btn.classList.add('accepted');
        } else {
          btn.textContent = 'Erreur';
          setTimeout(() => { btn.textContent = '✓ Accepter le risque'; btn.disabled = false; }, 2000);
        }
      });
    });
  }

  return {
    render, subscribe, start, resumeIfNeeded, stopFollow, clearJob,
    hydrate, hydrateHotels, bindAcceptButtons,
    verdictLabel, filterLocation, paintPartialOrError,
  };
})();
