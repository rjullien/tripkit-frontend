'use strict';
/**
 * Polarsteps generate is a leo.Hub job: POST returns 202 immediately, the UI
 * subscribes to GET /leo/jobs/{id}/stream. nginx /api/ must still wait on
 * that SSE (progress ticks every 10s; worst case a quiet hop).
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const conf = fs.readFileSync(path.join(__dirname, '..', 'nginx.conf'), 'utf8');
const apiBlock = conf.split('location /api/')[1];
assert.ok(apiBlock, 'location /api/ missing');
const untilNext = apiBlock.split('location ')[0];
assert.ok(/proxy_read_timeout\s+270s/.test(untilNext), 'location /api/ must set proxy_read_timeout 270s');
assert.ok(/proxy_send_timeout\s+270s/.test(untilNext), 'location /api/ must set proxy_send_timeout 270s');

const apiJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');
const start = apiJs.indexOf('async function postPolarstepsCaption');
assert.ok(start >= 0, 'postPolarstepsCaption missing');
const chunk = apiJs.slice(start, start + 350);
assert.ok(/timeoutMs:\s*15000/.test(chunk), 'POST is 202 {jobId} — 15s is enough');
assert.ok(!/timeoutMs:\s*24\d{4}/.test(chunk), 'POST must not wait on Bifrost');

console.log('nginx-api-timeout.test.cjs: ok');
