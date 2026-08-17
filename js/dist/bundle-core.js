/* ==== bundle-core.js — généré par scripts/build-bundles.mjs, ne pas éditer ==== */
/* Sources (10), dans l'ordre de bundles.json. */
;
/* ==== js/store.js ==== */
/**
 * store.js — localStorage wrapper with per-item timestamps for sync
 * All state reads/writes go through here.
 */

var Store = (() => {

  // ── Device ID (persistent, used for sync) ──────────────────────────────────
  function getDeviceId() {
    let id = localStorage.getItem('tk-device-id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('tk-device-id', id);
    }
    return id;
  }

  // ── Low-level helpers ──────────────────────────────────────────────────────

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[Store] localStorage write failed:', e);
    }
  }

  function del(key) {
    localStorage.removeItem(key);
  }

  // ── Current trip ──────────────────────────────────────────────────────────
  function getCurrentTripId() {
    return localStorage.getItem('tk-current-trip') || null;
  }

  function setCurrentTripId(id) {
    localStorage.setItem('tk-current-trip', id);
  }

  // ── List state: checks, custom, hidden ────────────────────────────────────
  // listId: e.g. "courses-day1-usa2026", "checklist-alice-bob-demo2026"

  /**
   * Get the checks map for a list: { itemId: { checked: bool, updatedAt: ts } }
   */
  function getChecks(listId) {
    return get(`${listId}-checks`, {});
  }

  /**
   * Dirty check IDs: local toggles not yet successfully pushed.
   * Pulls must not overwrite these; pushes send only these entries.
   */
  function getDirtyCheckIds(listId) {
    const raw = get(`${listId}-checks-dirty`, []);
    return Array.isArray(raw) ? raw : [];
  }

  function markCheckDirty(listId, itemId) {
    const ids = getDirtyCheckIds(listId);
    if (!ids.includes(itemId)) {
      ids.push(itemId);
      set(`${listId}-checks-dirty`, ids);
    }
  }

  function clearDirtyChecks(listId, itemIds) {
    if (!itemIds || !itemIds.length) return;
    const drop = new Set(itemIds);
    set(`${listId}-checks-dirty`, getDirtyCheckIds(listId).filter((id) => !drop.has(id)));
  }

  /** Checks map limited to dirty item IDs (for push payload). */
  function getDirtyChecks(listId) {
    const all = getChecks(listId);
    const out = {};
    getDirtyCheckIds(listId).forEach((id) => {
      if (all[id]) out[id] = all[id];
    });
    return out;
  }

  /**
   * Toggle an item check. Returns updated checks.
   */
  function toggleCheck(listId, itemId) {
    const checks = getChecks(listId);
    const current = checks[itemId] || { checked: false, updatedAt: 0 };
    checks[itemId] = { checked: !current.checked, updatedAt: Date.now() };
    set(`${listId}-checks`, checks);
    markCheckDirty(listId, itemId);
    return checks;
  }

  /**
   * Set a check from sync merge.
   * Policy: newer updatedAt wins; on equal ts, checked wins over unchecked.
   * Grace: never let a remote uncheck overwrite a local check younger than 10s.
   */
  function setCheck(listId, itemId, checked, updatedAt) {
    const checks = getChecks(listId);
    const current = checks[itemId];
    if (current && current.checked && !checked) {
      const age = Date.now() - current.updatedAt;
      if (age < 10000) return checks; // protect recent local check
    }
    if (!current) {
      checks[itemId] = { checked: !!checked, updatedAt: updatedAt || 0 };
      set(`${listId}-checks`, checks);
      return checks;
    }
    if (updatedAt > current.updatedAt) {
      checks[itemId] = { checked: !!checked, updatedAt };
      set(`${listId}-checks`, checks);
    } else if (updatedAt === current.updatedAt && checked && !current.checked) {
      checks[itemId] = { checked: true, updatedAt };
      set(`${listId}-checks`, checks);
    }
    return checks;
  }

  /**
   * Apply server checks after a pull/push.
   * Non-dirty items: take server as truth (fixes stale local ts that blocked peers).
   * Dirty items: keep LWW via setCheck so an in-flight local toggle is not lost.
   */
  function applyRemoteChecks(listId, remoteChecks) {
    if (!remoteChecks) return false;
    const dirty = new Set(getDirtyCheckIds(listId));
    let changed = false;
    Object.entries(remoteChecks).forEach(([id, item]) => {
      const checked = !!item.checked;
      const updatedAt = item.updatedAt || 0;
      if (dirty.has(id)) {
        const before = getChecks(listId)[id];
        setCheck(listId, id, checked, updatedAt);
        const after = getChecks(listId)[id];
        if (!before || !after
          || before.checked !== after.checked
          || before.updatedAt !== after.updatedAt) {
          changed = true;
        }
        return;
      }
      const before = getChecks(listId)[id];
      const checks = getChecks(listId);
      if (before && before.checked === checked && before.updatedAt === updatedAt) return;
      checks[id] = { checked, updatedAt };
      set(`${listId}-checks`, checks);
      changed = true;
    });
    return changed;
  }

  /**
   * packing (valise / vêtements) is local by default.
   * todo (avant-de-partir) and everything else is shared by default.
   * Explicit `{listId}-list-shared` overrides the default.
   */
  function rememberListType(listId, type) {
    if (listId && type) set(`${listId}-list-type`, type);
  }

  function listType(listId) {
    const remembered = get(`${listId}-list-type`, null);
    if (remembered) return remembered;
    const tripId = getCurrentTripId();
    const data = tripId && getTripData(tripId);
    const lists = data && data.lists;
    const list = lists && (lists[listId] || Object.values(lists).find(l => l && l.id === listId));
    if (list && list.type) return list.type;
    if (/^checklist-/.test(listId)) return 'packing';
    if (/^avant-de-partir-/.test(listId)) return 'todo';
    return '';
  }

  function defaultListShared(listId) {
    return listType(listId) !== 'packing';
  }

  function isListShared(listId) {
    const v = get(`${listId}-list-shared`, null);
    if (v === null) return defaultListShared(listId);
    return !!v;
  }

  /**
   * Set list-level share. When turning ON, promote local custom items so they
   * join the group. When turning OFF, only future adds stay local — already
   * published items stay on the server until 🔒 / 🗑.
   */
  function setListShared(listId, shared) {
    const on = !!shared;
    set(`${listId}-list-shared`, on);
    if (on) {
      const items = getCustomItems(listId);
      let changed = false;
      const tombs = getCustomDeleted(listId);
      Object.keys(items).forEach((id) => {
        if (!items[id].shared) {
          items[id].shared = true;
          items[id].createdAt = Date.now();
          if (tombs[id]) delete tombs[id];
          changed = true;
        }
      });
      if (changed) {
        set(`${listId}-custom`, items);
        set(`${listId}-custom-deleted`, tombs);
      }
    }
    return on;
  }

  /**
   * Last sync outcome for a list — surfaced in the list header so a failing
   * sync is visible instead of silently swallowed.
   * { state: 'ok'|'offline'|'error', at, status, message }
   */
  function getSyncState(listId) {
    return get(`${listId}-sync-state`, null);
  }

  function setSyncState(listId, state) {
    set(`${listId}-sync-state`, state);
  }

  /**
   * Get custom items for a list: { customId: { text, section, createdAt } }
   */
  function getCustomItems(listId) {
    return get(`${listId}-custom`, {});
  }

  /**
   * Add a custom item. shared follows the list-level Oui/Non
   * (packing = Non, avant-de-partir = Oui, unless the user toggled).
   */
  function addCustomItem(listId, sectionIndex, text) {
    const items = getCustomItems(listId);
    const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const now = Date.now();
    const shared = isListShared(listId);
    items[id] = { text, section: sectionIndex, createdAt: now, shared };
    set(`${listId}-custom`, items);
    return id;
  }

  /**
   * Toggle the shared flag on a custom item.
   * - share ON  → publish to the group: bump createdAt + clear any tombstone
   *   so the server treats it as a current item (works after a prior unshare).
   * - share OFF → retract from the group (tombstone) but KEEP it locally.
   * The item's check state is never affected — checks stay local, per device.
   */
  function toggleShareItem(listId, itemId) {
    const items = getCustomItems(listId);
    if (!items[itemId]) return null;
    const nowShared = !items[itemId].shared;
    items[itemId].shared = nowShared;
    const tombs = getCustomDeleted(listId);
    if (nowShared) {
      items[itemId].createdAt = Date.now();
      if (tombs[itemId]) { delete tombs[itemId]; set(`${listId}-custom-deleted`, tombs); }
    } else {
      tombs[itemId] = Date.now();
      set(`${listId}-custom-deleted`, tombs);
    }
    set(`${listId}-custom`, items);
    return items[itemId];
  }

  /**
   * Remove a custom item.
   */
  function deleteCustomItem(listId, itemId) {
    const items = getCustomItems(listId);
    delete items[itemId];
    set(`${listId}-custom`, items);
    // Also remove its check
    const checks = getChecks(listId);
    delete checks['custom-' + itemId];
    set(`${listId}-checks`, checks);
    // Record a tombstone so the deletion propagates and the item is not
    // resurrected by a later sync (server union or a stale device).
    const tombs = getCustomDeleted(listId);
    tombs[itemId] = Date.now();
    set(`${listId}-custom-deleted`, tombs);
  }

  /**
   * Get custom-item tombstones for a list: { itemId: deletedAt }.
   */
  function getCustomDeleted(listId) {
    return get(`${listId}-custom-deleted`, {});
  }

  /**
   * Get hidden item IDs (set).
   */
  function getHidden(listId) {
    return new Set(get(`${listId}-hidden`, []));
  }

  /**
   * Hide a built-in item.
   */
  function hideItem(listId, itemId) {
    const h = getHidden(listId);
    h.add(itemId);
    set(`${listId}-hidden`, [...h]);
  }

  /**
   * Restore a hidden item.
   */
  function restoreItem(listId, itemId) {
    const h = getHidden(listId);
    h.delete(itemId);
    set(`${listId}-hidden`, [...h]);
  }

  /**
   * Get last sync timestamp for a list.
   */
  function getLastSyncAt(listId) {
    return get(`${listId}-meta`, {}).lastSyncAt || 0;
  }

  /**
   * Update meta after sync.
   */
  function updateSyncMeta(listId, serverSyncAt) {
    const meta = get(`${listId}-meta`, {});
    meta.lastSyncAt = serverSyncAt;
    meta.deviceId = getDeviceId();
    set(`${listId}-meta`, meta);
  }

  /**
   * Reset a list completely.
   */
  function resetList(listId) {
    del(`${listId}-checks`);
    del(`${listId}-checks-dirty`);
    del(`${listId}-custom`);
    del(`${listId}-custom-deleted`);
    del(`${listId}-hidden`);
    // keep meta (lastSyncAt etc)
  }

  // ── Trip data ─────────────────────────────────────────────────────────────
  // Trip data is stored per trip id

  function getTripData(tripId) {
    return get(`tk-trip-${tripId}`, null);
  }

  function setTripData(tripId, data) {
    set(`tk-trip-${tripId}`, data);
  }

  function clearTripData(tripId) {
    localStorage.removeItem(`tk-trip-${tripId}`);
  }

  function getAllTripIds() {
    return get('tk-trips', []);
  }

  function registerTrip(tripId) {
    const trips = getAllTripIds();
    if (!trips.includes(tripId)) {
      trips.push(tripId);
      set('tk-trips', trips);
    }
  }

  /**
   * Reconcile local trip registry with a definitive server ID list.
   * Call ONLY after a successful GET /trips — never on network failure / null.
   * - Adds server trips missing locally
   * - Removes local orphans (gone from BE or no longer in ACL)
   * - Clears orphan payloads; keeps real trips when BE is unreachable (caller skips)
   * Empty array is valid (user has zero trips) and clears the registry.
   * @param {string[]} serverTripIds
   * @returns {{ kept: string[], removed: string[] }}
   */
  function reconcileTripsFromServer(serverTripIds) {
    if (!Array.isArray(serverTripIds)) {
      return { kept: getAllTripIds(), removed: [] };
    }
    const allowed = new Set(
      serverTripIds.filter((id) => typeof id === 'string' && id).map(String)
    );
    const local = getAllTripIds();
    const removed = [];
    local.forEach((id) => {
      if (!allowed.has(id)) {
        removed.push(id);
        clearTripData(id);
        del(`${id}-data-version`);
        del(`tk-seed-loaded-${id}`);
      }
    });
    const kept = local.filter((id) => allowed.has(id));
    allowed.forEach((id) => {
      if (!kept.includes(id)) kept.push(id);
    });
    set('tk-trips', kept);

    const cur = getCurrentTripId();
    if (cur && !allowed.has(cur)) {
      if (kept.length) setCurrentTripId(kept[0]);
      else del('tk-current-trip');
    }
    return { kept, removed };
  }

  // ── Seed management ───────────────────────────────────────────────────────

  function isSeedLoaded(tripId) {
    return get(`tk-seed-loaded-${tripId}`, false);
  }

  function markSeedLoaded(tripId) {
    set(`tk-seed-loaded-${tripId}`, true);
  }

  // ── Export helpers ────────────────────────────────────────────────────────

  /**
   * Export list state as JSON.
   */
  function exportList(listId) {
    return {
      _format: 'tripkit-list-v1',
      listId,
      checks: getChecks(listId),
      custom: getCustomItems(listId),
      hidden: [...getHidden(listId)],
      exportDate: new Date().toISOString(),
      deviceId: getDeviceId(),
    };
  }

  /**
   * Import list state from JSON.
   * Merges by updatedAt (newer wins).
   */
  function importList(listId, data) {
    if (!data || data._format !== 'tripkit-list-v1') {
      throw new Error('Format non reconnu (attendu: tripkit-list-v1)');
    }

    // Merge checks (per-item timestamp wins)
    if (data.checks) {
      Object.entries(data.checks).forEach(([itemId, state]) => {
        setCheck(listId, itemId, state.checked, state.updatedAt || 0);
      });
    }

    // Custom items: union (add any unknown ones)
    if (data.custom) {
      const existing = getCustomItems(listId);
      Object.entries(data.custom).forEach(([id, item]) => {
        if (!existing[id]) existing[id] = item;
      });
      set(`${listId}-custom`, existing);
    }

    // Hidden: replace
    if (data.hidden) {
      set(`${listId}-hidden`, data.hidden);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    // Device
    getDeviceId,
    // Raw
    get, set, del,
    // Trip
    getCurrentTripId, setCurrentTripId,
    getTripData, setTripData, clearTripData, getAllTripIds, registerTrip,
    reconcileTripsFromServer,
    // Seed
    isSeedLoaded, markSeedLoaded,
    // Lists
    getChecks, toggleCheck, setCheck, applyRemoteChecks,
    getDirtyCheckIds, getDirtyChecks, markCheckDirty, clearDirtyChecks,
    getCustomItems, addCustomItem, deleteCustomItem, toggleShareItem, getCustomDeleted,
    isListShared, setListShared, listType, rememberListType,
    getHidden, hideItem, restoreItem,
    getLastSyncAt, updateSyncMeta, getSyncState, setSyncState,
    resetList,
    exportList, importList,
  };
})();
;
/* ==== js/api.js ==== */
/**
 * api.js — Backend API client
 * RULE: ALL calls are fire-and-forget. The app NEVER waits for the backend.
 * Backend is PURELY optional — localStorage is always source of truth.
 */

