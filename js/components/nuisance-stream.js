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
        : `<div class="nuisance-incomplete">${esc(warn)}</div>`;
    }

    parsed.locations.forEach(loc => {
      const name = loc.locationName || loc.name || loc.locationId || '';
      const emoji = loc.verdictEmoji || '';
      const head = `${emoji ? emoji + ' ' : ''}${name}`;
      html += compact
        ? `<div style="margin-top:6px;font-weight:600">${esc(head)}</div>`
        : `<div class="nuisance-location"><div class="nuisance-loc-name">${esc(head)}</div>`;

      const cats = Array.isArray(loc.categories) ? loc.categories : [];
      cats.forEach(cat => { html += categoryHtml(cat, compact); });

      if (!compact) {
        if (loc.recommendation) html += `<div class="nuisance-recommendation">${esc(loc.recommendation)}</div>`;
        if (Array.isArray(loc.alternatives) && loc.alternatives.length) {
          html += `<div class="nuisance-alts">Alternatives : ${loc.alternatives.map(a => esc(a)).join(', ')}</div>`;
        }
        html += `</div>`;
      }
    });

    html += '</div>';
    return html;
  }

  /** Restreint un résultat à un hébergement (bouton par hôtel dans Résa). */
  function filterLocation(parsed, locationId) {
    const locations = parsed.locations.filter(l =>
      (l.locationId || '') === locationId || (l.locationName || l.name || '') === locationId);
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
   * Suit un job d'analyse jusqu'à sa trame `done`, puis récupère et affiche le
   * résultat définitif. `signal` (obligatoire côté appelant) coupe tout écriture
   * dans le DOM dès que l'appelant a abandonné.
   */
  async function subscribe(el, opts) {
    const o = opts || {};
    const compact = !!o.compact;
    const signal = o.signal;

    try {
      for await (const frame of API.leoJobStream(o.jobId, 0, { signal })) {
        if (aborted(signal)) return;

        if (frame.event === 'done') {
          const final = await API.getNuisanceCheck(o.tripId);
          if (aborted(signal)) return;
          if (final.ok) {
            render(el, final.data, o);
          } else {
            paint(el, errorHtml('Analyse terminée mais résultats indisponibles : ' + (final.error || 'HTTP ' + final.status), compact));
          }
          return;
        }

        if (frame.event === 'error') {
          // Une annulation volontaire n'est pas une erreur à afficher.
          if ((frame.data && frame.data.code === 'cancelled') || aborted(signal)) return;
          paint(el, errorHtml((frame.data && frame.data.error) || "Erreur lors de l'analyse", compact));
          return;
        }

        if (frame.event === 'delta' || frame.event === 'progress') {
          const text = (frame.data && (frame.data.text || frame.data.location || frame.data.message)) || '';
          const progressEl = (el && el.querySelector && el.querySelector('.nuisance-progress')) || el;
          if (text && progressEl) progressEl.textContent = 'Analyse : ' + text;
        }
      }
    } catch (e) {
      if (aborted(signal)) return; // abandon volontaire (re-render, changement de voyage)
      paint(el, errorHtml('Connexion perdue. Réessaie.', compact));
    }
  }

  /**
   * Point d'entrée unique après un POST nuisance-check : job asynchrone -> on
   * s'abonne, résultat synchrone -> on affiche directement.
   */
  function start(el, opts) {
    const o = opts || {};
    if (o.data && o.data.jobId) {
      paint(el, loadingHtml(!!o.compact));
      return subscribe(el, Object.assign({}, o, { jobId: o.data.jobId }));
    }
    render(el, o.data, o);
    return Promise.resolve();
  }

  return { render, subscribe, start, verdictLabel, filterLocation };
})();
