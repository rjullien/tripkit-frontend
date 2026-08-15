/**
 * construction-view.js — Construction mode tab view.
 * Renders the construction Leo chat widget (ideation mode).
 */
var ConstructionView = (() => {

  let _leoInstance = null;

  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="page-header"><h1>🏗️ Mode Construction</h1></div>
      <div id="construction-leo-section"></div>`;

    // Create or reuse the construction Leo instance
    if (typeof LeoChatStream !== 'undefined' && LeoChatStream.create) {
      if (!_leoInstance) {
        _leoInstance = LeoChatStream.create({
          prefix: 'construction-leo',
          mode: 'construction:ideation',
          storageKey: 'tk-construction-leo',
        });
      }
      const leoEl = document.getElementById('construction-leo-section');
      if (leoEl) {
        LeoChatStream.loadStatus().then(() => {
          _leoInstance.renderSection(leoEl);
        });
      }
    }
  }

  return { render };
})();