var API = (() => {

  // ── Config ────────────────────────────────────────────────────────────────
  // Backend URL — set to null/empty to disable completely.
  // In dev: 'http://localhost:3001'
  // In prod: same origin (nginx proxy) or set via meta tag
  let BASE_URL = (function detectBase() {
    // 1. Runtime config (Docker envsubst via config.js)
    if (typeof TRIPKIT_CONFIG !== 'undefined' && TRIPKIT_CONFIG.apiUrl &&
        TRIPKIT_CONFIG.apiUrl !== '${API_URL}') {
      return TRIPKIT_CONFIG.apiUrl.replace(/\/$/, '');
    }
    // 2. Meta tag override
    const meta = document.querySelector('meta[name="api-url"]');
    if (meta) return meta.content.replace(/\/$/, '');
    // 3. Same origin fallback
    return window.location.origin;
  })();

  const API_PREFIX = (typeof TRIPKIT_CONFIG !== 'undefined' && TRIPKIT_CONFIG.apiPrefix !== undefined &&
                      TRIPKIT_CONFIG.apiPrefix !== '${API_PREFIX}')
    ? TRIPKIT_CONFIG.apiPrefix
    : '/api';
  let _token = null;
  /** Real backend reachability — not navigator.onLine (captive portal / flaky 4G). */
  let _reachable = null; // null=unknown, true/false
  const _reachListeners = [];
  let _probeInflight = null;

  function setToken(t) {
    _token = t;
    if (t) localStorage.setItem('tk-api-token', t);
    else localStorage.removeItem('tk-api-token');
  }
  function getToken()  { return _token || localStorage.getItem('tk-api-token'); }
  function clearToken() {
    _token = null;
    localStorage.removeItem('tk-api-token');
  }

  function url(path) {
    return `${BASE_URL}${API_PREFIX}${path}`;
  }

  function isReachable() { return _reachable === true; }
  function getReachability() { return _reachable; }

  function setReachable(ok) {
    const next = !!ok;
    if (_reachable === next) return;
    _reachable = next;
    _reachListeners.forEach(fn => {
      try { fn(next); } catch (e) { console.debug('[API] reach listener', e.message); }
    });
  }

  function onReachabilityChange(fn) {
    if (typeof fn === 'function') _reachListeners.push(fn);
    return () => {
      const i = _reachListeners.indexOf(fn);
      if (i >= 0) _reachListeners.splice(i, 1);
    };
  }

  /**
   * Probe real backend (/health). navigator.onLine alone is not enough.
   * @returns {Promise<boolean>}
   */
  async function probe() {
    if (!navigator.onLine) {
      setReachable(false);
      return false;
    }
    if (_probeInflight) return _probeInflight;
    _probeInflight = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/health`, {
          signal: AbortSignal.timeout(3000),
          cache: 'no-store',
        });
        const ok = !!(res && res.ok);
        setReachable(ok);
        return ok;
      } catch (_) {
        setReachable(false);
        return false;
      } finally {
        _probeInflight = null;
      }
    })();
    return _probeInflight;
  }

  // ── Core fetch (fire-and-forget safe) ─────────────────────────────────────

  /**
   * Non-blocking fetch. Returns a promise but callers may ignore it.
   * On any error: logs, returns null. NEVER throws to caller.
   *
   * On 401 with a stored Bearer token: drop the token and retry once without
   * Authorization so Authelia's Remote-User can authenticate the session.
   * Stale magic-link JWTs otherwise block the whole boot (infinite « Chargement… »).
   */
  async function safeFetch(path, options = {}, _retried = false) {
    const res = await request(path, options, _retried);
    return res.ok ? res.data : null;
  }

  /**
   * Same transport as safeFetch but keeps the outcome: { ok, status, data, error }.
   * Sync needs the reason (offline / 403 / 404) — a silent null is what let a
   * broken list sync go unnoticed for weeks.
   */
  async function request(path, options = {}, _retried = false) {
    // Device offline → skip. Device "online" is not enough; failures mark unreachable.
    if (!navigator.onLine) {
      return { ok: false, status: 0, data: null, error: 'offline' };
    }
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      };
      const res = await fetch(url(path), {
        ...options,
        headers,
        signal: AbortSignal.timeout(options.timeoutMs || 8000),
      });
      if (res.status === 401 && token && !_retried) {
        console.debug('[API] 401 with Bearer — clearing stale token, retry via Authelia:', path);
        clearToken();
        return request(path, options, true);
      }
      if (!res.ok) {
        console.debug('[API] non-OK:', res.status, path);
        // HTTP from our host ⇒ path exists; treat as reachable unless 0/network.
        if (res.status > 0) setReachable(true);
        return { ok: false, status: res.status, data: null, error: 'http' };
      }
      setReachable(true);
      return { ok: true, status: res.status, data: await res.json(), error: null };
    } catch (e) {
      // Network error, CORS, timeout — backend not really usable
      console.debug('[API] error:', e.message, path);
      setReachable(false);
      return { ok: false, status: 0, data: null, error: 'network' };
    }
  }

  // ── Trips ─────────────────────────────────────────────────────────────────

  async function getTrips() {
    return safeFetch('/trips');
  }

  async function getTrip(tripId) {
    return safeFetch(`/trips/${tripId}`);
  }

  async function createTrip(data) {
    return safeFetch('/trips', { method: 'POST', body: JSON.stringify(data) });
  }

  async function getMe() {
    return requestJSON('/me');
  }

  // ── Days ──────────────────────────────────────────────────────────────────

  async function getDays(tripId) {
    return safeFetch(`/trips/${tripId}/days`);
  }

  async function getDay(tripId, dayNum) {
    return safeFetch(`/trips/${tripId}/days/${dayNum}`);
  }

  // ── Hotels ────────────────────────────────────────────────────────────────

  async function getHotels(tripId) {
    return safeFetch(`/trips/${tripId}/hotels`);
  }

  // ── Lists ─────────────────────────────────────────────────────────────────

  async function getLists(tripId) {
    return safeFetch(`/trips/${tripId}/lists`);
  }

  async function getList(tripId, listId) {
    return safeFetch(`/trips/${tripId}/lists/${listId}`);
  }

  /**
   * Sync a list state with the backend.
   * Fire-and-forget: caller may ignore returned promise.
   * If server responds with merged state, applies it to localStorage.
   */
  const OUTBOX_KEY = 'tk-list-sync-outbox';

  function readOutbox() {
    try {
      const raw = localStorage.getItem(OUTBOX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }
  function writeOutbox(list) {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(list)); } catch (_) {}
  }
  function enqueueListSync(tripId, listId) {
    const box = readOutbox().filter(x => !(x.tripId === tripId && x.listId === listId));
    box.push({ tripId, listId, at: Date.now() });
    writeOutbox(box);
  }

  /** Human-readable reason, stored so the list header can show why sync failed. */
  function syncFailure(res) {
    if (res.error === 'offline' || res.error === 'network') {
      return { state: 'offline', at: Date.now(), status: res.status, message: 'Hors ligne — reprise auto' };
    }
    if (res.status === 403) {
      return { state: 'error', at: Date.now(), status: 403, message: 'Liste perso d’un autre compte (403)' };
    }
    if (res.status === 404) {
      return { state: 'error', at: Date.now(), status: 404, message: 'Liste absente du serveur (404)' };
    }
    if (res.status === 401) {
      return { state: 'error', at: Date.now(), status: 401, message: 'Session expirée — recharge l’app' };
    }
    return { state: 'error', at: Date.now(), status: res.status, message: 'Erreur serveur ' + res.status };
  }

  async function syncList(tripId, listId, opts) {
    const mode = (opts && opts.mode) === 'pull' ? 'pull' : 'push';
    const deviceId = Store.getDeviceId();
    const deletedCustom = Store.getCustomDeleted(listId);
    const listShared = Store.isListShared(listId);

    // packing (valise) is local by default: checks stay on this phone.
    // todo (avant-de-partir) is shared: checks + custom items sync.
    // Hidden stays local forever.
    // Pull: never send checks (avoid stale local LWW wiping peers).
    // Push: send only dirty checks, and only when the list is shared.
    const allCustom = Store.getCustomItems(listId);
    const sharedCustom = {};
    Object.entries(allCustom).forEach(([id, item]) => {
      if (item.shared) sharedCustom[id] = { text: item.text, section: item.section, createdAt: item.createdAt };
    });
    let checksPayload = {};
    let dirtyIds = [];
    if (listShared && mode === 'push') {
      dirtyIds = Store.getDirtyCheckIds(listId);
      checksPayload = Store.getDirtyChecks(listId);
    }

    const res = await request(`/trips/${tripId}/lists/${listId}/sync`, {
      method: 'PATCH',
      body: JSON.stringify({
        deviceId,
        custom: sharedCustom,
        deletedCustom,
        checks: checksPayload,
      }),
    });

    if (!res.ok) {
      const failure = syncFailure(res);
      Store.setSyncState(listId, failure);
      enqueueListSync(tripId, listId);
      return { ok: false, changed: false, status: res.status, message: failure.message };
    }
    const result = res.data || {};
    // Drop this pair from outbox on success
    writeOutbox(readOutbox().filter(x => !(x.tripId === tripId && x.listId === listId)));
    // Reconcile shared customs + checks
    // (server LWW by updatedAt, checked wins on tie — same as Store.setCheck).
    let changed = false;
    if (result.merged) {
      const serverShared = result.merged.custom || {};
      const tombstones = Store.getCustomDeleted(listId);
      const cur = Store.getCustomItems(listId);

      Object.entries(serverShared).forEach(([id, item]) => {
        if (!cur[id] && !tombstones[id]) {
          cur[id] = { ...item, shared: true };
          changed = true;
        }
      });

      Object.entries(cur).forEach(([id, item]) => {
        if (item.shared && !serverShared[id]) {
          // a peer deleted/retracted this shared item → remove our copy
          delete cur[id];
          changed = true;
        }
      });

      if (changed) Store.set(`${listId}-custom`, cur);

      if (listShared && result.merged.checks && Store.applyRemoteChecks(listId, result.merged.checks)) {
        changed = true;
      }
    }

    if (listShared && mode === 'push' && dirtyIds.length) {
      Store.clearDirtyChecks(listId, dirtyIds);
    }

    if (result.serverSyncAt) {
      Store.updateSyncMeta(listId, result.serverSyncAt);
    }
    Store.setSyncState(listId, { state: 'ok', at: Date.now(), status: 200, message: '' });
    return { ok: true, changed, status: 200, message: '' };
  }

  /**
   * Background sync all lists for a trip (called on app startup if online).
   */
  function backgroundSyncTrip(tripId) {
    // Disabled full-trip sync (race with UI). Flush pending list outbox only
    // when the backend is actually reachable.
    flushOutbox();
  }

  /** Retry queued list syncs after a successful probe. */
  async function flushOutbox() {
    if (!navigator.onLine) return;
    const ok = _reachable === true ? true : await probe();
    if (!ok) return;
    const box = readOutbox();
    if (!box.length) return;
    for (const item of box.slice()) {
      try {
        await syncList(item.tripId, item.listId);
      } catch (e) {
        console.debug('[API] outbox flush failed', e.message);
      }
    }
  }

  // ── Version check (lightweight, 3s timeout) ──────────────────────────────

  /**
   * Check data version (~50 bytes response, 3s hard cutoff).
   * Returns {version, updated_at} or null if unreachable/slow/offline.
   */
  async function checkVersion(tripId) {
    // Same 401→clear-token→retry behaviour as safeFetch (stale magic-link JWT).
    return safeFetch(`/trips/${tripId}/version`);
  }

  // ── Seed / full data from backend ─────────────────────────────────────────

  /**
   * Fetch full trip seed data (only when version changed).
   * Returns null if backend unavailable.
   */
  async function fetchSeed(tripId) {
    return safeFetch(`/trips/${tripId}/seed`);
  }

  // ── Explicit request (publish / jobs — keeps status + body) ───────────────

  /**
   * Fetch JSON and preserve HTTP status/errors (unlike safeFetch).
   * @returns {{ ok: boolean, status: number, data: any, error?: string }}
   */
  async function requestJSON(path, options = {}, _retried = false) {
    if (!navigator.onLine) {
      return { ok: false, status: 0, data: null, error: 'offline' };
    }
    // timeoutMs / signal are ours — do not pass timeoutMs through to fetch().
    const { timeoutMs, headers: optHeaders, signal: userSignal, ...fetchOpts } = options;
    const ms = typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : 15000;
    const timeoutSignal = AbortSignal.timeout(ms);
    let signal = timeoutSignal;
    if (userSignal) {
      if (typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([userSignal, timeoutSignal]);
      } else {
        const ac = new AbortController();
        const abortBoth = () => { try { ac.abort(); } catch (_) {} };
        userSignal.addEventListener('abort', abortBoth, { once: true });
        timeoutSignal.addEventListener('abort', abortBoth, { once: true });
        if (userSignal.aborted || timeoutSignal.aborted) abortBoth();
        signal = ac.signal;
      }
    }
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...optHeaders,
      };
      const res = await fetch(url(path), {
        ...fetchOpts,
        headers,
        signal,
      });
      if (res.status === 401 && token && !_retried) {
        clearToken();
        return requestJSON(path, options, true);
      }
      let data = null;
      const text = await res.text();
      if (text) {
        try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
      }
      if (!res.ok) {
        if (res.status > 0) setReachable(true);
        let errMsg = '';
        if (data) {
          if (typeof data.error === 'string') errMsg = data.error;
          else if (data.error && typeof data.error === 'object') {
            errMsg = data.error.message || data.error.msg || '';
          }
          if (!errMsg && typeof data.code === 'string') errMsg = data.code;
          if (!errMsg && typeof data.raw === 'string') errMsg = data.raw.slice(0, 200);
        }
        if (!errMsg) errMsg = res.statusText || (res.status ? `HTTP ${res.status}` : 'request failed');
        // Proxy HTML pages are useless as error strings (Leo chat, etc.).
        if (/^\s*<(!DOCTYPE|html)\b/i.test(errMsg) || /<!DOCTYPE|<html[\s>]/i.test(errMsg)) {
          errMsg = res.status ? `HTTP ${res.status} (réponse HTML proxy)` : 'réponse HTML proxy';
        }
        return {
          ok: false,
          status: res.status,
          data,
          error: errMsg,
        };
      }
      setReachable(true);
      return { ok: true, status: res.status, data };
    } catch (e) {
      setReachable(false);
      const name = e && e.name;
      const msg = (e && e.message) || '';
      // AbortSignal.timeout / user cancel / Safari « Load failed » / Chrome « Failed to fetch »
      if (name === 'AbortError' || name === 'TimeoutError'
          || /aborted|timeout|timed out|load failed|failed to fetch|networkerror/i.test(msg)) {
        const userCancel = !!(userSignal && userSignal.aborted);
        const isTimeout = !userCancel && (
          name === 'TimeoutError'
          || /timeout|timed out/i.test(msg)
          || (name === 'AbortError' && timeoutSignal.aborted)
          || name === 'AbortError'
        );
        const code = userCancel ? 'cancelled' : (isTimeout ? 'timeout' : 'network');
        return {
          ok: false,
          status: 0,
          data: { code },
          error: code,
        };
      }
      return { ok: false, status: 0, data: null, error: msg || 'network' };
    }
  }

  /**
   * Version check that preserves HTTP status (for 403/404 rediscovery).
   * @returns {{ ok: boolean, status: number, data: any }}
   */
  async function checkVersionStatus(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/version`, { timeoutMs: 4000 });
  }

  async function getPublishSources() {
    return requestJSON('/publish/sources');
  }

  async function createPublishJob(body) {
    return requestJSON('/publish/jobs', {
      method: 'POST',
      body: JSON.stringify(body || {}),
    });
  }

  async function getPublishJob(jobId) {
    return requestJSON(`/publish/jobs/${encodeURIComponent(jobId)}`);
  }

  async function getLeoStatus() {
    return requestJSON('/leo/status');
  }

  async function leoChat(body = {}) {
    // Plus chat = short asks. Fail well under Cloudflare (~100s).
    // Optional body.signal (AbortController) for UI cancel.
    const { signal, ...payload } = body || {};
    return requestJSON('/leo/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 45000,
      ...(signal ? { signal } : {}),
    });
  }

  /**
   * Safari iOS reports a dropped fetch/SSE as TypeError « Load failed ».
   * Never show that raw string in the Plus chat bubbles.
   */
  function netFailMessage(e, aborted) {
    if (aborted) return 'Annulé.';
    const msg = (e && e.message) || '';
    const name = e && e.name;
    if (name === 'AbortError' || name === 'TimeoutError'
        || /aborted|timeout|timed out|load failed|failed to fetch|networkerror/i.test(msg)) {
      return 'Connexion coupée. Réessaie.';
    }
    return msg || 'stream interrompu';
  }

  /**
   * Shared SSE chat stream reader (Leo / Plus Assistant).
   * @param {string} path API path under /api
   * @param {object} body
   * @param {string} failCode default error code when HTTP fails
   * @param {string} [method='POST']
   */
  async function* chatSSE(path, body = {}, failCode = 'chat_failed', method = 'POST') {
    if (!navigator.onLine) {
      yield { event: 'error', data: { code: 'network', error: 'offline' } };
      return;
    }
    const { signal, ...payload } = body || {};
    const token = getToken();
    const headers = {
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const verb = method || 'POST';
    if (verb !== 'GET' && verb !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
    }
    let res;
    try {
      const init = { method: verb, headers, signal };
      if (verb !== 'GET' && verb !== 'HEAD') {
        init.body = JSON.stringify(payload);
      }
      res = await fetch(url(path), init);
    } catch (e) {
      const cancelled = !!(signal && signal.aborted);
      yield {
        event: 'error',
        data: {
          code: cancelled ? 'cancelled' : ((e && e.name) === 'AbortError' ? 'timeout' : 'network'),
          error: netFailMessage(e, cancelled),
        },
      };
      return;
    }
    if (!res.ok) {
      let data = null;
      try { data = await res.json(); } catch (_) {}
      yield {
        event: 'error',
        data: {
          code: (data && data.code) || failCode,
          error: (data && data.error) || `HTTP ${res.status}`,
        },
      };
      return;
    }
    setReachable(true);
    if (!res.body || !res.body.getReader) {
      yield { event: 'error', data: { code: failCode, error: 'Streaming non supporté' } };
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let eventName = '';
    let dataLines = [];

    const flush = function* () {
      if (!dataLines.length) { eventName = ''; return; }
      const raw = dataLines.join('\n');
      dataLines = [];
      const ev = eventName || 'message';
      eventName = '';
      let data = raw;
      try { data = JSON.parse(raw); } catch (_) {}
      yield { event: ev, data };
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n');
        buf = parts.pop() || '';
        for (const line of parts) {
          if (line === '') {
            yield* flush();
            continue;
          }
          if (line.startsWith(':')) continue;
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
            continue;
          }
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          }
        }
      }
      yield* flush();
    } catch (e) {
      const cancelled = !!(signal && signal.aborted);
      yield {
        event: 'error',
        data: {
          code: cancelled ? 'cancelled' : 'network',
          error: netFailMessage(e, cancelled),
        },
      };
    }
  }

  /**
   * Stream Leo chat (SSE). Yields { event, data } objects.
   * Events: delta | tool | done | error
   * @param {{ tripId?: string, messages: Array<{role:string,content:string}>, model?: string, signal?: AbortSignal }} body
   */
  async function* leoChatStream(body = {}) {
    yield* chatSSE('/leo/chat/stream', body, 'leo_chat_failed');
  }

  /**
   * Reconnect to a detached Léo job (catch-up after `after` + live).
   * @param {string} jobId
   * @param {number} [after=0]
   * @param {{ signal?: AbortSignal }} [extra]
   */
  async function* leoJobStream(jobId, after = 0, extra = {}) {
    const { signal } = extra || {};
    const q = `after=${encodeURIComponent(String(Number(after) || 0))}`;
    yield* chatSSE(
      `/leo/jobs/${encodeURIComponent(jobId)}/stream?${q}`,
      { signal },
      'leo_chat_failed',
      'GET',
    );
  }

  async function cancelLeoJob(jobId) {
    return requestJSON(`/leo/jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: 'POST',
      body: '{}',
    });
  }

  async function getPlusChatStatus() {
    return requestJSON('/plus/chat/status');
  }

  async function getPolarstepsStatus(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/polarsteps/status`);
  }

  async function getPolarstepsCaption(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/polarsteps/caption`);
  }

  async function postPolarstepsCaption(tripId, body = {}) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/polarsteps/caption`, {
      method: 'POST',
      body: JSON.stringify(body || {}),
      timeoutMs: 15000,
    });
  }

  async function getDiscoveryThemes(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/discovery/themes`);
  }

  async function getDiscoveryResults(tripId, opts = {}) {
    const q = [];
    if (opts.dayNum != null) q.push(`dayNum=${encodeURIComponent(String(opts.dayNum))}`);
    if (opts.locationId) q.push(`locationId=${encodeURIComponent(opts.locationId)}`);
    if (opts.fromLoc) q.push(`fromLoc=${encodeURIComponent(opts.fromLoc)}`);
    if (opts.toLoc) q.push(`toLoc=${encodeURIComponent(opts.toLoc)}`);
    if (opts.dateISO) q.push(`dateISO=${encodeURIComponent(opts.dateISO)}`);
    if (opts.themes) q.push(`themes=${encodeURIComponent(opts.themes)}`);
    const qs = q.length ? `?${q.join('&')}` : '';
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/discovery/results${qs}`);
  }

  async function postDiscoverySearch(tripId, body = {}) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/discovery/search`, {
      method: 'POST',
      body: JSON.stringify(body || {}),
      timeoutMs: 20000,
    });
  }

  async function retainDiscoveryItem(tripId, item) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/discovery/retain`, {
      method: 'POST',
      body: JSON.stringify({ item }),
      timeoutMs: 15000,
    });
  }

  // ── Construction ─────────────────────────────────────────────────────────

  async function getTravelProfile(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/travel-profile`);
  }

  async function getConstruction(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/construction`);
  }

  async function transitionPhase(tripId, phase, force) {
    const qs = force ? '?force=1' : '';
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/construction/phase${qs}`, {
      method: 'PUT',
      body: JSON.stringify({ phase }),
    });
  }

  async function createProfileRequest(tripId, target, text) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/travel-profile/request`, {
      method: 'POST',
      body: JSON.stringify({ target, text }),
    });
  }

  async function runQA(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/construction/qa`, {
      method: 'POST',
      body: '{}',
      timeoutMs: 30000,
    });
  }

  async function getQA(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/construction/qa`, {
      timeoutMs: 15000,
    });
  }

  // 60 s : admin et santé incluent un appel Bifrost (SPEC §7), et le client
  // Go Bifrost lui-même autorise jusqu'à 60 s. 30 s coupait le flux avant la
  // prose. Nuisances : POST 15 s (202 jobId), Overpass tourne dans leo.Hub.
  async function runAdminCheck(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/admin-check`, {
      method: 'POST',
      body: '{}',
      timeoutMs: 60000,
    });
  }

  async function runHealthCheck(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/health-check`, {
      method: 'POST',
      body: '{}',
      timeoutMs: 60000,
    });
  }

  async function runNuisanceCheck(tripId, locationIds) {
    const body = locationIds ? { locationIds } : { all: true };
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/nuisance-check`, {
      method: 'POST',
      body: JSON.stringify(body),
      timeoutMs: 15000,
    });
  }

  async function getNuisanceCheck(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/nuisance-check`);
  }

  async function pinNuisanceToSeed(tripId) {
    return requestJSON(`/trips/${encodeURIComponent(tripId)}/nuisance-check/pin`, {
      method: 'POST',
      body: '{}',
      timeoutMs: 15000,
    });
  }

  /**
   * Stream Plus Assistant (Bifrost direct). Events: delta | done | error
   * @param {{ tripId?: string, messages: Array<{role:string,content:string}>, signal?: AbortSignal }} body
   */
  async function* plusChatStream(body = {}) {
    yield* chatSSE('/plus/chat/stream', body, 'plus_chat_failed');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Build asset URL for a trip.
   * @param {string} tripId
   * @param {string} filename
   * @returns {string}
   */
  function assetUrl(tripId, filename) {
    return url(`/trips/${tripId}/assets/${filename}`);
  }

  /**
   * Prefetch trip assets into the SW cache while online so Jour/Route
   * keep maps & day-route images when the network drops.
   * Fire-and-forget; failures are ignored.
   */
  function warmTripAssets(tripId, tripData) {
    if (!navigator.onLine || !tripId || !tripData) return;
    const names = new Set();
    const trip = tripData.trip || {};
    ['mapImage', 'mapHtml'].forEach((k) => {
      const v = trip[k];
      if (v && typeof v === 'string' && !v.startsWith('http') && !v.startsWith('data:')) {
        names.add(v);
      }
    });
    (tripData.days || []).forEach((d) => {
      if (!d || d.routeImage === false) return;
      const n = Number(d.day);
      if (!Number.isFinite(n)) return;
      names.add(`day-${String(n).padStart(2, '0')}-route.jpg`);
    });
    names.forEach((filename) => {
      const href = assetUrl(tripId, filename);
      fetch(href, { credentials: 'same-origin' }).catch(() => {});
    });
  }

  /** Backend base URL (without /api prefix). */
  function getBaseUrl() { return BASE_URL; }

  return {
    setToken, getToken, clearToken, url,
    getTrips, getTrip, createTrip, getMe,
    getDays, getDay,
    getHotels,
    getLists, getList, syncList, backgroundSyncTrip, flushOutbox,
    checkVersion, checkVersionStatus, fetchSeed,
    requestJSON, getPublishSources, createPublishJob, getPublishJob,
    getLeoStatus, leoChat, leoChatStream, leoJobStream, cancelLeoJob, netFailMessage,
    getPlusChatStatus, plusChatStream,
    getPolarstepsStatus, getPolarstepsCaption, postPolarstepsCaption,
    getDiscoveryThemes, getDiscoveryResults, postDiscoverySearch,
    retainDiscoveryItem, pinNuisanceToSeed,
    getTravelProfile, getConstruction, transitionPhase, createProfileRequest,
    runQA, getQA, runAdminCheck, runHealthCheck, runNuisanceCheck, getNuisanceCheck,
    assetUrl, getBaseUrl, warmTripAssets,
    probe, isReachable, getReachability, onReachabilityChange,
  };
})();
;
/* ==== js/seed-merge.js ==== */
/**
 * seed-merge.js — Single source of truth for "backend seed payload → tripData".
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * This mapping used to be copy-pasted in two places: App.refreshTripData() and
 * TripSelector.select(). The copies drifted: when `mapHtml` / `meteoHtml` were
 * added (v2.27.33) only app.js was updated. TripSelector.select() purges the
 * cached trip data and then rebuilds trip meta from its own field list, so
 * selecting a trip silently DROPPED mapHtml/meteoHtml — the interactive Leaflet
 * map and the météo table vanished from the Itinéraire tab and never came back
 * (App.refreshTripData short-circuits while the data version is unchanged).
 *
 * Any trip-level field stored in `trip.data` must be declared in
 * TRIP_META_FIELDS below. There is now exactly one list to keep in sync.
 */

