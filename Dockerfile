FROM nginx:alpine
RUN apk add --no-cache jq
RUN rm -rf /usr/share/nginx/html/*
COPY . /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/.gitignore \
          /usr/share/nginx/html/README.md \
          /usr/share/nginx/html/config.js.template \
          /usr/share/nginx/html/docker-entrypoint.sh && \
    rm -rf /usr/share/nginx/html/.github

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
