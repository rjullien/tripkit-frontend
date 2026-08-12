/**
 * EdgeEngine — Wllama wrapper (download OPFS / warm RAM / generate / purge).
 * Spec: SPEC-edge-model.md — bouton opt-in, OPFS via Wllama CacheManager,
 * warm-up lazy, jamais au boot.
 */
var EdgeEngine = (() => {
  const WLLAMA_JS = 'js/lib/wllama/index.min.js';
  const WLLAMA_WASM = 'js/lib/wllama/wasm/wllama.wasm';
  const WARMUP_TIMEOUT_MS = 180000; // 3 min — 1GB→RAM on iPhone can be slow

  /** @type {null | 'idle' | 'downloading' | 'ready_disk' | 'loading_ram' | 'ready_ram' | 'error'} */
  let _state = 'idle';
  let _progress = 0; // 0..1
  let _error = '';
  let _phase = '';
  let _detail = '';
  let _hint = '';
  let _elapsedSec = 0;
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
      needsUpdate: typeof EdgeModelConfig !== 'undefined' ? EdgeModelConfig.needsUpdate() : false,
      sizeBytes: (typeof EdgeModelConfig !== 'undefined' && EdgeModelConfig.storedSize())
        || cfg.modelSizeBytes
        || 0,
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
    if (sec < 8) return 'Init runtime WASM…';
    if (sec < 25) return 'Décodage GGUF + démarrage worker…';
    if (sec < 60) return 'Allocation mémoire (~1.5 Go) — c’est long mais normal';
    if (sec < 120) return 'Toujours en cours — iPhone ~1–3 min pour 1 Go';
    return 'Très long — tu peux Annuler et rester sur le serveur';
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
    // CPU-only WASM. Do NOT call setCompat('default') — that pulls WebGPU compat
    // from jsDelivr and can hang forever on iOS for our n_gpu_layers:0 path.
    _wllama = new Wllama(paths, {
      allowOffline: true,
      logger: {
        debug: () => {},
        log: (...a) => console.log('[edge]', ...a),
        warn: (...a) => console.warn('[edge]', ...a),
        error: (...a) => console.error('[edge]', ...a),
      },
    });
    return _wllama;
  }

  function formatErr(e, fallback) {
    const raw = (e && e.message) || String(e || fallback);
    if (/load failed|failed to fetch/i.test(raw)) {
      return 'Réseau bloqué (CSP/CORS) ou URL modèle injoignable.';
    }
    if (/already initialized/i.test(raw)) {
      return 'Runtime déjà initialisé — réessaie (Annuler puis Activer).';
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
    const nCtx = isMobileSafari() ? 1024 : 2048;

    try {
      // Fresh instance — do NOT call resetInstance() here (it kills the heartbeat).
      await exitWllama();
      if (gen !== _warmupGen) throw new Error('Annulé');

      setPhase('2/4 Chargement runtime WASM…', 'js/lib/wllama + wllama.wasm');
      const w = await getInstance();
      if (gen !== _warmupGen) throw new Error('Annulé');

      setPhase('3/4 Lecture OPFS…', 'Ouverture du GGUF en cache local');
      let blob = await w.cacheManager.open(cfg.modelUrl);
      if (!blob || !blob.size) {
        setPhase('3/4 Cache OPFS vide — fallback URL…', cfg.modelUrl);
        await w.loadModelFromUrl(cfg.modelUrl, {
          useCache: true,
          n_ctx: nCtx,
          n_gpu_layers: 0,
          n_threads: 1,
          progressCallback: ({ loaded, total }) => {
            _progress = total > 0 ? loaded / total : 0;
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
          'Fichier OPFS : ' + mb + ' Mo — pas de % pendant cette étape (Wllama ne le rapporte pas)'
        );
        const loadPromise = w.loadModel([blob], {
          n_ctx: nCtx,
          n_gpu_layers: 0,
          n_threads: 1,
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
   * Stream a local completion. Calls onDelta(textChunk) then returns full text.
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
    let full = '';
    const stream = await w.createChatCompletion({
      messages,
      max_tokens: (opts && opts.maxTokens) || cfg.maxTokens || 300,
      temperature: (opts && opts.temperature) != null ? opts.temperature : (cfg.temperature ?? 0.7),
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
    } else {
      _state = 'idle';
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
