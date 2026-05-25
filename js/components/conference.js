/**
 * conference.js — Conference session switcher component
 *
 * Data-driven: reads day.conference { sessions: { person: Session[] } }
 * Renders toggle between attendees + session cards with badges.
 */

var ConferenceView = (() => {

  const BADGE_COLORS = {
    keynote:   { bg: 'rgba(255,170,51,.15)', color: '#ffaa33', label: '🎤 Keynote' },
    breakout:  { bg: 'rgba(78,205,196,.12)', color: '#4ecdc4', label: '📋 Breakout' },
    lightning: { bg: 'rgba(156,136,255,.12)', color: '#9c88ff', label: '⚡ Lightning' },
    meeting:   { bg: 'rgba(255,107,107,.12)', color: '#ff6b6b', label: '🤝 Meeting' },
    party:     { bg: 'rgba(255,170,51,.12)', color: '#ffaa33', label: '🎉 Social' },
    bof:       { bg: 'rgba(78,205,196,.08)', color: '#4ecdc4', label: '💬 BoF' },
  };

  /**
   * Render conference component.
   * @param {Object} conf — day.conference { dayLabel?, sessions: { person: Session[] } }
   * @param {Object} [opts] — { defaultPerson?, dayNum? }
   * @returns {string} HTML
   */
  function render(conf, opts) {
    if (!conf || !conf.sessions) return '';
    opts = opts || {};

    const people = Object.keys(conf.sessions);
    if (!people.length) return '';

    const defaultPerson = opts.defaultPerson || people[0];
    const dayNum = opts.dayNum || 0;
    const id = 'conf-' + dayNum;

    let html = `<div class="card" style="margin-top:16px">
      <h3>🎪 Conférence${conf.dayLabel ? ' — ' + esc(conf.dayLabel) : ''}</h3>`;

    // Toggle buttons
    if (people.length > 1) {
      html += `<div style="display:flex;gap:8px;margin-bottom:12px">`;
      people.forEach(person => {
        const count = conf.sessions[person].length;
        const isActive = person === defaultPerson;
        html += `<button id="${id}-btn-${person}" class="conf-toggle${isActive ? ' active' : ''}" 
          onclick="ConferenceView.switchPerson('${id}','${person}',${JSON.stringify(people)})">
          ${esc(capitalize(person))} (${count})
        </button>`;
      });
      html += `</div>`;
    }

    // Session lists (show default, hide others)
    people.forEach(person => {
      const isActive = person === defaultPerson;
      html += `<div id="${id}-sessions-${person}" style="${isActive ? '' : 'display:none'}">`;
      html += renderSessions(conf.sessions[person]);
      html += `</div>`;
    });

    html += `</div>`;
    return html;
  }

  function renderSessions(sessions) {
    if (!sessions || !sessions.length) return '<div style="color:var(--muted);font-size:.85em">Aucune session</div>';
    
    let html = `<div class="conf-sessions">`;
    sessions.forEach(s => {
      const badge = BADGE_COLORS[s.badge] || BADGE_COLORS.breakout;
      html += `<div class="conf-session${s.shared ? ' shared' : ''}" style="border-left:3px solid ${badge.color}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span class="conf-time">${esc(s.t)}</span>
            <span class="conf-badge" style="background:${badge.bg};color:${badge.color}">${badge.label}</span>
          </div>
          ${s.code ? '<span class="conf-code">' + esc(s.code) + '</span>' : ''}
        </div>
        <div class="conf-title">${esc(s.title)}</div>
        ${s.room ? '<div class="conf-room">📍 ' + esc(s.room) + '</div>' : ''}
        ${s.note ? '<div class="conf-note">💡 ' + esc(s.note) + '</div>' : ''}
      </div>`;
    });
    html += `</div>`;
    return html;
  }

  function switchPerson(id, person, people) {
    people.forEach(p => {
      const el = document.getElementById(id + '-sessions-' + p);
      const btn = document.getElementById(id + '-btn-' + p);
      if (el) el.style.display = (p === person) ? '' : 'none';
      if (btn) btn.classList.toggle('active', p === person);
    });
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, switchPerson };
})();
