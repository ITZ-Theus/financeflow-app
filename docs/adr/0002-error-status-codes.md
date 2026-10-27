# ADR 0002: HTTP status codes for errors

- Status: accepted
- Date: 2026-09-25

## Context

At the start of Sprint 1, 17 of 17 malformed requests returned 500: invalid ids and query values
reached PostgreSQL unvalidated, and body-parser errors lost their status. Status codes were also
used inconsistently, so clients could not tell "you sent something wrong" from "this does not
exist" from "the server broke".

## Decision

Every error response has the same shape:

```json
{ "message": "...", "requestId": "...", "errors": [{ "field": "...", "message": "..." }] }
```

`errors` is present only on 422. `requestId` matches the `X-Request-Id` header and the API logs.

| Status | When | Where it is produced |
| --- | --- | --- |
| 400 | A business rule rejects otherwise valid input (recurrence end before start, more than 60 months, category type different from the transaction type), malformed JSON, or the database rejects a value that slipped past validation | `AppError` (default status), `errorHandler` |
| 401 | Missing, invalid or expired token, or the token's user no longer exists | `authMiddleware` |
| 404 | The resource does not exist **or belongs to another user**, including a referenced category | services, via `findOneBy({ id, userId })` |
| 409 | Unique constraint violation that reached the database (safety net) | `errorHandler` (Postgres `23505`) |
| 413 | Body larger than `BODY_LIMIT` | `errorHandler` (body-parser) |
| 422 | The request does not match the schema: body, query string or a malformed `:id` | zod at the route, `validateIdParam` |
| 429 | Too many authentication attempts | `express-rate-limit` on `/api/auth` |
| 500 | Anything unexpected. Generic message only; details are logged with the request id | `errorHandler` |

## Why 404 instead of 403 for other users' data

Answering 403 confirms that the id exists. With 404, a user cannot tell "someone else's" from
"never existed", which is the usual practice against object-level authorization (BOLA) probing.
The API therefore does not use 403.

## Why 422 for a malformed id

A malformed `:id` ("not-a-uuid") is a schema error like any other, so it gets 422 with
`field: "id"`. A well-formed UUID that does not match an accessible row gets 404.

## Database errors as a safety net

`errorHandler` maps Postgres input errors (`22P02`, `22007`, `22008`, `22003`) to 400 and unique
violations (`23505`) to 409. Validation at the route is still the primary defense. These cases are
logged as warnings so the missing validation can be added.

## Known inconsistencies

- Duplicate email on register and duplicate monthly budget are checked in code and return 400.
  409 would be more precise (see [backlog](../backlog.md)).
- `PUT` performs partial updates. `PATCH` would be the accurate verb.
- Zod messages come back in English while the API's own messages are in Portuguese.
