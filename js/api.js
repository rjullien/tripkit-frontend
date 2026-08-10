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
    // Device offline → skip. Device "online" is not enough; failures mark unreachable.
    if (!navigator.onLine) return null;
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
        return safeFetch(path, options, true);
      }
      if (!res.ok) {
        console.debug('[API] non-OK:', res.status, path);
        // HTTP from our host ⇒ path exists; treat as reachable unless 0/network.
        if (res.status > 0) setReachable(true);
        return null;
      }
      setReachable(true);
      return await res.json();
    } catch (e) {
      // Network error, CORS, timeout — backend not really usable
      console.debug('[API] error:', e.message, path);
      setReachable(false);
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

    if (!result) {
      enqueueListSync(tripId, listId);
      return { ok: false, changed: false };
    }
    // Drop this pair from outbox on success
    writeOutbox(readOutbox().filter(x => !(x.tripId === tripId && x.listId === listId)));
    // The server is authoritative for SHARED items only. Reconcile the local
    // shared set with the server's merged set:
    //   • add shared items published by other devices (unless locally tombstoned)
    //   • drop local shared items the group no longer has (deleted/retracted by a peer)
    // Local-only items (shared:false) and ALL checks are left untouched.
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
    }

    if (result.serverSyncAt) {
      Store.updateSyncMeta(listId, result.serverSyncAt);
    }
    return { ok: true, changed };
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
   * Stream Leo chat (SSE). Yields { event, data } objects.
   * Events: delta | tool | done | error
   * @param {{ tripId?: string, messages: Array<{role:string,content:string}>, signal?: AbortSignal }} body
   */
  async function* leoChatStream(body = {}) {
    if (!navigator.onLine) {
      yield { event: 'error', data: { code: 'network', error: 'offline' } };
      return;
    }
    const { signal, ...payload } = body || {};
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    let res;
    try {
      res = await fetch(url('/leo/chat/stream'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
      });
    } catch (e) {
      const name = e && e.name;
      const cancelled = !!(signal && signal.aborted);
      yield {
        event: 'error',
        data: {
          code: cancelled ? 'cancelled' : (name === 'AbortError' ? 'timeout' : 'network'),
          error: cancelled ? 'Annulé.' : 'Connexion coupée.',
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
          code: (data && data.code) || 'leo_chat_failed',
          error: (data && data.error) || `HTTP ${res.status}`,
        },
      };
      return;
    }
    setReachable(true);
    if (!res.body || !res.body.getReader) {
      yield { event: 'error', data: { code: 'leo_chat_failed', error: 'Streaming non supporté' } };
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
          if (line.startsWith(':')) continue; // keepalive
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
            continue;
          }
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          }
        }
      }
      if (buf) {
        // trailing incomplete line — ignore
      }
      yield* flush();
    } catch (e) {
      const cancelled = !!(signal && signal.aborted);
      yield {
        event: 'error',
        data: {
          code: cancelled ? 'cancelled' : 'network',
          error: cancelled ? 'Annulé.' : ((e && e.message) || 'stream interrompu'),
        },
      };
    }
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
    setToken, getToken, clearToken,
    getTrips, getTrip, createTrip,
    getDays, getDay,
    getHotels,
    getLists, getList, syncList, backgroundSyncTrip, flushOutbox,
    checkVersion, checkVersionStatus, fetchSeed,
    requestJSON, getPublishSources, createPublishJob, getPublishJob,
    getLeoStatus, leoChat, leoChatStream,
    assetUrl, getBaseUrl, warmTripAssets,
    probe, isReachable, getReachability, onReachabilityChange,
  };
})();
