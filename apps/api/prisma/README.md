# Database

`schema.prisma` implements ARCHITECTURE.md §6.2. Read them side by side.

## Getting a database

```bash
pnpm db:up                                  # Postgres 17 in Docker, from the repo root
pnpm --filter @centiverse/api db:migrate    # apply migrations
```

The test suite manages its own database (`centiverse_test`) and migrates it
automatically; it only needs the server from `pnpm db:up` to be running.

## The hand-written half of the migration

Five things in §6.2 cannot be expressed in Prisma's schema language, so they are
written as SQL at the bottom of `migrations/20260915160204_initial_schema/migration.sql`:

| Object | Why Prisma can't express it |
|---|---|
| `expenses_total_minor_positive`, `expense_payers_amount_positive`, `settlements_amount_positive`, `settlements_distinct_parties` | No `CHECK` constraints |
| `users_email_live_key` | No partial (filtered) unique indexes |
| `friendships_pair_key` | No functional indexes — the uniqueness is on `LEAST(a,b), GREATEST(a,b)` |
| `expenses_group_date_live_idx`, `settlements_group_settled_live_idx` | No partial indexes |
| `expenses_sum_check`, `expense_payers_sum_check`, `expense_shares_sum_check` | No triggers |

**The caveat that matters.** Prisma does not know these objects exist. A future
`prisma migrate dev` can therefore generate a migration that drops the indexes,
because they are absent from `schema.prisma` and Prisma believes it owns every
index in the schema. Triggers and `CHECK` constraints are not modelled at all
and are left alone.

`test/schema.constraints.test.ts` asserts that every object in the table above
still exists and still rejects the writes it is supposed to reject. If a
generated migration would remove one, that suite fails before the change can be
merged — so **read generated migrations before applying them**, and if one
contains a `DROP INDEX` for a name in the table above, delete that statement.

## The constraint trigger

Invariant 1 — `sum(shares) = total` and `sum(payers) = total` — is enforced in
three places: `@centiverse/core` computes shares that satisfy it, the service
layer validates before writing, and the database refuses the transaction if
neither of those worked.

It is `DEFERRABLE INITIALLY DEFERRED` because a correct write is necessarily
multi-statement: the expense row exists for a moment before its shares do. The
check runs once, at `COMMIT`. This means a failure surfaces when the transaction
commits rather than at the offending statement, so the error names the expense
id rather than pointing at a line.

## Money

Postgres `bigint` minor units, never `float8` (invariant 3). Prisma maps
`bigint` to JavaScript `BigInt`, which does not JSON-serialise; `src/db/money.ts`
is the only place that converts, and `test/money.boundary.test.ts` proves a
value survives the round trip. See ADR 0004.
