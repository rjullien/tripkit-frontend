/**
 * Edge model config — defaults + optional fetch of /edge-model.json (SoT mirror).
 * Spec: SPEC-edge-model.md (rjullien/tripkit).
 */
var EdgeModelConfig = (() => {
  const LS_VERSION = 'tk-edge-model-version';
  const LS_SIZE = 'tk-edge-model-size';

  const DEFAULTS = {
    enabled: true,
    modelUrl: 'https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q3_K_S.gguf',
    modelVersion: 'smollm2-135m-instruct-q3ks-v1',
    modelSizeBytes: 88202080,
    runtime: 'wllama',
    maxTokens: 200,
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
