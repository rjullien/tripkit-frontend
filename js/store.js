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
  // listId: e.g. "courses-day1-usa2026", "checklist-rene-nicole-usa2026"

  /**
   * Get the checks map for a list: { itemId: { checked: bool, updatedAt: ts } }
   */
  function getChecks(listId) {
    return get(`${listId}-checks`, {});
  }

  /**
   * Toggle an item check. Returns updated checks.
   */
  function toggleCheck(listId, itemId) {
    const checks = getChecks(listId);
    const current = checks[itemId] || { checked: false, updatedAt: 0 };
    checks[itemId] = { checked: !current.checked, updatedAt: Date.now() };
    set(`${listId}-checks`, checks);
    return checks;
  }

  /**
   * Set a check directly (used by sync merge).
   */
  function setCheck(listId, itemId, checked, updatedAt) {
    const checks = getChecks(listId);
    const current = checks[itemId];
    // Only update if incoming is newer
    // Never let server uncheck something the user just checked (within 10s)
    if (current && current.checked && !checked) {
      const age = Date.now() - current.updatedAt;
      if (age < 10000) return checks; // protect recent local check
    }
    if (!current || updatedAt >= current.updatedAt) {
      checks[itemId] = { checked, updatedAt };
      set(`${listId}-checks`, checks);
    }
    return checks;
  }

  /**
   * Get custom items for a list: { customId: { text, section, createdAt } }
   */
  function getCustomItems(listId) {
    return get(`${listId}-custom`, {});
  }

  /**
   * Add a custom item. Starts as local (shared: false).
   */
  function addCustomItem(listId, sectionIndex, text) {
    const items = getCustomItems(listId);
    const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const now = Date.now();
    items[id] = { text, section: sectionIndex, createdAt: now, shared: true };
    set(`${listId}-custom`, items);
    return id;
  }

  /**
   * Toggle shared flag on a custom item.
   */
  function toggleShareItem(listId, itemId) {
    const items = getCustomItems(listId);
    if (items[itemId]) {
      items[itemId].shared = !items[itemId].shared;
      set(`${listId}-custom`, items);
    }
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
    del(`${listId}-custom`);
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
    // Seed
    isSeedLoaded, markSeedLoaded,
    // Lists
    getChecks, toggleCheck, setCheck,
    getCustomItems, addCustomItem, deleteCustomItem, toggleShareItem,
    getHidden, hideItem, restoreItem,
    getLastSyncAt, updateSyncMeta,
    resetList,
    exportList, importList,
  };
})();
