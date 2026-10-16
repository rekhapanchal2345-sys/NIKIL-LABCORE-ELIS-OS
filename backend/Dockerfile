# ==============================================================================
# Production Dockerfile for LabCore ELIS Backend Service
# Includes Chromium for PDF Generation & postgresql-client for Disaster Recovery
# ==============================================================================

FROM node:20-bookworm-slim AS base

# Install OS utilities, Chromium for Puppeteer, fonts, and postgresql-client
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    libxss1 \
    postgresql-client \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=5000

WORKDIR /app

# --- Build Stage ---
FROM base AS builder

COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY prisma ./prisma

RUN npm ci --include=dev

COPY api ./api
COPY scripts ./scripts

RUN npx prisma generate
RUN npm run build

# Prune devDependencies for production runtime
RUN npm prune --omit=dev

# --- Runtime Stage ---
FROM base AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Create backups directory with write permissions
RUN mkdir -p /app/backups && chmod 777 /app/backups

EXPOSE 5000 5005

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "dist/api/src/server.js"]
