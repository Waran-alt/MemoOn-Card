# Memoon Card - Setup Guide

Quick setup guide for Memoon Card application.

## Configuration

- **Client ID**: `memoon-card`
- **Subdomain**: `memoon-card`
- **Full URL**: `https://memoon-card.yourdomain.com`
- **Frontend Port**: `3002`
- **Backend Port**: `4002`
- **Database**: `memoon_card_db`

## Environment Setup

Create a `.env` file in the client root directory with the following variables:

```bash
# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV=development

# =============================================================================
# FRONTEND
# =============================================================================
FRONTEND_PORT=3002
NEXT_PUBLIC_API_URL=http://localhost:4002

# =============================================================================
# BACKEND
# =============================================================================
BACKEND_PORT=4002

# =============================================================================
# DATABASE
# =============================================================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=memoon_card_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# =============================================================================
# DATABASE CONNECTION (for Liquibase, optional)
# =============================================================================
# DATABASE_URL=jdbc:postgresql://localhost:5432/memoon_card_db
```

**Important Notes:**
- Update `POSTGRES_PASSWORD` with a secure password
- Configure client-specific variables (JWT, CORS, LOG_LEVEL, etc.) as needed for your application
- Ports must match the values in `client.config.json` (3002/4002)

## Development

### Standalone Development

```bash
# Start database
docker-compose up -d postgres

# Run migrations
yarn migrate:up

# Start backend
cd backend && yarn dev

# Start frontend (in another terminal)
cd frontend && yarn dev
```

### Integrated with Portfolio

When integrated with the Portfolio monorepo:

1. **Run discovery** (from Portfolio root):
   ```bash
   yarn discover:clients
   ```

2. **Run migrations**:
   ```bash
   yarn migrate:client memoon-card
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

## Access

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:4002
- **Production URL**: https://memoon-card.yourdomain.com

## Notes

- Ports are configured in `client.config.json`
- Database name is `memoon_card_db`
- This file was auto-generated - update as needed for your setup
