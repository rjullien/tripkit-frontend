/**
 * Edge prompt builder — system prompt + trip context from Store (local only).
 */
var EdgePrompt = (() => {
  const SYSTEM = [
    'Tu es l’assistant voyage TripKit (mode hors-ligne, modèle embarqué).',
    'Tu réponds aux questions générales sur les voyages : rythme, culture, conseils pratiques, que voir/faire.',
    'Tu n’as PAS accès à : météo live, prix, disponibilités, réservations, horaires transports.',
    'Si la question nécessite des données live, dis : « Pour ça, reconnecte-toi et repose la question — je te redirigerai vers l’assistant complet. »',
    'Style : français, concis, chaleureux, utile. Pas de jargon technique.',
  ].join(' ');

  function tripContext() {
    try {
      if (typeof Store === 'undefined') return '';
      const tripId = Store.getCurrentTripId && Store.getCurrentTripId();
      if (!tripId) return '';
      const data = Store.getTripData && Store.getTripData(tripId);
      if (!data) return '';
      const name = data.name || data.title || tripId;
      const start = data.startDate || data.start || '';
      const end = data.endDate || data.end || '';
      const dests = Array.isArray(data.destinations)
        ? data.destinations.map(d => (typeof d === 'string' ? d : (d && d.name) || '')).filter(Boolean)
        : [];
      const parts = [`Voyage : ${name}`];
      if (start || end) parts.push(`Dates : ${start}${end ? ' → ' + end : ''}`);
      if (dests.length) parts.push(`Destinations : ${dests.slice(0, 8).join(', ')}`);
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
    const sys = SYSTEM + (tripContext() ? '\n\nContexte trip : ' + tripContext() : '');
    const msgs = [{ role: 'system', content: sys }];
    const hist = Array.isArray(history) ? history.slice(-6) : [];
    for (const m of hist) {
      if (!m || !m.content) continue;
      if (m.role === 'user' || m.role === 'assistant') {
        msgs.push({ role: m.role, content: String(m.content) });
      }
    }
    msgs.push({ role: 'user', content: String(userText || '') });
    return msgs;
  }

  return { SYSTEM, tripContext, buildMessages };
})();
