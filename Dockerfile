# syntax=docker/dockerfile:1.7
# Multi-stage build for Next.js (standalone) + Payload CMS.

ARG NODE_VERSION=24.15.0
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      pnpm install --no-frozen-lockfile; \
    fi

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# PAYLOAD_SECRET and DATABASE_URI are not needed at build time but Payload
# may try to read them; provide harmless placeholders.
ENV PAYLOAD_SECRET=build_time_placeholder
ENV DATABASE_URI=postgres://placeholder@localhost:5432/placeholder
RUN pnpm run build

# ---------- runner ----------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Media uploads directory (mounted as a volume in production).
RUN mkdir -p /app/media && chown -R nextjs:nodejs /app/media
VOLUME ["/app/media"]

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
