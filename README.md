# Memoon Card

A standalone application for [brief description of what memoon-card does].

## Sub-Repo Setup

This is a **sub-repo** (nested Git repository) within the Portfolio monorepo. It has its own Git history and can be managed independently, while still being discovered and integrated by Portfolio's auto-discovery system.

### How It Works

- **Independent Git History**: This repo has its own commits, branches, and history
- **Portfolio Integration**: Portfolio discovers it via `client.config.json` and auto-generates Docker Compose and Nginx configs
- **Portfolio Tracking**: Portfolio's `.gitignore` excludes `clients/*/.git/` so it doesn't track the sub-repo's Git data

### Working with the Sub-Repo

**From Portfolio root:**
```bash
cd /home/waran/dev/Portfolio
yarn discover:clients  # Discover all clients (including this one)
yarn migrate:client memoon-card  # Run migrations
```

**From this directory:**
```bash
cd /home/waran/dev/Portfolio/clients/memoon-card
git status  # Normal Git operations work here
git add .
git commit -m "your message"
yarn install  # Install dependencies
docker-compose up -d  # Start standalone development
```

**Setting up a remote (optional):**
```bash
git remote add origin <your-remote-url>
git push -u origin main
```

## 🏗️ Project Structure

```
memoon-card/
├── frontend/              # Frontend application
├── backend/               # Backend API
├── migrations/            # Database migrations (Liquibase)
├── documentation/         # Project documentation
├── docker-compose.yml     # Docker Compose configuration
└── .env.example          # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.0.0
- Yarn 4.9.2+ (or npm)
- Docker & Docker Compose
- PostgreSQL 17+

### Development Setup

```bash
# Install dependencies
cd frontend && yarn install
cd ../backend && yarn install

# Copy environment files
cp .env.example .env
# Edit .env with your configuration

# Start services with Docker Compose
docker-compose up -d

# Or run individually
cd frontend && yarn dev
cd ../backend && yarn dev
```

### Database Migrations

```bash
# Run migrations
yarn migrate:up

# Or using Liquibase directly
cd migrations
liquibase update
```

## 📚 Documentation

See `documentation/` directory for detailed documentation.

## 🔧 Tech Stack

- **Frontend**: [To be configured]
- **Backend**: [To be configured]
- **Database**: PostgreSQL 17
- **Migrations**: Liquibase
- **Containerization**: Docker

## 📝 License

[To be specified]