var SeedMerge = (() => {

  /**
   * Trip-level fields carried inside the backend's `trip.data` JSON blob.
   * The backend model only has id/name/emoji/start_date/end_date as columns —
   * everything else round-trips through `data`.
   */
  const TRIP_META_FIELDS = [
    'travelers',
    'phases',
    'mapImage',    // static route image (backend asset or URL)
    'mapHtml',     // interactive map iframe (backend asset filename)
    'meteoHtml',   // météo iframe (backend asset filename)
    'routeUrl',    // full trip route on Google Maps
    'users',
    'sharedLinks',
    'homeTz',      // IANA home TZ for timeline dual times (default Europe/Paris)
    'polarsteps',  // { enabled, tripUrl? } — Plus Polarsteps box
    'construction', // { phase, dates? } — onglet Construction à jour au chargement
    'travelProfile', // overlay Publish (travel-profile.js)
  ];

  /** Top-level tripData collections carried in trip.data (see seed-import.cjs). */
  const TRIP_DATA_COLLECTIONS = [
    'restaurants', 'culture', 'locations', 'hotels',
    'flights', 'carRental', 'ferry', 'ferries', 'events',
    'activities',
    'people', // person fiches (from people.js) for travelers on this trip
  ];

  function parseMaybeJson(raw, fallback) {
    if (raw === undefined || raw === null) return fallback;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  /**
   * Merge a backend seed payload into a tripData object.
   *
   * @param {Object} seed — { trip, days[], hotels[], lists[] } from GET /trips/:id/seed
   * @param {Object} [existing] — tripData to merge into (pass {} for a clean rebuild)
   * @returns {Object} tripData — { trip, days[], hotels{}, locations{}, restaurants, culture, lists{} }
   */
  function merge(seed, existing) {
    const tripData = existing || {};
    if (!seed) return tripData;

    // ── Days: backend stores each day as { day_num, data: {...} } ────────────
    if (seed.days && seed.days.length) {
      tripData.days = seed.days
        .map(d => parseMaybeJson(d.data, d) || d)
        .filter(d => d.label && d.label !== '_deleted')
        .sort((a, b) => (a.day || 0) - (b.day || 0));
    }

    // ── Trip metadata ────────────────────────────────────────────────────────
    if (seed.trip) {
      const t = seed.trip;
      const extra = parseMaybeJson(t.data, {}) || {};
      const prev = tripData.trip || {};

      const meta = {
        id: t.id,
        name: t.name,
        emoji: t.emoji,
        startDate: t.start_date || extra.startDate,
        endDate: t.end_date || extra.endDate,
      };
      TRIP_META_FIELDS.forEach(f => { meta[f] = extra[f] !== undefined ? extra[f] : prev[f]; });
      tripData.trip = meta;

      // Collections that may travel inside trip.data (top-level on tripData,
      // NOT on trip — same pattern as hotels/restaurants). Must stay in sync
      // with seed-import.cjs or BookingsView loses ferry/events/flights.
      ['restaurants', 'culture', 'locations', 'flights', 'carRental', 'ferry', 'ferries', 'events', 'people'].forEach(key => {
        if (extra[key] !== undefined) tripData[key] = extra[key];
      });
      if (extra.hotels) {
        // Normalize array format [{id, ...}] to dict {id: {...}} for HotelCard.fromDay()
        if (Array.isArray(extra.hotels)) {
          const dict = {};
          extra.hotels.forEach(h => { if (h.id) dict[h.id] = h; });
          tripData.hotels = dict;
        } else {
          tripData.hotels = extra.hotels;
        }
      }
    }

    // ── Hotels: merge into days by day_num ───────────────────────────────────
    // Legacy path: hotel rows can carry wifi/etc. onto the day.
    // NEVER attach a hotel onto a day without hotelId (J0 = maison) — stale
    // hotels.day_num=0 would otherwise force Montréal onto the packing day.
    if (seed.hotels && seed.hotels.length) {
      seed.hotels.forEach(h => {
        const hData = parseMaybeJson(h.data, {}) || {};
        const day = tripData.days && tripData.days.find(d => d.day === h.day_num);
        if (!day || !day.hotelId) return;
        if (hData.hotelId && hData.hotelId !== day.hotelId) return;
        Object.assign(day, hData);
      });
    }

    // ── Lists: backend lists override seed lists (structure, not check state) ─
    if (seed.lists && seed.lists.length) {
      tripData.lists = tripData.lists || {};
      seed.lists.forEach(l => {
        const lData = parseMaybeJson(l.data, {}) || {};
        tripData.lists[l.id] = { id: l.id, type: l.type, title: l.title, ...lData };
      });
    }

    return tripData;
  }

  return { merge, TRIP_META_FIELDS, TRIP_DATA_COLLECTIONS };
})();
;
/* ==== js/day-helpers.js ==== */
/**
 * day-helpers.js — Resolve computed fields for days
 *
 * Days in the seed are normalized:
 * - No date/dow (computed from trip.startDate + (day.day - 1); Day 0 = startDate-1)
 * - No geo (resolved from locations[locationId])
 * - No inline culture (top-level culture[] is source of truth)
 * - No inline hotel fields (resolved from hotels[hotelId])
 *
 * This module enriches a raw day with computed fields for rendering.
 */

var DayHelpers = (() => {

  const DOWS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const MONTHS = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];

  /**
   * Enrich a raw day object with computed fields.
   * Returns a NEW object (does not mutate the original).
   *
   * @param {Object} day — raw day from tripData.days
   * @param {Object} tripData — full trip data (for locations, hotels, trip meta)
   * @returns {Object} enriched day with .date, .dow, .geo resolved
   */
  function enrich(day, tripData) {
    if (!day) return day;

    const enriched = Object.assign({}, day);
    const trip = tripData.trip || {};

    // ── Compute date + dow from trip.startDate ──
    // startDate = Day 1 (first travel day). Day 0 = startDate - 1 (veille).
    // Formula: date = startDate + (day - 1)
    if (!enriched.date && trip.startDate) {
      const start = new Date(trip.startDate + 'T12:00:00Z');
      const d = new Date(start.getTime() + ((day.day || 0) - 1) * 86400000);
      enriched.dow = DOWS[d.getUTCDay()];
      enriched.date = d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
      enriched._isoDate = d.toISOString().split('T')[0];
    }

    // ── Resolve locationId → geo ──
    if (!enriched.geo && enriched.locationId && tripData.locations) {
      enriched.geo = tripData.locations[enriched.locationId] || null;
    }

    return enriched;
  }

  /**
   * Compute ISO date string for a day.
   * @param {Object} day
   * @param {Object} trip — { startDate }
   * @returns {string} "2026-04-17"
   */
  function isoDate(day, trip) {
    if (!trip || !trip.startDate) return '';
    const start = new Date(trip.startDate + 'T12:00:00Z');
    const d = new Date(start.getTime() + ((day.day || 0) - 1) * 86400000);
    return d.toISOString().split('T')[0];
  }

  return { enrich, isoDate };
})();
;
/* ==== js/tz-helpers.js ==== */
/**
 * tz-helpers.js — Local airport time → home (Nice) reference time
 *
 * Contract:
 *   - timeline[].t  = local time at the event (airport / city)
 *   - timeline[].tz = IANA zone of that local time (required for dual display)
 *   - timeline[].date (optional) = local calendar date YYYY-MM-DD when ≠ day date
 *   - trip.homeTz   = fixed reference zone (default Europe/Paris = Nice)
 *
 * Primary column stays local. Secondary shows home time only when it differs.
 */

