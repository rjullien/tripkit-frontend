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
  const OVERSIZE_BYTES = 150 * 1000 * 1000; // >150 Mo = leftover 360M/1.7B, refuse warm-up

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
    const oversize = _diskBytes > 0 && (
      _diskBytes >= OVERSIZE_BYTES
      || (expected > 0 && _diskBytes > expected * 1.5)
    );
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
    if (sec < 60) return 'Allocation mémoire — 135M ≈ 10–40s sur iPhone';
    if (sec < 120) return 'Toujours en cours — laisse tourner ou Annuler';
    return 'Très long — Annuler, vérifier taille ~88 Mo, réessayer';
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
        + 'Activation trop longue. Si >150 Mo → Remplacer par 135M (~88 Mo). Sinon réessaie (Wi‑Fi, onglet seul).';
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

    _state = 'downloading';
    _progress = 0;
    _error = '';
    _phase = 'Téléchargement…';
    emit();

    try {
      const w = await getInstance();
      // Free previous GGUF (e.g. 1.7B → 360M) before download
      if (typeof EdgeModelConfig !== 'undefined' && EdgeModelConfig.needsUpdate()) {
        setPhase('Nettoyage ancien modèle…');
        try { await w.cacheManager.clear(); } catch (_) { /* ignore */ }
      }
      await w.cacheManager.download(cfg.modelUrl, {
        progressCallback: ({ loaded, total }) => {
          _progress = total > 0 ? loaded / total : 0;
          _phase = 'Téléchargement… ' + Math.round(_progress * 100) + '%';
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
   * Load GGUF from OPFS into RAM (lazy warm-up).
   * Uses cacheManager.open + loadModel (no network) + n_threads:1 (no COOP/COEP).
   */
  async function warmUp(opts) {
    await ensureConfig();
    const cfg = EdgeModelConfig.get();
    if (!hasOnDisk() && !(opts && opts.allowDownload)) {
      throw new Error('Modèle non téléchargé — utilise Charger d’abord');
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

    try {
      // Fresh instance — do NOT call resetInstance() here (it kills the heartbeat).
      await exitWllama();
      if (gen !== _warmupGen) throw new Error('Annulé');

      setPhase('2/4 Chargement runtime WASM…', isMobileSafari()
        ? 'Safari → compat Asyncify local (pas jsDelivr)'
        : 'js/lib/wllama + wllama.wasm');
      const w = await getInstance();
      if (gen !== _warmupGen) throw new Error('Annulé');

      setPhase('3/4 Lecture OPFS…', 'Ouverture du GGUF en cache local');
      let blob = await w.cacheManager.open(cfg.modelUrl);
      _diskBytes = blob && blob.size ? blob.size : 0;
      if (blob && blob.size >= OVERSIZE_BYTES) {
        const mb = Math.round(blob.size / 1e6);
        throw new Error(
          'Modèle trop gros (' + mb + ' Mo). Supprime-le puis charge le 135M (~88 Mo).'
        );
      }
      if (!blob || !blob.size) {
        setPhase('3/4 Cache OPFS vide — fallback URL…', cfg.modelUrl);
        await w.loadModelFromUrl(cfg.modelUrl, {
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
      } else {
        const mb = (blob.size / 1e6).toFixed(0);
        setPhase(
          '4/4 Inférence WASM (n_threads=1, n_ctx=' + nCtx + ')…',
          'OPFS ' + mb + ' Mo — Asyncify Safari sans %. 135M ≈ 10–40s.'
        );
        const loadPromise = w.loadModel([blob], {
          n_ctx: nCtx,
          n_gpu_layers: 0,
          n_threads: 1,
          warmup: false,
        });
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(
            'Timeout activation (' + Math.round(timeoutMs / 1000) + 's). Réessaie ou reste sur le serveur.'
          )), timeoutMs);
        });
        await Promise.race([loadPromise, timeoutPromise]);
      }

      if (gen !== _warmupGen) {
        await resetInstance();
        throw new Error('Annulé');
      }

      if (!EdgeModelConfig.storedVersion()) {
        EdgeModelConfig.setStoredVersion(cfg.modelVersion, cfg.modelSizeBytes);
      }
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

  /** Reconcile state after boot (disk meta only — no RAM load). */
  async function refreshFromDisk() {
    await ensureConfig();
    if (isLoaded()) {
      _state = 'ready_ram';
    } else if (hasOnDisk()) {
      _state = 'ready_disk';
      try {
        const cfg = EdgeModelConfig.get();
        const w = await getInstance();
        const blob = await w.cacheManager.open(cfg.modelUrl);
        _diskBytes = blob && blob.size ? blob.size : 0;
        if (_diskBytes >= OVERSIZE_BYTES && !_error) {
          _error = 'Ancien modèle ~' + Math.round(_diskBytes / 1e6)
            + ' Mo détecté — remplace par 135M (~88 Mo).';
        }
      } catch (_) {
        /* keep meta-only */
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
