/**
 * Edge intent classifier V1 — keywords / regex (no ML).
 * local → edge if loaded; remote → always Bifrost.
 */
var EdgeIntent = (() => {
  const REMOTE_SIGNALS = [
    /m[ée]t[ée]o/i,
    /prix/i,
    /tarif/i,
    /disponib/i,
    /r[ée]serv/i,
    /horaire.*(bus|train|vol|ferry)/i,
    /actualit/i,
    /ouvert/i,
    /combien.*(co[uû]t|cher)/i,
    /billet/i,
    /wifi|wi-?fi|pin\b|code\s*(porte|acc[eè]s)/i,
    /adresse.*(h[oô]tel|airbnb|logement)/i,
  ];

  /**
   * @param {string} text
   * @returns {'local'|'remote'}
   */
  function classify(text) {
    const t = String(text || '').trim();
    if (!t) return 'remote';
    if (REMOTE_SIGNALS.some(r => r.test(t))) return 'remote';
    return 'local';
  }

  return { classify, REMOTE_SIGNALS };
})();
