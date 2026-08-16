/**
 * construction-contract.js — Couche de lecture des réponses de l'API Construction.
 *
 * Pure (aucun accès au DOM, aucun fetch) et testable : tests/construction-contract.test.cjs
 * l'exécute contre les fixtures dorées copiées depuis
 * tripkit-backend/internal/handlers/testdata/contract/.
 *
 * Règle de base : chaque parseur renvoie un résultat discriminé.
 *   { ok: true,  ... }                              -> charge utile reconnue
 *   { ok: false, reason: 'unrecognized_payload' }    -> clé attendue absente
 * Une charge utile non reconnue ne doit JAMAIS se dégrader en liste vide : côté
 * visa / vaccins / nuisances, un « rien à signaler » faussement rassurant est
 * pire qu'une erreur affichée (revue findings 1 à 4).
 *
 * Enveloppes réellement émises par le backend :
 *   POST construction/qa   -> { violations: [QAViolation], phase, count }
 *   GET  construction/qa   -> { violations, phase, count, cached, cachedAt? }
 *   POST admin-check       -> { verdict, countries, items, travelers?: [TravelerChecklist], summary? }
 *   POST health-check      -> { verdict, countries, items: [HealthCheckItem], summary? }
 *   GET  nuisance-check    -> { results: [LocationResult] }   (verdict par lieu)
 *   409  construction/phase-> { error: 'transition_blocked', blockers: [QAViolation] }
 */
