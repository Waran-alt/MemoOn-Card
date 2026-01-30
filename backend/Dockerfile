# Multi-stage build for client backend
# Build context: memoon-card root (.) or Portfolio root with PROJECT_ROOT=clients/memoon-card
# Uses Debian (bookworm-slim) so PyTorch/torch has pre-built wheels for fsrs-optimizer; Alpine has none.
ARG PROJECT_ROOT=.

FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Workspace setup
FROM base AS workspace-setup
ARG PROJECT_ROOT=.
WORKDIR /app

# Copy client monorepo files
COPY ${PROJECT_ROOT}/.yarnrc.yml ./.yarnrc.yml
COPY ${PROJECT_ROOT}/package.json ./package.json
COPY ${PROJECT_ROOT}/frontend/package.json ./frontend/package.json
COPY ${PROJECT_ROOT}/backend/package.json ./backend/package.json
COPY ${PROJECT_ROOT}/.yarn* ./.yarn/
COPY ${PROJECT_ROOT}/backend/yarn.lock* ./yarn.lock

# Install dependencies
FROM workspace-setup AS deps
RUN yarn install

# Build
FROM deps AS builder
ARG PROJECT_ROOT=.
WORKDIR /app
COPY ${PROJECT_ROOT}/backend ./backend
WORKDIR /app/backend
RUN yarn build

# Runtime
FROM deps AS runner
WORKDIR /app
# Python + fsrs-optimizer (torch has manylinux wheels on Debian; not on Alpine)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    python3 \
    python3-pip \
    && python3 -m pip install --no-cache-dir --break-system-packages --upgrade pip \
    && python3 -m pip install --no-cache-dir --break-system-packages fsrs-optimizer \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/backend/dist ./backend/dist
EXPOSE 4002
WORKDIR /app/backend
CMD ["yarn", "start"]

# Development target
FROM deps AS development
ARG PROJECT_ROOT=.
WORKDIR /app
COPY ${PROJECT_ROOT}/backend ./backend
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    python3 \
    python3-pip \
    && python3 -m pip install --no-cache-dir --break-system-packages --upgrade pip \
    && python3 -m pip install --no-cache-dir --break-system-packages fsrs-optimizer \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/backend/dist ./backend/dist
EXPOSE 4002
WORKDIR /app/backend
CMD ["yarn", "dev"]
