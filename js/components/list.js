/**
 * list.js — Universal List Component
 * Renders any list type: shopping, packing, todo, inventory, custom
 * Same features everywhere: check, hide, custom items, progress, export/import
 */
var ListComponent = (() => {

  /**
   * Render a complete list into a container element.
   * @param {string} containerId - DOM element id to render into
   * @param {object} listData - { id, type, title, subtitle, store?, sections[], links[] }
   */
  function render(containerId, listData) {
    const el = document.getElementById(containerId);
    if (!el || !listData) return;

    const listId = listData.id;
    Store.migrateLegacyListShare(listId);
    const checks = Store.getChecks(listId);
    const custom = Store.getCustomItems(listId);
    const hidden = Store.getHidden(listId);

    // Compute totals
    let totalItems = 0, totalChecked = 0;

    // Build sections HTML
    let sectionsHtml = '';
    listData.sections.forEach((section, si) => {
      // Built-in items (not hidden)
      const builtinItems = section.items || [];
      const visibleItems = builtinItems.filter(it => !hidden.has(it.id));
      const hiddenItems = builtinItems.filter(it => hidden.has(it.id));

      // Custom items for this section
      const customForSection = Object.entries(custom)
        .filter(([, c]) => c.section === si)
        .map(([id, c]) => ({ id: 'custom-' + id, text: c.text, note: null, _customId: id, _isCustom: true, _shared: !!c.shared }));

      const allItems = [...visibleItems, ...customForSection];
      const sectionChecked = allItems.filter(it => checks[it.id]?.checked).length;
      const sectionTotal = allItems.length;
      totalItems += sectionTotal;
      totalChecked += sectionChecked;

      const allDone = sectionTotal > 0 && sectionChecked === sectionTotal;

      // Section header
      sectionsHtml += `<div class="section-wrap" data-section="${si}">
        <div class="section-head" data-action="toggle-section" data-section="${si}">
          <span class="s-emoji">${esc(section.emoji || '📋')}</span>
          <span class="s-title">${esc(section.title)}</span>
          ${section.subtitle ? `<span style="font-size:.72em;color:var(--muted);margin-right:4px">${esc(section.subtitle)}</span>` : ''}
          <span class="s-count">${sectionChecked}/${sectionTotal}</span>
          <span class="s-chevron">▼</span>
        </div>
        <div class="section-body">`;

      // Visible items
      visibleItems.forEach(item => {
        const isChecked = checks[item.id]?.checked;
        sectionsHtml += renderItem(item, isChecked, false, listId);
      });

      // Custom items
      customForSection.forEach(item => {
        const isChecked = checks[item.id]?.checked;
        sectionsHtml += renderCustomItem(item, isChecked, listId);
      });

      // Hidden items toggle
      if (hiddenItems.length > 0) {
        sectionsHtml += `<button class="hidden-toggle" data-action="toggle-hidden" data-section="${si}">
          👁️ ${hiddenItems.length} masqué${hiddenItems.length > 1 ? 's' : ''}</button>`;
        sectionsHtml += `<div class="hidden-list" data-hidden-section="${si}" style="display:none">`;
        hiddenItems.forEach(item => {
          sectionsHtml += `<div class="list-item is-hidden" data-item="${item.id}">
            <div class="item-label">${item.text}</div>
            <button class="item-restore-btn" data-action="restore" data-item="${item.id}">Restaurer</button>
          </div>`;
        });
        sectionsHtml += `</div>`;
      }

      // Add custom item button
      sectionsHtml += `<button class="add-item-btn" data-action="add-custom" data-section="${si}">
        <span class="plus-icon">+</span> Ajouter un item…</button>`;

      // Add input row (hidden by default)
      sectionsHtml += `<div class="add-input-row" data-input-section="${si}" style="display:none">
        <input type="text" placeholder="Nouvel item…" data-input-field="${si}">
        <button class="btn-confirm" data-action="confirm-add" data-section="${si}">OK</button>
        <button class="btn-cancel" data-action="cancel-add" data-section="${si}">✕</button>
      </div>`;

      sectionsHtml += `</div></div>`;
    });

    // Progress
    const pct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

    // Store card (for shopping type)
    let storeHtml = '';
    if (listData.store) {
      const s = listData.store;
      storeHtml = `<div class="store-card">
        <div class="store-name">📍 ${esc(s.name)}</div>
        <div class="store-meta">
          ${s.address ? `<div>${esc(s.address)}</div>` : ''}
          ${s.hours ? `<div>🕐 ${esc(s.hours)}</div>` : ''}
          ${s.mapsUrl ? `<div><a href="${esc(s.mapsUrl)}" target="_blank">📍 Ouvrir dans Maps</a></div>` : ''}
        </div>
      </div>`;
    }

    // Links — always include a bottom ← Retour (packing/valise lists are long;
    // seed links often omit it while shopping/todo lists have it).
    const links = Array.isArray(listData.links) ? listData.links.slice() : [];
    const hasRetour = links.some((l) => /retour/i.test(String(l && l.label || '')));
    if (!hasRetour) {
      links.unshift({ label: '← Retour', url: '#plus', style: 'muted' });
    }
    let linksHtml = '';
    if (links.length) {
      linksHtml = `<div class="btn-row">`;
      links.forEach(l => {
        const cls = l.style ? `btn btn-${l.style}` : 'btn btn-muted';
        linksHtml += `<a href="${esc(l.url)}" class="${cls}">${esc(l.label)}</a>`;
      });
      linksHtml += `</div>`;
    }

    // Assemble
    el.innerHTML = `
      <div class="page-header">
        <button class="back-btn" onclick="window.location.hash='plus'">◀ Retour</button>
        <h1>${esc(listData.title)}</h1>
        ${listData.subtitle ? `<div class="sub">${esc(listData.subtitle)}</div>` : ''}
      </div>
      <div class="list-sync-bar ${syncClass(listId)}" data-sync-bar="${esc(listId)}">
        <span class="list-sync-text">${esc(syncLabel(listId))}</span>
      </div>
      ${storeHtml}
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-text">${totalChecked}/${totalItems} — ${pct}%</div>
      </div>
      ${sectionsHtml}
      <div class="btn-row">
        <button class="btn btn-accent" data-action="export">📤 Export</button>
        <button class="btn btn-orange" data-action="import">📥 Import</button>
        <button class="btn btn-red" data-action="reset">🗑️ Reset</button>
      </div>
      ${linksHtml}
    `;

    // Bind events via delegation
    bindEvents(el, listData);
  }

  function renderItem(item, isChecked, isHidden, listId) {
    return `<div class="list-item${isChecked ? ' checked' : ''}" data-action="check" data-item="${esc(item.id)}">
      <div class="item-check"></div>
      <div class="item-label">
        ${esc(item.text)}
        ${item.note ? `<span class="item-note">${esc(item.note)}</span>` : ''}
      </div>
      <button class="item-action-btn" data-action="hide" data-item="${esc(item.id)}" title="Masquer">✕</button>
    </div>`;
  }

  function renderCustomItem(item, isChecked, listId) {
    const shareBtn = item._shared
      ? `<button class="item-share-btn shared" data-action="toggle-share" data-custom-id="${esc(item._customId)}" title="Partagé avec le groupe — appuyer pour garder en local">☁️</button>`
      : `<button class="item-share-btn" data-action="toggle-share" data-custom-id="${esc(item._customId)}" title="Local — appuyer pour partager avec le groupe">🔒</button>`;
    return `<div class="list-item custom${isChecked ? ' checked' : ''}" data-action="check" data-item="${esc(item.id)}">
      <div class="item-check"></div>
      <div class="item-label">${esc(item.text)}</div>
      ${shareBtn}
      <button class="item-delete-btn" data-action="delete-custom" data-custom-id="${esc(item._customId)}" title="Supprimer">🗑</button>
    </div>`;
  }

  function bindEvents(el, listData) {
    // Always refresh current list data — handlers read from here (no stale closure).
    el._listData = listData;

    // Bind once per container. Re-render replaces innerHTML; stacking click
    // listeners used to fire N toasts (and toggle share N times) per tap.
    if (el._listHandlersBound) return;
    el._listHandlersBound = true;

    el.addEventListener('click', (e) => {
      const data = el._listData;
      if (!data) return;
      const listId = data.id;
      const target = e.target.closest('[data-action]');
      if (!target || !el.contains(target)) return;

      const action = target.dataset.action;

      switch (action) {
        case 'check': {
          const itemId = target.dataset.item;
          if (!itemId) return;
          Store.toggleCheck(listId, itemId);
          render(el.id, data);
          backgroundSync(data);
          break;
        }
        case 'hide': {
          e.stopPropagation();
          const itemId = target.dataset.item;
          Store.hideItem(listId, itemId);
          render(el.id, data);
          backgroundSync(data);
          break;
        }
        case 'restore': {
          const itemId = target.dataset.item;
          Store.restoreItem(listId, itemId);
          render(el.id, data);
          backgroundSync(data);
          break;
        }
        case 'toggle-section': {
          const head = target;
          const si = head.dataset.section;
          const body = el.querySelector(`.section-wrap[data-section="${si}"] .section-body`);
          if (body) {
            body.classList.toggle('hidden');
            head.classList.toggle('collapsed');
          }
          break;
        }
        case 'toggle-hidden': {
          const si = target.dataset.section;
          const hiddenList = el.querySelector(`[data-hidden-section="${si}"]`);
          if (hiddenList) {
            hiddenList.style.display = hiddenList.style.display === 'none' ? 'block' : 'none';
          }
          break;
        }
        case 'add-custom': {
          const si = target.dataset.section;
          const inputRow = el.querySelector(`[data-input-section="${si}"]`);
          if (inputRow) {
            inputRow.style.display = 'flex';
            target.style.display = 'none';
            const input = inputRow.querySelector('input');
            if (input) input.focus();
          }
          break;
        }
        case 'confirm-add': {
          const si = parseInt(target.dataset.section);
          const input = el.querySelector(`[data-input-field="${si}"]`);
          if (input && input.value.trim()) {
            Store.addCustomItem(listId, si, input.value.trim());
            render(el.id, data);
            backgroundSync(data);
          }
          break;
        }
        case 'cancel-add': {
          const si = target.dataset.section;
          const inputRow = el.querySelector(`[data-input-section="${si}"]`);
          const addBtn = el.querySelector(`.add-item-btn[data-section="${si}"]`);
          if (inputRow) inputRow.style.display = 'none';
          if (addBtn) addBtn.style.display = 'flex';
          break;
        }
        case 'delete-custom': {
          e.stopPropagation();
          const customId = target.dataset.customId;
          if (customId) {
            Store.deleteCustomItem(listId, customId);
            render(el.id, data);
            backgroundSync(data);
          }
          break;
        }
        case 'toggle-share': {
          e.stopPropagation();
          const customId = target.dataset.customId;
          if (customId) {
            Store.toggleShareItem(listId, customId);
            render(el.id, data);
            backgroundSync(data);
            // No toast — ☁️/🔒 on the row is enough feedback.
          }
          break;
        }
        case 'export': {
          doExport(data);
          break;
        }
        case 'import': {
          doImport(el.id, data);
          break;
        }
        case 'reset': {
          if (confirm('Réinitialiser toutes les cases ?')) {
            Store.resetList(listId);
            render(el.id, data);
            showToast('✅ Liste réinitialisée');
          }
          break;
        }
      }
    });

    // Delegated — survives innerHTML re-renders (per-input binds used to die).
    el.addEventListener('keydown', (e) => {
      const input = e.target.closest('[data-input-field]');
      if (!input || !el.contains(input)) return;
      if (e.key === 'Enter') {
        const si = parseInt(input.dataset.inputField);
        const btn = el.querySelector(`[data-action="confirm-add"][data-section="${si}"]`);
        if (btn) btn.click();
      }
      if (e.key === 'Escape') {
        const si = input.dataset.inputField;
        const btn = el.querySelector(`[data-action="cancel-add"][data-section="${si}"]`);
        if (btn) btn.click();
      }
    });
  }

  function doExport(listData) {
    const data = Store.exportList(listData.id);
    const json = JSON.stringify(data, null, 2);

    // Also build readable text
    const checks = Store.getChecks(listData.id);
    let text = `${listData.title}\n`;
    if (listData.subtitle) text += `${listData.subtitle}\n`;
    text += '\n';
    listData.sections.forEach((section) => {
      text += `${section.emoji || ''} ${section.title}\n`;
      (section.items || []).forEach(item => {
        const c = checks[item.id]?.checked ? '✅' : '⬜';
        text += `  ${c} ${item.text}\n`;
      });
      text += '\n';
    });

    if (navigator.share) {
      navigator.share({ title: listData.title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(json).then(() => {
        showToast('📋 Copié dans le presse-papier');
      }).catch(() => {});
    }
  }

  function doImport(containerId, listData) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          Store.importList(listData.id, data);
          render(containerId, listData);
          showToast('✅ Importé !');
          backgroundSync(listData);
        } catch (err) {
          showToast('❌ ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /** Sync status shown in the list header — a failing sync must be visible. */
  function syncLabel(listId) {
    const s = Store.getSyncState(listId);
    if (!s) return '⏳ Synchro…';
    if (s.state === 'ok') return '☁️ Synchronisé ' + ago(s.at);
    if (s.state === 'offline') return '🔌 ' + s.message;
    return '⚠️ ' + s.message;
  }

  function syncClass(listId) {
    const s = Store.getSyncState(listId);
    return s ? 'sync-' + s.state : 'sync-pending';
  }

  function ago(ts) {
    const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (sec < 10) return 'à l’instant';
    if (sec < 60) return 'il y a ' + sec + ' s';
    const min = Math.round(sec / 60);
    if (min < 60) return 'il y a ' + min + ' min';
    return 'il y a ' + Math.round(min / 60) + ' h';
  }

  /** Repaint the status bar only — a full re-render steals taps mid-list. */
  function paintSync(containerId, listId) {
    const el = document.getElementById(containerId);
    const bar = el && el.querySelector('.list-sync-bar');
    if (!bar || bar.dataset.syncBar !== listId) return;
    bar.className = 'list-sync-bar ' + syncClass(listId);
    const text = bar.querySelector('.list-sync-text');
    if (text) text.textContent = syncLabel(listId);
  }

  function backgroundSync(listData) {
    const tripId = Store.getCurrentTripId();
    if (tripId && typeof API !== 'undefined') {
      return API.syncList(tripId, listData.id, { mode: 'push' }).then((res) => {
        const el = document.getElementById('plus-content');
        const onList = el && el._listData && el._listData.id === listData.id;
        if (res && res.changed && onList) {
          render('plus-content', listData);
        } else if (onList) {
          paintSync('plus-content', listData.id);
        }
        return res;
      }).catch(() => null);
    }
    return Promise.resolve(null);
  }

  /**
   * Pull shared customs + checks when opening a list (Nicole sees René's ticks).
   * Re-renders if the merge brought new state.
   * Pull mode sends no checks so stale local timestamps cannot wipe peers.
   */
  function pullOnOpen(containerId, listData) {
    const tripId = Store.getCurrentTripId();
    if (!tripId || typeof API === 'undefined' || !listData) return;
    API.syncList(tripId, listData.id, { mode: 'pull' }).then((res) => {
      if (res && res.changed) render(containerId, listData);
      else paintSync(containerId, listData.id);
    }).catch(() => {});
  }

  /** While a list is open, re-pull periodically so peer ticks appear without leaving. */
  let _pullTimer = null;
  let _pullCtx = null; // { containerId, listId }

  function stopPullWhileOpen() {
    if (_pullTimer) {
      clearInterval(_pullTimer);
      _pullTimer = null;
    }
    _pullCtx = null;
  }

  function startPullWhileOpen(containerId, listData) {
    stopPullWhileOpen();
    if (!listData || !listData.id) return;
    _pullCtx = { containerId, listId: listData.id, listData };
    pullOnOpen(containerId, listData);
    _pullTimer = setInterval(() => {
      if (!_pullCtx) return;
      // Only if still viewing this list in the DOM
      const el = document.getElementById(_pullCtx.containerId);
      if (!el || !el.querySelector('.list-sync-bar')) {
        stopPullWhileOpen();
        return;
      }
      pullOnOpen(_pullCtx.containerId, _pullCtx.listData);
    }, 12000);
  }

  function showToast(msg, type = 'success') {
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(msg, type);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render, pullOnOpen, startPullWhileOpen, stopPullWhileOpen, paintSync };
})();
