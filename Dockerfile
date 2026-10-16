# ==============================================================================
# Multi-Stage Production Dockerfile for LabCore ELIS OS
# Includes Chromium for Puppeteer PDF Generation & postgresql-client for Backups
# ==============================================================================

FROM node:20-bookworm-slim AS base

# Install system dependencies: Chromium, fonts, and PostgreSQL client tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    postgresql-client \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# --- Backend Builder ---
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma.config.ts ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
RUN npm ci --include=dev
COPY backend/api ./api
COPY backend/scripts ./scripts
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# --- Frontend Web Builder ---
FROM base AS frontend-builder
WORKDIR /app/frontend/apps/web
COPY frontend/apps/web/package*.json ./
COPY frontend/apps/web/tsconfig.json ./
COPY frontend/apps/web/postcss.config.js ./
COPY frontend/apps/web/tailwind.config.ts ./
COPY frontend/apps/web/next.config.js ./
COPY frontend/apps/web/scripts ./scripts
RUN npm ci --include=dev
COPY frontend/apps/web/src ./src
COPY frontend/apps/web/public ./public
RUN npm run build

# --- Production Runner Stage ---
FROM base AS runner
WORKDIR /app

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/scripts ./backend/scripts

# Copy built frontend web
COPY --from=frontend-builder /app/frontend/apps/web/.next ./frontend/apps/web/.next
COPY --from=frontend-builder /app/frontend/apps/web/public ./frontend/apps/web/public
COPY --from=frontend-builder /app/frontend/apps/web/package*.json ./frontend/apps/web/
COPY --from=frontend-builder /app/frontend/apps/web/node_modules ./frontend/apps/web/node_modules

# Ensure backup directories exist
RUN mkdir -p /app/backend/backups && chmod 777 /app/backend/backups

EXPOSE 5000 3001 5005

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Production startup
CMD ["node", "backend/dist/api/src/server.js"]
