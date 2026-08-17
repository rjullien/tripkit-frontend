/* ==== bundle-edge.js — généré par scripts/build-bundles.mjs, ne pas éditer ==== */
/* Sources (7), dans l'ordre de bundles.json. */
;
/* ==== js/edge-model/config.js ==== */
/**
 * Edge model config — defaults + optional fetch of /edge-model.json (SoT mirror).
 * Spec: SPEC-edge-model.md (rjullien/tripkit).
 */
var EdgeModelConfig = (() => {
  const LS_VERSION = 'tk-edge-model-version';
  const LS_SIZE = 'tk-edge-model-size';

  const DEFAULTS = {
    enabled: true,
    modelUrl: 'https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf',
    modelVersion: 'qwen2.5-0.5b-instruct-q4km-v1',
    modelSizeBytes: 397808192,
    runtime: 'wllama',
    maxTokens: 128,
    temperature: 0.7,
    intentClassifier: 'keywords-v1',
    fallbackToBifrost: true,
    minRamMB: 1024,
  };

  let _cfg = Object.assign({}, DEFAULTS);
  let _loaded = false;

  async function load() {
    try {
      const res = await fetch('edge-model.json', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        _cfg = Object.assign({}, DEFAULTS, data || {});
      }
    } catch (_) {
      /* keep defaults */
    }
    _loaded = true;
    return _cfg;
  }

  function get() {
    return _cfg;
  }

  function storedVersion() {
    try { return localStorage.getItem(LS_VERSION) || ''; } catch (_) { return ''; }
  }

  function setStoredVersion(v, size) {
    try {
      if (v) localStorage.setItem(LS_VERSION, v);
      if (size != null) localStorage.setItem(LS_SIZE, String(size));
    } catch (_) { /* ignore */ }
  }

  function clearStoredMeta() {
    try {
      localStorage.removeItem(LS_VERSION);
      localStorage.removeItem(LS_SIZE);
    } catch (_) { /* ignore */ }
  }

  function storedSize() {
    try {
      const n = parseInt(localStorage.getItem(LS_SIZE) || '0', 10);
      return Number.isFinite(n) ? n : 0;
    } catch (_) { return 0; }
  }

  function needsUpdate() {
    const cur = storedVersion();
    return !!cur && cur !== _cfg.modelVersion;
  }

  return {
    load,
    get,
    storedVersion,
    setStoredVersion,
    clearStoredMeta,
    storedSize,
    needsUpdate,
    LS_VERSION,
  };
})();
;
/* ==== js/edge-model/intent.js ==== */
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
;
/* ==== js/edge-model/prompt-builder.js ==== */
/**
 * Edge prompt builder — system prompt + trip context from local Store
 * (same facts as Bifrost today/tomorrow, compact for n_ctx 2048 / leftover 1024).
 */
var EdgePrompt = (() => {
  const MAX_CONTEXT_CHARS = 1200;
  const MAX_TIMELINE = 5;
  const MAX_CALENDAR = 6;
  const MAX_HISTORY = 1;
  const MAX_TURN_CHARS = 240;

  const SYSTEM = [
    'Assistant voyage TripKit hors-ligne. Français, court.',
    'CONTEXTE = vérité (aujourd’hui, demain, hôtel, codes). N’invente pas wifi/pin/adresse.',
    'Météo live / prix → Bifrost. Modifier le voyage → Léo.',
  ].join(' ');

  function str(v) {
    if (v == null) return '';
    return String(v).trim();
  }

  function todayISO(tz) {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: tz || 'Europe/Paris' });
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function homeTz(trip) {
    if (typeof TzHelpers !== 'undefined' && TzHelpers.homeTz) return TzHelpers.homeTz(trip || {});
    return str(trip && trip.homeTz) || 'Europe/Paris';
  }

  function tripDayNumber(startDate, iso) {
    if (!startDate || !iso) return null;
    const start = Date.parse(startDate + 'T12:00:00Z');
    const day = Date.parse(iso + 'T12:00:00Z');
    if (!Number.isFinite(start) || !Number.isFinite(day)) return null;
    return Math.round((day - start) / 86400000) + 1;
  }

  function findDay(days, num) {
    if (!Array.isArray(days) || num == null) return null;
    return days.find(d => d && d.day === num) || null;
  }

  function isoForDay(day, trip) {
    if (typeof DayHelpers !== 'undefined' && DayHelpers.isoDate) {
      return DayHelpers.isoDate(day, trip) || '';
    }
    return '';
  }

  function enrich(day, tripData) {
    if (typeof DayHelpers !== 'undefined' && DayHelpers.enrich) {
      return DayHelpers.enrich(day, tripData);
    }
    return day;
  }

  function resolveHotel(day, tripData) {
    if (!day) return null;
    const dict = (tripData && tripData.hotels) || {};
    if (day.hotelId && dict[day.hotelId]) {
      const hotel = dict[day.hotelId];
      if (hotel.wifi || day.hotelWifi || day.wifi) {
        return Object.assign({}, hotel, { wifi: hotel.wifi || day.hotelWifi || day.wifi });
      }
      return hotel;
    }
    if (day.hotel && day.hotel !== '—' && day.hotel !== '-') {
      return {
        name: day.hotel,
        addr: day.hotelAddr,
        wifi: day.hotelWifi || day.wifi,
        access: day.access,
        ref: day.hotelRef,
        checkin: day.checkin,
      };
    }
    return null;
  }

  function formatWifi(wifi) {
    if (!wifi) return '';
    if (typeof wifi === 'string') return wifi;
    const ssid = str(wifi.ssid);
    const pass = str(wifi.pass || wifi.password);
    if (!ssid && !pass) return '';
    return (ssid ? 'SSID ' + ssid : '') + (ssid && pass ? ' / ' : '') + (pass ? 'mdp ' + pass : '');
  }

  function formatHotel(hotel) {
    if (!hotel || !hotel.name) return '';
    const bits = ['Hôtel: ' + str(hotel.name)];
    const addr = str(hotel.addr || hotel.address);
    if (addr) bits.push('Adresse: ' + addr);
    const wifi = formatWifi(hotel.wifi);
    if (wifi) bits.push('Wifi: ' + wifi);
    const access = str(hotel.access);
    if (access) bits.push('Accès/pin: ' + access);
    const ref = str(hotel.confirmationNumber || hotel.ref || hotel.booking);
    if (ref) bits.push('Réf: ' + ref);
    if (hotel.checkin) bits.push('Check-in: ' + str(hotel.checkin));
    if (hotel.checkout) bits.push('Check-out: ' + str(hotel.checkout));
    if (hotel.phone) bits.push('Tél: ' + str(hotel.phone));
    return bits.join('\n');
  }

  function formatTimeline(day) {
    const tl = Array.isArray(day && day.timeline) ? day.timeline.slice(0, MAX_TIMELINE) : [];
    if (!tl.length) return '';
    const lines = tl.map(ev => {
      const t = str(ev && ev.t);
      const d = str(ev && ev.d);
      if (!t && !d) return '';
      return '- ' + (t ? t + ' ' : '') + d;
    }).filter(Boolean);
    return lines.length ? 'Programme:\n' + lines.join('\n') : '';
  }

  function formatResto(day, tripData) {
    const rest = tripData && tripData.restaurants;
    if (!rest || day == null || day.day == null) return '';
    const block = rest[String(day.day)] || rest[day.day];
    if (!block) return '';
    const main = block.main || block;
    const name = str(main.name);
    if (!name) return '';
    const extra = [str(main.note), str(main.price)].filter(Boolean).join(', ');
    return 'Resto: ' + name + (extra ? ' (' + extra + ')' : '');
  }

  function formatHighlights(day) {
    const hs = Array.isArray(day && day.highlights) ? day.highlights.slice(0, 3) : [];
    if (!hs.length) return '';
    return 'Notes: ' + hs.map(h => str(h)).filter(Boolean).join(' · ');
  }

  function formatDayBlock(role, day, tripData, opts) {
    if (!day) return '';
    const en = enrich(day, tripData);
    const head = [
      role,
      'J' + (day.day != null ? day.day : '?'),
      str(en.dow),
      str(en.date) || isoForDay(day, (tripData && tripData.trip) || {}),
      str(day.label),
    ].filter(Boolean).join(' ');
    const parts = [head];
    if (day.from || day.to) {
      parts.push('Trajet: ' + [str(day.from), str(day.to)].filter(Boolean).join(' → '));
    }
    const tl = formatTimeline(en);
    if (tl) parts.push(tl);
    if (!(opts && opts.skipHotel)) {
      const hotel = formatHotel(resolveHotel(day, tripData));
      if (hotel) parts.push(hotel);
    }
    const resto = formatResto(day, tripData);
    if (resto) parts.push(resto);
    const hi = formatHighlights(day);
    if (hi) parts.push(hi);
    return parts.join('\n');
  }

  function formatCalendar(days, trip, aroundDay) {
    if (!Array.isArray(days) || !days.length) return '';
    const center = aroundDay != null ? aroundDay : days[0].day;
    const nearby = days.filter(d => d.day >= center - 1 && d.day <= center + 2);
    const slice = (nearby.length ? nearby : days).slice(0, MAX_CALENDAR);
    const rows = slice.map(d => {
      const en = enrich(d, { trip: trip, days: days });
      const iso = isoForDay(d, trip);
      return 'J' + d.day + ' ' + (en.dow || '') + ' ' + (iso || en.date || '') + ' — ' + str(d.label);
    });
    return 'Calendrier:\n' + rows.join('\n');
  }

  function formatFlights(tripData, today, tomorrow) {
    const f = tripData && tripData.flights;
    if (!f) return '';
    const lines = [];
    ['outbound', 'return', 'inbound'].forEach(k => {
      const fl = f[k];
      if (!fl) return;
      const dep = str(fl.dep).slice(0, 10);
      if (dep && dep !== today && dep !== tomorrow) return;
      lines.push(
        (k === 'outbound' ? 'Vol aller' : 'Vol retour')
        + ': ' + str(fl.from) + '→' + str(fl.to)
        + (fl.dep ? ' ' + str(fl.dep) : '')
        + (fl.pnr ? ' PNR ' + str(fl.pnr) : '')
      );
    });
    return lines.join('\n');
  }

  function tripContext(opts) {
    try {
      if (typeof Store === 'undefined') return '';
      const tripId = Store.getCurrentTripId && Store.getCurrentTripId();
      if (!tripId) return '';
      const data = Store.getTripData && Store.getTripData(tripId);
      if (!data) return '';
      const trip = data.trip || {};
      const days = Array.isArray(data.days) ? data.days : [];
      const tz = homeTz(trip);
      const nowISO = (opts && opts.nowISO) || todayISO(tz);
      const n = tripDayNumber(trip.startDate, nowISO);
      const dayNums = days.map(d => d.day).filter(x => x != null);
      const minDay = dayNums.length ? Math.min.apply(null, dayNums) : 1;
      const maxDay = dayNums.length ? Math.max.apply(null, dayNums) : 1;
      let state = '';
      if (n != null) {
        if (n < minDay) state = 'before';
        else if (n > maxDay) state = 'after';
        else state = 'during';
      }
      let todayDay = findDay(days, n);
      if (!todayDay && days.length) {
        todayDay = (n != null && n < minDay) ? days[0] : days[days.length - 1];
      }
      const tomorrowNum = todayDay && todayDay.day != null ? todayDay.day + 1 : null;
      const tomorrowDay = findDay(days, tomorrowNum);

      const parts = [];
      const name = str(trip.name || trip.title || tripId);
      parts.push('Voyage: ' + name
        + (trip.startDate ? ' (' + trip.startDate + (trip.endDate ? ' → ' + trip.endDate : '') + ')' : ''));
      parts.push('Maintenant: ' + nowISO + (state ? ' (' + state + ')' : '') + ' TZ ' + tz);
      const cal = formatCalendar(days, trip, todayDay && todayDay.day);
      if (cal) parts.push(cal);
      const todayBlock = formatDayBlock('AUJOURD’HUI', todayDay, data);
      if (todayBlock) parts.push(todayBlock);
      const sameHotel = !!(todayDay && tomorrowDay && todayDay.hotelId && todayDay.hotelId === tomorrowDay.hotelId);
      const tomBlock = formatDayBlock('DEMAIN', tomorrowDay, data, { skipHotel: sameHotel });
      if (tomBlock) parts.push(tomBlock);
      const flights = formatFlights(data, nowISO,
        tomorrowDay ? isoForDay(tomorrowDay, trip) : '');
      if (flights) parts.push(flights);

      let out = parts.filter(Boolean).join('\n\n');
      if (out.length > MAX_CONTEXT_CHARS) out = out.slice(0, MAX_CONTEXT_CHARS - 1) + '…';
      return out;
    } catch (_) {
      return '';
    }
  }

  /**
   * @param {string} userText
   * @param {{role:string,content:string}[]} [history]
   * @param {{nowISO?:string,now?:Date}} [opts]
   * @returns {{role:string,content:string}[]}
   */
  function buildMessages(userText, history, opts) {
    const ctx = tripContext(opts);
    const sys = SYSTEM + (ctx ? '\n\nCONTEXTE\n' + ctx : '\n\n(Pas de voyage chargé.)');
    const msgs = [{ role: 'system', content: sys }];
    const hist = Array.isArray(history) ? history.slice(-MAX_HISTORY) : [];
    for (const m of hist) {
      if (!m || !m.content) continue;
      if (m.role === 'user' || m.role === 'assistant') {
        msgs.push({ role: m.role, content: String(m.content).slice(0, MAX_TURN_CHARS) });
      }
    }
    msgs.push({ role: 'user', content: String(userText || '').slice(0, MAX_TURN_CHARS) });
    return msgs;
  }

  return { SYSTEM, tripContext, buildMessages };
})();
;
/* ==== js/edge-model/engine.js ==== */
/**
 * EdgeEngine — Wllama wrapper (download OPFS / warm RAM / generate / purge).
 * Spec: SPEC-edge-model.md — bouton opt-in, OPFS via Wllama CacheManager,
 * warm-up lazy, jamais au boot.
 */
