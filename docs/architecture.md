# FinanceFlow Architecture

FinanceFlow is a full stack personal finance application built as a portfolio-grade product. The system is split into independently deployable frontend, backend and database layers.

## System Overview

```txt
Browser
  |
  | HTTPS
  v
Vercel Web App
  |
  | REST API calls with Axios
  v
Render API Service
  |
  | TypeORM
  v
Neon PostgreSQL
```

## Runtime Components

| Component | Responsibility | Main Technologies |
| --- | --- | --- |
| Web App | User interface, authentication state, dashboard, forms and client-side routing | React, Vite, TypeScript, React Query, Zustand, Recharts |
| API | Authentication, validation, business rules, persistence orchestration and error handling | Node.js, Express, TypeScript, Zod, TypeORM |
| Database | Relational storage for users, categories, transactions, budgets and goals | PostgreSQL |
| CI | Build and test validation on every push and pull request | GitHub Actions |
| Local Runtime | Reproducible development environment | Docker Compose |

## Backend Design

The API is organized by business domain:

```txt
src/modules/
  auth/
  budgets/
  categories/
  goals/
  transactions/
  users/
```

Routes are thin HTTP adapters. They validate input, resolve the authenticated user and delegate business behavior to services. Services own the core rules and database access. This keeps route handlers small and makes service logic easier to unit test.

Shared concerns live under `src/shared`, including centralized errors, request context and pagination utilities.

## Request Flow

Example: creating a transaction.

```txt
React form
  -> useTransactions hook
  -> Axios API client
  -> Express route /api/transactions
  -> auth middleware validates JWT
  -> Zod validates request body
  -> TransactionService applies business rules
  -> TypeORM persists data in PostgreSQL
  -> API response updates React Query cache
  -> UI shows toast feedback
```

## Data Model

| Entity | Notes |
| --- | --- |
| User | Owns all private financial data |
| Category | User-scoped income or expense category with custom color and icon |
| Transaction | Income or expense record, optionally linked to a category and recurrence group; also feeds monthly trend analytics |
| Budget | Monthly spending limit for a user-owned expense category |
| Goal | User-scoped financial target with progress and status |

All user-owned queries are scoped by `userId` to prevent cross-account access.

## Authentication And Authorization

FinanceFlow uses JWT-based authentication:

1. A user registers or logs in.
2. The API validates credentials and returns a signed token.
3. The Web app stores the authenticated session with Zustand.
4. Axios attaches the token to protected requests.
5. Express middleware validates the token and adds the authenticated user id to the request.

Passwords are hashed with bcrypt before persistence.

## Validation And Error Handling

Zod schemas validate incoming request payloads at route boundaries. Domain errors use `AppError`, allowing the API to return predictable status codes and messages.

Unexpected errors are handled by a centralized `errorHandler`, logged with a request id and returned to the client as a generic error response. Each response includes an `X-Request-Id` header, which helps correlate frontend failures with backend logs.

API logs are structured with Pino. The request logger records method, path, status code, duration, user id when available, user agent and request id. Successful responses are logged as `info`, client errors as `warn` and server errors as `error`.

## Security Measures

- JWT authentication for protected routes.
- User-scoped database queries.
- bcrypt password hashing.
- Helmet security headers.
- CORS restricted by `WEB_URL`.
- Rate limiting on authentication routes.
- JSON body size limit.
- Structured logs with sensitive fields redacted.
- Production migrations instead of schema synchronization.

## Frontend Design

The frontend separates concerns into:

```txt
src/pages/       screen-level UI
src/hooks/       React Query data operations
src/services/    Axios API client
src/store/       Zustand stores
src/components/  reusable UI pieces
src/utils/       formatting and error helpers
```

React Query handles server state, cache invalidation and loading states. Zustand handles client state such as authentication and toast notifications. Route-level lazy loading keeps the initial JavaScript bundle smaller.

## Database Strategy

The API uses TypeORM migrations for versioned schema changes. This avoids relying on automatic schema synchronization in production and makes database evolution explicit.

In local development, Docker Compose starts PostgreSQL and the API can run pending migrations automatically. In production, the API uses a managed PostgreSQL connection string through `DATABASE_URL`.

## Deployment Strategy

| Layer | Platform | Notes |
| --- | --- | --- |
| Web | Vercel | Static Vite build with SPA routing fallback |
| API | Render | Dockerized Node.js service with `/health` check |
| Database | Neon | Managed PostgreSQL with SSL |

The frontend receives the backend URL through `VITE_API_URL`. The API receives the frontend origin through `WEB_URL` for CORS.

## Testing Strategy

The project includes both backend and frontend tests.

Backend tests cover:

- authentication service behavior;
- authentication middleware;
- transaction service business rules;
- recurring transaction generation and date validation;
- budget progress calculation and category ownership rules;
- category and goal behavior;
- route-level integration flows;
- security middleware.

Frontend tests cover:

- currency and date formatting;
- API error message extraction;
- category icon rendering;
- toast notification behavior.

End-to-end tests use Playwright to validate real browser journeys with the demo account, including dashboard access, category management, transaction create/edit/delete and budget create/delete flows.

GitHub Actions runs builds and tests for both applications on pushes and pull requests. A dedicated Playwright workflow runs E2E validation on pull requests and can also be triggered manually.

## Analytics

The transaction module exposes a monthly trend endpoint that returns income, expense and balance totals for a bounded window of recent months. The dashboard consumes this data through React Query and renders a six-month trend chart, while the service keeps the aggregation scoped to the authenticated user.

## Key Tradeoffs

| Decision | Why |
| --- | --- |
| Separate Vercel and Render deployments | Keeps frontend and backend independently deployable and close to real production setups |
| TypeORM migrations | Safer schema evolution than automatic synchronization |
| React Query | Reduces manual async state management and keeps API data consistent |
| Zustand | Lightweight client state for auth and notifications |
| Docker Compose | Reproducible local environment with API, Web and PostgreSQL |
| Demo seed | Makes portfolio review easier without requiring manual data entry |

## Future Improvements

- Expand Playwright coverage to include goal flows.
- Error tracking with Sentry or a similar service.
- More recurrence intervals beyond monthly transactions.
- Spending alerts when category budgets approach the limit.
- Dashboard performance improvements with finer-grained code splitting.