var TzHelpers = (() => {

  const DEFAULT_HOME_TZ = 'Europe/Paris';

  const HOME_FLAGS = {
    'Europe/Paris': '🇫🇷',
    'Europe/Zurich': '🇨🇭',
    'America/Toronto': '🇨🇦',
    'America/New_York': '🇺🇸',
    'America/Los_Angeles': '🇺🇸',
    'America/Denver': '🇺🇸',
    'America/Phoenix': '🇺🇸',
    'Europe/Malta': '🇲🇹',
    'Europe/Madrid': '🇪🇸',
    'Atlantic/Canary': '🇪🇸',
  };

  function homeTz(trip) {
    const tz = trip && trip.homeTz;
    return (tz && String(tz).trim()) || DEFAULT_HOME_TZ;
  }

  function homeFlag(tz) {
    return HOME_FLAGS[tz] || '🏠';
  }

  /** Parse "HH:MM" or "H:MM" — null if not a clock time (emoji / text). */
  function parseHm(t) {
    const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hh = +m[1];
    const mm = +m[2];
    if (hh > 23 || mm > 59) return null;
    return { hh, mm, label: (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm };
  }

  function getTimeZoneOffsetMs(timeZone, date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);
    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const hour = (+map.hour === 24) ? 0 : +map.hour;
    const asUTC = Date.UTC(+map.year, +map.month - 1, +map.day, hour, +map.minute, +map.second);
    return asUTC - date.getTime();
  }

  /** Instant (UTC Date) for a wall-clock time in `tz`. */
  function localToUtc(ymd, hm, tz) {
    const parsed = parseHm(hm);
    if (!parsed || !ymd || !tz) return null;
    const [y, mo, d] = String(ymd).split('-').map(Number);
    if (!y || !mo || !d) return null;
    let utcMs = Date.UTC(y, mo - 1, d, parsed.hh, parsed.mm, 0);
    for (let i = 0; i < 4; i++) {
      const offset = getTimeZoneOffsetMs(tz, new Date(utcMs));
      utcMs = Date.UTC(y, mo - 1, d, parsed.hh, parsed.mm, 0) - offset;
    }
    return new Date(utcMs);
  }

  function formatInTz(date, tz) {
    if (!date || !tz) return null;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const hour = (map.hour === '24') ? '00' : map.hour;
    return {
      ymd: map.year + '-' + map.month + '-' + map.day,
      hm: hour + ':' + map.minute,
    };
  }

  /**
   * Secondary home-time label, or null if not useful.
   * @returns {{ text: string, hm: string, dayDelta: number }|null}
   */
  function homeTimeLabel(opts) {
    const localT = opts && opts.t;
    const eventTz = opts && opts.tz;
    const localDate = opts && opts.date;
    const home = (opts && opts.homeTz) || DEFAULT_HOME_TZ;
    if (!eventTz || !localDate) return null;
    if (eventTz === home) return null;

    const parsed = parseHm(localT);
    if (!parsed) return null;

    const utc = localToUtc(localDate, parsed.label, eventTz);
    if (!utc || isNaN(utc.getTime())) return null;
    const homeParts = formatInTz(utc, home);
    if (!homeParts) return null;

    // Same clock in home zone (e.g. Paris ↔ Zurich in summer) → no clutter
    if (homeParts.hm === parsed.label && homeParts.ymd === localDate) return null;

    let dayDelta = 0;
    if (homeParts.ymd > localDate) dayDelta = 1;
    else if (homeParts.ymd < localDate) dayDelta = -1;
    // Compare calendar days properly when localDate is event-local and home ymd differs
    if (homeParts.ymd !== localDate) {
      const a = new Date(localDate + 'T12:00:00Z').getTime();
      const b = new Date(homeParts.ymd + 'T12:00:00Z').getTime();
      dayDelta = Math.round((b - a) / 86400000);
    }

    const flag = homeFlag(home);
    const suffix = dayDelta > 0 ? '+' + dayDelta : (dayDelta < 0 ? String(dayDelta) : '');
    const text = homeParts.hm + (suffix ? suffix : '') + ' ' + flag;
    return { text, hm: homeParts.hm, dayDelta, ymd: homeParts.ymd };
  }

  return {
    DEFAULT_HOME_TZ,
    homeTz,
    homeFlag,
    parseHm,
    localToUtc,
    formatInTz,
    homeTimeLabel,
  };
})();
;
/* ==== js/people-helpers.js ==== */
/**
 * people-helpers.js — Resolve trip.travelers[{personId}] → people{} fiches
 *
 * people lives in trip.data (injected by seed-import from people.js of the
 * same seed repo). Travelers keep trip-only fields (role, leaveDate).
 */

var PeopleHelpers = (() => {

  function peopleMap(tripData) {
    if (!tripData) return {};
    if (tripData.people && typeof tripData.people === 'object') return tripData.people;
    if (tripData.trip && tripData.trip.people && typeof tripData.trip.people === 'object') {
      return tripData.trip.people;
    }
    return {};
  }

  /** Display name for a traveler ref (personId or legacy name). */
  function displayName(traveler, people) {
    if (!traveler) return '?';
    const map = people || {};
    if (traveler.personId && map[traveler.personId]) {
      return map[traveler.personId].name || traveler.personId;
    }
    return traveler.name || traveler.personId || '?';
  }

  function displayEmoji(traveler, people) {
    if (!traveler) return '';
    const map = people || {};
    if (traveler.personId && map[traveler.personId] && map[traveler.personId].emoji) {
      return map[traveler.personId].emoji;
    }
    return traveler.emoji || '';
  }

  /** Resolve full person record + trip overlays for one traveler. */
  function resolve(traveler, people) {
    if (!traveler) return null;
    const map = people || {};
    const base = (traveler.personId && map[traveler.personId])
      ? Object.assign({}, map[traveler.personId])
      : { name: traveler.name, emoji: traveler.emoji };
    return Object.assign(base, {
      personId: traveler.personId || base.id || null,
      role: traveler.role,
      leaveDate: traveler.leaveDate,
      note: traveler.note || base.note,
    });
  }

  /** Travelers of the trip, resolved against people map. */
  function tripPeople(tripData) {
    const map = peopleMap(tripData);
    const travelers = (tripData && tripData.trip && tripData.trip.travelers) || [];
    return travelers.map(t => resolve(t, map)).filter(Boolean);
  }

  /** People on this trip that have at least one document. */
  function withDocuments(tripData) {
    return tripPeople(tripData).filter(p => Array.isArray(p.documents) && p.documents.length > 0);
  }

  return {
    peopleMap,
    displayName,
    displayEmoji,
    resolve,
    tripPeople,
    withDocuments,
  };
})();
;
/* ==== js/day-resolver.js ==== */
/**
 * day-resolver.js — Determines which day to show on app load
 *
 * Logic:
 * 1. If user manually navigated → use their last position (localStorage)
 * 2. During trip → auto-navigate to today's day
 * 3. Before trip → Day 0 (or user's startDay if late joiner)
 * 4. After trip → last day
 * 5. User personalization: skipDays, startDay
 *
 * All computed from trip.startDate — zero hardcoded dates.
 */

var DayResolver = (() => {

  /**
   * Get the default day index to display.
   * @param {Object} tripData — { trip, days[] }
   * @param {Object} [opts] — { userId?, ignoreManual?, nowOverride? }
   * @returns {number} 0-based index into tripData.days[]
   */
  function getDefaultDayIndex(tripData, opts) {
    if (!tripData || !tripData.days || !tripData.days.length) return 0;
    opts = opts || {};

    const days = tripData.days;
    const trip = tripData.trip || {};
    const userId = opts.userId || null;
    const userCfg = userId && trip.users ? trip.users[userId] : null;

    // Check localStorage for manual position
    if (!opts.ignoreManual) {
      const stored = Store.get(trip.id + '-current-day');
      if (stored !== null) {
        const idx = days.findIndex(d => d.day === Number(stored));
        if (idx >= 0) return idx;
      }
    }

    // Compute today's trip day from startDate
    if (!trip.startDate) return 0;

    const now = opts.nowOverride || new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(trip.startDate + 'T00:00:00');
    const tripDay = Math.floor((today - start) / 86400000) + 1; // +1: startDate = Day 1, Day 0 = startDate-1

    // Before trip
    if (tripDay < 0) {
      // Late joiner? Jump to their start day
      if (userCfg && userCfg.startDay != null) {
        const idx = days.findIndex(d => d.day === userCfg.startDay);
        if (idx >= 0) return idx;
      }
      return 0;
    }

    // After trip
    if (tripDay >= days.length) {
      return days.length - 1;
    }

    // During trip — find today's day
    const idx = days.findIndex(d => d.day === tripDay);
    return idx >= 0 ? idx : 0;
  }

  /**
   * Filter days based on user config (skipDays).
   * Returns a new array (does not mutate).
   * @param {Array} days
   * @param {Object} userCfg — { skipDays?: number[] }
   * @returns {Array}
   */
  function filterDays(days, userCfg) {
    if (!userCfg || !userCfg.skipDays || !userCfg.skipDays.length) return days;
    return days.filter(d => !userCfg.skipDays.includes(d.day));
  }

  /**
   * Get countdown info (before trip).
   * @param {Object} trip — { startDate }
   * @returns {{ days: number, hours: number, active: boolean } | null}
   */
  function getCountdown(trip, nowOverride) {
    if (!trip || !trip.startDate) return null;
    const now = nowOverride || new Date();
    const start = new Date(trip.startDate + 'T00:00:00');
    const diff = start - now;
    if (diff <= 0) return { days: 0, hours: 0, active: false };
    return {
      days: Math.ceil(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      active: true,
    };
  }

  /**
   * Check trip temporal state.
   * @param {Object} trip
   * @returns {"before" | "during" | "after"}
   */
  function tripState(trip, nowOverride) {
    if (!trip || !trip.startDate || !trip.endDate) return 'before';
    const now = nowOverride || new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(trip.startDate + 'T00:00:00');
    const day0Start = new Date(start.getTime() - 86400000); // Day 0 = startDate - 1
    const end = new Date(trip.endDate + 'T00:00:00');
    if (today < day0Start) return 'before';
    if (today > end) return 'after';
    return 'during';
  }

  return { getDefaultDayIndex, filterDays, getCountdown, tripState };
})();
;
/* ==== js/trip-groups.js ==== */
/**
 * trip-groups.js — Plus trip list buckets: open / past / others.
 *
 * Open (Voyage actif): trips I am on that are not finished.
 * Past: trips I was on that already ended (collapsed like Documents).
 * Others: trips I can see but I am not a participant (collapsed).
 *
 * GH publish rows (« Publier depuis git ») use isMySource / bucketSource
 * to keep other families collapsed — they are not mixed into this list.
 *
 * "On the trip" = listed in travelers (any role) or trip.users, matching the
 * Authelia login (trip.users[login].defaultConf, people[].login, personId).
 * Unknown login → do not hide trips as "others" (offline / anonymous).
 */
var TripGroups = (() => {

  function fold(s) {
    return String(s || '').trim().toLowerCase();
  }

  function tripOf(tripData) {
    if (!tripData) return {};
    return tripData.trip || tripData;
  }

  function peopleOf(tripData) {
    if (!tripData) return {};
    if (tripData.people && typeof tripData.people === 'object') return tripData.people;
    const trip = tripOf(tripData);
    if (trip.people && typeof trip.people === 'object') return trip.people;
    return {};
  }

  /** Person ids that count as "the logged-in user" on this trip. */
  function personIdsForLogin(tripData, login) {
    const ids = new Set();
    const L = fold(login);
    if (!L) return ids;
    ids.add(L);
    const trip = tripOf(tripData);
    const users = trip.users || {};
    Object.keys(users).forEach((key) => {
      if (fold(key) !== L) return;
      ids.add(fold(key));
      const cfg = users[key] || {};
      if (cfg.defaultConf) ids.add(fold(cfg.defaultConf));
    });
    const people = peopleOf(tripData);
    Object.keys(people).forEach((id) => {
      const p = people[id] || {};
      if (fold(p.login) === L || fold(p.id) === L) ids.add(fold(id));
    });
    return ids;
  }

  function loginOnTrip(tripData, login) {
    const my = personIdsForLogin(tripData, login);
    if (!my.size) return false;
    const trip = tripOf(tripData);
    const travelers = trip.travelers || [];
    for (let i = 0; i < travelers.length; i++) {
      const t = travelers[i] || {};
      if (my.has(fold(t.personId || t.id))) return true;
    }
    const users = trip.users || {};
    return Object.keys(users).some((key) => fold(key) === fold(login));
  }

  /**
   * Union of person ids for this login across every trip we know.
   * USA maps `laurine-rol` → `laurine`; Philippines owner is `laurine`.
   */
  function identityPersonIds(tripDatas, login) {
    const ids = new Set();
    const L = fold(login);
    if (L) ids.add(L);
    (tripDatas || []).forEach((td) => {
      personIdsForLogin(td, login).forEach((id) => ids.add(id));
    });
    return ids;
  }

  /**
   * True when this trip is "mine" for Voyage actif / Passés.
   * Any participant (traveler, not only role: owner) counts — Nicole and
   * Baptiste on Québec must see it in actif, not Autres.
   * @param {object} tripData
   * @param {string} login
   * @param {Set<string>} [knownIds] person ids already resolved for this login
   */
  function isMine(tripData, login, knownIds) {
    const L = fold(login);
    if (!L) return true;
    const trip = tripOf(tripData);
    const my = new Set(knownIds || []);
    personIdsForLogin(tripData, login).forEach((id) => my.add(id));
    if (!my.size) my.add(L);
    const travelers = trip.travelers || [];
    for (let i = 0; i < travelers.length; i++) {
      const t = travelers[i] || {};
      if (my.has(fold(t.personId || t.id))) return true;
    }
    const users = trip.users || {};
    if (Object.keys(users).some((key) => my.has(fold(key)) || fold(key) === L)) return true;
    return loginOnTrip(tripData, login);
  }

  function isPast(trip, now) {
    if (typeof DayResolver !== 'undefined' && DayResolver.tripState) {
      return DayResolver.tripState(trip, now) === 'after';
    }
    if (!trip || !trip.endDate) return false;
    const today = now || new Date();
    const end = new Date(String(trip.endDate) + 'T00:00:00');
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return day > end;
  }

  /**
   * @returns {'open'|'past'|'others'}
   */
  function bucket(tripData, login, now, knownIds) {
    if (fold(login) && !isMine(tripData, login, knownIds)) return 'others';
    if (isPast(tripOf(tripData), now)) return 'past';
    return 'open';
  }

  /**
   * GH seed is "mine" when I'm on ownerLogins / publisherLogins, or the
   * source id / family matches a known person id (nadia, laurine, …).
   */
  function isMySource(source, login, knownIds) {
    const L = fold(login);
    if (!L) return true;
    const my = new Set(knownIds || []);
    my.add(L);
    const owners = [].concat(source.ownerLogins || [], source.publisherLogins || []);
    if (owners.length) {
      return owners.some((o) => my.has(fold(o)));
    }
    return my.has(fold(source.sourceId)) || my.has(fold(source.family));
  }

  /**
   * Same open / past / others buckets as Voyage actif, for a publish source.
   * When the trip is already in Store, reuse bucket(). Otherwise (create, or
   * trip not downloaded) fall back to source ownership — never dates.
   * @returns {'open'|'past'|'others'}
   */
  function bucketSource(source, tripData, login, now, knownIds) {
    if (tripData) return bucket(tripData, login, now, knownIds);
    if (fold(login) && !isMySource(source, login, knownIds)) return 'others';
    return 'open';
  }

  function parseData(raw) {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) || {}; } catch (_) { return {}; }
    }
    return typeof raw === 'object' ? raw : {};
  }

  /**
   * Grouping fields from GET /trips. BE stores travelers/users/people on
   * trip.data (flat) and dates on start_date / end_date.
   */
  function fromListItem(t) {
    const extra = parseData(t && t.data);
    const nested = extra.trip && typeof extra.trip === 'object' ? extra.trip : {};
    return {
      startDate: (t && (t.start_date || t.startDate)) || extra.startDate || nested.startDate || '',
      endDate: (t && (t.end_date || t.endDate)) || extra.endDate || nested.endDate || '',
      travelers: extra.travelers || nested.travelers || [],
      users: extra.users || nested.users || {},
      people: extra.people || nested.people || {},
      name: (t && t.name) || extra.name || nested.name || (t && t.id) || '',
      emoji: (t && t.emoji) || extra.emoji || nested.emoji || '🌍',
    };
  }

  /**
   * Patch Store trip data with list metadata without wiping days/hotels.
   * Prefer an already-loaded seed for travelers/users; fill gaps from the list.
   */
  function mergeListItem(existing, t) {
    const g = fromListItem(t);
    const prev = (existing && (existing.trip || existing)) || {};
    const prevPeople = (existing && existing.people && typeof existing.people === 'object')
      ? existing.people : {};
    const travelers = (Array.isArray(prev.travelers) && prev.travelers.length)
      ? prev.travelers : g.travelers;
    const users = (prev.users && typeof prev.users === 'object' && Object.keys(prev.users).length)
      ? prev.users : g.users;
    const people = Object.keys(prevPeople).length ? prevPeople : g.people;
    const trip = Object.assign({}, prev, {
      id: (t && t.id) || prev.id,
      name: prev.name || g.name,
      emoji: prev.emoji || g.emoji,
      startDate: prev.startDate || g.startDate,
      endDate: prev.endDate || g.endDate,
      travelers: travelers,
      users: users,
    });
    return Object.assign({}, existing || {}, { trip: trip, people: people });
  }

  return {
    fold, personIdsForLogin, identityPersonIds, isMine, isPast, bucket,
    isMySource, bucketSource, fromListItem, mergeListItem,
  };
})();
;
/* ==== js/construction-contract.js ==== */
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
;
/* ==== js/app.js ==== */
/**
 * app.js — Main application controller
 * Hash-based router, tab switching, trip context, toast system
 *
 * Data flow (100% backend, localStorage = cache):
 * 1. Boot → render from localStorage cache (instant, works offline)
 * 2. If online → check /api/trips/:id/version (3s timeout, 50 bytes)
 * 3. If version changed → fetch /api/trips/:id/seed → update localStorage → re-render
 * 4. If offline/slow/same version → skip, use cached data
 * 5. No static seed JS — all data comes from backend, cached locally
 */
