# Internal Task Manager

A modern, production-ready internal task management system built with a **FastAPI (Python)** backend and a **React (TypeScript + Vite)** frontend.

---

## Repository Architecture

```
Untitled/
├── backend/                  # FastAPI Application
│   ├── app/                  # Main source code (routers, core, models)
│   ├── alembic/              # Database migration scripts
│   ├── Dockerfile            # Production-ready single-stage build
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React Frontend
│   ├── src/                  # React components and pages
│   ├── Dockerfile            # Production Nginx setup
│   └── package.json          # Node dependencies
├── load_tests/               # Locust API performance and load testing scripts
├── docker-compose.yml        # Development environment docker setup
├── docker-compose.prod.yml   # Production environment docker setup
└── archive/laravel/          # Legacy Laravel PHP source files (Archived)
```

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
   cd "New Projects/New Internal Tool/Untitled"
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
