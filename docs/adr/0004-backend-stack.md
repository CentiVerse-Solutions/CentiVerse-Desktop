# 4. Backend stack, ORM, auth, hosting and placeholder members

Date: 2026-09-15

## Status

Accepted. Resolves ARCHITECTURE.md §12 decisions #1, #2, #3, #6 and #9 — the five that
Phase 5 was blocked on. Every one of them landed on the document's own recommendation.

## Context

Phase 5 builds `apps/api`. Five §12 decisions had to be settled before any of it could be
written, because each one changes the shape of the code: #1 decides whether there is a server
at all, #2 decides how the schema is expressed, #3 decides what the session tables look like,
#9 decides whether `users` is one entity or two, and #6 decides what the deploy target is.

## Decision

### #1 — Backend approach: own Fastify API

Node 22 + TypeScript + Fastify + Prisma + PostgreSQL, as §6.1 specifies.

Supabase-as-backend was the real alternative and is a defensible choice — it would have
removed most of #2 and all of #3. It was rejected for the reason §6.1 gives: the schema
design, transaction boundaries, auth flow and authorization model are the parts of this
project worth being able to show, and a BaaS hides exactly those. Convex was rejected as
furthest from the architecture as written; §6.2's SQL schema and §6.3's REST surface would
both have needed rethinking.

Fastify over Express for first-class TypeScript and schema-driven validation that plugs
into the existing zod contracts.

### #2 — ORM: Prisma

Migrations, type-safe queries, and a schema file that doubles as documentation.

One known cost, accepted with eyes open: §6.2 stores money as Postgres `bigint`, and Prisma
maps `bigint` to JavaScript `BigInt`, which does not JSON-serialise and does not satisfy the
shared `MoneySchema` (invariant 3 requires `minor` to be an integer `number`). Drizzle would
have given finer control over that mapping. The mitigation is a single conversion boundary in
the repository layer — nothing above it ever sees a `BigInt` — plus a test that a money value
survives a round trip through the database unchanged.

Do not mix ORMs. Prisma or hand-written SQL via Prisma's `$queryRaw` for the few places that
need it (the constraint triggers, the balance recompute); never a second query builder.

### #3 — Auth: roll our own

§6.4 as written: argon2id at the OWASP baseline (`m=19456, t=2, p=1`), 15-minute in-memory
access tokens, opaque refresh tokens stored hashed and rotated on every use, and reuse
detection that revokes the whole session family.

This is the highest-risk item of the five — a subtle mistake here is a security bug rather
than a visible defect — and Better Auth remains the documented fallback if it proves too slow
to build. Two consequences that follow from choosing it:

- The API must accept the refresh token **both** as an httpOnly cookie (web) and as an
  `Authorization` header (Tauri, which cannot rely on cookies across its custom protocol).
  §6.4 is explicit that this is a day-one requirement, not a later addition.
- Rate limiting is part of the auth work, not a follow-up: 5 login attempts per 15 minutes
  per IP+email, plus a global per-IP limiter.

### #6 — Hosting: Railway + Neon + Cloudflare Pages

API on Railway, Postgres on Neon, web on Cloudflare Pages. Generous free tiers, and Neon's
branching is useful for testing migrations against a copy of real data.

Nothing in the Phase 5 code depends on this until the deploy step; local development runs
Postgres in Docker. The decision is recorded now so it does not have to be made under
deadline, and it is the cheapest of the five to reverse.

### #9 — Placeholder members: real users with a `claimed_at` column

A member added by name with no account is a row in `users` with `email = NULL` and
`claimed_at = NULL`. When they later register with an email, the row is claimed rather than
merged.

The alternative — a separate `guest_members` entity — was rejected because it doubles every
query that touches membership: every join, every balance computation, every activity row
would need a union over two tables and a discriminated reference. §6.2 notes Splitwise
learned this the hard way.

## Consequences

- Phase 5 proceeds as §6 specifies, with no deviation to record.
- `apps/api` joins the pnpm workspace and consumes `@centiverse/contracts` and
  `@centiverse/core` — the same split code runs on both sides of the wire, which is what
  invariant 4 requires.
- Local development gains a Docker dependency (Postgres 17). The web app's `mockPort` path
  keeps working with no backend at all, per invariant 10.
- `users.email` becomes nullable, so the partial unique index in §6.2
  (`users (email) WHERE deleted_at IS NULL`) matters more than it looks: it must tolerate
  many NULL emails, which Postgres allows.
