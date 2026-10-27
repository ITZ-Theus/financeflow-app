# Engineering Backlog

Known issues and planned work, collected from the technical audit and from what each Sprint 1
task found but deliberately left out of its scope. Items are grouped by priority; each one says
where the problem is.

Sprint 1 (done) fixed: the recurrence date lockup, TypeScript strict mode, tests that exercised
copies of the services, PostgreSQL-backed tests, cross-user category references (BOLA), money
columns returned as strings, and invalid input answered with 500.

## Next: database (Sprint 2)

- **Indexes on hot paths.** Only primary keys, `users.email` and the budget unique index exist.
  Every main query filters transactions by `userId` and a date range. Add `transactions(userId, date)`
  and indexes on `transactions(categoryId)`, `categories(userId)` and `goals(userId)`. Measure with
  `EXPLAIN (ANALYZE, BUFFERS)` on a large seed before and after.
- **Aggregations in SQL.** `summary`, `monthlyTrend` and the financial report load every matching row
  and sum in JavaScript (`transaction.service.ts`, `report.service.ts`). Use `SUM ... GROUP BY`
  (exact with numeric; convert raw results, see [ADR 0001](adr/0001-money-numeric-transformer.md))
  and cap the report period.
- **Budget N+1.** `BudgetService.toProgress` runs one query per budget and loads all-time expenses of
  the category, then filters the month in JavaScript. The dashboard calls it twice (`/budgets` and
  `/budgets/alerts`).
- **Database transactions.** Recurring creation (parent + up to 60 children), the demo seed (delete
  then insert) and category deletion (detach transactions, then delete) can each stop halfway.
- **Constraints.** No FK on `transactions.parentTransactionId`; no CHECK for `amount > 0`,
  `month BETWEEN 1 AND 12` or `recurrenceInterval`; inconsistent `ON DELETE` rules (NO ACTION vs
  CASCADE); timestamps without time zone.
- **Entity/schema drift.** TypeORM's schema diff reports 15 statements, mostly foreign key names that
  differ from the migrations. `migration:generate` would include that noise.
- **Category delete** detaches transactions manually although the FK already has `ON DELETE SET NULL`.

## Security

- **Token storage.** The JWT lives in `localStorage` for 7 days, with no revocation and logout only on
  the client. Decide between an httpOnly cookie with short-lived tokens or bearer tokens with a short
  lifetime and a CSP, and record it in an ADR.
- **CORS when `WEB_URL` is empty** allows any origin (`app.ts`). Fail at startup in production instead.
- **Database TLS** uses `rejectUnauthorized: false` (`config/database.ts`).
- **Hard-coded JWT fallback secret** when `NODE_ENV` is not `production` (`config/env.ts`).
- **Emails are case-sensitive** (`A@x.com` and `a@x.com` are different accounts); register reveals
  that an email exists; login skips bcrypt when the user does not exist (timing).
- **Only `/api/auth` is rate limited**, in memory. A recurring create writes up to 61 rows and the CSV
  export has no limit.
- **CSV formula injection.** Cells starting with `= + - @` are not neutralized. Relevant because the
  demo account is shared.
- **Password policy:** minimum 6 characters, no maximum.
- `color` and `icon` on categories accept any string.

## API correctness

- **Matrix gaps.** The isolation tests cover transactions and categories. Budgets, goals and a token
  of a deleted user are not covered yet.
- **Updating a transaction** accepts `isRecurring` and `recurrenceEndDate` but does not generate or
  update the series. Editing or deleting the parent does not affect the children.
- **Goal status.** Sending `status: 'active'` on a goal that reached its target is overridden to
  `completed`, because the check runs after `Object.assign`.
- **Category type change** is allowed even when budgets (expense-only) use the category.
- **Dates have no year bounds** (`9999-12-31` is accepted).
- **Time zone policy.** The current month is computed in server local time, ranges in UTC, and the web
  form defaults to the UTC date (after 21:00 in Brazil it shows tomorrow).
- **Status codes and verbs:** duplicate email or budget return 400 (409 would be precise), `PUT` does
  partial updates (`PATCH`), zod messages are in English. See [ADR 0002](adr/0002-error-status-codes.md).
- **Offset pagination** orders by `date` only; rows with the same date can move between pages.
- **Redundant `Number(...)`** calls in services since the money transformer.

## Testing

- **`npm run test:db` runs can collide.** Two runs at once, or a run left orphaned after an
  interrupted command, recreate and truncate the same `financeflow_test` database. An advisory lock in
  the global setup would prevent it.
- **E2E** runs against the Vite dev server instead of a production build, only on pull requests, and
  on the shared demo account. The category spec creates a category and never deletes it.
- **Web tests** cover helpers and two components only; no page, hook or form tests.
- `noUncheckedIndexedAccess` would report 20 errors.

## Infrastructure and developer experience

- **No lint or formatting** (no ESLint or Prettier config).
- **CD is not gated on CI.** The deploy workflow is manual and does not depend on the CI result.
- **Docker:** the API image runs as root, uses `npm install` against `apps/api/package-lock.json`
  (CI uses the root lockfile, so versions can drift), and there is no `.dockerignore` or
  `HEALTHCHECK`. The web image only runs the Vite dev server.
- **Runtime:** no graceful shutdown on SIGTERM; `/health` does not check the database; migrations run
  on API startup (a problem with more than one instance).
- **Local Docker:** `ts-node-dev --transpile-only` does not type-check, and every saved file restarts
  the API and re-seeds the demo account.
- **Observability:** structured logs with request ids exist; error tracking and metrics do not.

## Frontend

- Pages of 300 to 480 lines mixing form, modal, filters and table.
- Three styling approaches: Tailwind, a 1,450-line `index.css` and many inline `style` objects.
- No error boundary; `react-query` v3 (superseded by TanStack Query v5); circular import between
  `authStore` and `services/api`.
- Front and back types are written by hand on each side (no shared contract).
