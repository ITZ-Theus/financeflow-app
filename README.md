# FinanceFlow

FinanceFlow is a full stack personal finance management application focused on clarity, speed and a polished product experience. It allows users to track income and expenses, organize transactions by category, set monthly category budgets, monitor financial goals and visualize monthly cash flow through an interactive dashboard.

The project was built as a portfolio-grade application, with a typed React frontend, a modular Node.js API, Docker-based local infrastructure and automated tests across backend, frontend and browser flows.

## Live Demo

- Web app: https://financeflow-app-eight.vercel.app
- API health check: https://financeflow-api-q5ax.onrender.com/health
- Demo account: `demo@financeflow.dev` / `FinanceFlow@2026`

## Highlights

- JWT authentication with protected API routes
- Income and expense tracking
- Monthly recurring transactions with automatic future entries
- CSV export for transaction history
- Category management for financial organization
- Monthly category budgets with spending progress
- Financial goals with progress tracking
- Monthly dashboard with summary cards and charts
- Premium dark UI with hover interactions and responsive layout
- Docker Compose environment with PostgreSQL, API and Web services
- TypeORM migrations for versioned database schema changes
- API security hardening with Helmet, auth rate limiting and request IDs
- Structured API logging with request duration, status and correlation ids
- Unit, integration, frontend and E2E tests
- GitHub Actions CI for build and test validation

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, TypeScript, React Router, React Query, Zustand, Recharts, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, TypeORM, Zod, JWT, bcrypt, Pino |
| Database | PostgreSQL |
| Testing | Jest, ts-jest, Supertest, Vitest, Testing Library, Playwright |
| Infrastructure | Docker, Docker Compose, GitHub Actions |

## Project Structure

```txt
financeflow/
  apps/
    api/                  # Express API, TypeORM entities, services, tests
      src/
        config/           # Environment and database configuration
        modules/          # Auth, transactions, categories, budgets, goals and users
        shared/           # Shared errors and utilities
      tests/              # Unit and integration tests
    web/                  # React application
      src/
        components/       # Layout and reusable UI pieces
        hooks/            # React Query data hooks
        pages/            # Application screens
        services/         # Axios API client
        store/            # Zustand auth store
        types/            # Shared frontend types
  docker-compose.yml      # Local PostgreSQL, API and Web orchestration
```

## Technical Documentation

- [Architecture overview](docs/architecture.md)
- [Interview guide, Portuguese](docs/interview-guide.pt-BR.md)

## Core Features

### Authentication

- User registration and login
- One-click demo login with seeded portfolio data
- Password hashing with bcrypt
- JWT-based route protection
- Persistent frontend auth state with Zustand

### Transactions

- Create, list, update and delete transactions
- Income and expense transaction types
- Optional category association
- Monthly recurring transaction generation with end-date validation
- Month, type and category filters for transaction history
- Paginated transaction listing
- CSV export for spreadsheet analysis and backup

### Categories

- Create and manage income or expense categories
- Custom color and icon support
- User-scoped category ownership

### Budgets

- Create monthly budgets for expense categories
- Track spent amount, remaining amount and percentage used
- Surface safe, warning and exceeded budget states
- Recalculate progress when transactions or categories change

### Goals

- Create financial goals with target amounts and deadlines
- Track current progress
- Automatically mark goals as completed when the target is reached

### Dashboard

- Monthly income, expense and balance summary
- Bar chart for cash flow overview
- Expense distribution by category
- Recent transactions list
- Premium dark interface with glass panels and hover effects

## API Overview

Base URL:

```txt
Production: https://financeflow-api-q5ax.onrender.com/api
Local:      http://localhost:3333/api
```

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Authenticate a user |
| `GET` | `/transactions` | List authenticated user's transactions |
| `GET` | `/transactions/summary` | Get monthly financial summary |
| `GET` | `/transactions/export` | Export transactions as CSV |
| `POST` | `/transactions` | Create a transaction |
| `PUT` | `/transactions/:id` | Update a transaction |
| `DELETE` | `/transactions/:id` | Delete a transaction |
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create a category |
| `PUT` | `/categories/:id` | Update a category |
| `DELETE` | `/categories/:id` | Delete a category |
| `GET` | `/budgets` | List monthly category budgets |
| `POST` | `/budgets` | Create a category budget |
| `PUT` | `/budgets/:id` | Update a category budget |
| `DELETE` | `/budgets/:id` | Delete a category budget |
| `GET` | `/goals` | List goals |
| `POST` | `/goals` | Create a goal |
| `PUT` | `/goals/:id` | Update a goal |
| `DELETE` | `/goals/:id` | Delete a goal |
| `GET` | `/health` | API health check |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm

### Run with Docker

```bash
docker compose up --build
```

Services:

```txt
Web:    http://localhost:5173
API:    http://localhost:3333
Health: http://localhost:3333/health
Postgres: localhost:5433
```

