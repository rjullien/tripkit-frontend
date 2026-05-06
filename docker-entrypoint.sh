#!/bin/sh
# Inject runtime env vars into config.js via envsubst
envsubst '${API_URL} ${API_PREFIX}' < /etc/nginx/templates/config.js.template > /usr/share/nginx/html/config.js
exec "$@"
