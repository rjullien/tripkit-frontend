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
  const WARMUP_TIMEOUT_MS = 180000; // 3 min — Safari Asyncify; 135M should be well under
  const OVERSIZE_BYTES = 40 * 1000 * 1000; // >40 Mo = leftover 135M/360M during stories15M smoke-test

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
    if (sec < 60) return 'Allocation mémoire — stories15M ≈ quelques secondes';
    if (sec < 120) return 'Toujours en cours — laisse tourner ou Annuler';
    return 'Très long — Annuler, vérifier taille ~19 Mo, réessayer';
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
    if (/already initialized/i.test(raw)) {
      return 'Runtime déjà initialisé — réessaie (Annuler puis Activer).';
    }
    if (/timeout activation/i.test(raw)) {
      const mb = _diskBytes ? Math.round(_diskBytes / 1e6) + ' Mo sur disque. ' : '';
      return mb
        + 'Activation trop longue. Si >40 Mo → Remplacer par stories15M (~19 Mo). Sinon réessaie.';
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
    const nCtx = isMobileSafari() ? 512 : 1024;
    const modelUrl = resolveModelUrl(cfg.modelUrl);

    try {
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
   * Completion locale. Sur iPhone : non-stream (évite OOM / kill d’onglet).
   * Desktop : stream + onDelta.
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
    const maxTokens = (opts && opts.maxTokens) || cfg.maxTokens || 80;
    const temperature = (opts && opts.temperature) != null ? opts.temperature : (cfg.temperature ?? 0.7);
    const useStream = !(opts && opts.stream === false) && !isMobileSafari();

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
          + ' Mo — clique Remplacer (~19 Mo self-host).';
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
