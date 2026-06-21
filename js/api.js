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

  function setToken(t) { _token = t; }
  function getToken()  { return _token || localStorage.getItem('tk-api-token'); }

  function url(path) {
    return `${BASE_URL}${API_PREFIX}${path}`;
  }

  // ── Core fetch (fire-and-forget safe) ─────────────────────────────────────

  /**
   * Non-blocking fetch. Returns a promise but callers may ignore it.
   * On any error: logs, returns null. NEVER throws to caller.
   */
  async function safeFetch(path, options = {}) {
    if (!navigator.onLine) return null; // skip when offline
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
        signal: AbortSignal.timeout(8000), // never block more than 8s
      });
      if (!res.ok) {
        console.debug('[API] non-OK:', res.status, path);
        return null;
      }
      return await res.json();
    } catch (e) {
      // Network error, CORS, timeout — all silent
      console.debug('[API] error:', e.message, path);
      return null;
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
  async function syncList(tripId, listId) {
    const deviceId = Store.getDeviceId();
    const lastSyncAt = Store.getLastSyncAt(listId);
    const checks = Store.getChecks(listId);
    const allCustom = Store.getCustomItems(listId);
    // Only sync shared items (shared: true or received from another device)
    const custom = {};
    Object.entries(allCustom).forEach(([id, item]) => {
      if (item.shared !== false) custom[id] = item;
    });
    const hidden = [...Store.getHidden(listId)];

    const result = await safeFetch(`/trips/${tripId}/lists/${listId}/sync`, {
      method: 'PATCH',
      body: JSON.stringify({ deviceId, lastSyncAt, checks, custom, hidden }),
    });

    if (!result) return; // backend unreachable — no-op

    // Apply merged state to localStorage (per-item timestamp wins)
    if (result.merged?.checks) {
      Object.entries(result.merged.checks).forEach(([itemId, state]) => {
        Store.setCheck(listId, itemId, state.checked, state.updatedAt);
      });
    }
    if (result.merged?.custom) {
      const existing = Store.getCustomItems(listId);
      Object.entries(result.merged.custom).forEach(([id, item]) => {
        if (!existing[id]) {
          // new item from another device — mark as shared
          const cur = Store.getCustomItems(listId);
          cur[id] = { ...item, shared: true };
          Store.set(`${listId}-custom`, cur);
        }
      });
    }
    if (result.hidden) {
      Store.set(`${listId}-hidden`, result.hidden);
    }
    if (result.serverSyncAt) {
      Store.updateSyncMeta(listId, result.serverSyncAt);
    }
  }

  /**
   * Background sync all lists for a trip (called on app startup if online).
   */
  function backgroundSyncTrip(tripId) {
    if (!navigator.onLine || !getToken()) return;
    // Async, fire-and-forget
    setTimeout(async () => {
      const lists = await getLists(tripId);
      if (!lists) return;
      for (const listMeta of (lists.lists || [])) {
        await syncList(tripId, listMeta.id);
        await new Promise(r => setTimeout(r, 200)); // small delay between syncs
      }
    }, 2000); // delay 2s after boot
  }

  // ── Version check (lightweight, 3s timeout) ──────────────────────────────

  /**
   * Check data version (~50 bytes response, 3s hard cutoff).
   * Returns {version, updated_at} or null if unreachable/slow/offline.
   */
  async function checkVersion(tripId) {
    if (!navigator.onLine) return null;
    try {
      const token = getToken();
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };
      const res = await fetch(url(`/trips/${tripId}/version`), {
        headers,
        signal: AbortSignal.timeout(3000), // 3s hard cutoff — no debit = skip
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.debug('[API] version check skipped:', e.message);
      return null;
    }
  }

  // ── Seed / full data from backend ─────────────────────────────────────────

  /**
   * Fetch full trip seed data (only when version changed).
   * Returns null if backend unavailable.
   */
  async function fetchSeed(tripId) {
    return safeFetch(`/trips/${tripId}/seed`);
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

  /** Backend base URL (without /api prefix). */
  function getBaseUrl() { return BASE_URL; }

  return {
    setToken, getToken,
    getTrips, getTrip, createTrip,
    getDays, getDay,
    getHotels,
    getLists, getList, syncList, backgroundSyncTrip,
    checkVersion, fetchSeed,
    assetUrl, getBaseUrl,
  };
})();
