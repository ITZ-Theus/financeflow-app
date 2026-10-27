# FinanceFlow Architecture

FinanceFlow is a personal finance application: a React single-page app, a Node.js/Express API
organized as a modular monolith, and PostgreSQL. This document describes the system as it is
today, including its known limitations. Planned work lives in the [backlog](backlog.md) and
decisions in [docs/adr](adr/).

## System Overview

```txt
Browser (React SPA)
  |
  | HTTPS, Authorization: Bearer <JWT>
  v
Vercel (static Vite build)        Render (Docker)
                                    Express API
                                      |
                                      | TypeORM
                                      v
                                    Neon PostgreSQL
```

| Component | Responsibility | Main technologies |
| --- | --- | --- |
| Web app | UI, authentication state, dashboard, forms, client-side routing | React, Vite, TypeScript, React Query, Zustand, Recharts, Tailwind |
| API | Authentication, validation, business rules, persistence, error handling | Node.js, Express, TypeScript (strict), Zod, TypeORM |
| Database | Users, categories, transactions, budgets and goals | PostgreSQL 16 |
| CI | Build and tests on every push and pull request | GitHub Actions |
| Local runtime | API, web and PostgreSQL in containers | Docker Compose |

## Backend

### Modules

```txt
apps/api/src/
  modules/
    auth/          register, login, demo login, JWT middleware
    users/         User entity
    transactions/  CRUD, recurrence, summary, trend, CSV export
    categories/    CRUD
    budgets/       monthly limits, progress and alerts
    goals/         targets and progress
    reports/       period report with monthly, category and top-transaction breakdowns
  shared/
    errors/        AppError and the central errorHandler
    validation/    shared zod schemas: ISO dates, UUID route params, money limits
    database/      the money column transformer
    logging/       pino logger
    middlewares/   request id and request logging
    utils/         pagination
  migrations/      versioned schema changes
  seeds/           demo account
```

Each module splits HTTP from business logic:

- `*.routes.ts` declares the zod schemas, a small controller class and the Express router. `auth`
  keeps its controller in its own file.
- `*.service.ts` holds the business rules and data access, using TypeORM repositories directly.
  There is no separate repository layer.
- Services obtain repositories from the global `AppDataSource`; there is no dependency injection.
  Unit tests mock `config/database`, and the PostgreSQL tests initialize the real DataSource.

### Request flow

Creating a transaction:

```txt
React form -> useCreateTransaction (React Query) -> Axios
  -> POST /api/transactions
  -> requestContext (X-Request-Id) and requestLogger
  -> helmet, cors, express.json (body limit)
  -> authMiddleware: verifies the JWT and that the user still exists
  -> zod: body schema (ISO dates, amount within numeric(10,2))
  -> TransactionService.create
       - the category must belong to the user and match the transaction type
       - recurrence: end date validated, at most 60 monthly occurrences, computed in constant time
  -> TypeORM -> PostgreSQL
  -> 201 -> React Query invalidates transactions, summary, trend and budgets
```

### Authentication and authorization

1. Register or login returns a JWT (`sub` = user id), signed with `JWT_SECRET` and valid for
   `JWT_EXPIRES_IN` (7 days by default).
2. The web app keeps the token in Zustand, persisted to `localStorage`, and Axios sends it as
   `Authorization: Bearer`.
3. `authMiddleware` verifies the token and checks on every request that the user still exists
   (one query per request), so tokens of deleted users stop working.
4. Every query on user data is filtered by the authenticated `userId`. Ids that are missing or
   belong to another user return 404, never 403 ([ADR 0002](adr/0002-error-status-codes.md)).
5. References between resources are checked too: a transaction or budget can only use a category
   of the same user. The PostgreSQL test suite runs this isolation matrix with two users in both
   directions.

There is no server-side session or token revocation; logout happens on the client.

### Validation and errors

- Zod validates every request body, the query strings of the list, summary, trend, export, budget
  and report endpoints, and every `:id` route parameter (`router.param`).
- Dates must be real calendar dates in `YYYY-MM-DD`. Money values must fit `numeric(10,2)`.
- `errorHandler` produces one response shape: `{ message, requestId, errors? }`. Status codes follow
  [ADR 0002](adr/0002-error-status-codes.md): 422 for schema errors, 400 for business rules and
  malformed JSON, 404 for missing or foreign resources, 413 for oversized bodies, 500 with a generic
  message for anything unexpected.
- Postgres input errors that slip past validation are mapped to 400/409 and logged as warnings.
- Logs are structured JSON (pino): method, path, status, duration, user id and request id, with
  authorization headers, passwords and tokens redacted.

### Security measures in place