var App = (() => {

  let currentTab = 'programme';
  let currentDayIndex = 0;   // index into tripData.days array
  let currentListId = null;
  let _cachedVersion = null; // loaded from version.json
  let _backendVersion = null; // from GET /health — survives Plus tab re-renders
  let _backendVersionFetch = null; // in-flight promise (dedupe)
  let _deferredInstallPrompt = null; // Android/Chrome install prompt
  let _edgeBundlePromise = null; // in-flight injection of js/dist/bundle-edge.js
  let _edgeBundleAttempt = 0;    // compteur d'essais, cf. ensureEdgeBundle
  let _experimentalOpen = false; // « Expérimental » : état replié/déplié, survit aux re-render
  let _nuisanceAbort = null;     // AbortController du flux nuisances (onglet Plus)

  // ── PWA Install prompt capture (Android/Chrome) ─────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
  });

  // ── Magic Link Auth ────────────────────────────────────────────────────────
  // POST /auth/login is a full round-trip: awaiting it before the first paint
  // left the screen blank for the whole exchange. Boot now starts it and paints,
  // then awaits it right before touching the backend (the JWT it stores is what
  // authorises /api/trips…, and a first-ever visit has no local cache to show).
  const MAGIC_LINK_TIMEOUT_MS = 8000;

  /**
   * Starts the ?token= → JWT exchange without blocking the caller.
   * @returns {Promise<boolean>|null} null when the URL carries no magic token
   *   (the common case), else a promise resolving true when authenticated /
   *   false when the link was refused (error already displayed).
   */
  function startMagicLink() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return null;
    return handleMagicLink(token);
  }

  async function handleMagicLink(token) {
    // Exchange magic token for JWT via backend
    try {
      const baseUrl = (typeof TRIPKIT_CONFIG !== 'undefined' && TRIPKIT_CONFIG.apiUrl &&
                       TRIPKIT_CONFIG.apiUrl !== '${API_URL}')
        ? TRIPKIT_CONFIG.apiUrl.replace(/\/$/, '') : window.location.origin;

      // Timeout: boot waits on this promise before fetching data, so a hung
      // /auth/login must not stall « Chargement… » forever.
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), MAGIC_LINK_TIMEOUT_MS) : null;
      let res;
      try {
        res = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          signal: ctrl ? ctrl.signal : undefined,
        });
      } finally {
        if (timer) clearTimeout(timer);
      }

      if (res.ok) {
        const data = await res.json();
        if (data.jwt) {
          localStorage.setItem('tk-api-token', data.jwt);
          localStorage.setItem('tk-user-name', data.name || '');
          localStorage.setItem('tk-user-role', data.role || 'viewer');
          if (data.trip_id) {
            Store.setCurrentTripId(data.trip_id);
          }
          // Clean URL (remove ?token=xxx)
          window.history.replaceState({}, '', window.location.pathname + window.location.hash);
          return true;
        }
      }

      // Token invalid/expired — show error
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      showAuthError(err.error || 'Lien invalide ou expir\u00e9');
      return false;
    } catch (e) {
      console.error('[Auth] Magic link error:', e);
      showAuthError('Erreur de connexion au serveur');
      return false;
    }
  }

  function showAuthError(msg) {
    const container = document.getElementById('programme-content') || document.body;
    container.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">\ud83d\udd12</div>
      <h3>Acc\u00e8s refus\u00e9</h3>
      <p>${msg}</p>
      <p style="font-size:.8em;color:var(--muted);margin-top:12px">Demandez un nouveau lien d'invitation.</p>
    </div>`;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    window.addEventListener('hashchange', handleHash);
    // NOTE (FEAT-004) : personne ne dispatche « tripkit-sync-done » dans le repo
    // aujourd'hui (aucun dispatchEvent/CustomEvent dans js/). Le listener est
    // gardé comme point d'extension, mais il ne participe PAS aux refresh
    // parasites de l'onglet Plus : ceux-ci viennent de setupConnectivityResume().
    window.addEventListener('tripkit-sync-done', () => {
      // Don't auto-re-render while user is on the list (causes tap misses).
      // Only re-render if on the Plus tab but NOT viewing a specific list.
      if (currentTab === 'plus' && !currentListId) {
        renderCurrentTab();
      }
    });

    // Magic link: intercept ?token=xxx in URL → exchange for JWT.
    // Started here, not awaited: the UI below paints during the exchange.
    const magicLink = startMagicLink();

    paintConstructionNav();

    // Load version.json (non-blocking, best-effort)
    fetch('version.json').then(r => r.ok ? r.json() : null)
      .then(v => {
        if (v) {
          _cachedVersion = v;
          // Update version display if Plus tab is visible
          const verEl = document.getElementById('tripkit-version-info');
          if (verEl) verEl.innerHTML = `🏷️ Soft: <code style="font-size:.82em;color:var(--sec);font-weight:600">v${esc(v.soft)}</code> · Data: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(v.data)}</code> · Cache: <code style="font-size:.82em;color:var(--sec)">${v.cache || '?'}</code>`;
        }
      })
      .catch(() => {});

    // Backend version — cache in memory so Plus tab can show it even if the
    // /health response lands before #tripkit-backend-info exists (race).
    fetchBackendVersion();

    // Paint first, hit the backend after. When the URL carried a magic token the
    // /api calls must wait for its JWT — that is the only thing they wait for.
    const tripId = Store.getCurrentTripId();
    if (tripId && Store.getTripData(tripId)) {
      // Has cached data → render instantly, refresh in background
      handleHash();
      if (magicLink) magicLink.then(() => refreshFromBackend());
      else refreshFromBackend();
    } else {
      // First visit — show loading, fetch from backend, then render.
      // No cache to fall back on: the seed fetch genuinely needs the JWT.
      showLoading();
      const authed = magicLink ? await magicLink : null;
      await refreshFromBackend();

      // Check if we got data — if not, show offline message
      const newTripId = Store.getCurrentTripId();
      if (!newTripId || !Store.getTripData(newTripId)) {
        // A refused magic link already rendered its own error — don't clobber it
        if (authed !== false) showOffline();
      } else {
        handleHash();
      }
    }

    // 4. Register SW + update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then(reg => {
        setInterval(() => reg.update(), 30 * 60 * 1000);
        function showUpdateBanner() {
          if (document.getElementById('sw-update-banner')) return;
          const banner = document.createElement('div');
          banner.id = 'sw-update-banner';
          banner.className = 'update-banner';
          banner.innerHTML = '🔄 Mise à jour dispo !<button onclick="location.reload()" class="btn-update">Recharger</button>';
          document.body.appendChild(banner);
        }
        if (reg.waiting) showUpdateBanner();
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (newSW) newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner();
          });
        });
      }).catch(e => console.debug('[SW] registration failed:', e));
    }

    // 5. Swipe navigation
    setupSwipe();

    // 6. Resume when backend is really reachable again
    setupConnectivityResume();
    paintConnectivity();
  }

  // ── No static seed — data comes from backend, cached in localStorage ─────
  // First visit: backend fetch → localStorage. Subsequent visits: localStorage cache.
  // Offline after first visit: works from cache. Never-visited + offline: empty state shown.

  // ── Backend refresh (version-gated, data decoupled from code) ─────────────
  async function resolveTripId() {
    let tripId = Store.getCurrentTripId();
    if (tripId) return tripId;
    if (typeof TRIPKIT_CONFIG !== 'undefined' && TRIPKIT_CONFIG.defaultTripId &&
        TRIPKIT_CONFIG.defaultTripId !== '${DEFAULT_TRIP_ID}') {
      return TRIPKIT_CONFIG.defaultTripId;
    }
    const trips = await API.getTrips();
    if (trips && trips.length) return trips[0].id;
    // Offline / backend down: keep browsing a locally cached trip
    const localIds = Store.getAllTripIds();
    if (localIds && localIds.length) return localIds[0];
    return null;
  }

  /**
   * Fetch seed for tripId.
   * @returns {Promise<'updated'|'unchanged'|false>} 'updated' when a new seed was
   *   merged and stored, 'unchanged' when the backend version matched (or the
   *   version check failed) but local data stays usable, false when there is
   *   nothing usable at all. Both strings are truthy, so the historical
   *   `if (!ok)` / `if (ok || …)` call sites keep their control flow — but only
   *   'updated' may trigger a re-render (cf. refreshFromBackend).
   * Network failure never invalidates a good local cache.
   */
  async function loadTripSeed(tripId) {
    const hasLocal = !!Store.getTripData(tripId);
    const verRes = await API.checkVersionStatus(tripId);
    if (!verRes.ok || !verRes.data) {
      console.debug('[App] Version check failed for', tripId, verRes.status || verRes.error);
      // Keep current trip usable offline / when backend is flaky
      if (hasLocal) await syncConstructionData(tripId);
      return hasLocal ? 'unchanged' : false;
    }
    const ver = verRes.data;

    const cachedVersion = Store.get(tripId + '-data-version');
    // Skip network seed only when we already have local data AND same version.
    // A leftover *-data-version without tk-trip-* must NOT skip (boot would stall).
    if (hasLocal && cachedVersion && String(cachedVersion) === String(ver.version)) {
      console.debug('[App] Data up to date (v' + ver.version + ') — skip refresh');
      await syncConstructionData(tripId);
      return 'unchanged';
    }

    console.log('[App] Fetching seed:', tripId, 'version', cachedVersion, '→', ver.version);
    const seed = await API.fetchSeed(tripId);
    if (!seed) {
      if (hasLocal) await syncConstructionData(tripId);
      return hasLocal ? 'unchanged' : false;
    }

    const tripData = SeedMerge.merge(seed, Store.getTripData(tripId) || {});
    Store.registerTrip(tripId);
    Store.setCurrentTripId(tripId);
    Store.markSeedLoaded(tripId);
    Store.setTripData(tripId, tripData);
    Store.set(tripId + '-data-version', ver.version);
    console.log('[App] Backend data refreshed:', tripId, tripData.days?.length, 'days, version:', ver.version);
    if (typeof API.warmTripAssets === 'function') API.warmTripAssets(tripId, tripData);
    await syncConstructionData(tripId);
    return 'updated';
  }

  /**
   * Sync tk-trips with GET /trips. Only when the response is a real array
   * (including empty). null / network error → leave local cache alone.
   */
  async function reconcileTripRegistry() {
    if (typeof API === 'undefined' || typeof Store.reconcileTripsFromServer !== 'function') {
      return null;
    }
    try {
      const resp = await API.getTrips();
      const backendTrips = Array.isArray(resp)
        ? resp
        : (resp && Array.isArray(resp.results) ? resp.results : null);
      if (!backendTrips) return null;
      const ids = backendTrips.map(t => t && t.id).filter(Boolean);
      const result = Store.reconcileTripsFromServer(ids);
      if (result.removed.length) {
        console.debug('[App] Dropped trips gone from backend:', result.removed.join(', '));
      }
      return result;
    } catch (e) {
      console.debug('[App] Trip registry sync skipped:', e.message);
      return null;
    }
  }

  /**
   * @param {{probed?: boolean}} [opts] probed: le caller vient de sonder /health
   *   avec succès (kick()), inutile de le refaire — cela économise une requête
   *   /health par retour dans l'app.
   */
  async function refreshFromBackend(opts) {
    if (!navigator.onLine) return;
    // Prefer a real probe when the device claims to be online
    if (!(opts && opts.probed) && typeof API !== 'undefined' && API.probe) {
      const up = await API.probe();
      if (!up) {
        // Stay on cache — do not rediscover / wipe
        if (typeof API.flushOutbox === 'function') API.flushOutbox();
        return;
      }
    }

    // Drop deleted / ACL-lost trips from local registry (BE success only).
    // L'empreinte avant/après capture aussi bien un retrait qu'un ajout : le
    // résultat de reconcileTripsFromServer ne liste que les retraits.
    const tripsBefore = (Store.getAllTripIds() || []).join('|');
    const registry = await reconcileTripRegistry();
    const registryChanged = !!registry &&
      (Store.getAllTripIds() || []).join('|') !== tripsBefore;

    let tripId = await resolveTripId();
    if (!tripId) return;

    try {
      const hasLocal = !!Store.getTripData(tripId);
      let ok = await loadTripSeed(tripId);

      // Rediscover ONLY on definitive 403/404 and when we have NO local cache.
      // Never clear tk-current-trip because /health or /version timed out.
      if (!ok && !hasLocal && Store.getCurrentTripId() === tripId) {
        const st = await API.checkVersionStatus(tripId);
        if (st.status === 403 || st.status === 404) {
          console.debug('[App] Current trip gone (', st.status, ') — rediscovering');
          localStorage.removeItem('tk-current-trip');
          localStorage.removeItem(tripId + '-data-version');
          const trips = await API.getTrips();
          const next = trips && trips.length
            ? (trips.find(t => t.id !== tripId) || trips[0])
            : null;
          if (next && next.id) {
            ok = await loadTripSeed(next.id);
            tripId = next.id;
          }
        }
      }

      // Re-render ONLY when the seed really changed, or when this refresh is what
      // brought the first usable data (cold boot / rediscovered trip).
      // Repainting on an unchanged version was the « refresh parasite » of the
      // Plus tab: every app switch / screen unlock rebuilt #plus-content, which
      // restarted PublishPanel.loadSources(), LeoChatStream.loadStatus(),
      // PlusChatStream.loadStatus() and lost the scroll position.
      // …ou quand le registre des voyages a bougé côté backend (voyage ajouté ou
      // retiré) : la version du seed courant n'en dit rien, et sans ce cas le
      // sélecteur de voyages de l'onglet Plus resterait périmé jusqu'à ce que
      // l'utilisateur quitte l'onglet et y revienne.
      const firstPaint = !hasLocal && !!Store.getTripData(tripId);
      if (ok === 'updated' || firstPaint || registryChanged) renderCurrentTab();
    } catch (e) {
      console.debug('[App] Backend refresh failed (using cached):', e.message);
    }

    if (typeof API !== 'undefined' && tripId) {
      API.backgroundSyncTrip(tripId);
      // Even when seed was already up-to-date, warm images for offline Jour/Route
      const td = Store.getTripData(tripId);
      if (td && typeof API.warmTripAssets === 'function') API.warmTripAssets(tripId, td);
    }
  }

  // Deux garde-fous cumulés contre les reprises en rafale (l'utilisateur qui
  // bascule entre applis fait pleuvoir les visibilitychange) :
  //  1. un debounce de 400 ms qui fusionne les événements rapprochés ;
  //  2. un intervalle minimum entre deux reprises déclenchées par la visibilité.
  // L'événement « online » reste immédiat (hors intervalle minimum) : retrouver
  // le réseau doit resynchroniser tout de suite.
  const RESUME_MIN_INTERVAL_MS = 10000;

  /**
   * Intervalle minimum effectif entre deux reprises de visibilité.
   * Crochet de test uniquement : sans `window.__tripkitResumeMinIntervalMs`
   * (le cas en production, où rien ne le définit), renvoie toujours
   * RESUME_MIN_INTERVAL_MS. Il permet à tests/plus-refresh.spec.js de vérifier
   * que la reprise différée a bien lieu sans attendre 10 s de sommeil réel.
   */
  function resumeMinIntervalMs() {
    const override = window.__tripkitResumeMinIntervalMs;
    return (typeof override === 'number' && override > 0) ? override : RESUME_MIN_INTERVAL_MS;
  }

  /** Resume when network is really back (probe), not merely navigator.onLine. */
  function setupConnectivityResume() {
    let _resumeTimer = null;
    let _lastResumeAt = 0;
    const kick = (force) => {
      const minInterval = resumeMinIntervalMs();
      const since = _lastResumeAt ? Date.now() - _lastResumeAt : Infinity;
      if (!force && since < minInterval) {
        // L'intervalle minimum DIFFÈRE la reprise, il ne l'annule pas : un vrai
        // retour dans l'app 9 s après le précédent (souvent sur un autre réseau)
        // doit finir par resynchroniser. Un seul report est armé à la fois.
        clearTimeout(_resumeTimer);
        _resumeTimer = setTimeout(() => kick(true), minInterval - since);
        // L'indicateur de connectivité, lui, ne coûte rien : il est repeint tout
        // de suite pour ne pas rester périmé pendant la fenêtre.
        paintConnectivity();
        return;
      }
      clearTimeout(_resumeTimer);
      _resumeTimer = setTimeout(async () => {
        if (typeof API === 'undefined') return;
        _lastResumeAt = Date.now();
        const up = await API.probe();
        paintConnectivity();
        if (!up) return;
        await refreshFromBackend({ probed: true });
        if (typeof PublishPanel !== 'undefined' && PublishPanel.resumeIfNeeded) {
          PublishPanel.resumeIfNeeded();
        }
        if (typeof PolarstepsPanel !== 'undefined' && PolarstepsPanel.resumeIfNeeded) {
          PolarstepsPanel.resumeIfNeeded();
        }
        if (typeof LeoChatStream !== 'undefined' && LeoChatStream.resumeIfNeeded) {
          LeoChatStream.resumeIfNeeded();
        }
        if (typeof NuisanceStream !== 'undefined' && NuisanceStream.resumeIfNeeded) {
          NuisanceStream.resumeIfNeeded();
        }
        // If a shared list is open, re-pull so Nicole sees René's ticks after
        // unlocking the phone / coming back to Safari.
        if (currentListId && typeof ListComponent !== 'undefined') {
          const td = Store.getTripData(Store.getCurrentTripId());
          const list = td && td.lists && td.lists[currentListId];
          if (list && ListComponent.pullOnOpen) {
            ListComponent.pullOnOpen('plus-content', list);
          }
        }
      }, 400);
    };
    window.addEventListener('online', () => kick(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') kick(false);
    });
    if (typeof API.onReachabilityChange === 'function') {
      API.onReachabilityChange(() => paintConnectivity());
    }
  }

  function paintConnectivity() {
    const el = document.getElementById('tripkit-connectivity');
    if (!el) return;
    const device = navigator.onLine;
    const be = (typeof API !== 'undefined' && API.getReachability) ? API.getReachability() : null;
    let label;
    if (!device) label = '<span style="color:var(--orange)">Hors ligne (appareil)</span>';
    else if (be === true) label = '<span style="color:var(--green)">Backend OK</span>';
    else if (be === false) label = '<span style="color:var(--orange)">Appareil en ligne · backend injoignable</span>';
    else label = '<span style="color:var(--muted)">Appareil en ligne · backend…</span>';
    el.innerHTML = `🌐 ${label}`;
  }

  // ── Router ────────────────────────────────────────────────────────────────
  function handleHash() {
    const hash = window.location.hash.slice(1) || 'programme';
    const parts = hash.split('/');
    const tab = parts[0];

    if (['programme', 'route', 'culture', 'hotels', 'construction', 'plus'].includes(tab)) {
      if (tab === 'construction' && !Store.get('tk-construction-mode')) {
        window.location.hash = 'programme';
        return;
      }
      _updateTabUI(tab);
      if (currentTab && currentTab !== tab) _teardownTab(currentTab);
      currentTab = tab;

      if (tab === 'programme' && parts[1] !== undefined) {
        currentDayIndex = parseInt(parts[1]) || 0;
      }
      if (tab === 'plus') {
        // plus/listes/listId or plus/hotels
        currentListId = (parts[1] === 'listes' && parts[2]) ? parts[2] : null;
      } else {
        currentListId = null;
      }
    }

    renderCurrentTab();
  }

  function _updateTabUI(tab) {
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === 'tab-' + tab);
    });
  }

  /**
   * Coupe les flux SSE de l'onglet qu'on quitte.
   *
   * Un flux nuisances survit à l'abandon de son panneau : il continue jusqu'au
   * `done` puis repeint un panneau que l'utilisateur ne regarde plus. Chaque
   * panneau annule déjà son propre flux avant d'en ouvrir un autre ;
   * il manquait la sortie d'onglet.
   *
   * Limite : `abort()` ne coupe que la lecture côté client. Le job serveur
   * continue d'interroger Overpass jusqu'à son terme.
   */
  function _teardownTab(tab) {
    if (tab === 'construction' && typeof ConstructionView !== 'undefined' && ConstructionView.abortNuisanceStream) {
      ConstructionView.abortNuisanceStream();
    }
    if (tab === 'hotels' && typeof BookingsView !== 'undefined' && BookingsView.abortHotelNuisanceStreams) {
      BookingsView.abortHotelNuisanceStreams();
    }
    if (tab === 'plus' && _nuisanceAbort) {
      _nuisanceAbort.abort();
      _nuisanceAbort = null;
    }
    if (typeof NuisanceStream !== 'undefined' && NuisanceStream.stopFollow) {
      NuisanceStream.stopFollow();
    }
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  function switchTab(tab) {
    if (currentTab && currentTab !== tab) _teardownTab(currentTab);
    currentTab = tab;
    _updateTabUI(tab);
    if (tab !== 'listes') currentListId = null;
    // Animate tab content
    const activeView = document.getElementById('tab-' + tab);
    if (activeView) {
      activeView.style.animation = 'none';
      activeView.offsetHeight;
      activeView.style.animation = 'fadeIn 0.25s ease';
    }
    window.location.hash = tab;
  }

  // ── Render current tab ────────────────────────────────────────────────────
  function renderCurrentTab() {
    const tripId = Store.getCurrentTripId();
    const tripData = tripId ? Store.getTripData(tripId) : null;

    switch (currentTab) {
      case 'programme': renderProgramme(tripData); break;
      case 'route':     renderRoute(tripData);     break;
      case 'culture':   renderCulture(tripData);   break;
      case 'hotels':    renderHotels(tripData);    break;
      case 'construction': renderConstruction(tripData); break;
      case 'plus':      renderPlus(tripData);      break;
    }
  }

  function reloadAllViews() { renderCurrentTab(); }

  // ── Programme tab ─────────────────────────────────────────────────────────
  function renderProgramme(tripData) {
    const container = document.getElementById('programme-content');
    if (!tripData || !tripData.days || !tripData.days.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🌍</div>
        <h3>Aucun voyage chargé</h3>
        <p>Allez dans ⚙️ Plus pour sélectionner un voyage.</p>
      </div>`;
      return;
    }
    // Auto-navigate to current day (during trip) or default
    if (typeof DayResolver !== 'undefined' && !window.location.hash.includes('programme/')) {
      currentDayIndex = DayResolver.getDefaultDayIndex(tripData);
    }
    currentDayIndex = Math.max(0, Math.min(currentDayIndex, tripData.days.length - 1));
    DailyView.render(container, tripData, currentDayIndex);
  }

  function goToDay(dayIndex) {
    const tripId = Store.getCurrentTripId();
    const tripData = tripId ? Store.getTripData(tripId) : null;
    if (!tripData) return;
    const oldIndex = currentDayIndex;
    currentDayIndex = Math.max(0, Math.min(dayIndex, tripData.days.length - 1));
    // Slide animation
    const container = document.getElementById('programme-content');
    if (container && oldIndex !== currentDayIndex) {
      const anim = currentDayIndex > oldIndex ? 'slideLeft' : 'slideRight';
      container.style.animation = 'none';
      container.offsetHeight; // force reflow
      container.style.animation = `${anim} 0.25s ease`;
    }
    window.location.hash = `programme/${currentDayIndex}`;
  }

  // ── Route tab ──────────────────────────────────────────────────────────────
  function renderRoute(tripData) {
    RouteView.render('route-content', tripData);
  }

  // ── Culture tab ───────────────────────────────────────────────────────────
  function renderCulture(tripData) {
    CultureView.render('culture-content', tripData);
  }

  // ── Résa tab (data-tab stays "hotels" for #hotels deep links) ─────────────
  function renderHotels(tripData) {
    if (typeof BookingsView !== 'undefined') {
      BookingsView.render('hotels-content', tripData);
      return;
    }
    const container = document.getElementById('hotels-content');
    container.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">📋</div><h3>Réservations indisponibles</h3></div>`;
  }

  // ── Construction tab ──────────────────────────────────────────────────────
  function renderConstruction(tripData) {
    if (typeof ConstructionView !== 'undefined') {
      ConstructionView.render('construction-content', tripData);
      return;
    }
    const container = document.getElementById('construction-content');
    if (container) container.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">🏗️</div><h3>Mode Construction</h3></div>`;
  }

  // ── Plus tab (listes + settings) ──────────────────────────────────────────
  function renderPlus(tripData) {
    const container = document.getElementById('plus-content');

    // If viewing a specific list
    if (currentListId && tripData?.lists?.[currentListId]) {
      const list = tripData.lists[currentListId];
      ListComponent.render('plus-content', list);
      // Pull shared customs + checks; keep pulling while open so peer ticks
      // appear without leaving the list (iPhone resume / wait on same screen).
      if (typeof ListComponent.startPullWhileOpen === 'function') {
        ListComponent.startPullWhileOpen('plus-content', list);
      } else if (typeof ListComponent.pullOnOpen === 'function') {
        ListComponent.pullOnOpen('plus-content', list);
      }
      return;
    }

    if (typeof ListComponent !== 'undefined' && ListComponent.stopPullWhileOpen) {
      ListComponent.stopPullWhileOpen();
    }

    let html = `<div class="page-header"><h1>⚙️ Plus</h1></div>`;

    // ── Lists → Documents → Voyage actif ──
    if (tripData?.lists && Object.keys(tripData.lists).length > 0) {
      html += `<div class="section-title">📋 Listes</div>`;
      Object.entries(tripData.lists).forEach(([id, list]) => {
        Store.rememberListType(id, list.type);
        const checks = Store.getChecks(id);
        let total = 0, checked = 0;
        (list.sections || []).forEach(s => {
          (s.items || []).forEach(it => { total++; if (checks[it.id]?.checked) checked++; });
        });
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
        const typeEmoji = list.type === 'shopping' ? '🛒' : list.type === 'packing' ? '🧳' : '📋';
        const shared = Store.isListShared(id);
        const sync = Store.getSyncState(id);
        const shareHint = sync && sync.state === 'error' ? '⚠️ ' + sync.message
          : sync && sync.state === 'offline' ? '🔌 hors ligne'
          : shared ? '☁️ partagée' : '🔒 locale';
        html += `<div class="trip-item" onclick="App.openList('${escAttr(id)}')">
          <span class="trip-emoji">${typeEmoji}</span>
          <div class="trip-info">
            <div class="trip-name">${esc(list.title)}</div>
            <div class="trip-dates">${checked}/${total} coché${checked !== 1 ? 's' : ''} — ${pct}% · ${shareHint}</div>
          </div>
          <span class="trip-arrow">›</span>
        </div>`;
      });
    }

    // Traveler documents (from people.js) — collapsed by default
    if (typeof BookingsView !== 'undefined' && BookingsView.renderDocumentsCollapsed) {
      html += BookingsView.renderDocumentsCollapsed(tripData);
    }

    // ── Trip selector ──
    html += `<div class="section-title" style="margin-top:24px">🌍 Voyage actif</div>`;
    html += `<div id="plus-trip-selector"></div>`;
    html += `<div id="plus-publish-panel"></div>`;
    // Polarsteps is a Plus landmark (SPEC-polarsteps-caption), not Expérimental.
    // tests/plus-inventory.* fail if this mount or its order is dropped.
    html += `<div id="plus-polarsteps-panel"></div>`;
    html += `<div id="plus-leo-chat-stream"></div>`;
    // Replié par défaut au premier rendu ; un re-render légitime (changement de
    // voyage, nouvelles données) restitue l'état choisi par l'utilisateur.
    html += `<div class="section-wrap plus-docs-wrap plus-experimental-wrap" id="plus-experimental-wrap"
      style="margin-top:16px;border:none;background:transparent">
      <div class="section-head${_experimentalOpen ? '' : ' collapsed'} plus-docs-head" id="plus-experimental-head" role="button" tabindex="0"
        aria-expanded="${_experimentalOpen ? 'true' : 'false'}" aria-controls="plus-experimental-body">
        <span class="s-title">🧪 Expérimental</span>
        <span class="s-chevron">▼</span>
      </div>
      <div class="section-body${_experimentalOpen ? '' : ' hidden'} plus-docs-body" id="plus-experimental-body">
        <div id="plus-chat-stream"></div>
        <div id="plus-edge-chat-stream"></div>
        <div style="margin-top:12px;padding:12px;background:var(--card);border-radius:var(--radius)">
          <button class="btn btn-sm" id="plus-nuisance-all" style="width:100%;background:var(--accent);color:#000;font-weight:600">
            ⚠️ Analyse nuisances (tous les hôtels)
          </button>
          <div id="plus-nuisance-result" style="margin-top:8px"></div>
        </div>
      </div>
    </div>`;

    // ── Quiz (only if quiz exists for current trip) ──
    const tripsWithQuiz = []; // add trip ids that ship a questions.json quiz // trips that have a questions.json quiz
    const currentTripId = Store.getCurrentTripId();
    if (tripsWithQuiz.includes(currentTripId)) {
      html += `<div class="section-title" style="margin-top:24px">🧠 Quiz</div>`;
      html += `<a href="quiz.html" class="trip-item" style="text-decoration:none;color:var(--text)">
        <span class="trip-emoji">🧠</span>
        <div class="trip-info">
          <div class="trip-name">Quiz Voyage</div>
          <div class="trip-dates">140 questions · 5 niveaux · Scores par joueur</div>
        </div>
        <span class="trip-arrow">›</span>
      </a>`;
    }

    // ── Install guide (shown only if not already installed) ──
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      html += `<div class="section-title" style="margin-top:24px">📲 Installer l'app</div>`;
      html += `<div class="card" style="padding:16px">`;

      if (_deferredInstallPrompt) {
        // Android/Chrome — native install button
        html += `<p style="color:var(--text);margin:0 0 12px;font-size:.9em">Installe l'app pour un accès rapide depuis l'écran d'accueil 🚀</p>`;
        html += `<button class="btn" style="background:var(--green);color:#000;font-weight:700;width:100%" onclick="App.installPWA()">📲 Installer</button>`;
      } else if (isIOS && isSafari) {
        // iOS Safari — show guide
        html += `<p style="color:var(--text);margin:0 0 12px;font-size:.9em">Pour installer sur iPhone/iPad :</p>`;
        html += `<div style="font-size:.85em;color:var(--muted);line-height:2.2">`;
        html += `<div>1️⃣ Tape l'icône <strong style="color:var(--text);font-size:1.2em">⬆️</strong> (Partager) en bas de Safari</div>`;
        html += `<div>2️⃣ Scroll et tape <strong style="color:var(--text)">“Sur l'écran d'accueil”</strong></div>`;
        html += `<div>3️⃣ Tape <strong style="color:var(--text)">“Ajouter”</strong> — c'est fait ! ✅</div>`;
        html += `</div>`;
      } else if (isIOS && !isSafari) {
        // iOS but not Safari (Chrome, Firefox...)
        html += `<p style="color:var(--orange);margin:0 0 8px;font-size:.9em">⚠️ Ouvre cette page dans <strong>Safari</strong> pour installer !</p>`;
        html += `<p style="color:var(--muted);margin:0;font-size:.82em">Chrome/Firefox sur iOS ne permettent pas l'installation. Copie ce lien et ouvre-le dans Safari :</p>`;
        html += `<div style="margin-top:8px;padding:10px;background:var(--bg);border-radius:8px;font-size:.78em;word-break:break-all;color:var(--sec)">${window.location.origin}</div>`;
        html += `<button class="btn" style="margin-top:10px;background:var(--accent);color:#000;font-weight:600;width:100%" onclick="navigator.clipboard.writeText(window.location.origin);App.showToast('✅ Lien copié !')">📋 Copier le lien</button>`;
      } else if (isAndroid) {
        // Android but no prompt captured yet
        html += `<p style="color:var(--text);margin:0 0 12px;font-size:.9em">Pour installer :</p>`;
        html += `<div style="font-size:.85em;color:var(--muted);line-height:2.2">`;
        html += `<div>1️⃣ Tape le menu <strong style="color:var(--text)">⋮</strong> (3 points) en haut à droite</div>`;
        html += `<div>2️⃣ Tape <strong style="color:var(--text)">“Installer l'application”</strong> ou <strong style="color:var(--text)">“Ajouter à l'écran d'accueil”</strong></div>`;
        html += `</div>`;
      } else {
        // Desktop or unknown
        html += `<p style="color:var(--muted);margin:0;font-size:.85em">Utilise Chrome ou Safari mobile pour installer l'app sur ton téléphone 📱</p>`;
      }

      html += `</div>`;
    }

    // ── App info ──
    const ver = _cachedVersion || { soft: '?', data: '?' };
    const beLabel = _backendVersion
      ? `🖥️ Backend: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(formatBackendVersion(_backendVersion))}</code>`
      : `🖥️ Backend: <code style="font-size:.82em;color:var(--muted)">…</code>`;
    html += `<div class="section-title" style="margin-top:24px">ℹ️ Infos app</div>
      <div class="card"><div style="font-size:.84em;color:var(--muted);line-height:2">
        <div>📱 <strong style="color:var(--text)">Juju's Adventures</strong> — PWA offline-first</div>
        <div id="tripkit-version-info">🏷️ Soft: <code style="font-size:.82em;color:var(--sec);font-weight:600">v${esc(ver.soft)}</code> · Data: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(ver.data)}</code> · Cache: <code style="font-size:.82em;color:var(--sec)">${ver.cache || '?'}</code></div>
        <div id="tripkit-backend-info">${beLabel}</div>
        <div>💾 Device: <code style="font-size:.78em;color:var(--sec)">${Store.getDeviceId()}</code></div>
        <div id="tripkit-connectivity">🌐 …</div>
      </div></div>`;

    html += `<div class="btn-row" style="margin-top:12px;gap:8px;flex-direction:column">
      <button class="btn" style="background:var(--accent);color:#000;font-weight:700;width:100%" onclick="App.updateApp()">
        🚀 Mettre à jour l'app
      </button>
      <div style="display:flex;gap:8px">
        <button class="btn" style="background:var(--sec);color:#000;font-weight:600;flex:1" onclick="App.clearCache()">🔄 Vider cache</button>
        <button class="btn" style="flex:1;background:#f85149;color:#fff;font-weight:600" onclick="App.confirmClearData()">🗑️ Effacer données</button>
      </div>
      <p style="font-size:.78em;color:var(--muted);margin:8px 0 0;line-height:1.4">
        «&nbsp;Vider cache&nbsp;» n’efface pas le modèle hors-ligne (OPFS).
        «&nbsp;Effacer données&nbsp;» le supprime aussi.
      </p>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 12px;background:var(--card);border-radius:var(--radius)">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;color:var(--text);font-size:.85em">
          <input type="checkbox" id="nocache-toggle" ${localStorage.getItem('tripkit_nocache') === '1' ? 'checked' : ''} onchange="App.toggleNoCache(this.checked)" style="width:18px;height:18px">
          🛠️ Mode dev (pas de cache images)
        </label>
      </div>
      <div id="construction-mode-toggle-wrap" style="display:${constructionToggleVisible() ? 'flex' : 'none'};align-items:center;gap:10px;margin-top:8px;padding:10px 12px;background:var(--card);border-radius:var(--radius)">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;color:var(--text);font-size:.85em">
          <input type="checkbox" id="construction-toggle" ${Store.get('tk-construction-mode') ? 'checked' : ''} onchange="App.toggleConstructionMode(this.checked)" style="width:18px;height:18px">
          🏗️ Mode construction
        </label>
      </div>
    </div>`;

    container.innerHTML = html;

    if (typeof BookingsView !== 'undefined' && BookingsView.bindDocumentsCollapse) {
      BookingsView.bindDocumentsCollapse(container);
    }
    bindExperimentalCollapse(container);
    bindPlusNuisanceButton();

    // Trip list first, then GH publish (uses Store trips to mark « my » families).
    const selectorEl = document.getElementById('plus-trip-selector');
    const tripsReady = selectorEl && typeof TripSelector !== 'undefined'
      ? Promise.resolve(TripSelector.render(selectorEl))
      : Promise.resolve();

    const publishEl = document.getElementById('plus-publish-panel');
    if (publishEl && typeof PublishPanel !== 'undefined') {
      tripsReady.then(() => PublishPanel.loadSources()).then(() => {
        PublishPanel.renderSection(publishEl);
        PublishPanel.resumeIfNeeded();
        paintConstructionToggle();
      }).catch(() => paintConstructionToggle());
    }

    if (typeof PolarstepsPanel !== 'undefined') {
      const paintPolarsteps = () => {
        const live = document.getElementById('plus-polarsteps-panel');
        if (live) PolarstepsPanel.renderSection(live);
      };
      PolarstepsPanel.loadStatus().then(paintPolarsteps).catch(paintPolarsteps);
    }

    // Order: Polarsteps → Léo → Bifrost → Local (edge)
    // Those three sections live in bundle-edge, which is kept off the boot path:
    // render straight away when it is already there, otherwise fetch it first.
    if (edgeBundleLoaded()) renderEdgeSections();
    else ensureEdgeBundle().then(ok => { if (ok) renderEdgeSections(); else renderEdgeFallback(); });

    // If /health hasn't resolved yet (or failed earlier), retry now that the
    // Plus DOM exists — paintBackendVersion will fill #tripkit-backend-info.
    if (!_backendVersion) fetchBackendVersion();
    paintConnectivity();
    if (typeof API !== 'undefined' && API.probe) API.probe().then(() => paintConnectivity());
  }

  // ── bundle-edge : chargement à la demande ─────────────────────────────────
  // Léo / Bifrost / Local (appareil) et le moteur d'IA locale ne servent qu'à
  // l'onglet Plus : bundle-edge n'est donc pas dans index.html, il est injecté
  // ici au premier besoin. Le service worker le précache quand même, pour que le
  // shell reste complet hors ligne une fois mis en cache.
  function edgeBundleLoaded() {
    return typeof EdgeChatStream !== 'undefined';
  }

  // Plafond d'attente du chargement de bundle-edge. `onerror` couvre l'échec net
  // (DNS, 404, abort) mais PAS la requête qui pend : sur un réseau capté sans
  // sortie (portail WiFi, 3G morte), un <script> peut rester en attente sans
  // jamais déclencher le moindre événement. Le plafond vaut donc pour tous les
  // appelants — rendu de l'onglet Plus comme « Effacer données ».
  const EDGE_BUNDLE_TIMEOUT_MS = 5000;

  // Resolves true when the bundle is available, false when its load failed or
  // timed out. Never rejects and never throws: sans bundle-edge, le reste de
  // l'onglet Plus doit continuer à fonctionner. Un échec remet la promesse à null
  // pour qu'un rendu ultérieur — ou le bouton « Réessayer » — puisse retenter.
  function ensureEdgeBundle() {
    if (edgeBundleLoaded()) return Promise.resolve(true);
    if (_edgeBundlePromise) return _edgeBundlePromise;
    _edgeBundlePromise = new Promise(resolve => {
      const s = document.createElement('script');
      // Same cache-busting semantics as the tags rewritten by the Dockerfile:
      // version.json is served no-store, so ?v=<cache> follows each release.
      const cache = _cachedVersion && _cachedVersion.cache;
      const query = [];
      if (cache) query.push('v=' + cache);
      // Après un essai raté, la requête précédente peut être encore EN ATTENTE
      // (réseau qui pend) : le navigateur rattacherait le nouveau <script> à
      // cette requête morte plutôt que d'en ouvrir une neuve, et « Réessayer »
      // ne servirait à rien. Le numéro d'essai rend l'URL unique. Le service
      // worker sait quand même la servir hors ligne (matchShell → ignoreSearch).
      _edgeBundleAttempt += 1;
      if (_edgeBundleAttempt > 1) query.push('r=' + _edgeBundleAttempt);
      s.src = 'js/dist/bundle-edge.js' + (query.length ? '?' + query.join('&') : '');
      // Volontairement PAS `s.async = false` : l'ordre d'exécution n'a rien à
      // ordonner (bundle-edge est un seul fichier autonome, ses 7 sources sont
      // déjà concaténées dans le bon ordre par le build), alors qu'un script
      // injecté avec async=false rejoint la liste « à exécuter dans l'ordre » —
      // une première requête qui pend y bloquerait indéfiniment l'exécution du
      // script du « Réessayer ».

      let settled = false;
      const settle = (ok) => {
        if (settled) return; // un onload tardif après le plafond ne rejoue rien
        settled = true;
        clearTimeout(timer);
        if (!ok) {
          _edgeBundlePromise = null; // allow a retry on the next render
          // Le <script> abandonné ne sert plus à rien : on ne le laisse pas en
          // travers du prochain essai.
          if (s.parentNode) s.parentNode.removeChild(s);
        }
        resolve(ok);
      };
      // Sans ce plafond, une requête qui pend laisse la promesse en suspens pour
      // toujours : Léo / Bifrost / Local restent vides et le repli « Réessayer »
      // n'est jamais rendu, puisque personne ne reçoit `false`.
      const timer = setTimeout(() => settle(false), EDGE_BUNDLE_TIMEOUT_MS);
      s.onload = () => settle(true);
      s.onerror = () => settle(false);
      document.head.appendChild(s);
    });
    return _edgeBundlePromise;
  }

  // Échec de chargement (net ou par dépassement du plafond) : les trois <div>
  // resteraient vides, ce qui se lit comme un onglet cassé plutôt que dégradé. On
  // affiche donc un état explicite avec un bouton « Réessayer » — indispensable
  // depuis que la reprise d'app ne repeint plus l'onglet Plus : sans lui, il
  // faudrait ressortir de l'onglet pour retenter.
  function renderEdgeFallback() {
    const leoEl = document.getElementById('plus-leo-chat-stream');
    const target = leoEl || document.getElementById('plus-chat-stream');
    if (!target) return;
    const others = ['plus-chat-stream', 'plus-edge-chat-stream']
      .map(id => document.getElementById(id))
      .filter(el => el && el !== target);
    others.forEach(el => { el.innerHTML = ''; });

    target.innerHTML = `<div class="card" style="padding:14px" id="plus-edge-fallback">
      <div style="font-size:.9em;color:var(--orange);font-weight:600;margin-bottom:6px">⚠️ Assistants indisponibles</div>
      <p style="font-size:.82em;color:var(--muted);margin:0 0 10px;line-height:1.5">
        Léo, Bifrost et l'IA locale n'ont pas pu être chargés (réseau ou cache incomplet).
        Le reste de l'onglet fonctionne normalement.
      </p>
      <button type="button" class="btn" id="plus-edge-retry"
        style="background:var(--sec);color:#000;font-weight:600">🔄 Réessayer</button>
    </div>`;

    const btn = document.getElementById('plus-edge-retry');
    if (btn) btn.onclick = () => {
      btn.disabled = true;
      btn.textContent = '⏳ Chargement…';
      retryEdgeBundle();
    };
  }

  // Rejoue l'injection après un échec : ensureEdgeBundle a déjà remis sa promesse
  // à null, il suffit donc de la rappeler.
  function retryEdgeBundle() {
    return ensureEdgeBundle().then(ok => {
      if (ok) renderEdgeSections();
      else renderEdgeFallback();
      return ok;
    });
  }

  // Idempotent: the Plus tab re-renders often, so the elements are re-queried
  // every time and each global keeps its typeof guard.
  function renderEdgeSections() {
    const leoStreamEl = document.getElementById('plus-leo-chat-stream');
    if (leoStreamEl && typeof LeoChatStream !== 'undefined') {
      LeoChatStream.loadStatus().then(() => LeoChatStream.renderSection(leoStreamEl));
    }

    const plusChatEl = document.getElementById('plus-chat-stream');
    if (plusChatEl && typeof PlusChatStream !== 'undefined') {
      PlusChatStream.loadStatus().then(() => PlusChatStream.renderSection(plusChatEl));
    }

    const edgeChatEl = document.getElementById('plus-edge-chat-stream');
    if (edgeChatEl && typeof EdgeChatStream !== 'undefined') {
      EdgeChatStream.renderSection(edgeChatEl);
    }
  }

  function bindExperimentalCollapse(root) {
    const head = (root || document).querySelector('#plus-experimental-head');
    const body = (root || document).querySelector('#plus-experimental-body');
    if (!head || !body || head.dataset.bound === '1') return;
    head.dataset.bound = '1';
    const toggle = () => {
      const open = body.classList.toggle('hidden') === false;
      head.classList.toggle('collapsed', !open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      _experimentalOpen = open; // survit au prochain rendu de l'onglet Plus
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }

  function bindPlusNuisanceButton() {
    const btn = document.getElementById('plus-nuisance-all');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      const tripId = Store.getCurrentTripId();
      if (!tripId) return;
      const resultEl = document.getElementById('plus-nuisance-result');

      btn.disabled = true;
      btn.textContent = '...';

      const res = await API.runNuisanceCheck(tripId, null);

      btn.disabled = false;
      btn.textContent = '⚠️ Analyse nuisances (tous les hôtels)';

      if (!res.ok) {
        if (resultEl) resultEl.innerHTML = `<div class="construction-error" style="font-size:.82em">${esc(res.error || 'Erreur')}</div>`;
        return;
      }

      if (_nuisanceAbort) _nuisanceAbort.abort();
      const ac = new AbortController();
      _nuisanceAbort = ac;

      await NuisanceStream.start(resultEl, {
        tripId,
        data: res.data,
        signal: ac.signal,
        compact: true,
      });
    });
    const tripId = typeof Store !== 'undefined' && Store.getCurrentTripId && Store.getCurrentTripId();
    const resultEl = document.getElementById('plus-nuisance-result');
    const resumed = typeof NuisanceStream !== 'undefined' && NuisanceStream.resumeIfNeeded
      && NuisanceStream.resumeIfNeeded();
    if (!resumed && resultEl && tripId && typeof NuisanceStream !== 'undefined' && NuisanceStream.hydrate) {
      NuisanceStream.hydrate(resultEl, { tripId, compact: true, panel: 'plus' });
    }
  }

  function formatBackendVersion(v) {
    const s = String(v || '');
    return s.startsWith('v') ? s : 'v' + s;
  }

  function paintBackendVersion() {
    if (!_backendVersion) return;
    const el = document.getElementById('tripkit-backend-info');
    if (!el) return;
    el.innerHTML = `🖥️ Backend: <code style="font-size:.82em;color:var(--sec);font-weight:600">${esc(formatBackendVersion(_backendVersion))}</code>`;
  }

  /** Fetch GET /health once, cache APP_VERSION, paint Plus tab if visible. */
  function fetchBackendVersion() {
    if (!navigator.onLine) return Promise.resolve(null);
    if (_backendVersion) {
      paintBackendVersion();
      return Promise.resolve(_backendVersion);
    }
    if (_backendVersionFetch) return _backendVersionFetch;
    const baseUrl = (typeof API !== 'undefined' && API.getBaseUrl) ? API.getBaseUrl() : window.location.origin;
    _backendVersionFetch = fetch(baseUrl + '/health', { signal: AbortSignal.timeout(3000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.version) {
          _backendVersion = data.version;
          paintBackendVersion();
        }
        return _backendVersion;
      })
      .catch(() => null)
      .finally(() => { _backendVersionFetch = null; });
    return _backendVersionFetch;
  }

  function openList(listId) {
    currentListId = listId;
    window.location.hash = 'plus/listes/' + listId;
  }

  function selectTrip(tripId) {
    Store.setCurrentTripId(tripId);
    currentListId = null;
    currentDayIndex = 0;

    // Do NOT purge local cache before fetch — offline / flaky backend must keep
    // the previous seed. Successful loadTripSeed merges over it.
    tripData = Store.getTripData(tripId) || {};
    switchTab('programme');
    if (tripData && tripData.days && tripData.days.length) {
      renderCurrentTab();
      showToast('✅ Voyage sélectionné');
    } else {
      showToast('✅ Chargement…');
    }
    refreshFromBackend();
  }

  function updateApp() {
    showToast('🔄 Mise à jour en cours…');
    // 1. Unregister service worker to force fresh install
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        const promises = regs.map(r => r.unregister());
        Promise.all(promises).then(() => {
          // 2. Clear all caches
          if ('caches' in window) {
            caches.keys().then(names => {
              return Promise.all(names.map(name => caches.delete(name)));
            }).then(() => {
              // 3. Hard reload
              showToast('✅ Cache vidé — rechargement…');
              setTimeout(() => window.location.reload(true), 500);
            });
          } else {
            window.location.reload(true);
          }
        });
      });
    } else {
      // No SW — just hard reload
      window.location.reload(true);
    }
  }

  function confirmClearData() {
    if (!confirm('⚠️ Effacer les données locales ?\nLes données voyage seront retéléchargées.\nLe modèle hors-ligne (OPFS) sera aussi supprimé.')) return;
    const afterPurge = () => {
      // Remove cached versions so next reload forces a fresh backend fetch
      // but do NOT wipe tripkit-trips or user-id — just version markers
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('tripkit-version-') || k.endsWith('-data-version') || k.startsWith('tripkit-trip-')) {
          localStorage.removeItem(k);
        }
      });
      // Also clear SW cache (Cache API only — OPFS already purged above)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => location.reload(true));
    };
    // Edge GGUF lives in OPFS — must purge explicitly (clearCache does NOT).
    // The model can survive in OPFS from an earlier session, so bundle-edge is
    // loaded on demand here rather than skipping the purge when it is absent.
    // ensureEdgeBundle est borné par EDGE_BUNDLE_TIMEOUT_MS : cet appel ne peut
    // donc pas rester bloqué, mais il peut échouer.
    ensureEdgeBundle().then(ok => {
      if (ok && typeof EdgeEngine !== 'undefined' && EdgeEngine.purge) {
        Promise.resolve(EdgeEngine.purge()).catch(() => {}).then(afterPurge);
        return;
      }
      // Sans bundle-edge, EdgeEngine.purge est hors de portée : le modèle OPFS
      // survivrait à l'effacement alors que le premier dialogue vient de promettre
      // sa suppression. Et « ce sera purgé au prochain essai » ne tient pas : le
      // prochain essai a besoin du réseau, précisément ce qui manque ici. On dit
      // donc la vérité et on laisse l'utilisateur choisir.
      if (!confirm('⚠️ Le modèle hors-ligne (OPFS) n\'a pas pu être supprimé : ses outils de suppression n\'ont pas pu être chargés (réseau indisponible).\n\nEffacer quand même les autres données locales ?\nLe modèle restera sur l\'appareil ; réessaie avec du réseau pour t\'en débarrasser.')) return;
      afterPurge();
    });
  }

  // ── Swipe navigation (programme tab) ──────────────────────────────────────
  function setupSwipe() {
    let touchStartX = 0, touchStartY = 0;
    const container = document.getElementById('programme-content');
    if (!container) return;
    container.style.touchAction = 'pan-y'; // allow vertical scroll, intercept horizontal
    container.addEventListener('touchstart', e => {
      if (currentTab !== 'programme') return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    container.addEventListener('touchend', e => {
      if (currentTab !== 'programme') return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].screenY - touchStartY);
      // Only trigger if horizontal swipe > 60px and more horizontal than vertical (1.5x ratio)
      if (Math.abs(dx) > 60 && Math.abs(dx) > dy * 1.5) {
        const tripId = Store.getCurrentTripId();
        const tripData = tripId ? Store.getTripData(tripId) : null;
        if (!tripData) return;
        if (dx < 0 && currentDayIndex < tripData.days.length - 1) {
          goToDay(currentDayIndex + 1);
        } else if (dx > 0 && currentDayIndex > 0) {
          goToDay(currentDayIndex - 1);
        }
      }
    }, { passive: true });
  }

  // ── Clear cache (reload button) ───────────────────────────────────────────
  // Cache API + SW only. Does NOT touch OPFS edge model (SPEC-edge-model.md).
  function clearCache() {
    if (!confirm('Vider le cache et recharger ?\n(Le modèle hors-ligne OPFS est conservé.)')) return;
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => location.reload(true));
  }

  // ── Loading state (first visit) ──────────────────────────────────────────
  function showLoading() {
    const el = document.getElementById('programme-content');
    if (el) el.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">\u23f3</div>
      <h3>Chargement du voyage...</h3>
      <p style="color:var(--muted)">Premi\u00e8re connexion au serveur</p>
    </div>`;
  }

  function showOffline() {
    const el = document.getElementById('programme-content');
    if (!el) return;
    const stuck = Store.getCurrentTripId();
    el.innerHTML = `<div class="empty-state">
      <div class="empty-emoji">\u26a0\ufe0f</div>
      <h3>Impossible de charger le voyage</h3>
      <p style="color:var(--muted);max-width:28em;margin:0 auto 12px">
        Le serveur n'a renvoy\u00e9 aucune donn\u00e9e (voyage local p\u00e9rim\u00e9, token, session Authelia, ou aucun voyage accessible).
        ${stuck ? `<br><code style="font-size:.8em">tk-current-trip=${esc(stuck)}</code>` : ''}
      </p>
      <p style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px">
        <button type="button" class="btn" id="tk-boot-retry" style="background:var(--accent);color:#000;font-weight:700">R\u00e9essayer</button>
        <button type="button" class="btn" id="tk-boot-reset-local" style="background:var(--sec);color:#000;font-weight:600">R\u00e9initialiser le local</button>
      </p>
    </div>`;
    const retry = document.getElementById('tk-boot-retry');
    if (retry) retry.onclick = () => location.reload();
    const resetBtn = document.getElementById('tk-boot-reset-local');
    if (resetBtn) {
      resetBtn.onclick = () => {
        try {
          if (typeof API !== 'undefined' && API.clearToken) API.clearToken();
          else localStorage.removeItem('tk-api-token');
          localStorage.removeItem('tk-user-name');
          localStorage.removeItem('tk-user-role');
          const cur = localStorage.getItem('tk-current-trip');
          if (cur) {
            localStorage.removeItem('tk-current-trip');
            localStorage.removeItem(cur + '-data-version');
            localStorage.removeItem('tk-trip-' + cur);
            localStorage.removeItem('tk-seed-loaded-' + cur);
          }
        } catch (_) { /* ignore */ }
        location.reload();
      };
    }
  }

  function showToast(msg, type = 'success') {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    // One toast at a time — avoid stacking that fills the screen.
    wrap.replaceChildren();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    wrap.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode === wrap) toast.remove();
      }, 300);
    }, 2200);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) {
    return String(s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  // ── Public API ────────────────────────────────────────────────────────────
  // ── PWA Install (Android/Chrome native prompt) ────────────────────────
  async function installPWA() {
    if (!_deferredInstallPrompt) {
      showToast('⚠️ Installation non disponible');
      return;
    }
    _deferredInstallPrompt.prompt();
    const result = await _deferredInstallPrompt.userChoice;
    if (result.outcome === 'accepted') {
      showToast('✅ App installée !');
    }
    _deferredInstallPrompt = null;
  }

  // ── No-cache toggle (dev mode) ────────────────────────────────────
  function toggleNoCache(enabled) {
    if (enabled) {
      localStorage.setItem('tripkit_nocache', '1');
      showToast('🛠️ Mode dev activé — images sans cache');
    } else {
      localStorage.removeItem('tripkit_nocache');
      showToast('✅ Cache normal réactivé');
    }
  }

  function paintConstructionNav() {
    const btn = document.getElementById('nav-construction');
    if (!btn) return;
    const enabled = !!Store.get('tk-construction-mode');
    btn.style.display = enabled ? '' : 'none';
  }

  // Visible while Construction is ON (so OFF is always possible) or once
  // publish sources have loaded (authors only). Checking ON used to rebuild
  // Plus with display:none and hide the control before sources came back.
  function constructionToggleVisible() {
    if (Store.get('tk-construction-mode')) return true;
    return !!(typeof PublishPanel !== 'undefined' && PublishPanel.sources && PublishPanel.sources().length);
  }

  function paintConstructionToggle() {
    const wrap = document.getElementById('construction-mode-toggle-wrap');
    const checkbox = document.getElementById('construction-toggle');
    if (!wrap) return;
    const on = !!Store.get('tk-construction-mode');
    wrap.style.display = constructionToggleVisible() ? 'flex' : 'none';
    if (checkbox) checkbox.checked = on;
  }

  /**
   * Toggle Plus = préférence utilisateur (inchangé). Les *données* Construction
   * (phase, lastQA) viennent du voyage chargé : seed + GET /construction.
   */
  async function syncConstructionData(tripId) {
    tripId = tripId || (typeof Store !== 'undefined' && Store.getCurrentTripId && Store.getCurrentTripId());
    if (!tripId || typeof API === 'undefined' || !API.getConstruction) return;
    const res = await API.getConstruction(tripId);
    if (!res || !res.ok || !res.data) return;
    const td = Store.getTripData(tripId);
    if (td) {
      td.trip = td.trip || {};
      td.trip.construction = Object.assign({}, td.trip.construction, res.data);
      Store.setTripData(tripId, td);
    }
    if (currentTab === 'construction' && typeof ConstructionView !== 'undefined' && ConstructionView.render) {
      ConstructionView.render('construction-content', Store.getTripData(tripId));
    }
  }

  function toggleConstructionMode(checked) {
    Store.set('tk-construction-mode', !!checked);
    paintConstructionNav();
    paintConstructionToggle();
    if (checked) {
      showToast('🏗️ Mode construction activé');
    } else {
      showToast('✅ Mode construction désactivé');
      if (currentTab === 'construction') {
        switchTab('programme');
        return;
      }
    }
    // Stay on Plus: the checkbox already flipped. Rebuilding the tab hid it
    // until loadSources finished (or forever if sources were empty/failed).
    if (currentTab === 'construction') renderCurrentTab();
  }

  return {
    switchTab,
    openList,
    selectTrip,
    goToDay,
    showToast,
    reloadAllViews,
    confirmClearData,
    updateApp,
    clearCache,
    installPWA,
    toggleNoCache,
    paintConstructionNav,
    paintConstructionToggle,
    toggleConstructionMode,
    syncConstructionData,
    ensureEdgeBundle,
  };
})();
