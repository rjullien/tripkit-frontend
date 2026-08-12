/**
 * EdgeEngine — Wllama wrapper (download OPFS / warm RAM / generate / purge).
 * Spec: SPEC-edge-model.md — bouton opt-in, OPFS via Wllama CacheManager,
 * warm-up lazy, jamais au boot.
 */
var EdgeEngine = (() => {
  const WLLAMA_JS = 'js/lib/wllama/index.min.js';
  const WLLAMA_WASM = 'js/lib/wllama/wasm/wllama.wasm';

  /** @type {null | 'idle' | 'downloading' | 'ready_disk' | 'loading_ram' | 'ready_ram' | 'error'} */
  let _state = 'idle';
  let _progress = 0; // 0..1 while downloading
  let _error = '';
  let _wllama = null;
  let _WllamaClass = null;
  let _listeners = [];

  function absUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
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

  async function loadWllamaClass() {
    if (_WllamaClass) return _WllamaClass;
    const mod = await import(absUrl(WLLAMA_JS));
    _WllamaClass = mod.Wllama || (mod.default && mod.default.Wllama) || mod.default;
    if (!_WllamaClass) throw new Error('Wllama export introuvable');
    return _WllamaClass;
  }

  async function getInstance() {
    if (_wllama) return _wllama;
    const Wllama = await loadWllamaClass();
    const paths = { default: absUrl(WLLAMA_WASM) };
    _wllama = new Wllama(paths, {
      allowOffline: true,
      logger: {
        debug: () => {},
        log: (...a) => console.log('[edge]', ...a),
        warn: (...a) => console.warn('[edge]', ...a),
        error: (...a) => console.error('[edge]', ...a),
      },
    });
    // iOS Safari needs compat worker (WebGPU path / SharedArrayBuffer gaps).
    try {
      if (typeof _wllama.setCompat === 'function') {
        const ua = navigator.userAgent || '';
        if (/iPhone|iPad|iPod|Safari/.test(ua) && !/Chrom(e|ium)|CriOS/.test(ua)) {
          _wllama.setCompat('default');
        }
      }
    } catch (e) {
      console.warn('[edge] setCompat failed', e);
    }
    return _wllama;
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
    emit();

    try {
      const w = await getInstance();
      await w.cacheManager.download(cfg.modelUrl, {
        progressCallback: ({ loaded, total }) => {
          _progress = total > 0 ? loaded / total : 0;
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
      emit();
      return true;
    } catch (e) {
      _error = (e && e.message) || String(e);
      _state = hasOnDisk() ? 'ready_disk' : 'error';
      emit();
      throw e;
    }
  }

  /**
   * Load GGUF from OPFS into RAM (lazy warm-up).
   */
  async function warmUp(opts) {
    await ensureConfig();
    const cfg = EdgeModelConfig.get();
    if (!hasOnDisk() && !(opts && opts.allowDownload)) {
      throw new Error('Modèle non téléchargé — utilise Charger d’abord');
    }

    _state = 'loading_ram';
    _error = '';
    emit();

    try {
      const w = await getInstance();
      await w.loadModelFromUrl(cfg.modelUrl, {
        useCache: true,
        n_ctx: 2048,
        n_gpu_layers: 0,
        progressCallback: ({ loaded, total }) => {
          _progress = total > 0 ? loaded / total : 0;
          emit();
        },
      });
      if (!EdgeModelConfig.storedVersion()) {
        EdgeModelConfig.setStoredVersion(cfg.modelVersion, cfg.modelSizeBytes);
      }
      _state = 'ready_ram';
      _progress = 1;
      emit();
      return true;
    } catch (e) {
      _error = (e && e.message) || String(e);
      _state = hasOnDisk() ? 'ready_disk' : 'error';
      emit();
      throw e;
    }
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
        try { await w.exit(); } catch (_) {}
        _state = 'ready_disk';
        _wllama = null;
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
    if (_wllama) {
      try { await _wllama.exit(); } catch (_) { /* ignore */ }
    }
    _wllama = null;
    _state = hasOnDisk() ? 'ready_disk' : 'idle';
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
    try {
      if (_wllama) await _wllama.exit();
    } catch (_) { /* ignore */ }
    _wllama = null;
    if (typeof EdgeModelConfig !== 'undefined') EdgeModelConfig.clearStoredMeta();
    _state = 'idle';
    _progress = 0;
    _error = '';
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
    ensureReadyForLocal,
    generate,
    unload,
    purge,
    refreshFromDisk,
  };
})();