var ConstructionContract = (() => {

  const UNRECOGNIZED = 'unrecognized_payload';

  // Niveaux de nuisance, du pire au meilleur. INDETERMINE (donnée indisponible)
  // passe devant MODERE : une requête Overpass en échec ne doit pas verdir.
  const NUISANCE_LEVELS = ['ELEVE', 'INDETERMINE', 'MODERE', 'FAIBLE'];

  const NUISANCE_EMOJI = {
    ELEVE: '🔴',
    INDETERMINE: '⚪',
    MODERE: '🟡',
    FAIBLE: '🟢',
  };

  function fail() {
    return { ok: false, reason: UNRECOGNIZED };
  }

  function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  /**
   * Les GET admin-check / health-check renvoient le résultat encapsulé dans
   * { result, cached, cachedAt }. On déballe pour que le même parseur serve
   * aux deux verbes.
   */
  function unwrapCached(data) {
    if (isPlainObject(data) && data.cached === true && isPlainObject(data.result)) {
      return data.result;
    }
    return data;
  }

  /**
   * Lit une liste à `key`. Renvoie undefined si la clé est absente ou d'un type
   * inattendu (charge utile non reconnue), [] si la clé vaut null (Go sérialise
   * une slice nil en `null` : c'est une liste vide légitime).
   */
  function readList(obj, key) {
    if (!isPlainObject(obj)) return undefined;
    if (!(key in obj)) return undefined;
    const v = obj[key];
    if (v === null || v === undefined) return [];
    return Array.isArray(v) ? v : undefined;
  }

  function readString(obj, key) {
    return (isPlainObject(obj) && typeof obj[key] === 'string') ? obj[key] : '';
  }

  function readStringList(obj, key) {
    const v = isPlainObject(obj) ? obj[key] : null;
    if (!Array.isArray(v)) return [];
    return v.filter(x => typeof x === 'string' && x !== '');
  }

  /**
   * Phase courante, explicitement : le backend démarre à 0 et `0 || 1` faisait
   * sauter la phase 1 (revue finding 11). Renvoie null si absente.
   */
  function readPhase(data) {
    if (isPlainObject(data) && typeof data.phase === 'number' && isFinite(data.phase)) {
      return data.phase;
    }
    return null;
  }

  // ── QA ──────────────────────────────────────────────────────────────────────

  function parseQA(data) {
    const violations = readList(data, 'violations');
    if (violations === undefined) return fail();
    const phase = readPhase(data);
    const count = (isPlainObject(data) && typeof data.count === 'number')
      ? data.count
      : violations.length;
    return { ok: true, violations, phase, count };
  }

  const SEVERITY_RANK = { blocker: 0, red: 0, error: 0, warning: 1, yellow: 1, info: 2 };

  function severityRank(sev) {
    const r = SEVERITY_RANK[String(sev || '').toLowerCase()];
    return r === undefined ? 3 : r;
  }

  /** Copie triée : rouges d'abord, puis jaunes, puis le reste. */
  function sortViolations(violations) {
    return (violations || []).slice().sort((a, b) => severityRank(a && a.severity) - severityRank(b && b.severity));
  }

  // ── Blocages de transition (409) ────────────────────────────────────────────

  /**
   * Blocages structurés d'un 409. Renvoie undefined si le corps ne les porte
   * pas, pour que l'appelant retombe sur le message d'erreur textuel.
   */
  function parseBlockers(data) {
    const blockers = readList(data, 'blockers');
    if (blockers === undefined) return undefined;
    return blockers;
  }

  // ── Admin-check / Health-check ──────────────────────────────────────────────

  function parseItemsEnvelope(raw) {
    const data = unwrapCached(raw);
    const items = readList(data, 'items');
    if (items === undefined) return fail();
    return {
      ok: true,
      verdict: readString(data, 'verdict'),
      countries: readStringList(data, 'countries'),
      items,
      summary: readString(data, 'summary'),
    };
  }

  function parseAdminCheck(data) {
    const parsed = parseItemsEnvelope(data);
    if (!parsed.ok) return parsed;
    const raw = unwrapCached(data);
    const list = readList(raw, 'travelers');
    if (list !== undefined) {
      parsed.travelers = list.filter(isPlainObject).map(t => ({
        id: readString(t, 'id'),
        name: readString(t, 'name') || readString(t, 'id'),
        nationalities: readStringList(t, 'nationalities'),
        verdict: readString(t, 'verdict'),
        items: Array.isArray(t.items) ? t.items.filter(isPlainObject) : [],
      }));
    }
    return parsed;
  }

  function parseHealthCheck(data) {
    return parseItemsEnvelope(data);
  }

  /** appliesTo, en tolérant l'ancien nom snake_case applies_to. */
  function itemAppliesTo(item) {
    if (!isPlainObject(item)) return [];
    const raw = Array.isArray(item.appliesTo) ? item.appliesTo
      : (Array.isArray(item.applies_to) ? item.applies_to : []);
    return raw.filter(x => typeof x === 'string' && x !== '');
  }

  function appliesToEveryone(list) {
    return !list.length || list.indexOf('*') !== -1;
  }

  /** Normalise people (objet id->personne ou tableau) en [{name, nationalities}]. */
  function normalizePeople(people) {
    const raw = Array.isArray(people) ? people
      : (isPlainObject(people) ? Object.keys(people).map(k => {
        const p = people[k];
        return isPlainObject(p) ? Object.assign({ _key: k }, p) : null;
      }) : []);
    return raw.filter(Boolean).map(p => {
      const nats = Array.isArray(p.nationalities)
        ? p.nationalities.filter(n => typeof n === 'string' && n !== '')
        : (typeof p.nationality === 'string' && p.nationality ? [p.nationality] : []);
      const name = p.name || p.firstName || p.id || p._key || '';
      return { name: String(name), nationalities: nats };
    }).filter(p => p.name);
  }

  /**
   * Checklist admin par voyageur (SPEC §7.1). Le backend envoie travelers[]
   * (passeport par passeport). On le lit en priorité. Sans travelers[], repli
   * sur le regroupement local depuis people + note d'union.
   */
  function groupAdminItemsByTraveler(items, people) {
    const list = Array.isArray(items) ? items.filter(isPlainObject) : [];
    const travelers = normalizePeople(people).map(p => ({
      name: p.name,
      nationalities: p.nationalities,
      items: [],
    }));
    const everyone = [];
    const unassigned = [];

    if (!travelers.length) {
      return { grouped: false, travelers: [], everyone: list, unassigned: [] };
    }

    list.forEach(item => {
      const applies = itemAppliesTo(item);
      if (appliesToEveryone(applies)) {
        everyone.push(item);
        return;
      }
      let matched = 0;
      travelers.forEach(t => {
        if (t.nationalities.some(n => applies.indexOf(n) !== -1)) {
          t.items.push(item);
          matched++;
        }
      });
      if (!matched) unassigned.push(item);
    });

    return { grouped: true, travelers, everyone, unassigned };
  }

  // ── Nuisances ───────────────────────────────────────────────────────────────

  function levelRank(level) {
    const i = NUISANCE_LEVELS.indexOf(String(level || '').toUpperCase());
    return i === -1 ? NUISANCE_LEVELS.length : i;
  }

  /** Pire verdict d'une liste de niveaux, selon ELEVE > INDETERMINE > MODERE > FAIBLE. */
  function worstNuisanceVerdict(levels) {
    let best = null;
    (levels || []).forEach(l => {
      const up = String(l || '').toUpperCase();
      if (NUISANCE_LEVELS.indexOf(up) === -1) return;
      if (best === null || levelRank(up) < levelRank(best)) best = up;
    });
    return best || '';
  }

  function nuisanceEmoji(level) {
    return NUISANCE_EMOJI[String(level || '').toUpperCase()] || '';
  }

  /**
   * Le backend ne porte PAS de verdict global sur nuisance-check : il est par
   * lieu, dans results[]. On le calcule, et on remonte les drapeaux
   * incomplete / failedCategories pour qu'une analyse partielle ne s'affiche
   * jamais en vert (revue finding 9, côté rendu).
   */
  function parseNuisance(data) {
    const locations = readList(data, 'results');
    if (locations === undefined) return fail();
    const clean = locations.filter(isPlainObject);

    const verdict = worstNuisanceVerdict(clean.map(l => l.verdict));
    const failed = [];
    let incomplete = (isPlainObject(data) && data.incomplete === true);

    clean.forEach(loc => {
      if (loc.incomplete === true) incomplete = true;
      readStringList(loc, 'failedCategories').forEach(c => {
        if (failed.indexOf(c) === -1) failed.push(c);
      });
      const cats = Array.isArray(loc.categories) ? loc.categories : [];
      cats.forEach(cat => {
        if (isPlainObject(cat) && (cat.unavailable === true || String(cat.level).toUpperCase() === 'INDETERMINE')) {
          incomplete = true;
        }
      });
    });

    return {
      ok: true,
      locations: clean,
      verdict,
      verdictEmoji: nuisanceEmoji(verdict),
      incomplete,
      failedCategories: failed,
    };
  }

  return {
    UNRECOGNIZED,
    NUISANCE_LEVELS,
    readPhase,
    parseQA,
    sortViolations,
    severityRank,
    parseBlockers,
    parseAdminCheck,
    parseHealthCheck,
    itemAppliesTo,
    normalizePeople,
    groupAdminItemsByTraveler,
    parseNuisance,
    worstNuisanceVerdict,
    nuisanceEmoji,
  };
})();