### Run Locally

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up postgres
```

Create environment files using `.env.example` as a reference:

```txt
apps/api/.env
apps/web/.env
```

Start the API:

```bash
npm run dev:api
```

Start the Web app:

```bash
npm run dev:web
```

## Environment Variables

The repository includes a safe `.env.example` file. Real `.env` files are intentionally ignored by Git.

API variables:

```txt
PORT=3333
NODE_ENV=development
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
WEB_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5433
DB_USER=financeflow
DB_PASS=financeflow123
DB_NAME=financeflow
DATABASE_URL=
DB_SSL=false
DB_MIGRATIONS_RUN=false
DEMO_SEED_ON_STARTUP=false
DEMO_USER_EMAIL=demo@financeflow.dev
DEMO_USER_PASSWORD=FinanceFlow@2026
BODY_LIMIT=1mb
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
LOG_LEVEL=debug
```

Web variables:

```txt
VITE_API_URL=http://localhost:3333/api
VITE_DEMO_EMAIL=demo@financeflow.dev
```

The API accepts both local `DB_*` variables and a managed PostgreSQL `DATABASE_URL`. Set `DB_SSL=true` when your database provider requires SSL. Set `DB_MIGRATIONS_RUN=true` when the API should run pending migrations on startup. Authentication routes are protected by rate limiting through `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX`. `LOG_LEVEL` controls structured API log verbosity.

## Scripts

From the repository root:

```bash
npm run dev:api       # Start the API in development mode
npm run dev:web       # Start the Web app in development mode
npm run build:api     # Compile the API
npm run build:web     # Build the frontend
npm run migration:run # Run pending API database migrations
npm run seed:demo     # Create or refresh the demo account data
npm test              # Run API tests
npm run test:web      # Run frontend tests
npm run test:e2e      # Run Playwright E2E tests against a running local stack
```

API-specific scripts:

```bash
npm run test:unit --workspace=apps/api
npm run test:integration --workspace=apps/api
npm run test:coverage --workspace=apps/api
npm run migration:show --workspace=apps/api
npm run migration:revert --workspace=apps/api
npm run seed:demo --workspace=apps/api
```

Web-specific scripts:

```bash
npm run test --workspace=apps/web
npm run test:watch --workspace=apps/web
```

E2E scripts:

```bash
npm run test:e2e
npm run test:e2e:ui
```

## Database Migrations

The API uses TypeORM migrations instead of automatic schema synchronization. This keeps database changes versioned and safer for production deploys.

Local Docker sets `DB_MIGRATIONS_RUN=true`, so pending migrations run when the API starts. For manual usage:

```bash
npm run migration:run
npm run migration:show
npm run migration:revert
```

Production should also run migrations before serving traffic. The API enables startup migrations automatically when `NODE_ENV=production`.

## Demo Data

The repository includes an idempotent demo seed for portfolio reviewers. It creates a `FinanceFlow Demo` user, category set, current-month transactions, budgets and goals. The seed can be run manually:

```bash
npm run seed:demo
```

For hosted demo environments, set `DEMO_SEED_ON_STARTUP=true` in the API service. The demo login button calls the API demo-login endpoint, so the frontend does not need access to the demo password.

## Testing

The API test suite covers authentication, shared utilities, transaction business rules, category budget calculations, category and goal behavior, and route-level integration flows. The Web test suite covers UI helpers, user-facing error messages, category icon rendering and toast notifications. The Playwright E2E suite validates a real browser journey with the demo account.

Current suites:

```txt
API: 10 test suites, 89 tests
Web: 4 test files, 11 tests
E2E: demo login and category management flow
```

Run all API tests:

```bash
npm test
```

Run Web tests:

```bash
npm run test:web
```

Run E2E tests after starting the local stack:

```bash
docker compose up -d --build postgres api web
npm run test:e2e
```

## CI

GitHub Actions validates the project on pushes and pull requests to `main` and `develop`:

- install dependencies
- build the API
- build the Web app
- run API tests
- run Web tests

The repository also includes a Playwright E2E workflow that runs on pull requests and can be triggered manually from GitHub Actions.

## Security And Observability

- Helmet adds baseline HTTP security headers.
- Authentication routes use rate limiting to reduce brute-force risk.
- Every response receives an `X-Request-Id` header for easier debugging across Render logs, browser errors and API responses.
- API requests are logged as structured JSON with method, path, status code, duration and request id.
- Unexpected API errors are logged with the request id while returning a generic public message to the client.

Deployment is configured as a manual workflow so it can be enabled safely after production services and secrets are available.

## Deployment

Recommended production setup:

```txt
API:         Render
Database:    PostgreSQL on Render, Neon or Supabase
Web:         Vercel
```

### Render API

Create a Render Web Service connected to this GitHub repository.

Recommended API settings:

```txt
Root Directory: apps/api
Environment:    Docker
Health Check:  /health
```

Required API variables:

```txt
NODE_ENV=production
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=7d
WEB_URL=https://financeflow-app-eight.vercel.app
DATABASE_URL=<your-postgres-connection-string>
DB_SSL=true
DB_MIGRATIONS_RUN=true
DEMO_SEED_ON_STARTUP=true
DEMO_USER_EMAIL=demo@financeflow.dev
DEMO_USER_PASSWORD=<demo-password>
BODY_LIMIT=1mb
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
LOG_LEVEL=info
```

For external providers such as Neon or Supabase, use their pooled or direct PostgreSQL connection string and keep `DB_SSL=true`. Keep `WEB_URL` without a trailing slash to match browser origins exactly.

### Vercel Web

Create a Vercel project connected to this repository and set:

```txt
Root Directory: apps/web
Build Command: npm run build
Output Directory: dist
```

Required Web variable:

```txt
VITE_API_URL=https://financeflow-api-q5ax.onrender.com/api
VITE_DEMO_EMAIL=demo@financeflow.dev
```

The web app includes `apps/web/vercel.json` to redirect client-side routes back to `index.html`, which keeps React Router working on page refresh.

## Roadmap

- Add observability and production error tracking
- Expand recurrence options beyond monthly transactions

## Author

Built by [ITZ-Theus](https://github.com/ITZ-Theus).
