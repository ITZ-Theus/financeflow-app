# ADR 0001: Money as PostgreSQL numeric, read as JavaScript number

- Status: accepted
- Date: 2026-09-24

## Context

Money is stored in four `numeric(10,2)` columns: `transactions.amount`, `budgets.amount`,
`goals.targetAmount` and `goals.currentAmount`.

node-postgres returns `numeric` values as strings (`"8200.00"`) so it never silently loses
precision. The entities declared these fields as `number`, so the types did not match the runtime.
Most code wrapped every read in `Number()`, but the goal completion check compared the raw values:
`"3850.00" >= "12000.00"` is `true` as text, so editing only a goal's title marked it completed.

## Decision

- Keep `numeric(10,2)` in PostgreSQL. Storage stays exact and the schema does not change.
- Convert to `number` on read with a TypeORM column transformer
  ([moneyTransformer.ts](../../apps/api/src/shared/database/moneyTransformer.ts)) applied to the
  four columns. Entity types (`amount: number`) are now true at runtime, and the API returns
  numbers (`"amount": 8200`).
- Reject amounts above the column maximum at the API boundary
  (`MAX_MONEY_AMOUNT = 99_999_999.99`), so oversized values never reach the database.
- Round to cents (`roundMoney`) wherever JavaScript adds money values.

## Why this is safe

A `numeric(10,2)` value has at most 10 significant digits. A JavaScript `number` (IEEE 754 double)
round-trips any decimal of up to 15 significant digits, so every stored value converts to a number
and back without changing a cent.

Sums done in JavaScript can still produce float noise (`0.1 + 0.2`). At this magnitude, rounding to
cents after each sum removes it.

## Consequences

- The transformer only runs on entity reads. Raw query results (`getRawMany`, `SUM(...)`) still come
  back as strings and must be converted explicitly. This matters once aggregations move to SQL
  (see [backlog](../backlog.md)).
- The many `Number(...)` calls left in services are now redundant but harmless.
- Clients receive numbers instead of numeric strings. The web app already called `Number()` on
  these fields, so it kept working, and its types were narrowed to `number`.

## Alternatives considered

| Option | Why not now |
| --- | --- |
| Keep strings in the domain and use a decimal library | Exact, but every calculation and the frontend would change, plus a new dependency. Justified for a ledger or interest calculations, not for personal tracking within numeric(10,2) |
| Integer cents (`amount_cents`) | Exact and well understood, but needs a data migration, an API contract change and frontend changes. `bigint` would also come back as a string from node-postgres |
| Global `pg.types.setTypeParser` for numeric | Would also convert SQL aggregates, but it is implicit and affects every numeric in the application |

## When to revisit

Move to integer cents or a decimal type if the product needs multiple currencies, interest or
percentage-based financial calculations, or amounts beyond numeric(10,2).
