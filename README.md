# FinanceFlow

FinanceFlow is a full stack personal finance management application focused on clarity, speed and a polished product experience. It allows users to track income and expenses, organize transactions by category, monitor financial goals and visualize monthly cash flow through an interactive dashboard.

The project was built as a portfolio-grade application, with a typed React frontend, a modular Node.js API, Docker-based local infrastructure and automated backend tests.

## Highlights

- JWT authentication with protected API routes
- Income and expense tracking
- Category management for financial organization
- Financial goals with progress tracking
- Monthly dashboard with summary cards and charts
- Premium dark UI with hover interactions and responsive layout
- Docker Compose environment with MySQL, API and Web services
- Unit and integration tests for the API
- GitHub Actions CI for build and test validation

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, TypeScript, React Router, React Query, Zustand, Recharts, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, TypeORM, Zod, JWT, bcrypt |
| Database | MySQL 8 |
| Testing | Jest, ts-jest, Supertest |
| Infrastructure | Docker, Docker Compose, GitHub Actions |

## Project Structure

```txt
financeflow/
  apps/
    api/                  # Express API, TypeORM entities, services, tests
      src/
        config/           # Environment and database configuration
        modules/          # Auth, transactions, categories, goals and users
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
  docker-compose.yml      # Local MySQL, API and Web orchestration
```

## Core Features

### Authentication

- User registration and login
- Password hashing with bcrypt
- JWT-based route protection
- Persistent frontend auth state with Zustand

### Transactions

- Create, list, update and delete transactions
- Income and expense transaction types
- Optional category association
- Monthly filtering support in the API
- Paginated transaction listing

### Categories

- Create and manage income or expense categories
- Custom color and icon support
- User-scoped category ownership

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
http://localhost:3333/api
```

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Authenticate a user |
| `GET` | `/transactions` | List authenticated user's transactions |
| `GET` | `/transactions/summary` | Get monthly financial summary |
| `POST` | `/transactions` | Create a transaction |
| `PUT` | `/transactions/:id` | Update a transaction |
| `DELETE` | `/transactions/:id` | Delete a transaction |
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create a category |
| `PUT` | `/categories/:id` | Update a category |
| `DELETE` | `/categories/:id` | Delete a category |
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
MySQL:  localhost:3307
```

### Run Locally

Install dependencies:

```bash
npm install
```

Start MySQL:

```bash
docker compose up mysql
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
DB_PORT=3307
DB_USER=financeflow
DB_PASS=financeflow123
DB_NAME=financeflow
```

Web variables:

```txt
VITE_API_URL=http://localhost:3333/api
```

The API accepts both local `DB_*` variables and Railway MySQL variables (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`).

## Scripts

From the repository root:

```bash
npm run dev:api       # Start the API in development mode
npm run dev:web       # Start the Web app in development mode
npm run build:api     # Compile the API
npm run build:web     # Build the frontend
npm test              # Run API tests
```

API-specific scripts:

```bash
npm run test:unit --workspace=apps/api
npm run test:integration --workspace=apps/api
npm run test:coverage --workspace=apps/api
```

## Testing

The API test suite covers authentication, shared utilities, transaction business rules, category and goal behavior, and route-level integration flows.

Current suite:

```txt
Test Suites: 6 passed
Tests:       61 passed
```

Run all API tests:

```bash
npm test
```

## CI

GitHub Actions validates the project on pushes and pull requests to `main` and `develop`:

- install dependencies
- build the API
- build the Web app
- run API tests

Deployment is configured as a manual workflow so it can be enabled safely after production services and secrets are available.

## Deployment

Recommended production setup:

```txt
API + MySQL: Railway
Web:         Vercel
```

### Railway API

Create a Railway project with two services:

- MySQL database
- API service connected to this GitHub repository

For the API service, use:

```txt
Root Directory: apps/api
Start Command: npm start
Health Check:  /health
```

Required API variables:

```txt
NODE_ENV=production
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=7d
WEB_URL=https://your-vercel-domain.vercel.app
```

Railway automatically provides the MySQL variables when the database service is attached to the same project. The API can read the Railway `MYSQL*` variables directly.

### Vercel Web

Create a Vercel project connected to this repository and set:

```txt
Root Directory: apps/web
Build Command: npm run build
Output Directory: dist
```

Required Web variable:

```txt
VITE_API_URL=https://your-railway-api-domain.up.railway.app/api
```

The web app includes `apps/web/vercel.json` to redirect client-side routes back to `index.html`, which keeps React Router working on page refresh.

## Roadmap

- Replace TypeORM `synchronize` with production-grade migrations
- Add seed data and a demo account for recruiters
- Add frontend tests with React Testing Library
- Add E2E tests for the main user journey
- Add CSV export for transactions
- Add recurring transactions and category budgets
- Deploy the API and Web app to public production URLs

## Author

Built by [ITZ-Theus](https://github.com/ITZ-Theus).