var EdgeEngine = (() => {
  const WLLAMA_JS = 'js/lib/wllama/index.min.js';
  const WLLAMA_WASM = 'js/lib/wllama/wasm/wllama.wasm';
  // Safari has no JSPI/Memory64 — Wllama needs Asyncify compat (vendored, NOT jsDelivr).
  const WLLAMA_COMPAT_WASM = 'js/lib/wllama/compat/wllama.wasm';
  const WLLAMA_COMPAT_JS = 'js/lib/wllama/compat/wllama.js';
  const WARMUP_TIMEOUT_MS = 180000; // 3 min — Safari Asyncify; 0.5B ~3s in practice
  const OVERSIZE_BYTES = 700 * 1000 * 1000; // >700 Mo = leftover 1.1 GB

  /** @type {null | 'idle' | 'downloading' | 'ready_disk' | 'loading_ram' | 'ready_ram' | 'error'} */
  let _state = 'idle';
  let _progress = 0; // 0..1
  let _error = '';
  let _phase = '';
  let _detail = '';
  let _hint = '';
  let _elapsedSec = 0;
  let _diskBytes = 0; // last probed OPFS blob size for current modelUrl
  let _wllama = null;
  let _WllamaClass = null;
  let _listeners = [];
  let _heartbeat = null;
  let _warmupGen = 0; // bump to invalidate in-flight warm-up

  // Empty but valid wasm module — compiling it proves CSP allows WebAssembly.
  const WASM_PROBE = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

  /**
   * Wllama compiles its wasm inside a blob worker. When the page CSP lacks
   * 'wasm-unsafe-eval' the compile is refused there, the worker aborts, and the
   * load promise never settles — activation just hangs until the timeout. Probe
   * first so the real reason surfaces immediately.
   */
  async function assertWasmAllowed() {
    try {
      await WebAssembly.instantiate(WASM_PROBE);
    } catch (e) {
      const msg = (e && e.message) || String(e);
      if (/content security policy|unsafe-eval/i.test(msg)) {
        throw new Error(
          'WebAssembly bloqué par le CSP du serveur (wasm-unsafe-eval manquant). '
          + 'Recharge l’app après mise à jour.'
        );
      }
      throw new Error('WebAssembly indisponible sur ce navigateur : ' + msg);
    }
  }

  function absUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  /** Absolute URL for GGUF (relative paths → same-origin). */
  function resolveModelUrl(url) {
    const u = String(url || '').trim();
    if (!u) return u;
    if (/^https?:\/\//i.test(u)) return u;
    return absUrl(u);
  }

  function isMobileSafari() {
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua)
      || (/Safari/.test(ua) && !/Chrom(e|ium)|CriOS|FxiOS|Edg/.test(ua));
  }

  function emit() {
    const snap = status();
    _listeners.slice().forEach(fn => {
      try { fn(snap); } catch (_) { /* ignore */ }
    });
  }

  function onChange(fn) {
    if (typeof fn === 'function') _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter(f => f !== fn);
    };
  }

  function status() {
    const cfg = typeof EdgeModelConfig !== 'undefined' ? EdgeModelConfig.get() : {};
    const onDisk = hasOnDisk();
    const expected = cfg.modelSizeBytes || 0;
    const stored = typeof EdgeModelConfig !== 'undefined' ? EdgeModelConfig.storedSize() : 0;
    const sizeBytes = _diskBytes || stored || expected || 0;
    const oversize = sizeBytes >= OVERSIZE_BYTES;
    const needsUpdate = (typeof EdgeModelConfig !== 'undefined' && EdgeModelConfig.needsUpdate())
      || oversize;
    return {
      state: _state,
      progress: _progress,
      error: _error,
      phase: _phase,
      detail: _detail,
      hint: _hint,
      elapsedSec: _elapsedSec,
      onDisk,
      inRam: isLoaded(),
      enabled: cfg.enabled !== false,
      modelVersion: cfg.modelVersion || '',
      storedVersion: typeof EdgeModelConfig !== 'undefined' ? EdgeModelConfig.storedVersion() : '',
      needsUpdate,
      oversize,
      sizeBytes,
    };
  }

  function isLoaded() {
    return !!(_wllama && _wllama.isModelLoaded && _wllama.isModelLoaded());
  }

  function hasOnDisk() {
    if (typeof EdgeModelConfig === 'undefined') return false;
    return !!EdgeModelConfig.storedVersion();
  }

  async function ensureConfig() {
    if (typeof EdgeModelConfig !== 'undefined') {
      await EdgeModelConfig.load();
    }
  }

  function setPhase(phase, detail) {
    _phase = phase || '';
    if (detail !== undefined) _detail = detail || '';
    emit();
  }

  function hintForElapsed(sec) {
    if (sec < 8) return 'Init runtime WASM (Safari Asyncify)…';
    if (sec < 25) return 'Lecture GGUF OPFS + worker…';
    if (sec < 60) return 'Allocation mémoire — ~400 Mo à charger';
    if (sec < 120) return 'Toujours en cours — laisse tourner ou Annuler';
    return 'Très long — Annuler, garder l’onglet seul au premier plan, réessayer';
  }

  function startHeartbeat(startedAt) {
    stopHeartbeat();
    _elapsedSec = 0;
    _hint = hintForElapsed(0);
    _heartbeat = setInterval(() => {
      _elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      _hint = hintForElapsed(_elapsedSec);
      emit();
    }, 500);
  }

  function stopHeartbeat() {
    if (_heartbeat) {
      clearInterval(_heartbeat);
      _heartbeat = null;
    }
  }

  async function exitWllama() {
    if (_wllama) {
      try { await _wllama.exit(); } catch (_) { /* ignore */ }
    }
    _wllama = null;
  }

  async function resetInstance() {
    stopHeartbeat();
    await exitWllama();
  }

  async function loadWllamaClass() {
    if (_WllamaClass) return _WllamaClass;
    setPhase('Chargement runtime…');
    const mod = await import(absUrl(WLLAMA_JS));
    _WllamaClass = mod.Wllama || (mod.default && mod.default.Wllama) || mod.default;
    if (!_WllamaClass) throw new Error('Wllama export introuvable');
    return _WllamaClass;
  }

  async function getInstance() {
    if (_wllama) return _wllama;
    const Wllama = await loadWllamaClass();
    const paths = { default: absUrl(WLLAMA_WASM) };
    // Constructor enables setCompat('default') → jsDelivr CDN. Override with
    // vendored Asyncify assets so iPhone Safari never depends on CDN.
    _wllama = new Wllama(paths, {
      allowOffline: true,
      logger: {
        debug: () => {},
        log: (...a) => console.log('[edge]', ...a),
        warn: (...a) => console.warn('[edge]', ...a),
        error: (...a) => console.error('[edge]', ...a),
      },
    });
    if (typeof _wllama.setCompat === 'function') {
      _wllama.setCompat({
        wasm: absUrl(WLLAMA_COMPAT_WASM),
        worker: absUrl(WLLAMA_COMPAT_JS),
      });
    }
    return _wllama;
  }

  function formatErr(e, fallback) {
    const raw = (e && e.message) || String(e || fallback);
    if (/trop gros|1\.1|oversize/i.test(raw)) {
      return raw;
    }
    if (/load failed|failed to fetch/i.test(raw)) {
      return 'Réseau bloqué (CSP/CORS) ou URL modèle injoignable.';
    }
    if (/exceeds the available context size|n_ctx|context size/i.test(raw)) {
      return 'Prompt trop long pour la fenêtre actuelle. Libère la mémoire puis Activer (fenêtre 2048).';
    }
    if (/already initialized/i.test(raw)) {
      return 'Runtime déjà initialisé — réessaie (Annuler puis Activer).';
    }
    if (/timeout activation/i.test(raw)) {
      const mb = _diskBytes ? Math.round(_diskBytes / 1e6) + ' Mo sur disque. ' : '';
      return mb
        + 'Activation trop longue. Si >700 Mo → Supprimer puis recharger (~400 Mo). Sinon réessaie.';
    }
    return raw || fallback;
  }

  /**
   * Download GGUF → OPFS only (no RAM load). Explicit opt-in.
   */
  async function download(opts) {
    await ensureConfig();
    const cfg = EdgeModelConfig.get();
    if (cfg.enabled === false) throw new Error('Edge model désactivé');
    if (!cfg.modelUrl) throw new Error('modelUrl manquant');
    const modelUrl = resolveModelUrl(cfg.modelUrl);

    _state = 'downloading';
    _progress = 0;
    _error = '';
    _phase = 'Téléchargement…';
    emit();

    try {
      const w = await getInstance();
      // Always clear OPFS before a (re)download — avoids stale URL keys / old 135M
      setPhase('Nettoyage cache OPFS…');
      try { await w.cacheManager.clear(); } catch (_) { /* ignore */ }
      EdgeModelConfig.clearStoredMeta();

      await w.cacheManager.download(modelUrl, {
        progressCallback: ({ loaded, total }) => {
          _progress = total > 0 ? loaded / total : 0;
          _phase = 'Téléchargement… ' + Math.round(_progress * 100) + '%';
          _diskBytes = loaded || _diskBytes;
          emit();
          if (opts && typeof opts.onProgress === 'function') {
            opts.onProgress(_progress, loaded, total);
          }
        },
        signal: opts && opts.signal,
      });
      EdgeModelConfig.setStoredVersion(cfg.modelVersion, cfg.modelSizeBytes);
      _diskBytes = cfg.modelSizeBytes || _diskBytes;
      _state = 'ready_disk';
      _progress = 1;
      _phase = '';
      emit();
      return true;
    } catch (e) {
      _error = formatErr(e, 'téléchargement échoué');
      _state = hasOnDisk() ? 'ready_disk' : 'error';
      _phase = '';
      emit();
      throw new Error(_error);
    }
  }

  /**
   * Load GGUF into RAM (lazy warm-up).
   * Uses loadModelFromUrl(useCache) — same path as Wllama demos; more reliable on
   * Safari than open()+loadModel([blob]) (Blob transfer quirks).
   */
  async function warmUp(opts) {
    await ensureConfig();
    const cfg = EdgeModelConfig.get();
    if (!hasOnDisk() && !(opts && opts.allowDownload)) {
      throw new Error('Modèle non téléchargé — utilise Charger / Remplacer d’abord');
    }

    const gen = ++_warmupGen;
    const startedAt = Date.now();
    _state = 'loading_ram';
    _progress = 0;
    _error = '';
    _phase = '1/4 Démarrage…';
    _detail = '';
    _hint = hintForElapsed(0);
    _elapsedSec = 0;
    startHeartbeat(startedAt);
    emit();

    const timeoutMs = (opts && opts.timeoutMs) || WARMUP_TIMEOUT_MS;
    const nCtx = 2048;
    const modelUrl = resolveModelUrl(cfg.modelUrl);

    try {
      await assertWasmAllowed();
      await exitWllama();
      if (gen !== _warmupGen) throw new Error('Annulé');

      setPhase('2/4 Runtime WASM…', isMobileSafari()
        ? 'Safari Asyncify local'
        : 'wllama.wasm');
      const w = await getInstance();
      if (gen !== _warmupGen) throw new Error('Annulé');

      setPhase('3/4 Chargement GGUF…', modelUrl);
      const loadPromise = w.loadModelFromUrl(modelUrl, {
        useCache: true,
        n_ctx: nCtx,
        n_gpu_layers: 0,
        n_threads: 1,
        warmup: false,
        progressCallback: ({ loaded, total }) => {
          _progress = total > 0 ? loaded / total : 0;
          _diskBytes = loaded || _diskBytes;
          _detail = total
            ? Math.round(loaded / 1e6) + ' / ' + Math.round(total / 1e6) + ' Mo'
            : Math.round(loaded / 1e6) + ' Mo';
          emit();
        },
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(
          'Timeout activation (' + Math.round(timeoutMs / 1000) + 's). Réessaie ou reste sur Bifrost.'
        )), timeoutMs);
      });
      await Promise.race([loadPromise, timeoutPromise]);

      if (gen !== _warmupGen) {
        await resetInstance();
        throw new Error('Annulé');
      }

      if (!EdgeModelConfig.storedVersion()) {
        EdgeModelConfig.setStoredVersion(cfg.modelVersion, cfg.modelSizeBytes);
      }
      if (!_diskBytes && cfg.modelSizeBytes) _diskBytes = cfg.modelSizeBytes;

      stopHeartbeat();
      _state = 'ready_ram';
      _progress = 1;
      _phase = '';
      _detail = '';
      _hint = '';
      _elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      emit();
      return true;
    } catch (e) {
      stopHeartbeat();
      await exitWllama();
      _error = formatErr(e, 'activation échouée');
      _state = hasOnDisk() ? 'ready_disk' : 'error';
      _phase = '';
      _detail = '';
      _hint = '';
      emit();
      throw new Error(_error);
    }
  }

  /** Cancel in-flight warm-up / free partial init. */
  async function cancelWarmUp() {
    _warmupGen += 1;
    stopHeartbeat();
    await resetInstance();
    _state = hasOnDisk() ? 'ready_disk' : 'idle';
    _progress = 0;
    _phase = '';
    _detail = '';
    _hint = '';
    _error = 'Activation annulée';
    emit();
  }

  async function ensureReadyForLocal() {
    if (isLoaded()) return true;
    if (!hasOnDisk()) return false;
    await warmUp();
    return isLoaded();
  }

  /**
   * Completion locale, en streaming. Asyncify plafonne à ~2-3 tokens/s sur
   * iPhone : sans onDelta l’utilisateur attend une minute devant un écran figé.
   */
  async function generate(userText, history, opts) {
    const cfg = typeof EdgeModelConfig !== 'undefined' ? EdgeModelConfig.get() : {};
    if (!isLoaded()) {
      await warmUp();
    }
    const messages = (typeof EdgePrompt !== 'undefined')
      ? EdgePrompt.buildMessages(userText, history)
      : [{ role: 'user', content: String(userText || '') }];

    const w = await getInstance();
    const maxTokens = (opts && opts.maxTokens) || cfg.maxTokens || 128;
    const temperature = (opts && opts.temperature) != null ? opts.temperature : (cfg.temperature ?? 0.7);
    const useStream = !(opts && opts.stream === false);

    try {
      if (!useStream) {
        const response = await w.createChatCompletion({
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: false,
        });
        if (opts && opts.signal && opts.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        const full = (response
          && response.choices
          && response.choices[0]
          && response.choices[0].message
          && response.choices[0].message.content) || '';
        if (opts && typeof opts.onDelta === 'function' && full) opts.onDelta(full);
        return full;
      }

      let full = '';
      const stream = await w.createChatCompletion({
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      });
      for await (const chunk of stream) {
        if (opts && opts.signal && opts.signal.aborted) {
          await resetInstance();
          _state = 'ready_disk';
          emit();
          throw new DOMException('Aborted', 'AbortError');
        }
        const delta = chunk
          && chunk.choices
          && chunk.choices[0]
          && chunk.choices[0].delta
          && chunk.choices[0].delta.content;
        if (delta) {
          full += delta;
          if (opts && typeof opts.onDelta === 'function') opts.onDelta(delta);
        }
      }
      return full;
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      // Try to free RAM so the tab stays usable
      try { await unload(); } catch (_) { /* ignore */ }
      throw e;
    }
  }

  /** Free RAM; keep OPFS. */
  async function unload() {
    await resetInstance();
    _state = hasOnDisk() ? 'ready_disk' : 'idle';
    _phase = '';
    _error = '';
    emit();
  }

  /** Purge OPFS model + meta. Called by Effacer données / Supprimer le modèle. */
  async function purge() {
    try {
      const w = await getInstance();
      if (w.cacheManager && typeof w.cacheManager.clear === 'function') {
        await w.cacheManager.clear();
      }
    } catch (e) {
      console.warn('[edge] purge cacheManager', e);
    }
    await resetInstance();
    if (typeof EdgeModelConfig !== 'undefined') EdgeModelConfig.clearStoredMeta();
    _diskBytes = 0;
    _state = 'idle';
    _progress = 0;
    _error = '';
    _phase = '';
    emit();
  }

  /** Reconcile state after boot — meta only, no WASM spin-up. */
  async function refreshFromDisk() {
    await ensureConfig();
    if (isLoaded()) {
      _state = 'ready_ram';
    } else if (hasOnDisk()) {
      _state = 'ready_disk';
      _diskBytes = (typeof EdgeModelConfig !== 'undefined' && EdgeModelConfig.storedSize()) || 0;
      if (_diskBytes >= OVERSIZE_BYTES && !_error) {
        _error = 'Ancien modèle ~' + Math.round(_diskBytes / 1e6)
          + ' Mo — clique Remplacer (~400 Mo).';
      }
    } else {
      _state = 'idle';
      _diskBytes = 0;
    }
    emit();
    return status();
  }

  return {
    status,
    onChange,
    isLoaded,
    hasOnDisk,
    download,
    warmUp,
    cancelWarmUp,
    ensureReadyForLocal,
    generate,
    unload,
    purge,
    refreshFromDisk,
  };
})();
;
/* ==== js/components/leo-chat-stream.js ==== */
/**
 * leo-chat-stream.js — « Construire le voyage avec Léo » (SSE via BE → Hermes).
 * Factory pattern: LeoChatStream.create({prefix, mode, storageKey}) returns an
 * isolated instance. The singleton API is preserved for backward compat (Plus).
 *
 * V1 jobs: POST /leo/chat/stream still streams live (delta + tool) while the
 * app is open. Lock-phone / dropped SSE only drops the listener; Hermes keeps
 * running. Reconnect GET /leo/jobs/{id}/stream?after=N. Annuler → POST cancel.
 */
