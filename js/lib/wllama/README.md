@wllama/wllama v3.5.1 — vendored for Edge Model (Plus Chat offline).

Source: https://github.com/ngxson/wllama
npm: `@wllama/wllama` + `@wllama/wllama-compat` (same version)

Files kept:
- `index.min.js` — main ESM bundle
- `wasm/wllama.wasm` — default (JSPI / Memory64) build
- `compat/wllama.wasm` + `compat/wllama.js` — Safari / no-JSPI Asyncify build

**iPhone / Safari:** Wllama constructor enables compat by default and would pull
from jsDelivr. We override with local `compat/` via `setCompat({ wasm, worker })`
so activation does not depend on CDN (and works after first fetch offline).

Do NOT precache `*.wasm` in `sw.js` ASSETS (lazy load on opt-in — ~7–14 Mo).
GGUF models are stored by Wllama CacheManager in OPFS — never Cache API.
