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
    const deletedCustom = Store.getCustomDeleted(listId);

    // Only SHARED custom items leave the device. Checks and hidden are
    // strictly local (per device) and are never sent or received.
    const allCustom = Store.getCustomItems(listId);
    const sharedCustom = {};
    Object.entries(allCustom).forEach(([id, item]) => {
      if (item.shared) sharedCustom[id] = { text: item.text, section: item.section, createdAt: item.createdAt };
    });

    const result = await safeFetch(`/trips/${tripId}/lists/${listId}/sync`, {
      method: 'PATCH',
      body: JSON.stringify({ deviceId, custom: sharedCustom, deletedCustom }),
    });

    if (!result) return; // backend unreachable — no-op

    // The server is authoritative for SHARED items only. Reconcile the local
    // shared set with the server's merged set:
    //   • add shared items published by other devices (unless locally tombstoned)
    //   • drop local shared items the group no longer has (deleted/retracted by a peer)
    // Local-only items (shared:false) and ALL checks are left untouched.
    if (result.merged) {
      const serverShared = result.merged.custom || {};
      const tombstones = Store.getCustomDeleted(listId);
      const cur = Store.getCustomItems(listId);
      let changed = false;

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
    }

    if (result.serverSyncAt) {
      Store.updateSyncMeta(listId, result.serverSyncAt);
    }
  }

  /**
   * Background sync all lists for a trip (called on app startup if online).
   */
  function backgroundSyncTrip(tripId) {
    // Disabled: background sync at startup caused race conditions with user
    // interactions (items disappearing, checks reverting). Sync now only
    // happens on explicit user actions (check, add, delete).
    // The next page load will still get fresh data from the seed endpoint.
    return;
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
