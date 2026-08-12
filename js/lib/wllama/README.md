@wllama/wllama v3.5.1 — vendored for Edge Model (Plus Chat offline).

Source: https://github.com/ngxson/wllama
npm: @wllama/wllama
Licence: see upstream (MIT-style — check package LICENCE)

Files kept:
- index.min.js
- wasm/wllama.wasm

Do NOT precache wllama.wasm in sw.js ASSETS (lazy load on opt-in).
GGUF models are stored by Wllama CacheManager in OPFS — never Cache API.