var LeoChatStream = (() => {

  /** All live instances for resumeIfNeeded iteration */
  const _instances = [];

  /** Shared status (loaded once, used by all instances) */
  let _status = null;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function loadStatus() {
    const res = await API.getLeoStatus();
    if (!res.ok || !res.data) {
      _status = { ready: false, reason: res.error || 'unreachable' };
      return _status;
    }
    _status = res.data;
    return _status;
  }

  function allowedModels() {
    const list = (_status && Array.isArray(_status.models)) ? _status.models : [];
    return list.filter(m => m && m.id);
  }

  function defaultModelId() {
    const d = _status && _status.defaultModel;
    if (d && allowedModels().some(m => m.id === d)) return d;
    const first = allowedModels()[0];
    return first ? first.id : '';
  }

  function modelLabel(id) {
    if (!id) return '';
    const m = allowedModels().find(x => x.id === id);
    return (m && m.label) || id;
  }

  // ── Factory ───────────────────────────────────────────────────────────────
  /**
   * Create an isolated LeoChatStream instance.
   * @param {{ prefix: string, mode: string, storageKey: string }} config
   */
  function create(config) {
    const { prefix, mode, storageKey } = config;

    // Storage keys (prefixed)
    const JOB_KEY = storageKey + '-job';
    const SEQ_KEY = storageKey + '-seq';
    const HIST_KEY = storageKey + '-hist';
    const API_HIST_KEY = storageKey + '-api-hist';
    const MODEL_KEY = storageKey + '-model';

    // Instance state (fully isolated)
    let _history = [];
    let _apiHistory = [];
    let _busy = false;
    let _abort = null;
    let _toolLine = '';
    let _jobId = null;
    let _lastSeq = 0;
    let _wantCancel = false;
    let _pausing = false;
    let _resumeTimer = null;
    let _listening = false;
    let _destroyed = false;

    // DOM id helpers
    function domId(suffix) { return prefix + '-' + suffix; }

    function persistJob() {
      try {
        if (!_jobId) {
          sessionStorage.removeItem(JOB_KEY);
          sessionStorage.removeItem(SEQ_KEY);
          sessionStorage.removeItem(HIST_KEY);
          sessionStorage.removeItem(API_HIST_KEY);
          return;
        }
        sessionStorage.setItem(JOB_KEY, _jobId);
        sessionStorage.setItem(SEQ_KEY, String(_lastSeq || 0));
        sessionStorage.setItem(HIST_KEY, JSON.stringify(_history));
        sessionStorage.setItem(API_HIST_KEY, JSON.stringify(_apiHistory));
      } catch (_) {}
    }

    function clearJob() {
      _jobId = null;
      _lastSeq = 0;
      persistJob();
    }

    function restoreFromSession() {
      try {
        const id = sessionStorage.getItem(JOB_KEY);
        if (!id) return;
        _jobId = id;
        _lastSeq = Number(sessionStorage.getItem(SEQ_KEY) || 0) || 0;
        const hist = sessionStorage.getItem(HIST_KEY);
        if (hist) _history = JSON.parse(hist);
        const api = sessionStorage.getItem(API_HIST_KEY);
        if (api) _apiHistory = JSON.parse(api);
      } catch (_) {}
    }

    // Restore on creation
    restoreFromSession();

    function selectedModelId() {
      const allowed = allowedModels();
      if (!allowed.length) return '';
      const sel = document.getElementById(domId('model'));
      if (sel && sel.value && allowed.some(m => m.id === sel.value)) return sel.value;
      let saved = '';
      try { saved = localStorage.getItem(MODEL_KEY) || ''; } catch (_) {}
      if (saved && allowed.some(m => m.id === saved)) return saved;
      return defaultModelId();
    }

    function persistModel(id) {
      if (!id) return;
      try { localStorage.setItem(MODEL_KEY, id); } catch (_) {}
    }

    function renderSection(container) {
      if (!container) return;
      const ready = !!(_status && _status.ready);
      const dash = (_status && _status.dashboardUrl) || 'https://hermes-leo.bapttf.com';
      const models = allowedModels();
      const selected = selectedModelId();
      const modelRow = models.length
        ? `<div class="leo-compose-row">
          <label class="leo-model-label">Modèle
            <select id="${domId('model')}" ${!ready || !navigator.onLine ? 'disabled' : ''}>
              ${models.map(m => `<option value="${escapeHtml(m.id)}"${m.id === selected ? ' selected' : ''}>${escapeHtml(m.label || m.id)}</option>`).join('')}
            </select>
          </label>
          <button type="submit" class="btn btn-primary" id="${domId('send')}"
            ${!ready || !navigator.onLine ? 'disabled' : ''}>Envoyer</button>
        </div>`
        : `<button type="submit" class="btn btn-primary" id="${domId('send')}"
            ${!ready || !navigator.onLine ? 'disabled' : ''}>Envoyer</button>`;

      container.innerHTML = `<div class="leo-section leo-stream-section">
        <h3 class="section-title">Léo</h3>
        <p class="leo-hint">Créer / modifier le seed voyage (Hermes).</p>
        <div class="leo-thread" id="${domId('thread')}"></div>
        <div class="leo-stream-status" id="${domId('status')}" hidden></div>
        <div class="leo-wait" id="${domId('wait')}" hidden>
          <span id="${domId('wait-label')}">Connexion…</span>
          <button type="button" class="btn" id="${domId('cancel')}">Annuler</button>
        </div>
        <form class="leo-compose" id="${domId('compose')}">
          <textarea id="${domId('input')}" rows="2"
            placeholder="Ex. Dans quebec-2026, ajoute une note Day 12…"
            ${!ready || !navigator.onLine ? 'disabled' : ''}></textarea>
          ${modelRow}
        </form>
        ${!ready ? `<div class="leo-banner">Léo non prêt — <a href="${escapeHtml(dash)}" target="_blank" rel="noopener">Dashboard</a></div>` : ''}
      </div>`;

      paintThread();
      const form = document.getElementById(domId('compose'));
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          send();
        });
      }
      const selEl = document.getElementById(domId('model'));
      if (selEl) {
        selEl.addEventListener('change', () => persistModel(selEl.value));
      }
      const cancelBtn = document.getElementById(domId('cancel'));
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => { cancelJob(); });
      }
      if (_jobId || _busy) {
        setBusy(true);
        resumeIfNeeded();
      }
    }

    function paintThread() {
      const el = document.getElementById(domId('thread'));
      if (!el) return;
      if (!_history.length) {
        el.innerHTML = `<div class="leo-empty">Aucun message stream pour l'instant.</div>`;
        return;
      }
      el.innerHTML = _history.map(m => {
        const err = m.kind === 'error';
        const cls = m.role === 'user' ? 'leo-msg user' : (err ? 'leo-msg assistant error' : 'leo-msg assistant');
        const who = m.role === 'user' ? 'Toi' : (err ? 'Erreur' : 'Léo');
        const live = m.live ? ' leo-live' : '';
        const mdl = (m.role === 'assistant' && !err && m.model)
          ? ` <span class="leo-msg-model">${escapeHtml(modelLabel(m.model))}</span>`
          : '';
        return `<div class="${cls}${live}" data-id="${escapeHtml(m.id || '')}">
          <div class="leo-who">${who}${mdl}</div>
          <div class="leo-bubble">${escapeHtml(m.content)}</div>
        </div>`;
      }).join('');
      el.scrollTop = el.scrollHeight;
    }

    function setBusy(on) {
      _busy = on;
      const btn = document.getElementById(domId('send'));
      const input = document.getElementById(domId('input'));
      const wait = document.getElementById(domId('wait'));
      const sel = document.getElementById(domId('model'));
      const blocked = on || !(_status && _status.ready) || !navigator.onLine;
      if (btn) {
        btn.disabled = blocked;
        btn.textContent = on ? 'Léo…' : 'Envoyer';
      }
      if (input) input.disabled = blocked;
      if (sel) sel.disabled = blocked;
      if (wait) wait.hidden = !on;
    }

    function setStatus(text) {
      const el = document.getElementById(domId('status'));
      const label = document.getElementById(domId('wait-label'));
      if (label) label.textContent = text || 'Léo…';
      if (!el) return;
      if (!text) { el.hidden = true; el.textContent = ''; return; }
      el.hidden = false;
      el.textContent = text;
    }

    function toolLabel(tool) {
      if (!tool) return 'outil…';
      if (typeof tool === 'string') return tool;
      const name = tool.name || tool.tool || tool.toolName || '';
      const status = tool.status || tool.state || '';
      return [name, status].filter(Boolean).join(' · ') || 'outil…';
    }

    function liveAsst() {
      for (let i = _history.length - 1; i >= 0; i--) {
        const m = _history[i];
        if (m && m.role === 'assistant' && m.live) return m;
      }
      return null;
    }

    function ensureLiveBubble() {
      let asst = liveAsst();
      if (asst) return asst;
      asst = { role: 'assistant', content: '', id: 's' + Date.now(), live: true };
      _history.push(asst);
      paintThread();
      return asst;
    }

    function noteModel(asst, data) {
      if (!asst || !data || !data.model) return;
      asst.model = data.model;
    }

    function noteSeq(data) {
      if (!data) return;
      if (data.jobId) _jobId = data.jobId;
      const seq = Number(data.seq);
      if (Number.isFinite(seq) && seq > _lastSeq) _lastSeq = seq;
      persistJob();
    }

    function finishIdle() {
      _abort = null;
      _pausing = false;
      _wantCancel = false;
      _toolLine = '';
      setStatus('');
      setBusy(false);
    }

    function showError(asst, msg) {
      if (asst && _history[_history.length - 1] === asst) _history.pop();
      else if (asst) asst.live = false;
      _history.push({ role: 'assistant', kind: 'error', content: msg });
      paintThread();
    }

    async function consume(iter, asst) {
      let finalReply = asst.content || '';
      try {
        for await (const ev of iter) {
          const event = ev.event;
          const data = ev.data || {};
          noteSeq(data);
          if (event === 'meta') {
            noteModel(asst, data);
            if (data.model) paintThread();
            setStatus(_toolLine ? `🔧 ${_toolLine}` : 'Léo…');
          } else if (event === 'delta' && data.text) {
            asst.content += data.text;
            finalReply = asst.content;
            noteModel(asst, data);
            setStatus(_toolLine ? `✎ ${_toolLine}` : 'Réponse…');
            paintThread();
            persistJob();
          } else if (event === 'tool') {
            _toolLine = toolLabel(data.tool);
            setStatus(`🔧 ${_toolLine}`);
          } else if (event === 'done') {
            finalReply = (data.reply != null && data.reply !== '') ? data.reply : asst.content;
            asst.content = finalReply || '(réponse vide)';
            asst.live = false;
            noteModel(asst, data);
            paintThread();
            return { outcome: 'done', reply: asst.content };
          } else if (event === 'error') {
            const code = data.code || '';
            if (code === 'job_not_found') {
              return { outcome: 'expired' };
            }
            if (_wantCancel || (code === 'cancelled' && !_pausing)) {
              return { outcome: 'cancelled' };
            }
            if (_pausing || code === 'network' || code === 'timeout') {
              return { outcome: 'drop' };
            }
            let msg = data.error || 'Échec stream';
            if (typeof API !== 'undefined' && API.netFailMessage) {
              msg = API.netFailMessage({ message: msg }, code === 'cancelled');
            }
            return { outcome: 'error', message: msg };
          }
        }
      } catch (e) {
        if (_wantCancel) return { outcome: 'cancelled' };
        if (_pausing || _jobId) return { outcome: 'drop' };
        return {
          outcome: 'error',
          message: (typeof API !== 'undefined' && API.netFailMessage)
            ? API.netFailMessage(e, false)
            : ((e && e.message) || 'stream interrompu'),
        };
      }
      if (_wantCancel) return { outcome: 'cancelled' };
      if (_jobId && !_wantCancel) return { outcome: 'drop' };
      return { outcome: 'done', reply: finalReply };
    }

    function scheduleResume() {
      clearTimeout(_resumeTimer);
      _resumeTimer = setTimeout(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        resumeIfNeeded();
      }, 600);
    }

    function pauseListener() {
      if (!_jobId || _wantCancel) return;
      _pausing = true;
      if (_abort) {
        try { _abort.abort(); } catch (_) {}
        _abort = null;
      }
      setStatus('En arrière-plan…');
      persistJob();
    }

    async function cancelJob() {
      _wantCancel = true;
      const id = _jobId;
      if (id && typeof API !== 'undefined' && API.cancelLeoJob) {
        try { await API.cancelLeoJob(id); } catch (_) {}
      }
      if (_abort) {
        try { _abort.abort(); } catch (_) {}
      }
    }

    async function listenGet(asst) {
      const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
      _abort = ac;
      _pausing = false;
      return consume(API.leoJobStream(_jobId, _lastSeq, { signal: ac ? ac.signal : undefined }), asst);
    }

    async function handleOutcome(result, asst) {
      const outcome = (result && result.outcome) || 'drop';
      if (outcome === 'drop') {
        _abort = null;
        setBusy(true);
        setStatus('Reconnexion…');
        persistJob();
        scheduleResume();
        return;
      }
      if (outcome === 'done') {
        asst.live = false;
        asst.content = result.reply || asst.content || '(réponse vide)';
        _apiHistory.push({ role: 'assistant', content: asst.content });
        if (_apiHistory.length > 12) _apiHistory = _apiHistory.slice(-12);
        paintThread();
        clearJob();
        finishIdle();
        return;
      }
      asst.live = false;
      if (outcome === 'cancelled') {
        showError(asst, 'Annulé.');
      } else if (outcome === 'expired') {
        showError(asst, 'Session Léo expirée. Réessaie.');
      } else {
        showError(asst, (result && result.message) || 'Échec stream');
      }
      clearJob();
      finishIdle();
    }

    async function resumeIfNeeded() {
      if (_destroyed) return;
      restoreFromSession();
      if (!_jobId || _wantCancel) return;
      if (_abort || _listening) return;
      _listening = true;
      try {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          setBusy(true);
          setStatus('En arrière-plan…');
          return;
        }
        if (!navigator.onLine) {
          setBusy(true);
          setStatus('Reconnexion…');
          return;
        }
        const asst = ensureLiveBubble();
        setBusy(true);
        setStatus('Reconnexion…');
        const result = await listenGet(asst);
        await handleOutcome(result, asst);
      } finally {
        _listening = false;
      }
    }

    async function send(text) {
      if (_busy) return;
      const input = document.getElementById(domId('input'));
      const msg = text || (input ? String(input.value || '').trim() : '');
      if (!msg) return;

      const userMsg = { role: 'user', content: msg };
      _history.push(userMsg);
      _apiHistory.push(userMsg);
      if (_apiHistory.length > 12) _apiHistory = _apiHistory.slice(-12);
      if (input) input.value = '';

      const asst = { role: 'assistant', content: '', id: 's' + Date.now(), live: true };
      _history.push(asst);
      paintThread();
      setBusy(true);
      setStatus('Connexion au stream…');
      _toolLine = '';
      _wantCancel = false;
      _pausing = false;
      _lastSeq = 0;
      _jobId = null;

      const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
        ? Store.getCurrentTripId()
        : '';
      const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
      _abort = ac;
      _listening = true;
      const mdl = selectedModelId();
      persistModel(mdl);

      let result;
      try {
        result = await consume(API.leoChatStream({
          tripId: tripId || undefined,
          messages: _apiHistory.slice(),
          model: mdl || undefined,
          mode: mode || undefined,
          signal: ac ? ac.signal : undefined,
        }), asst);
      } finally {
        _listening = false;
      }
      await handleOutcome(result, asst);
    }

    function cancel() { return cancelJob(); }

    function destroy() {
      _destroyed = true;
      clearTimeout(_resumeTimer);
      if (_abort) {
        try { _abort.abort(); } catch (_) {}
        _abort = null;
      }
      const idx = _instances.indexOf(instance);
      if (idx !== -1) _instances.splice(idx, 1);
    }

    const instance = {
      renderSection,
      send,
      cancel,
      resumeIfNeeded,
      destroy,
      get prefix() { return prefix; },
      get mode() { return mode; },
      get storageKey() { return storageKey; },
      // internal for visibility change forwarding
      _pauseListener: pauseListener,
    };

    _instances.push(instance);
    return instance;
  }

  // ── Backward-compatible singleton wrapper for Plus ────────────────────────
  let _plusInstance = null;

  function ensurePlusInstance() {
    if (!_plusInstance) {
      _plusInstance = create({ prefix: 'leo-stream', mode: 'default', storageKey: 'tk-leo' });
    }
    return _plusInstance;
  }

  function renderSection(container) {
    return ensurePlusInstance().renderSection(container);
  }

  function resumeIfNeeded() {
    // Iterate ALL live instances
    for (const inst of _instances) {
      inst.resumeIfNeeded();
    }
  }

  // Visibility change handler for all instances
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        for (const inst of _instances) inst._pauseListener();
      } else {
        for (const inst of _instances) inst.resumeIfNeeded();
      }
    });
  }

  return { loadStatus, renderSection, resumeIfNeeded, create };
})();
;
/* ==== js/components/plus-chat-stream.js ==== */
/**
 * plus-chat-stream.js — Plus « Assistant Bifrost » (SSE via BE → Bifrost).
 * Always remote. Local edge has its own box (edge-chat-stream.js).
 */
