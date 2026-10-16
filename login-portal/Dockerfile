# ==============================================================================
# Production Dockerfile for LabCore Login Portal (Vite + React SPA)
# ==============================================================================

FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

RUN npm ci --include=dev

COPY src ./src
COPY index.html ./
COPY public ./public

RUN npm run build

# --- Runtime Stage via Nginx Alpine ---
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx SPA configuration
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '  listen 3002;' >> /etc/nginx/conf.d/default.conf && \
    echo '  server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '  root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '    try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '  location /health {' >> /etc/nginx/conf.d/default.conf && \
    echo '    return 200 "OK\n";' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
