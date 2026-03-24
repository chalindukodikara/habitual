# Habitual

**Build better habits, one day at a time.**

A full-featured habit tracker with a GitHub-style contribution heatmap, streak tracking, weekly analytics, focus timer, achievement badges, and intelligent insights. Built as a multi-component demo app for [OpenChoreo](https://github.com/openchoreo/openchoreo).

## Architecture

```
                    ┌─────────────────┐
                    │    Browser       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    frontend      │  React + Vite, served by nginx
                    │    port 3000     │  nginx proxies /api/backend/ → backend
                    └────────┬────────┘
                             │ (in-cluster)
                    ┌────────▼────────┐
                    │    backend       │  Go REST API (net/http)
                    │    port 8080     │  CRUD for habits, completions, stats
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
          ┌────────│    postgres      │  PostgreSQL 16
          │        │    port 5432     │  Persistent storage via trait
          │        └──────────────────┘
          │
 ┌────────▼────────┐
 │    cronjob       │  Runs daily at 00:05 UTC
 │    (scheduled)   │  Computes streaks & weekly stats
 └──────────────────┘
```

### Components

| Component  | Type         | Tech          | Port | Visibility | Description                                                    |
|------------|--------------|---------------|------|------------|----------------------------------------------------------------|
| `frontend` | deployment   | React + Vite  | 3000 | external   | SPA served by nginx; reverse-proxies API calls to the backend  |
| `backend`  | deployment   | Go (net/http) | 8080 | project    | REST API for habits, completions, heatmap, and stats           |
| `postgres` | deployment   | PostgreSQL 16 | 5432 | project    | Database with persistent volume for durable storage            |
| `cronjob`  | cronjob      | Go            | --   | --         | Nightly job that computes streaks and weekly aggregation stats  |

### How it connects (OpenChoreo Dependencies)

The frontend, backend, and cronjob declare **dependencies** in their `workload.yaml`. OpenChoreo resolves the target component's in-cluster address and injects it as environment variables:

- **frontend** → depends on `backend` (http) → gets `API_URL` injected → nginx proxies browser requests to it
- **backend** → depends on `postgres` (tcp) → gets `DB_HOST`, `DB_PORT` injected
- **cronjob** → depends on `postgres` (tcp) → gets `DB_HOST`, `DB_PORT` injected

The browser never talks to the backend directly. The frontend's nginx reverse-proxies `/api/backend/` to the backend's in-cluster URL, so all API calls stay on the same origin.

## Project Structure

```
habitual/
├── frontend/               # React SPA
│   ├── src/
│   ├── Dockerfile          # Multi-stage: npm build → nginx with reverse proxy
│   ├── nginx.conf.template # Proxy /api/backend/ → ${API_URL}
│   ├── docker-entrypoint.sh
│   └── workload.yaml       # Descriptor: HTTP endpoint, depends on backend
├── backend/                # Go REST API
│   ├── *.go
│   ├── Dockerfile
│   ├── openapi.yaml
│   └── workload.yaml       # Descriptor: HTTP endpoint, depends on postgres
├── db/                     # PostgreSQL setup
│   ├── init.sql            # Schema: profiles, habits, completions, streaks, weekly_stats
│   ├── seed.sql            # 6 months of demo data for 8 habits
│   ├── Dockerfile          # postgres:16-alpine + init/seed scripts
│   └── workload.yaml       # Descriptor: TCP endpoint
├── cronjob/                # Nightly streak computation
│   ├── *.go
│   ├── Dockerfile
│   └── workload.yaml       # Descriptor: depends on postgres
├── ocResources/            # OpenChoreo GitOps resources
│   ├── platform/
│   │   ├── component-types/
│   │   │   ├── database.yaml        # TCP service + persistent-volume trait
│   │   │   ├── service.yaml         # HTTP service with HTTPRoute
│   │   │   └── web-application.yaml # Web frontend with HTTPRoute
│   │   └── traits/
│   │       └── persistent-volume.yaml
│   └── projects/
│       └── habitual/
│           ├── project.yaml
│           └── components/
│               ├── backend/    # component.yaml + workload.yaml (full CR)
│               ├── frontend/
│               ├── postgres/
│               └── cronjob/
├── docker-compose.yml      # Local development
├── Makefile
└── openapi.yaml
```

## Quick Start (Local)

```bash
make dev              # Start all services with docker compose
open http://localhost:3000
make run-cronjob      # Run streak calculation manually
make clean            # Stop and remove everything
```

### Custom Ports

```bash
FRONTEND_PORT=3002 BACKEND_PORT=8082 PG_PORT=5434 \
  docker compose up --build -d
```

## Deploy to OpenChoreo

### Prerequisites

Platform resources (component types and traits) must be applied first:

```bash
kubectl apply -f ocResources/platform/traits/persistent-volume.yaml
kubectl apply -f ocResources/platform/component-types/
```

### Deploy components

```bash
kubectl apply -f ocResources/projects/habitual/project.yaml
kubectl apply -f ocResources/projects/habitual/components/postgres/
kubectl apply -f ocResources/projects/habitual/components/backend/
kubectl apply -f ocResources/projects/habitual/components/frontend/
kubectl apply -f ocResources/projects/habitual/components/cronjob/
```

Or create components via the OpenChoreo UI — each source directory contains a `workload.yaml` descriptor that OpenChoreo reads during the build workflow.

## API Endpoints

| Method | Path                          | Description                         |
|--------|-------------------------------|-------------------------------------|
| POST   | `/api/profiles`               | Create profile                      |
| GET    | `/api/profiles/:id`           | Get profile                         |
| POST   | `/api/profiles/:id/habits`    | Create habit                        |
| GET    | `/api/profiles/:id/habits`    | List habits with streaks            |
| GET    | `/api/profiles/:id/today`     | Get today's completions             |
| PATCH  | `/api/habits/:id`             | Update habit                        |
| DELETE | `/api/habits/:id`             | Delete habit                        |
| POST   | `/api/habits/:id/complete`    | Toggle habit completion             |
| GET    | `/api/profiles/:id/heatmap`   | Heatmap data                        |
| GET    | `/api/profiles/:id/stats`     | Weekly stats + habit rates          |
| GET    | `/healthz`                    | Health check                        |

## Cronjob (Streak Engine)

Runs daily at 00:05 UTC. Performs two computations:

1. **Streak calculation** — for each active habit, walks backwards from today counting consecutive completions. Updates `current_streak`, `longest_streak`, and `completion_rate_30d`.

2. **Weekly aggregation** — for each profile, counts completions in the current Mon-Sun week and total possible (active habits * 7). Feeds the weekly chart on the Stats page.

## Seed Data

- 1 demo profile ("Demo User") with **8 habits** (Exercise, Read, Water, Meditate, No Social Media, Journal, Eat Healthy, Walk 10k Steps)
- **180 days** (6 months) of semi-realistic completion data
- Pre-computed streaks, 30-day rates, and 26 weeks of weekly stats
- Re-runnable: `make seed` to reset demo data
