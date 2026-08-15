'use strict';
/**
 * Polarsteps generate holds the /api/ proxy with no bytes until Bifrost
 * answers. nginx default proxy_read_timeout is 60s → HTML 502 on the
 * ClusterIP / same-origin hop (public /api is Traefik → backend).
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const conf = fs.readFileSync(path.join(__dirname, '..', 'nginx.conf'), 'utf8');
const apiBlock = conf.split('location /api/')[1];
assert.ok(apiBlock, 'location /api/ missing');
const untilNext = apiBlock.split('location ')[0];
assert.ok(/proxy_read_timeout\s+180s/.test(untilNext), 'location /api/ must set proxy_read_timeout 180s');
assert.ok(/proxy_send_timeout\s+180s/.test(untilNext), 'location /api/ must set proxy_send_timeout 180s');

const apiJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');
assert.ok(/timeoutMs:\s*120000/.test(apiJs), 'postPolarstepsCaption must wait 120s');

console.log('nginx-api-timeout.test.cjs: ok');
