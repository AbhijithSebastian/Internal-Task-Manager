# Internal Task Manager

A modern, production-ready internal task management system built with a **FastAPI (Python)** backend and a **React (TypeScript + Vite)** frontend.

---

## Repository Architecture

```
Internal-Task-Manager/
├── backend/                  # FastAPI application
│   ├── app/                  # Routers, models, core, services
│   ├── alembic/              # Database migrations
│   ├── Dockerfile            # Production build
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── design-system/    # Tokens, primitives, components, patterns
│   │   ├── features/         # Product screens by domain
│   │   ├── layouts/          # AppShell, Sidebar, Header
│   │   └── ...
│   ├── e2e/                  # Playwright end-to-end tests
│   ├── Dockerfile            # Production Nginx setup
│   └── package.json          # Node dependencies
├── docs/                     # Product and engineering documentation
├── load_tests/               # Locust API performance and load tests
├── docker-compose.yml        # Development environment
└── docker-compose.prod.yml   # Production environment
```

---

## Documentation

| Document | Purpose |
| -------- | ------- |
| [`docs/design-system.md`](docs/design-system.md) | Token architecture, Figma ↔ code mapping, accessibility, governance |
| [`frontend/src/design-system/README.md`](frontend/src/design-system/README.md) | How to use and extend the design system |
| [`docs/product/PRD.md`](docs/product/PRD.md) | Product requirements |
| [`docs/product/INFORMATION_ARCHITECTURE.md`](docs/product/INFORMATION_ARCHITECTURE.md) | Sitemap and navigation model |
| [`docs/product/USER_FLOWS.md`](docs/product/USER_FLOWS.md) | Key user journeys |
| [`docs/archive/`](docs/archive/) | Superseded specifications, kept for history |

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
* [Git](https://git-scm.com/)

---

## Local Development Setup

To spin up the entire application stack (FastAPI backend, React frontend, PostgreSQL database) in development mode:

1. **Clone the repository** and navigate to the project root:
   ```bash
   cd Internal-Task-Manager
   ```

2. **Copy the environment configuration template**:
   ```bash
   cp .env.example .env
   ```

3. **Start the development containers**:
   ```bash
   docker compose up --build
   ```
   *This command automatically builds and starts the PostgreSQL database, applies Alembic migrations, runs database seeders, and exposes the services.*

4. **Access the Applications**:
   * **React Frontend**: [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173))
   * **FastAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   * **FastAPI Health check**: [http://localhost:8000/health](http://localhost:8000/health)

5. **Stop development containers**:
   ```bash
   docker compose down
   ```

---

## Frontend Development

The frontend can also run on the host while the backend runs in Docker:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` only |
| `npm run lint` | ESLint (flat config) |
| `npm run format` | Prettier, including Tailwind class sorting |
| `npm run check:tokens` | Fails if a raw colour escapes the token layer |
| `npm run check` | `typecheck` + `lint` + `check:tokens` |
| `npm run test:e2e` | Playwright end-to-end suite |

### Style guide

The design system renders live in the app at
[`/design-system`](http://localhost:5173/design-system). It is a public route
(no login) and documents every token, primitive, component and pattern. Use it
for visual QA and when reviewing UI pull requests.

All UI code imports from a single barrel:

```tsx
import { Button, Card, StatusBadge, PageHeader } from "@/design-system";
```

Colour, spacing, radius and typography literals are not allowed in feature code
— see [`docs/design-system.md`](docs/design-system.md) for the rules and the
Figma mapping.

---

## Production Deployment

For production deployments, use the dedicated `docker-compose.prod.yml` configuration:

1. Ensure the required environment variables are set (either in your environment or via a `.env` file):
   * `POSTGRES_PASSWORD`
   * `JWT_SECRET_KEY`
   * `CORS_ORIGINS`
   * `FRONTEND_URL`

2. Deploy using production settings:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

---

## Verification & Testing

### Running Tests
To execute backend unit tests:
```bash
docker compose exec backend pytest app/tests/ -v
```

### Database Migrations (Alembic)
To generate a new migration:
```bash
docker compose exec backend alembic revision --autogenerate -m "Description of change"
```

To apply migrations:
```bash
docker compose exec backend alembic upgrade head
```

### Seeding Dummy Data
To run the database seeders:
```bash
docker compose exec backend python -c "from app.database.seed import seed; from app.core.database import SessionLocal; db = SessionLocal(); seed(db); db.close()"
```
