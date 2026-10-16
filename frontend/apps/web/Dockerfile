# ==============================================================================
# Production Dockerfile for LabCore ELIS Web Application (Next.js 15)
# ==============================================================================

FROM node:20-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=3001 \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# --- Build Stage ---
FROM base AS builder

COPY package*.json ./
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY next.config.js ./
COPY scripts ./scripts

RUN npm ci --include=dev

COPY src ./src
COPY public ./public

# Build Next.js production bundle
RUN npm run build

# --- Runtime Stage ---
FROM base AS runner

WORKDIR /app

# Non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

USER nextjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

CMD ["npm", "start"]
