/**
 * Edge prompt builder — short system prompt (Safari memory).
 */
var EdgePrompt = (() => {
  const SYSTEM = [
    'Assistant voyage TripKit hors-ligne.',
    'Réponds en français, court, utile (tips culture / rythme / que voir).',
    'Pas d’accès météo, prix, résas, horaires live — dis de poser ça à Bifrost.',
  ].join(' ');

  function tripContext() {
    try {
      if (typeof Store === 'undefined') return '';
      const tripId = Store.getCurrentTripId && Store.getCurrentTripId();
      if (!tripId) return '';
      const data = Store.getTripData && Store.getTripData(tripId);
      if (!data) return '';
      const name = data.name || data.title || tripId;
      const dests = Array.isArray(data.destinations)
        ? data.destinations.map(d => (typeof d === 'string' ? d : (d && d.name) || '')).filter(Boolean)
        : [];
      const parts = [`Voyage : ${name}`];
      if (dests.length) parts.push(`Destinations : ${dests.slice(0, 4).join(', ')}`);
      return parts.join('. ') + '.';
    } catch (_) {
      return '';
    }
  }

  /**
   * @param {string} userText
   * @param {{role:string,content:string}[]} [history]
   * @returns {{role:string,content:string}[]}
   */
  function buildMessages(userText, history) {
    const sys = SYSTEM + (tripContext() ? ' ' + tripContext() : '');
    const msgs = [{ role: 'system', content: sys }];
    const hist = Array.isArray(history) ? history.slice(-2) : [];
    for (const m of hist) {
      if (!m || !m.content) continue;
      if (m.role === 'user' || m.role === 'assistant') {
        msgs.push({ role: m.role, content: String(m.content).slice(0, 400) });
      }
    }
    msgs.push({ role: 'user', content: String(userText || '').slice(0, 500) });
    return msgs;
  }

  return { SYSTEM, tripContext, buildMessages };
})();
