# ADR 0001 — Workspace layout and Phase 1 tooling

Status: accepted · Phase 1

Records the §12 decisions taken before Phase 1 so they are not re-litigated.

## Decided

| § 12 | Decision | Chosen |
|---|---|---|
| #5 | Monorepo | **pnpm workspace.** `apps/web`, `apps/desktop`, `packages/*`. Makes the §3.2 dependency rule enforceable by CI rather than by discipline, and gives `packages/core` a home in Phase 2. |
| #7 | Platform | **Web-first** (already decided in the plan). PWA in Phase 6; optional Capacitor APK in Phase 7. |
| #8 | MUI | **Remove.** ESLint bans *new* `@mui/*` imports from Phase 1; existing usages are allowlisted and migrate feature-by-feature, with the packages deleted in Phase 7. |

## Consequences

- Package names are `web` and `desktop`, matching §7.1's `beforeDevCommand: "pnpm --filter web dev"`.
- `src-tauri/` contents moved to `apps/desktop/`, so `tauri.conf.json` sits two levels below the
  root and §7.1's `frontendDist: "../../apps/web/dist"` resolves correctly.
- npm `package-lock.json` is replaced by `pnpm-lock.yaml`.

## Still open

Decisions #1, #2, #3, #6, #9 (Phase 5) and #10 (Phase 6) are untouched.
#4 is decided in [ADR 0002](0002-currency-scope.md).

## Deferred

Rust is not installed on the development machine, so `pnpm tauri:dev` cannot be run here.
The Tauri config is written per §7.1 but the desktop exit criterion is **unverified**.
