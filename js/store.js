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
   * List-level share default (Oui/Non).
   * Default TRUE — family lists (avant-de-partir, packing…) publish new custom
   * items to the group unless the user turns the list to local-only.
   * Stored per device preference key `${listId}-list-shared`.
   */
  function isListShared(listId) {
    const v = get(`${listId}-list-shared`, null);
    if (v === null) return true;
    return !!v;
  }

  /**
   * Set list-level share. When turning ON, promote all local custom items to
   * shared (so existing notes join the group). When turning OFF, only affects
   * future adds — already-shared items stay on the server until unshared/deleted.
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
   * Get custom items for a list: { customId: { text, section, createdAt } }
   */
  function getCustomItems(listId) {
    return get(`${listId}-custom`, {});
  }

  /**
   * Add a custom item. shared follows the list-level Oui/Non (default Oui).
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
    getChecks, toggleCheck, setCheck,
    getCustomItems, addCustomItem, deleteCustomItem, toggleShareItem, getCustomDeleted,
    isListShared, setListShared,
    getHidden, hideItem, restoreItem,
    getLastSyncAt, updateSyncMeta,
    resetList,
    exportList, importList,
  };
})();
