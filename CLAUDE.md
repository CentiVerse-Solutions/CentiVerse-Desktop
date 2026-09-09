# CentiVerse — working rules

## Read first
- `docs/ARCHITECTURE.md` — the plan. Work one phase at a time.
- `docs/DOMAIN.md` — money and split rules (written in Phase 2).

Never start a phase whose predecessor's exit criteria are unmet.

## Non-negotiables

1. **Money is `Money { minor: int, currency }`.** Never a float. Never a bare number across a
   function boundary. The only way a Money becomes a string is `formatMoney()`.
2. **Splits are computed only by `@centiverse/core`.** No component, service, route or SQL query
   computes a share. If you are about to write `amount / n`, stop.
3. **`sum(shares) === total` and `sum(payers) === total`.** Always. Every strategy, every input.
4. **Balances are derived, never authored.** `balance_cache` is a cache; a test that reads it as
   truth is a broken test.
5. **`simplifyDebts()` output is a display suggestion.** It never writes to the ledger.
6. **`packages/core` imports nothing** — no React, no Prisma, no Node built-ins.
7. **Client and server run the same split code** with the same deterministic tie-break
   (fractional part DESC, then userId ASC).
8. **No component file over 300 lines.** If it grows past that, extract.
9. **Every group-scoped endpoint calls `assertGroupMember` in the service layer**, and has a test
   proving a non-member receives 404 (not 403).
10. **No new `@mui/*` imports.** Ever.

## Working style

- One phase per session. One logical change per commit. Keep the app running at every commit.
- Refactor commits are behaviour-preserving: no feature changes, no styling changes, no
  opportunistic fixes. Note them and do them separately.
- Write the test before the refactor, not after.
- Do not touch `utils/mockData.js` outside the `data/mock/` adapter.
- Do not add a dependency without stating, in the commit message, what it replaces.
- If a task seems to require breaking a non-negotiable, the task is modelled wrong. Stop and say
  so rather than working around it.
- If a decision from ARCHITECTURE.md §12 is still open and blocks you, ask. Do not guess.

## Definition of done — every task

- `typecheck` passes
- `lint` passes
- unit tests pass
- E2E smoke passes
- new logic has tests
- no console errors in dev
- both light and dark themes render correctly
- the diff contains nothing unrelated to the task
