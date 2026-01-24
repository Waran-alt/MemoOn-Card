# Multi-stage build for client backend
# Build context: Portfolio root (.)

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Workspace setup
FROM base AS workspace-setup
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy client monorepo files
COPY clients/memoon-card/.yarnrc.yml ./.yarnrc.yml
COPY clients/memoon-card/package.json ./package.json
COPY clients/memoon-card/frontend/package.json ./frontend/package.json
COPY clients/memoon-card/backend/package.json ./backend/package.json
# Copy .yarn directory if it exists (Yarn will create it during install if missing)
COPY clients/memoon-card/.yarn* ./.yarn/
COPY clients/memoon-card/backend/yarn.lock* ./yarn.lock

# Install dependencies
FROM workspace-setup AS deps
RUN yarn install

# Build
FROM deps AS builder
WORKDIR /app
COPY clients/memoon-card/backend ./backend
WORKDIR /app/backend
RUN yarn build

# Runtime
FROM deps AS runner
WORKDIR /app
# Install Python and pip for FSRS Optimizer
# Alpine uses python3 and py3-pip packages
RUN apk add --no-cache \
    libc6-compat \
    curl \
    python3 \
    py3-pip \
    && python3 -m pip install --no-cache-dir --upgrade pip \
    && python3 -m pip install --no-cache-dir fsrs-optimizer

COPY --from=builder /app/backend/dist ./backend/dist
EXPOSE 4002
WORKDIR /app/backend
CMD ["yarn", "start"]

# Development target
FROM deps AS development
WORKDIR /app
# Install Python and pip for FSRS Optimizer
RUN apk add --no-cache \
    libc6-compat \
    curl \
    python3 \
    py3-pip \
    && python3 -m pip install --no-cache-dir --upgrade pip \
    && python3 -m pip install --no-cache-dir fsrs-optimizer

COPY --from=builder /app/backend/dist ./backend/dist
EXPOSE 4002
WORKDIR /app/backend
CMD ["yarn", "dev"]
