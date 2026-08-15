# ── Stage 1 : génération des bundles JS ──────────────────────────────────────
# Aucune dépendance npm : scripts/build-bundles.mjs n'utilise que node:*.
FROM node:22-alpine AS build
WORKDIR /src
COPY . .
RUN node scripts/build-bundles.mjs

# ── Stage 2 : image nginx servie en prod ─────────────────────────────────────
FROM nginx:alpine
RUN apk add --no-cache jq
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /src /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/.gitignore \
          /usr/share/nginx/html/.dockerignore \
          /usr/share/nginx/html/config.js.template \
          /usr/share/nginx/html/docker-entrypoint.sh \
          /usr/share/nginx/html/bundles.json \
          /usr/share/nginx/html/package.json \
          /usr/share/nginx/html/package-lock.json && \
    rm -rf /usr/share/nginx/html/.github \
           /usr/share/nginx/html/scripts

# Cache-buster: inject ?v=CACHE_VER into all JS/CSS references in index.html
RUN CACHE_VER=$(jq -r '.cache' /usr/share/nginx/html/version.json) && \
    sed -i -E "s/(src=\"[^\"]+\\.js)(\")/\1?v=${CACHE_VER}\2/g" /usr/share/nginx/html/index.html && \
    sed -i -E "s/(href=\"[^\"]+\\.css)(\")/\1?v=${CACHE_VER}\2/g" /usr/share/nginx/html/index.html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime config injection via envsubst
COPY config.js.template /etc/nginx/templates/config.js.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV API_URL=""
ENV API_PREFIX="/api"
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