var PlusChatStream = (() => {
  let _status = null;
  let _history = [];
  let _apiHistory = [];
  let _busy = false;
  let _abort = null;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function loadStatus() {
    const res = await API.getPlusChatStatus();
    if (!res.ok || !res.data) {
      _status = { ready: false, reason: res.error || 'unreachable' };
      return _status;
    }
    _status = res.data;
    return _status;
  }

  function renderSection(container) {
    if (!container) return;
    const ready = !!(_status && _status.ready);
    const model = (_status && _status.model) || '';

    container.innerHTML = `<div class="leo-section plus-chat-section">
      <h3 class="section-title">Assistant Bifrost</h3>
      <p class="leo-hint">Aujourd’hui / demain : météo, hôtel, codes, bookings (serveur). Seed → Léo. Tips hors-ligne → Local.${model ? ` · <code class="plus-chat-model">${escapeHtml(model)}</code>` : ''}</p>
      <div class="leo-thread" id="plus-chat-thread"></div>
      <div class="leo-stream-status" id="plus-chat-status" hidden></div>
      <div class="leo-wait" id="plus-chat-wait" hidden>
        <span id="plus-chat-wait-label">Connexion…</span>
        <button type="button" class="btn" id="plus-chat-cancel">Annuler</button>
      </div>
      <form class="leo-compose" id="plus-chat-compose">
        <textarea id="plus-chat-input" rows="2"
          placeholder="Ex. Code wifi / pin Airbnb demain ? Météo lundi ?"
          ${!ready || !navigator.onLine ? 'disabled' : ''}></textarea>
        <button type="submit" class="btn btn-primary" id="plus-chat-send"
          ${!ready || !navigator.onLine ? 'disabled' : ''}>Envoyer</button>
      </form>
      ${!ready ? `<div class="leo-banner">Assistant non prêt${_status && _status.reason ? ` (${escapeHtml(_status.reason)})` : ''}.</div>` : ''}
    </div>`;

    paintThread();

    const form = document.getElementById('plus-chat-compose');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        send();
      });
    }
    const cancel = document.getElementById('plus-chat-cancel');
    if (cancel) {
      cancel.addEventListener('click', () => {
        if (_abort) {
          try { _abort.abort(); } catch (_) {}
        }
      });
    }

    if (!navigator.onLine) {
      const input = document.getElementById('plus-chat-input');
      const btn = document.getElementById('plus-chat-send');
      if (input) input.disabled = true;
      if (btn) btn.disabled = true;
    }
  }

  function paintThread() {
    const el = document.getElementById('plus-chat-thread');
    if (!el) return;
    if (!_history.length) {
      el.innerHTML = `<div class="leo-empty">Aucun message pour l’instant.</div>`;
      return;
    }
    el.innerHTML = _history.map(m => {
      const err = m.kind === 'error';
      const cls = m.role === 'user' ? 'leo-msg user' : (err ? 'leo-msg assistant error' : 'leo-msg assistant');
      const who = m.role === 'user' ? 'Toi' : (err ? 'Erreur' : 'Bifrost');
      return `<div class="${cls}"><div class="leo-msg-who">${who}</div><div class="leo-msg-body">${escapeHtml(m.content)}${m.live ? ' ▍' : ''}</div></div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function setBusy(on) {
    _busy = !!on;
    const btn = document.getElementById('plus-chat-send');
    const input = document.getElementById('plus-chat-input');
    const wait = document.getElementById('plus-chat-wait');
    if (btn) btn.disabled = _busy || !navigator.onLine || !(_status && _status.ready);
    if (input) input.disabled = _busy || !navigator.onLine || !(_status && _status.ready);
    if (wait) wait.hidden = !_busy;
  }

  function setStatus(text) {
    const el = document.getElementById('plus-chat-status');
    const label = document.getElementById('plus-chat-wait-label');
    if (label) label.textContent = text || 'Bifrost…';
    if (!el) return;
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = text;
  }

  async function send() {
    if (_busy) return;
    const input = document.getElementById('plus-chat-input');
    const text = String((input && input.value) || '').trim();
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    _history.push(userMsg);
    _apiHistory.push(userMsg);
    if (_apiHistory.length > 12) _apiHistory = _apiHistory.slice(-12);
    if (input) input.value = '';

    const asst = { role: 'assistant', content: '', id: 'p' + Date.now(), live: true };
    _history.push(asst);
    paintThread();
    setBusy(true);
    setStatus('Réponse serveur…');

    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;

    let finalReply = '';
    let sawError = false;
    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : '';

    try {
      for await (const ev of API.plusChatStream({
        tripId: tripId || undefined,
        messages: _apiHistory.slice(),
        signal: ac ? ac.signal : undefined,
      })) {
        const event = ev.event;
        const data = ev.data || {};
        if (event === 'delta' && data.text) {
          asst.content += data.text;
          finalReply = asst.content;
          paintThread();
        } else if (event === 'done') {
          finalReply = (data.reply != null && data.reply !== '') ? data.reply : asst.content;
          asst.content = finalReply || '(réponse vide)';
          asst.live = false;
          paintThread();
        } else if (event === 'error') {
          sawError = true;
          asst.live = false;
          _history.pop();
          let msg = data.error || 'Échec stream';
          if (data.code === 'cancelled') msg = 'Annulé.';
          else if (typeof API !== 'undefined' && API.netFailMessage) {
            msg = API.netFailMessage({ message: msg }, data.code === 'cancelled');
          }
          _history.push({ role: 'assistant', kind: 'error', content: msg });
          paintThread();
        }
      }
    } catch (e) {
      sawError = true;
      asst.live = false;
      _history.pop();
      _history.push({
        role: 'assistant',
        kind: 'error',
        content: (typeof API !== 'undefined' && API.netFailMessage)
          ? API.netFailMessage(e, !!(ac && ac.signal && ac.signal.aborted))
          : ((ac && ac.signal && ac.signal.aborted) ? 'Annulé.' : ((e && e.message) || 'stream interrompu')),
      });
      paintThread();
    }

    _abort = null;
    if (!sawError) {
      asst.live = false;
      asst.content = finalReply || asst.content || '(réponse vide)';
      _apiHistory.push({ role: 'assistant', content: asst.content });
      paintThread();
    }
    setStatus('');
    setBusy(false);
  }

  return { loadStatus, renderSection };
})();
;
/* ==== js/components/edge-chat-stream.js ==== */
/**
 * edge-chat-stream.js — Plus « Local » (Wllama on-device).
 * Separate from Bifrost. Spec: SPEC-edge-model.md — Léo → Bifrost → Local.
 */
var EdgeChatStream = (() => {
  let _history = [];
  let _apiHistory = [];
  let _busy = false;
  let _abort = null;
  let _edgeUnsub = null;
  let _paintScheduled = false;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function fmtSize(bytes) {
    const n = Number(bytes) || 0;
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB';
    if (n >= 1e6) return Math.round(n / 1e6) + ' MB';
    return n + ' o';
  }

  function edgeStatus() {
    if (typeof EdgeEngine === 'undefined') return null;
    return EdgeEngine.status();
  }

  function canSend() {
    const st = edgeStatus();
    return !!(st && st.inRam && !_busy);
  }

  function edgeBarHtml() {
    if (typeof EdgeEngine === 'undefined' || typeof EdgeModelConfig === 'undefined') {
      return `<div class="edge-bar"><p class="leo-hint">Runtime local indisponible.</p></div>`;
    }
    const cfg = EdgeModelConfig.get();
    if (cfg.enabled === false) {
      return `<div class="edge-bar"><p class="leo-hint">Modèle local désactivé.</p></div>`;
    }
    const st = EdgeEngine.status();
    const size = fmtSize(st.sizeBytes || cfg.modelSizeBytes);

    if (st.state === 'downloading') {
      const pct = Math.round((st.progress || 0) * 100);
      return `<div class="edge-bar" id="edge-model-bar">
        <div class="edge-bar-title">Téléchargement… ${pct}%</div>
        <div class="edge-progress"><div class="edge-progress-fill" style="width:${pct}%"></div></div>
      </div>`;
    }
    if (st.state === 'loading_ram') {
      const pct = Math.round((st.progress || 0) * 100);
      const elapsed = st.elapsedSec || 0;
      const phase = st.phase || 'Activation…';
      const detail = st.detail || '';
      const hint = st.hint || '';
      const known = pct > 0;
      return `<div class="edge-bar" id="edge-model-bar">
        <div class="edge-bar-title">${escapeHtml(phase)}${known ? ' · ' + pct + '%' : ''}</div>
        <div class="edge-progress${known ? '' : ' indeterminate'}">
          <div class="edge-progress-fill" style="${known ? 'width:' + pct + '%' : ''}"></div>
        </div>
        <p class="leo-hint" style="margin:8px 0 0">
          <strong style="color:var(--text)">${elapsed}s</strong>
          ${hint ? ' — ' + escapeHtml(hint) : ''}
        </p>
        ${detail ? `<p class="leo-hint" style="margin:6px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78em;overflow-wrap:anywhere">${escapeHtml(detail)}</p>` : ''}
        <button type="button" class="btn edge-btn-secondary" id="edge-cancel-warmup-btn" style="margin-top:10px">Annuler</button>
      </div>`;
    }
    if (st.inRam) {
      return `<div class="edge-bar edge-ready" id="edge-model-bar">
        <span class="edge-badge">⚡ actif</span>
        <span class="leo-hint">Aujourd’hui / demain / hôtel / codes depuis le voyage sur l’appareil. Météo live → Bifrost.</span>
        <button type="button" class="btn edge-btn-secondary" id="edge-unload-btn">Libérer la mémoire</button>
      </div>`;
    }
    if (st.onDisk) {
      return `<div class="edge-bar" id="edge-model-bar">
        <span class="edge-badge">💾 prêt</span>
        <span class="leo-hint">Sur l’appareil (${escapeHtml(size)})${st.needsUpdate ? ' — <strong style="color:var(--orange)">nouvelle version</strong>' : ''}.</span>
        <div class="edge-actions">
          ${st.needsUpdate
            ? '<button type="button" class="btn btn-primary" id="edge-update-btn">Remplacer le modèle</button>'
            : '<button type="button" class="btn btn-primary" id="edge-warmup-btn">Activer maintenant</button>'}
          <button type="button" class="btn edge-btn-danger" id="edge-purge-btn">Supprimer</button>
        </div>
        ${st.error ? `<p class="leo-hint" style="color:var(--orange);margin:10px 0 0;white-space:normal;overflow-wrap:anywhere">${escapeHtml(st.error)}</p>` : ''}
      </div>`;
    }
    return `<div class="edge-bar" id="edge-model-bar">
      <button type="button" class="btn" id="edge-download-btn">Charger le modèle (~${escapeHtml(size)})</button>
      <p class="leo-hint" style="margin:8px 0 0">Optionnel. Survit à «&nbsp;Vider le cache&nbsp;». Bifrost reste disponible au-dessus.</p>
      ${st.error ? `<p class="leo-hint" style="color:var(--orange);margin:6px 0 0">${escapeHtml(st.error)}</p>` : ''}
    </div>`;
  }

  function bindEdgeBar() {
    const dl = document.getElementById('edge-download-btn');
    if (dl) {
      dl.addEventListener('click', async () => {
        const cfg = EdgeModelConfig.get();
        if (!confirm(`Télécharger ~${fmtSize(cfg.modelSizeBytes)} ?\nPréférer Wi‑Fi.`)) return;
        dl.disabled = true;
        try {
          await EdgeEngine.download();
          if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ Modèle téléchargé');
        } catch (_) {
          if (typeof App !== 'undefined' && App.showToast) App.showToast('❌ Téléchargement échoué', 'error');
        }
        refreshEdgeBar();
      });
    }
    const warm = document.getElementById('edge-warmup-btn');
    if (warm) {
      warm.addEventListener('click', async () => {
        warm.disabled = true;
        warm.textContent = 'Activation…';
        try {
          await EdgeEngine.warmUp();
          if (typeof App !== 'undefined' && App.showToast) App.showToast('⚡ Modèle actif');
        } catch (_) {
          if (typeof App !== 'undefined' && App.showToast) App.showToast('❌ Activation échouée', 'error');
        }
        refreshEdgeBar();
      });
    }
    const upd = document.getElementById('edge-update-btn');
    if (upd) {
      upd.addEventListener('click', async () => {
        if (!confirm('Remplacer le modèle OPFS par la version actuelle ?')) return;
        upd.disabled = true;
        try {
          await EdgeEngine.download();
          if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ Modèle mis à jour');
        } catch (_) {
          if (typeof App !== 'undefined' && App.showToast) App.showToast('❌ Mise à jour échouée', 'error');
        }
        refreshEdgeBar();
      });
    }
    const purge = document.getElementById('edge-purge-btn');
    if (purge) {
      purge.addEventListener('click', async () => {
        if (!confirm('Supprimer le modèle de cet appareil ?')) return;
        await EdgeEngine.purge();
        refreshEdgeBar();
      });
    }
    const unload = document.getElementById('edge-unload-btn');
    if (unload) {
      unload.addEventListener('click', async () => {
        await EdgeEngine.unload();
        refreshEdgeBar();
      });
    }
    const cancelWarm = document.getElementById('edge-cancel-warmup-btn');
    if (cancelWarm) {
      cancelWarm.addEventListener('click', async () => {
        await EdgeEngine.cancelWarmUp();
        refreshEdgeBar();
      });
    }
    syncComposeEnabled();
  }

  function refreshEdgeBar() {
    const host = document.getElementById('edge-model-bar-host');
    if (!host) return;
    host.innerHTML = edgeBarHtml();
    bindEdgeBar();
  }

  function patchEdgeLoading(st) {
    const bar = document.getElementById('edge-model-bar');
    if (!bar || !st) return false;
    const title = bar.querySelector('.edge-bar-title');
    const pct = Math.round((st.progress || 0) * 100);
    const known = pct > 0;
    if (title) {
      title.textContent = (st.phase || 'Activation…') + (known ? ' · ' + pct + '%' : '');
    }
    const hints = bar.querySelectorAll('.leo-hint');
    if (hints[0]) {
      hints[0].innerHTML = `<strong style="color:var(--text)">${st.elapsedSec || 0}s</strong>`
        + (st.hint ? ' — ' + escapeHtml(st.hint) : '');
    }
    if (st.detail) {
      let det = hints[1];
      if (!det || !det.classList.contains('edge-detail')) {
        det = document.createElement('p');
        det.className = 'leo-hint edge-detail';
        det.style.cssText = 'margin:6px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78em;overflow-wrap:anywhere';
        hints[0] && hints[0].after(det);
      }
      det.textContent = st.detail;
    }
    const fill = bar.querySelector('.edge-progress-fill');
    const prog = bar.querySelector('.edge-progress');
    if (prog) prog.classList.toggle('indeterminate', !known);
    if (fill && known) fill.style.width = pct + '%';
    return true;
  }

  function onEdgeChange() {
    const st = edgeStatus();
    if (st && st.state === 'loading_ram' && document.getElementById('edge-model-bar')) {
      if (patchEdgeLoading(st)) {
        syncComposeEnabled();
        return;
      }
    }
    refreshEdgeBar();
  }

  function syncComposeEnabled() {
    const input = document.getElementById('edge-chat-input');
    const btn = document.getElementById('edge-chat-send');
    const ok = canSend();
    if (input) input.disabled = !ok;
    if (btn) btn.disabled = !ok;
  }

  function renderSection(container) {
    if (!container) return;
    container.innerHTML = `<div class="leo-section edge-chat-section">
      <h3 class="section-title">Local (appareil)</h3>
      <p class="leo-hint">Même contexte que Bifrost (programme, hôtel, codes), calculé sur l’appareil. Lent (~2&nbsp;tokens/s). Météo live → Bifrost au-dessus.</p>
      <div id="edge-model-bar-host">${edgeBarHtml()}</div>
      <div class="leo-thread" id="edge-chat-thread"></div>
      <div class="leo-stream-status" id="edge-chat-status" hidden></div>
      <div class="leo-wait" id="edge-chat-wait" hidden>
        <span id="edge-chat-wait-label">Réponse locale…</span>
        <button type="button" class="btn" id="edge-chat-cancel">Annuler</button>
      </div>
      <form class="leo-compose" id="edge-chat-compose">
        <textarea id="edge-chat-input" rows="2"
          placeholder="Ex. Que faire un jour de pluie à Québec ?"
          disabled></textarea>
        <button type="submit" class="btn btn-primary" id="edge-chat-send" disabled>Envoyer</button>
      </form>
    </div>`;

    paintThread();
    bindEdgeBar();

    if (_edgeUnsub) { try { _edgeUnsub(); } catch (_) {} _edgeUnsub = null; }
    if (typeof EdgeEngine !== 'undefined') {
      _edgeUnsub = EdgeEngine.onChange(() => onEdgeChange());
      EdgeEngine.refreshFromDisk().then(() => refreshEdgeBar());
    }

    const form = document.getElementById('edge-chat-compose');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        send();
      });
    }
    const cancel = document.getElementById('edge-chat-cancel');
    if (cancel) {
      cancel.addEventListener('click', () => {
        if (_abort) {
          try { _abort.abort(); } catch (_) {}
        }
      });
    }
  }

  function paintThread() {
    const el = document.getElementById('edge-chat-thread');
    if (!el) return;
    if (!_history.length) {
      el.innerHTML = `<div class="leo-empty">Active le modèle puis pose une question tip.</div>`;
      return;
    }
    el.innerHTML = _history.map(m => {
      const err = m.kind === 'error';
      const cls = m.role === 'user' ? 'leo-msg user' : (err ? 'leo-msg assistant error' : 'leo-msg assistant');
      const who = m.role === 'user' ? 'Toi' : (err ? 'Erreur' : 'Local');
      return `<div class="${cls}"><div class="leo-msg-who">${who}</div><div class="leo-msg-body">${escapeHtml(m.content)}${m.live ? ' ▍' : ''}</div></div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function schedulePaint() {
    if (_paintScheduled) return;
    _paintScheduled = true;
    const run = () => {
      _paintScheduled = false;
      paintThread();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 50);
  }

  function setBusy(on) {
    _busy = !!on;
    const wait = document.getElementById('edge-chat-wait');
    if (wait) wait.hidden = !_busy;
    syncComposeEnabled();
  }

  function setStatus(text) {
    const el = document.getElementById('edge-chat-status');
    const label = document.getElementById('edge-chat-wait-label');
    if (label) label.textContent = text || 'Réponse locale…';
    if (!el) return;
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = text;
  }

  async function send() {
    if (_busy || !canSend()) return;
    const input = document.getElementById('edge-chat-input');
    const text = String((input && input.value) || '').trim();
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    _history.push(userMsg);
    _apiHistory.push(userMsg);
    if (_apiHistory.length > 6) _apiHistory = _apiHistory.slice(-6);
    if (input) input.value = '';

    const asst = { role: 'assistant', content: '', id: 'e' + Date.now(), live: true, source: 'edge' };
    _history.push(asst);
    paintThread();
    setBusy(true);
    setStatus('Réponse locale…');

    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    _abort = ac;

    try {
      const hist = _apiHistory.slice(0, -1);
      const reply = await EdgeEngine.generate(text, hist, {
        signal: ac ? ac.signal : undefined,
        onDelta: (delta) => {
          asst.content += delta;
          schedulePaint();
        },
      });
      asst.content = reply || asst.content || '(réponse vide)';
      asst.live = false;
      _apiHistory.push({ role: 'assistant', content: asst.content });
      paintThread();
    } catch (e) {
      asst.live = false;
      _history.pop();
      const aborted = ac && ac.signal && ac.signal.aborted;
      const msg = aborted ? 'Annulé.' : ((e && e.message) || 'génération locale interrompue (mémoire ?)');
      _history.push({ role: 'assistant', kind: 'error', content: msg });
      paintThread();
      // Free WASM RAM after crash so Bifrost/Léo stay usable
      if (!aborted && typeof EdgeEngine !== 'undefined' && EdgeEngine.unload) {
        try { await EdgeEngine.unload(); } catch (_) { /* ignore */ }
        refreshEdgeBar();
      }
    }

    _abort = null;
    setStatus('');
    setBusy(false);
  }

  return { renderSection, refreshEdgeBar };
})();