- bcrypt password hashing; the password column is excluded from default selects.
- Helmet headers; JSON body size limit; `Cache-Control: no-store` on API responses.
- Rate limiting on `/api/auth` (in memory, per IP).
- CORS restricted to `WEB_URL`. If `WEB_URL` is empty in production the API currently allows any
  origin; the token is sent as a header, not a cookie, which limits the impact (see backlog).
- In production the API refuses to start without `JWT_SECRET`.

Open security items (token storage, CORS fallback, TLS verification, CSV formula injection) are
listed in the [backlog](backlog.md#security).

## Data Model

| Entity | Notes |
| --- | --- |
| User | Owns all financial data. Unique email |
| Category | Income or expense, with color and icon, per user |
| Transaction | Income or expense, optional category (`ON DELETE SET NULL`). Recurring series: the parent plus up to 60 generated children linked by `parentTransactionId` |
| Budget | Monthly limit for one expense category. Unique per user, category, month and year |
| Goal | Target amount, current amount, deadline and status |

Money is stored as `numeric(10,2)` and read as a JavaScript `number` through a column
transformer ([ADR 0001](adr/0001-money-numeric-transformer.md)).

Known limitations: aggregations (summary, trend, reports, budget progress) load rows and sum in
JavaScript, the budget progress has an N+1 query, and the hot query paths have no indexes. These
are the next planned work.

## Database Strategy

- Schema changes go through TypeORM migrations; `synchronize` is off.
- Migrations run on API startup when `DB_MIGRATIONS_RUN=true`, and always in production.
- Locally, Docker Compose runs PostgreSQL and the API applies migrations and seeds the demo account
  on startup. In production the API connects through `DATABASE_URL`.

## Frontend

```txt
apps/web/src/
  pages/        screen-level components
  hooks/        React Query data hooks per resource
  services/     Axios client (token injection, 401 handling)
  store/        Zustand: auth and toasts
  components/   layout and UI pieces
  utils/        formatting and error helpers
  types/        API types, written by hand
```

React Query holds server state, cache and invalidation; Zustand holds authentication and toast
notifications. Routes are lazy-loaded.

## Testing Strategy

| Layer | Where | What it proves | What it does not |
| --- | --- | --- | --- |
| API unit | `apps/api/tests/unit` | Business rules of the real services (recurrence, budgets, reports, auth, ownership checks), validators, money transformer, error handler | SQL, migrations and entity metadata: the DataSource is mocked |
| API HTTP | `apps/api/tests/integration` | Routing, auth, validation and status codes through the real Express app | Data access: services or the DataSource are mocked |
| API + PostgreSQL | `apps/api/tests/db` | The real app and migrations against a real database: user isolation in both directions, money round-trips, invalid input never returning 500 | The browser |
| Web | `apps/web/src/**/*.test.ts(x)` | Formatting, error messages, API URL resolution, two components | Pages, hooks and forms |
| E2E | `tests/e2e` | Demo login, creating a category, transaction create/edit/delete, budget create/delete in a real browser | Isolation: runs on the shared demo account |

The PostgreSQL tests recreate a `financeflow_test` database on every run, apply the migrations,
truncate tables before each test and run serially. They refuse any database whose name does not
end in `_test`. This layer exists because mocked tests passed while the real system was broken: for
example, with strict TypeScript an inferred column type made the API unable to start while all
mocked tests stayed green.

CI (GitHub Actions) runs on pushes and pull requests to `main` and `develop`:

- `build-and-test`: builds API and web, runs the API unit/HTTP tests and the web tests.
- `api-database-tests`: runs the PostgreSQL suite against a `postgres:16-alpine` service container.
- A separate E2E workflow runs Playwright against the Docker Compose stack on pull requests and
  on demand.

## Deployment

| Layer | Platform | Notes |
| --- | --- | --- |
| Web | Vercel | Static Vite build with SPA fallback (`vercel.json`) |
| API | Render | Docker image, `/health` check |
| Database | Neon | Managed PostgreSQL with SSL |

The frontend gets the API URL from `VITE_API_URL`; the API gets the allowed origin from `WEB_URL`.
The deploy workflow is manual and not gated on CI.

## Key Trade-offs

| Decision | Why |
| --- | --- |
| Modular monolith | One domain, one relational database and one team; modules keep boundaries without distributed-system costs |
| Separate Vercel and Render deployments | Frontend and backend deploy independently |
| TypeORM migrations | Explicit, reviewable schema changes instead of automatic synchronization |
| numeric + transformer for money | Exact storage with truthful types and the smallest change; limits documented in [ADR 0001](adr/0001-money-numeric-transformer.md) |
| 404 for other users' data | Does not reveal whether an id exists ([ADR 0002](adr/0002-error-status-codes.md)) |
| Real PostgreSQL in tests | Catches what mocks cannot: SQL, migrations, metadata, isolation |
| React Query + Zustand | Server state with cache invalidation; small client state without boilerplate |
| Demo seed | Reviewers get realistic multi-month data without setup |
