/**
 * construction-view.js — Construction mode tab view (placeholder)
 * Renders a simple "Mode Construction" empty state until real content is added.
 */
var ConstructionView = (() => {

  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="page-header"><h1>🏗️ Mode Construction</h1></div>
      <div class="empty-state">
        <div class="empty-emoji">🏗️</div>
        <h3>Mode Construction</h3>
        <p style="color:var(--muted)">Cette vue sera enrichie prochainement.</p>
      </div>`;
  }

  return { render };
})();
