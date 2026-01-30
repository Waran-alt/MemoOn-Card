# Multi-stage build for client frontend
# Build context: memoon-card root (.) or Portfolio root with PROJECT_ROOT=clients/memoon-card
ARG PROJECT_ROOT=.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Workspace setup
FROM base AS workspace-setup
ARG PROJECT_ROOT=.
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy client monorepo files
COPY ${PROJECT_ROOT}/.yarnrc.yml ./.yarnrc.yml
COPY ${PROJECT_ROOT}/package.json ./package.json
COPY ${PROJECT_ROOT}/frontend/package.json ./frontend/package.json
COPY ${PROJECT_ROOT}/backend/package.json ./backend/package.json
COPY ${PROJECT_ROOT}/.yarn* ./.yarn/
COPY ${PROJECT_ROOT}/frontend/yarn.lock* ./yarn.lock

# Install dependencies
FROM workspace-setup AS deps
RUN yarn install

# Build
FROM deps AS builder
ARG PROJECT_ROOT=.
WORKDIR /app
COPY ${PROJECT_ROOT}/frontend ./frontend
WORKDIR /app/frontend
RUN yarn build

# Runtime
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat curl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

USER nextjs
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
WORKDIR /app
CMD ["node", "frontend/server.js"]

# Development target
FROM deps AS development
ARG PROJECT_ROOT=.
WORKDIR /app
ENV NODE_ENV=development
RUN apk add --no-cache libc6-compat curl
COPY ${PROJECT_ROOT}/frontend ./frontend
WORKDIR /app/frontend
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
CMD ["yarn", "dev"]
