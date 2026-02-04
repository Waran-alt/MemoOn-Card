# Multi-stage build for client frontend
# Build context: memoon-card root (.) or Portfolio root with PROJECT_ROOT=clients/memoon-card
# Volume mounts source to /app/clients/memoon-card/frontend - workspace must live there
ARG PROJECT_ROOT=.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Workspace setup - put client at /app/clients/memoon-card to match volume mount path
FROM base AS workspace-setup
ARG PROJECT_ROOT=.
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN mkdir -p clients/memoon-card/frontend clients/memoon-card/backend

COPY ${PROJECT_ROOT}/.yarnrc.yml ./clients/memoon-card/.yarnrc.yml
COPY ${PROJECT_ROOT}/package.json ./clients/memoon-card/package.json
COPY ${PROJECT_ROOT}/frontend/package.json ./clients/memoon-card/frontend/package.json
COPY ${PROJECT_ROOT}/backend/package.json ./clients/memoon-card/backend/package.json
COPY ${PROJECT_ROOT}/.yarn* ./clients/memoon-card/.yarn/
COPY ${PROJECT_ROOT}/frontend/yarn.lock* ./clients/memoon-card/frontend/yarn.lock

# Install dependencies
FROM workspace-setup AS deps
WORKDIR /app/clients/memoon-card
RUN yarn install
WORKDIR /app

# Build
FROM deps AS builder
ARG PROJECT_ROOT=.
COPY ${PROJECT_ROOT}/frontend ./clients/memoon-card/frontend
WORKDIR /app/clients/memoon-card/frontend
RUN yarn build

# Runtime
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat curl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy built application (standalone output - structure may vary by Next.js version)
COPY --from=builder /app/clients/memoon-card/frontend/public ./clients/memoon-card/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/clients/memoon-card/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/clients/memoon-card/frontend/.next/static ./clients/memoon-card/frontend/.next/static

USER nextjs
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
WORKDIR /app
# Standalone output structure: server.js at root or frontend/server.js depending on Next.js config
CMD ["node", "server.js"]

# Development - volume overlays /app/clients/memoon-card/frontend with host source
FROM deps AS development
ARG PROJECT_ROOT=.
WORKDIR /app
ENV NODE_ENV=development
RUN apk add --no-cache libc6-compat curl
COPY ${PROJECT_ROOT}/frontend ./clients/memoon-card/frontend
WORKDIR /app/clients/memoon-card/frontend
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
CMD ["yarn", "dev"]
