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
        .map(([id, c]) => ({ id: 'custom-' + id, text: c.text, note: null, _customId: id, _isCustom: true, _shared: c.shared !== false }));

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

    // Links
    let linksHtml = '';
    if (listData.links && listData.links.length) {
      linksHtml = `<div class="btn-row">`;
      listData.links.forEach(l => {
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
    return `<div class="list-item custom${isChecked ? ' checked' : ''}" data-action="check" data-item="${esc(item.id)}">
      <div class="item-check"></div>
      <div class="item-label">${esc(item.text)} <span class="item-cloud">☁️</span></div>
      <button class="item-delete-btn" data-action="delete-custom" data-custom-id="${esc(item._customId)}" title="Supprimer">🗑</button>
    </div>`;
  }

  function bindEvents(el, listData) {
    // Store current listData on element for handler access
    el._listData = listData;
    // Prevent stacking event listeners on re-render of same list
    if (el._listBoundId === listData.id) return;
    el._listBoundId = listData.id;
    const listId = listData.id;

    el.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      switch (action) {
        case 'check': {
          const itemId = target.dataset.item;
          if (!itemId) return;
          Store.toggleCheck(listId, itemId);
          render(el.id, listData);
          backgroundSync(listData);
          break;
        }
        case 'hide': {
          e.stopPropagation();
          const itemId = target.dataset.item;
          Store.hideItem(listId, itemId);
          render(el.id, listData);
          backgroundSync(listData);
          break;
        }
        case 'restore': {
          const itemId = target.dataset.item;
          Store.restoreItem(listId, itemId);
          render(el.id, listData);
          backgroundSync(listData);
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
            render(el.id, listData);
            backgroundSync(listData);
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
            render(el.id, listData);
            backgroundSync(listData);
          }
          break;
        }
        case 'toggle-share': {
          e.stopPropagation();
          const customId = target.dataset.customId;
          if (customId) {
            const updated = Store.toggleShareItem(listId, customId);
            render(el.id, listData);
            if (updated && updated.shared) {
              backgroundSync(listData);
              showToast('☁️ Partagé avec le groupe');
            } else {
              showToast('🔒 Gardé en local');
            }
          }
          break;
        }
        case 'export': {
          doExport(listData);
          break;
        }
        case 'import': {
          doImport(el.id, listData);
          break;
        }
        case 'reset': {
          if (confirm('Réinitialiser toutes les cases ?')) {
            Store.resetList(listId);
            render(el.id, listData);
            showToast('✅ Liste réinitialisée');
          }
          break;
        }
      }
    });

    // Enter key on add input
    el.querySelectorAll('[data-input-field]').forEach(input => {
      input.addEventListener('keydown', (e) => {
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

  function backgroundSync(listData) {
    const tripId = Store.getCurrentTripId();
    if (tripId && typeof API !== 'undefined') {
      API.syncList(tripId, listData.id);
    }
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

  return { render };
})();
