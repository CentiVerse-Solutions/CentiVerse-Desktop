# CentiVerse — Target Architecture & Build Plan

> Status: planning document. Nothing in the repo has been changed.
> Audience: Claude Code (and future-you). Read §0, then work one phase at a time.

---

## 0. How to use this document

1. Read §1–§3 once for the shape of the thing.
2. Then work **one phase at a time** from §10. Each phase has explicit exit criteria.
3. §11 is the standing rule set — copy it into `CLAUDE.md` at the repo root before starting.
4. §12 lists the decisions only Akuma can make. If a phase depends on an undecided item, **stop and ask** rather than guessing.
5. §13 lists invariants. If a change would break one, the change is wrong.

**Do not skip phases.** The ordering is not aesthetic — each phase makes the next one cheap. Building the backend before the domain means writing the money logic twice. Refactoring components before the data seam exists means touching every component twice.

---

## 1. Where the project actually stands

An honest baseline, because the plan depends on it.

**What exists and is genuinely valuable:**
- A large, polished, feature-dense UI. Landing, Dashboard, Groups, GroupDetails (5 tabs), Friends, Activity, Account, Whiteboard. Real interaction logic, animations, responsive layout, a coherent teal/sage/cream visual language.
- Working theme system (`ThemeContext.js`, 9KB) and a token file (`styles/variables.css`).
- A Tauri 2 shell, scaffolded.
- shadcn/Radix primitives already vendored in `components/ui/`.

**What does not exist:**
- **No domain model.** Not "it's mocked" — it's *absent*. `mockExpenses` entries are `{ id, groupId, description, amount, date, paidBy, participants, category }`. There is no `splits` array, no split type, no per-person share. Equal-split is implied by the UI at render time.
- **No ledger, no derivation.** `mockSettlementSummary` is a hand-authored object of floating-point rupee amounts. It is not computed from `mockExpenses` and does not reconcile with them. Every balance in the app is a literal someone typed.
- **No money type.** Amounts are JS floats (`2320.5`, `7705.95`, `13682.25`). Groups declare `currency: "INR"`, but `Dashboard.jsx` and `Activity.jsx` hardcode `$`, `GroupCard.jsx` hardcodes USD via `Intl`, and only `GroupDetails.jsx` reads `group.currency`.
- **No identity model.** User id `1` is literally named `"You"` inside the mock data. The current-user perspective is baked into the data instead of being a property of the viewer. This will contaminate every component until it is fixed.
- **No service/data layer.** `services/*.js`, `hooks/use*.js`, `utils/{calculations,formatters,validators}.js`, `context/{Group,Expense}Context.js`, `constants/{routes,apiEndpoints}.js`, `styles/global.css` — all 0 bytes. Scaffolded, never written.
- **No auth.** `const isAuthenticated = true` is a module constant in `App.js`. `AuthContext` holds a hardcoded "Test User"; `logout()` is a `console.log`.
- **No backend.**

**Structural debt worth naming:**
- `pages/GroupDetails/GroupDetails.jsx` — **173 KB / ~3,100 lines**. Plus a 54 KB CSS file.
- `components/groups/Whiteboard/Whiteboard.jsx` — 61 KB. `pages/Account/Account.jsx` — 61 KB. `pages/Activity/Activity.jsx` — 41 KB. `components/groups/GroupList/GroupList.jsx` — 26 KB.
- Three parallel styling systems: per-component CSS + CSS variables, MUI v6 (`@mui/material` + emotion), and Tailwind.
- Tailwind is the **v2 postcss7-compat** build (`tailwindcss: npm:@tailwindcss/postcss7-compat@^2.2.17`) with a **v3 `content:` key** in the config, and `postcss@7` / `autoprefixer@9`. Purging is silently off — every build ships the full Tailwind v2 stylesheet.
- `package.json` has a self-referential dependency: `"centiverse": "file:"`.
- CRA / `react-scripts@5` — deprecated, no ESM env handling, no `dev` script (Tauri's `beforeDevCommand` calls `npm run dev`, which does not exist; there's no `tauri` script either).
- Dead/broken files: `ThemeToggle.jsx` (wrong relative import depth), `Navbar.jsx` (destructures `darkMode`, which `ThemeContext` never exposes — ~11 undefined usages), `ActivityFeed.jsx` (imports from the empty `formatters.js`), and four 0-byte components (`BottomNavigation`, `ExpenseForm`, `ExpenseList`, `ExpenseSummary`). None are imported, so the build never catches them.
- `.env` (containing a real `GEMINI_API_KEY`) is **not** in `.gitignore`. Currently untracked, so nothing has leaked — one `git add -A` changes that.
- `test.js` at the repo root — an unrelated fake-console-output prank script requiring `chalk`.

**Summary in one line:** a strong front-end prototype with the back three quarters of the application missing, and a data shape that cannot represent the product's core concept (a split).

---

## 2. The thesis

CentiVerse today is a **view with no model**. Three layers are missing and they must be built in this order:

```
  ┌──────────────────────────────────────────────────────────┐
  │ 3. Backend        — persistence, auth, multi-user         │  ← LAST
  ├──────────────────────────────────────────────────────────┤
  │ 2. Data seam      — typed contracts + swappable adapter   │  ← SECOND
  ├──────────────────────────────────────────────────────────┤
  │ 1. Domain         — money, splits, balances (pure, tested)│  ← FIRST
  └──────────────────────────────────────────────────────────┘
```

**Why this order.**

- The **domain first**, because it is pure functions with zero dependencies. It can be written and 100%-tested in a day, and it is the only part of this app where being wrong costs the user real money. Once it exists, both the mock layer and the real backend consume the *same* engine, so they cannot disagree.
- The **seam second**, because it lets the entire UI migrate to a real data-access pattern (TanStack Query, typed contracts, loading/error states, optimistic updates) *while still running on mock data*. The app stays demo-able the whole time. When the backend lands, cutover is an environment variable — not a rewrite.
- The **backend last**, because by then the contract is already written, exercised by a real UI, and validated by real domain tests. You will be implementing a known specification rather than discovering one.

The single most valuable structural decision in this whole document is the seam in §5. Everything else is competent engineering; that one is what makes the migration incremental instead of a big-bang rewrite you abandon halfway.

---

## 3. Target architecture

### 3.1 Runtime shape

```
   ┌─────────────┐        ┌─────────────┐
   │  Web (SPA)  │        │   Desktop   │
   │   Vite +    │        │  Tauri 2 +  │
   │  React 19   │        │  same SPA   │
   └──────┬──────┘        └──────┬──────┘
          │                      │  (+ SQLite mirror, phase 6)
          └──────────┬───────────┘
                     │ HTTPS / JSON (typed client generated from contracts)
                     │ SSE for invalidation events
              ┌──────▼───────┐
              │   API (Node) │  Fastify + TypeScript
              │  routes      │  ← HTTP, auth, validation only
              │  services    │  ← use cases, transactions, authz
              │  domain      │  ← @centiverse/core (pure)
              │  repositories│  ← Prisma
              └──────┬───────┘
                     │
          ┌──────────┼──────────┬─────────────┐
     ┌────▼────┐ ┌───▼────┐ ┌───▼────┐  ┌─────▼─────┐
     │Postgres │ │ Redis  │ │  R2/S3 │  │  Resend   │
     │ (truth) │ │(queue, │ │(receipt│  │  (email)  │
     │         │ │ cache) │ │ blobs) │  │           │
     └─────────┘ └────────┘ └────────┘  └───────────┘
```

### 3.2 Repository layout (pnpm workspace monorepo)

Convert the current single-package repo into a workspace. This is not over-engineering for a solo project — it is what makes "the domain has no React in it" and "the API and the web app cannot disagree about a type" mechanically enforceable rather than a matter of discipline.

```
centiverse/
├── package.json                 # workspace root, scripts only
├── pnpm-workspace.yaml
├── turbo.json                   # or just npm-run-all; task graph
├── CLAUDE.md                    # standing rules for the agent (§11)
├── docs/
│   ├── ARCHITECTURE.md          # this file
│   ├── DOMAIN.md                # split rules, worked examples
│   └── adr/                     # one file per irreversible decision
├── packages/
│   ├── core/                    # @centiverse/core — PURE DOMAIN
│   │   ├── src/
│   │   │   ├── money.ts
│   │   │   ├── split/
│   │   │   │   ├── strategies.ts
│   │   │   │   ├── allocate.ts       # largest-remainder
│   │   │   │   └── index.ts
│   │   │   ├── balance/
│   │   │   │   ├── pairwise.ts
│   │   │   │   ├── net.ts
│   │   │   │   └── simplify.ts       # min-cash-flow
│   │   │   └── errors.ts
│   │   └── test/                     # vitest + fast-check
│   ├── contracts/               # @centiverse/contracts — zod schemas + types
│   │   └── src/
│   │       ├── entities/        # Group, Expense, Settlement, User, ...
│   │       ├── endpoints/       # request/response schema per route
│   │       └── index.ts
│   └── ui/                      # (optional, phase 7) shared primitives
├── apps/
│   ├── web/                     # Vite + React 19 (the current src/, migrated)
│   ├── api/                     # Fastify + Prisma
│   │   ├── prisma/schema.prisma
│   │   └── src/{routes,services,repositories,auth,jobs}
│   └── desktop/                 # src-tauri/ moves here
└── .github/workflows/ci.yml
```

**Dependency rule (enforced by ESLint `no-restricted-imports` + CI):**

```
core        → depends on nothing
contracts   → depends on core (for Money types) only
api         → contracts, core
web         → contracts, core
desktop     → web
```

`core` must never import React, Prisma, Node built-ins, or anything from `apps/`. If a task requires it, the task is modelled wrong.

---

## 4. Layer 1 — Money and the split domain (`@centiverse/core`)

This is the highest-leverage code in the project. Write it first, test it hardest.

### 4.1 Money

**Rule: money is never a JavaScript number in a variable that crosses a function boundary.**

```ts
// packages/core/src/money.ts
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | /* ... */;

/** An amount in the currency's *minor units* (paise, cents). Always an integer. */
export interface Money {
  readonly minor: number;        // integer; safe to ~9e15, far beyond any real use
  readonly currency: CurrencyCode;
}

export const money = (minor: number, currency: CurrencyCode): Money => {
  if (!Number.isSafeInteger(minor)) throw new MoneyError('non-integer minor units');
  return { minor, currency };
};

export const add = (a: Money, b: Money): Money => { assertSameCurrency(a, b); return money(a.minor + b.minor, a.currency); };
export const sub = (a: Money, b: Money): Money => { assertSameCurrency(a, b); return money(a.minor - b.minor, a.currency); };
export const neg = (a: Money): Money => money(-a.minor, a.currency);
export const isZero = (a: Money) => a.minor === 0;
export const sum = (xs: Money[], currency: CurrencyCode): Money => xs.reduce(add, money(0, currency));

/** Parse user input ("1,234.56") → Money. Rejects ambiguity rather than guessing. */
export const parseMoney = (input: string, currency: CurrencyCode): Result<Money, ParseError>;

/** The ONLY way a Money becomes a string. Locale-aware, currency-aware. */
export const formatMoney = (m: Money, locale?: string): string;
```

Notes:
- Minor-unit exponent is **per currency** (INR/USD = 2, JPY = 0, KWD = 3). Keep a small table; do not assume 2.
- `formatMoney` uses `Intl.NumberFormat(locale, { style: 'currency', currency })`. This is what the empty `utils/formatters.js` was always supposed to own. Because it takes `Money` and not `number`, the hardcoded-`$` bug becomes **unrepresentable** — you cannot format an amount without also supplying its currency.
- Never expose a `toNumber()` that returns rupees. Only `formatMoney` and `toMinor`.

### 4.2 Split strategies

```ts
export type SplitStrategy =
  | { kind: 'EQUAL';      participants: UserId[] }
  | { kind: 'EXACT';      shares: Array<{ userId: UserId; amount: Money }> }
  | { kind: 'PERCENT';    shares: Array<{ userId: UserId; bps: number }> }   // basis points, integer, sums to 10000
  | { kind: 'SHARES';     shares: Array<{ userId: UserId; weight: number }> } // integer weights
  | { kind: 'ADJUSTMENT'; participants: UserId[]; adjustments: Array<{ userId: UserId; delta: Money }> }
  | { kind: 'ITEMIZED';   items: Array<{ amount: Money; participants: UserId[] }>; tax?: Money; tip?: Money };

export interface SplitInput {
  total: Money;
  payers: Array<{ userId: UserId; amount: Money }>;  // multi-payer from day one
  strategy: SplitStrategy;
}

export interface Share { userId: UserId; amount: Money; }

export function computeShares(input: SplitInput): Result<Share[], SplitError>;
```

**Use percentages as integer basis points, not floats.** `33.33%` is `3333` bps. Three-way percent splits are the classic source of a stray paisa.

**Multi-payer in the schema from day one**, even if the v1 UI only offers a single payer. Retrofitting "Priya and I both paid part of the hotel" into a single-`paidBy` schema is a migration across every derived table. Cheap now, expensive later.

### 4.2.1 Itemized splits and ancillary apportionment

`ITEMIZED` is the strategy behind receipt-scanning and the claim flow (§14.1). It needs one extra domain function, because a restaurant bill is never just line items:

```ts
export interface Itemization {
  items: Array<{ id: string; label: string; amount: Money; claimedBy: UserId[] }>;
  tax?: Money; serviceCharge?: Money; tip?: Money; discount?: Money;  // discount is negative
  printedTotal: Money;
  unclaimedPolicy: 'SPLIT_EQUALLY' | 'ASSIGN_TO_PAYER' | 'BLOCK';
}

/** Apportions tax / service / tip / discount pro-rata by each person's claimed subtotal. */
export function apportionAncillary(it: Itemization): Result<Share[], SplitError>;
```

Rules:
- Each item is split evenly among the users who claimed it, using the **same largest-remainder allocator** (§4.3), applied per item and then summed. Per-item, deterministic, order-independent.
- Tax, service charge, tip and discount are apportioned **pro-rata by claimed subtotal**, then remainder-allocated so the pieces sum exactly.
- **Reconciliation is mandatory:** `sum(items) + tax + serviceCharge + tip + discount` must equal `printedTotal` within a one-minor-unit tolerance. Outside tolerance the itemization is rejected and the user must correct it. An extracted receipt is never trusted.
- Unclaimed items are resolved by the group's `unclaimedPolicy` before shares are computed.

Build this in Phase 2 with the rest of the domain. The scanning and the claim UI come much later (Phase 8), but they depend on this existing and being correct.

### 4.3 Remainder allocation — the invariant that matters

Splitting ₹100 three ways gives 3333 + 3333 + 3333 = 9999 paise. One paisa is unaccounted for. If you round each share independently, group balances drift and never settle to zero. Users notice — Splitwise's forums are full of it.

**Algorithm: largest remainder, deterministic tie-break.**

```
1. For each participant, compute the exact rational share.
2. Take the floor in minor units.
3. remainder = total.minor - sum(floors)          // 0 <= remainder < participantCount
4. Rank participants by fractional part DESC, then by userId ASC (stable, deterministic).
5. Give +1 minor unit to the first `remainder` participants.
```

The `userId ASC` tie-break is what makes it deterministic: the same expense computed on the client, on the server, and in a recompute job produces byte-identical shares. Without it, optimistic UI and server truth will disagree by a paisa and you will chase phantom bugs.

**This must hold for every strategy, every input:**

```
sum(shares.map(s => s.amount)) === total
sum(payers.map(p => p.amount))  === total
```

Enforce it three times: as an assertion at the end of `computeShares`, as a property-based test, and as a database `CHECK`/trigger.

### 4.4 Balances

Truth is the ledger. Balances are **always derived, never stored as authority.**

Two derived views, both pure functions over the same inputs:

```ts
/** Who owes whom, edge by edge. This is the truth users argue about. */
export function pairwiseBalances(
  expenses: ExpenseRecord[], settlements: SettlementRecord[]
): Map<`${UserId}:${UserId}`, Money>;

/** Each member's single net position in a group. What the summary cards show. */
export function netBalances(
  expenses: ExpenseRecord[], settlements: SettlementRecord[]
): Map<UserId, Money>;
```

Derivation for one expense: each payer is credited what they paid; each participant is debited their share. Pairwise edges are `participant → payer`, apportioned across payers pro-rata when there is more than one.

```ts
/** Suggests the minimum set of transfers to clear a group. DISPLAY ONLY. */
export function simplifyDebts(net: Map<UserId, Money>): Transfer[];
```

`simplifyDebts` (greedy min-cash-flow: repeatedly match the largest creditor with the largest debtor) reduces N² edges to at most N−1 transfers. **It must never mutate the ledger.** Recording a simplified transfer as if it were a real payment destroys the audit trail — "why do I owe Vikram? I never ate with Vikram" is the resulting support ticket. Present it as a *suggestion*; when the user acts on one, record a real settlement between the two actual parties.

Make simplification **opt-in per group** (`groups.simplify_debts BOOLEAN DEFAULT false`), because for some groups the pairwise detail is the point.

### 4.5 Testing the domain

Non-negotiable for this package:
- **Unit tests** for each strategy including the degenerate cases: 1 participant, 0 amount, negative adjustment exceeding the base share, a participant appearing twice, percent not summing to 10000, exact shares not summing to total.
- **Property-based tests** with `fast-check`. The properties:
  - `sum(computeShares(x)) === x.total` — for arbitrary totals, participant counts, strategies.
  - No share is negative unless the strategy is `ADJUSTMENT`.
  - `computeShares` is deterministic: same input → identical output, always.
  - Balance conservation: `sum(netBalances(...).values()) === 0` for any set of expenses and settlements.
  - `simplifyDebts` preserves every participant's net position exactly.
- **Golden-file tests**: a handful of realistic group histories with hand-verified expected balances, committed as JSON. These catch regressions that property tests do not.

Coverage target for `packages/core`: **100% branch.** It is a few hundred lines of pure functions; there is no excuse.

---

## 5. Layer 2 — Contracts and the data-access seam

### 5.1 Contracts package

`packages/contracts` holds **zod schemas** as the single source of truth for every entity and every endpoint. TypeScript types are inferred from them, never hand-written in parallel.

```ts
// packages/contracts/src/entities/expense.ts
export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid().nullable(),      // null = a 1:1 non-group expense
  description: z.string().min(1).max(200),
  total: MoneySchema,
  date: z.string().datetime(),
  categoryId: z.string().uuid().nullable(),
  notes: z.string().max(2000).nullable(),
  payers: z.array(PayerSchema).min(1),
  shares: z.array(ShareSchema).min(1),
  splitStrategy: SplitStrategySchema,
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int(),                  // optimistic concurrency
  deletedAt: z.string().datetime().nullable(),
});
export type Expense = z.infer<typeof ExpenseSchema>;
```

The same schema validates the API request body server-side, validates the API response client-side (catches contract drift immediately, in dev), and drives `react-hook-form` resolvers in the UI. One definition, three jobs.

`constants/apiEndpoints.js` (currently 0 bytes) should never be filled in. Endpoints become **typed functions**, not string constants.

### 5.2 The seam

```ts
// apps/web/src/data/port.ts — the interface the UI codes against
export interface DataPort {
  groups: {
    list(): Promise<GroupSummary[]>;
    get(id: GroupId): Promise<GroupDetail>;
    create(input: CreateGroupInput): Promise<Group>;
    // ...
  };
  expenses: {
    listByGroup(id: GroupId, cursor?: string): Promise<Page<Expense>>;
    create(input: CreateExpenseInput): Promise<Expense>;
    update(id: ExpenseId, input: UpdateExpenseInput, version: number): Promise<Expense>;
    remove(id: ExpenseId): Promise<void>;
  };
  balances: { forGroup(id: GroupId): Promise<GroupBalances>; forViewer(): Promise<ViewerBalances>; };
  settlements: { ... };
  friends: { ... };
  activity: { ... };
  whiteboard: { ... };
}
```

Two implementations, identical signatures:

```ts
// apps/web/src/data/mock/index.ts  — in-memory, seeded from the existing mockData.js,
//   but running every amount through @centiverse/core so balances are REAL, not typed by hand.
//   Persists to localStorage so the demo survives a refresh. Simulates latency and, in dev,
//   injectable failures so loading and error states get exercised.
export const mockPort: DataPort = { ... };

// apps/web/src/data/http/index.ts — fetch + zod-validated, talks to apps/api
export const httpPort: DataPort = { ... };

// apps/web/src/data/index.ts
export const data: DataPort =
  import.meta.env.VITE_DATA_SOURCE === 'mock' ? mockPort : httpPort;
```

**What this buys you:**
1. The whole UI migrates to real async data access — loading, error, empty, optimistic — before a backend exists.
2. Backend cutover is one env var, not a rewrite.
3. Mock mode survives as **permanent demo mode**: deploy the portfolio build with `VITE_DATA_SOURCE=mock` and it works with zero hosting cost and no cold-start, while the real app runs against the API. For a project you will show recruiters, this is worth a lot.
4. E2E tests run against `mockPort` — fast, deterministic, no database.

**Critical:** `mockPort` must compute balances with `@centiverse/core`, not return `mockSettlementSummary`. The moment mock balances are derived, the app's numbers start being *correct*, and every derived-value bug surfaces now rather than after the backend lands.

### 5.3 Query layer

TanStack Query owns all server state. `context/GroupContext.js` and `context/ExpenseContext.js` stay at 0 bytes — **delete them**. React Context is the wrong tool for server state; it re-renders the world and gives you no caching, deduping, retry, or invalidation.

```ts
// query key factory — one place, no ad-hoc key strings anywhere
export const qk = {
  groups: {
    all: ['groups'] as const,
    detail: (id: GroupId) => ['groups', id] as const,
    expenses: (id: GroupId) => ['groups', id, 'expenses'] as const,
    balances: (id: GroupId) => ['groups', id, 'balances'] as const,
  },
  viewer: { balances: ['viewer', 'balances'] as const, activity: ['viewer', 'activity'] as const },
} ;
```

Context survives only for: auth session, theme, toasts. That's it.

### 5.4 Kill the `"You"` pseudo-user — do this early

`mockData.js` contains a user with `id: 1, name: "You"`. The viewer's identity is baked into the data. Every component that renders a name is therefore subtly wrong the moment there is a real logged-in user.

Fix at the seam:
- Data carries real users only. No user is ever named `"You"`.
- A `useViewer()` hook exposes the current user id.
- A single `<PersonName userId={id} />` component (and a `displayName(user, viewerId)` helper) renders `"You"` when `id === viewerId`, the person's name otherwise.
- Same for balance phrasing: `"you owe"` / `"owes you"` / `"X owes Y"` is a formatting concern derived from viewer + edge direction, not stored text.

Do this in Phase 2. Every day it waits, more components hardcode the assumption.

---

## 6. Layer 3 — Backend

### 6.1 Stack recommendation

**Node 22 + TypeScript + Fastify + Prisma + PostgreSQL.** Deploy: Railway or Fly.io for the API, Neon or Supabase Postgres for the database, Cloudflare R2 for blobs.

**Why not Supabase-as-backend** (auth + RLS + generated API, no server code): it is genuinely faster to ship, and it is a defensible choice. But for someone interviewing for SDE roles, the schema design, the transaction boundaries, the auth flow and the authorization model *are the interview*. Supabase hides exactly the parts that demonstrate competence. Write the API. Use Supabase or Neon for managed Postgres alone.

**Why Fastify over Express**: first-class TypeScript, schema-driven validation and serialization that plugs straight into the zod contracts, and meaningfully faster. Express is fine if familiarity matters more.

**Why Prisma**: migrations, type-safe queries, and a readable schema file that doubles as documentation. Drizzle is the alternative if you want SQL closer to the surface — either is defensible; do not mix.

### 6.2 Schema

Sketched as SQL for clarity; implement in `schema.prisma`. All ids are **UUIDv7** (time-sortable, client-generatable — this is what makes offline creation and idempotent retries possible later).

```sql
-- ── identity ────────────────────────────────────────────────────────────────
users (
  id uuid PK, email citext UNIQUE NOT NULL, email_verified_at timestamptz,
  display_name text NOT NULL, avatar_url text,
  default_currency char(3) NOT NULL DEFAULT 'INR',
  locale text NOT NULL DEFAULT 'en-IN', timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
)
auth_credentials (user_id uuid PK→users, password_hash text NOT NULL /* argon2id */, updated_at timestamptz)
oauth_identities (id uuid PK, user_id uuid→users, provider text, provider_uid text, UNIQUE(provider, provider_uid))
sessions (
  id uuid PK, user_id uuid→users, refresh_token_hash text NOT NULL UNIQUE,
  user_agent text, ip inet, created_at timestamptz, last_used_at timestamptz,
  expires_at timestamptz NOT NULL, revoked_at timestamptz
)   -- ← this is what makes the Account→Security screen show real data

-- ── social graph ────────────────────────────────────────────────────────────
friendships (
  id uuid PK, requester_id uuid→users, addressee_id uuid→users,
  status text CHECK (status IN ('PENDING','ACCEPTED','BLOCKED')),
  created_at timestamptz, responded_at timestamptz,
  UNIQUE (LEAST(requester_id,addressee_id), GREATEST(requester_id,addressee_id))
)
invites (id uuid PK, group_id uuid→groups NULL, inviter_id uuid→users,
         email citext NULL, token_hash text UNIQUE, expires_at timestamptz, accepted_at timestamptz)

-- ── groups ──────────────────────────────────────────────────────────────────
groups (
  id uuid PK, name text NOT NULL, avatar_url text, banner_url text,
  currency char(3) NOT NULL, simplify_debts boolean NOT NULL DEFAULT false,
  created_by uuid→users, created_at timestamptz, archived_at timestamptz, deleted_at timestamptz
)
group_members (
  group_id uuid→groups, user_id uuid→users,
  role text CHECK (role IN ('OWNER','ADMIN','MEMBER')) NOT NULL DEFAULT 'MEMBER',
  joined_at timestamptz NOT NULL, left_at timestamptz,
  PRIMARY KEY (group_id, user_id)
)
-- Placeholder members (added by name, no account yet) are real users with
-- email = NULL and a `claimed_at` column — NOT a separate entity. Splitwise
-- learned this the hard way; a parallel "guest" type doubles every query.

-- ── the ledger ──────────────────────────────────────────────────────────────
expenses (
  id uuid PK,                                    -- UUIDv7, client-generated
  group_id uuid→groups NULL,                     -- NULL = 1:1 expense outside a group
  description text NOT NULL, notes text,
  currency char(3) NOT NULL,
  total_minor bigint NOT NULL CHECK (total_minor > 0),
  original_currency char(3), original_total_minor bigint, fx_rate numeric(18,8),
                                                 -- frozen at creation; never recompute history
  expense_date timestamptz NOT NULL,
  category_id uuid→categories NULL,
  split_strategy jsonb NOT NULL,                 -- the SplitStrategy that produced the shares
  recurring_id uuid→recurring_expenses NULL,
  created_by uuid→users NOT NULL,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1,            -- optimistic concurrency
  deleted_at timestamptz
)
expense_payers  (expense_id uuid→expenses, user_id uuid→users, amount_minor bigint NOT NULL CHECK (amount_minor > 0), PRIMARY KEY (expense_id, user_id))
expense_shares  (expense_id uuid→expenses, user_id uuid→users, amount_minor bigint NOT NULL,                          PRIMARY KEY (expense_id, user_id))
-- INVARIANT, enforced by a DEFERRABLE constraint trigger:
--   SUM(expense_payers.amount_minor) = expenses.total_minor
--   SUM(expense_shares.amount_minor) = expenses.total_minor

expense_revisions (
  id uuid PK, expense_id uuid→expenses, version integer NOT NULL,
  snapshot jsonb NOT NULL,                       -- full prior state
  changed_by uuid→users, changed_at timestamptz, reason text,
  UNIQUE (expense_id, version)
)   -- ← makes "who changed this and when" answerable, and feeds the activity feed

settlements (
  id uuid PK, group_id uuid→groups NULL,
  from_user_id uuid→users, to_user_id uuid→users,
  currency char(3), amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  method text,                                   -- UPI / CASH / BANK / OTHER
  external_ref text, note text,
  settled_at timestamptz NOT NULL, recorded_by uuid→users,
  confirmed_at timestamptz, confirmed_by uuid→users,   -- two-sided confirmation
  created_at timestamptz, deleted_at timestamptz,
  CHECK (from_user_id <> to_user_id)
)

-- ── derived (cache, never truth) ────────────────────────────────────────────
balance_cache (
  group_id uuid, from_user_id uuid, to_user_id uuid, currency char(3),
  amount_minor bigint NOT NULL, updated_at timestamptz,
  PRIMARY KEY (group_id, from_user_id, to_user_id, currency)
)
-- Maintained in the same transaction as the mutation. A nightly job recomputes
-- from scratch and asserts equality; a mismatch is a P1 alert. NEVER read this
-- as authority in a test — tests derive from the ledger.

-- ── everything else ─────────────────────────────────────────────────────────
categories        (id uuid PK, key text UNIQUE, label text, icon text, is_system boolean)
attachments       (id uuid PK, owner_type text, owner_id uuid, storage_key text, mime text,
                   bytes bigint, width int, height int, uploaded_by uuid→users, created_at timestamptz)
comments          (id uuid PK, expense_id uuid→expenses, author_id uuid→users, body text, created_at, edited_at, deleted_at)
activity_events   (id uuid PK, actor_id uuid→users, group_id uuid NULL, subject_type text, subject_id uuid,
                   verb text, payload jsonb, created_at timestamptz)
                   -- written in the SAME TRANSACTION as the mutation it describes
activity_reads    (user_id uuid, event_id uuid, read_at timestamptz, PRIMARY KEY (user_id, event_id))
notification_prefs(user_id uuid PK→users, prefs jsonb NOT NULL)
recurring_expenses(id uuid PK, group_id uuid, template jsonb, rrule text, next_run_at timestamptz, active boolean)
budgets           (id uuid PK, user_id uuid NULL, group_id uuid NULL, category_id uuid NULL,
                   period text, amount_minor bigint, currency char(3))
fx_rates          (base char(3), quote char(3), rate numeric(18,8), as_of date, PRIMARY KEY (base, quote, as_of))

-- ── whiteboard ──────────────────────────────────────────────────────────────
whiteboard_notes    (id uuid PK, group_id uuid→groups, author_id uuid→users, body text,
                     color text, position jsonb, pinned boolean, created_at, updated_at, deleted_at)
note_mentions       (note_id uuid→whiteboard_notes, user_id uuid→users, PRIMARY KEY (note_id, user_id))
note_reactions      (note_id uuid, user_id uuid, emoji text, PRIMARY KEY (note_id, user_id, emoji))
note_comments       (id uuid PK, note_id uuid→whiteboard_notes, author_id uuid, body text, created_at)
note_reads          (note_id uuid, user_id uuid, read_at timestamptz, PRIMARY KEY (note_id, user_id))
```

**Indexes that matter:** `expenses (group_id, expense_date DESC) WHERE deleted_at IS NULL`; `expense_shares (user_id)`; `activity_events (group_id, created_at DESC)`; `group_members (user_id)`; partial unique on `users (email) WHERE deleted_at IS NULL`.

### 6.3 API design

REST, resource-shaped, cursor-paginated. Versioned under `/v1`.

```
POST   /v1/auth/register            POST /v1/auth/login
POST   /v1/auth/refresh             POST /v1/auth/logout
GET    /v1/auth/sessions            DELETE /v1/auth/sessions/:id
GET    /v1/me                       PATCH /v1/me

GET    /v1/groups                   POST /v1/groups
GET    /v1/groups/:id               PATCH /v1/groups/:id            DELETE /v1/groups/:id
GET    /v1/groups/:id/members       POST /v1/groups/:id/members     DELETE /v1/groups/:id/members/:userId
GET    /v1/groups/:id/balances      GET  /v1/groups/:id/settle-plan   ← simplifyDebts output
GET    /v1/groups/:id/expenses?cursor=&limit=

POST   /v1/expenses                 GET  /v1/expenses/:id
PATCH  /v1/expenses/:id             DELETE /v1/expenses/:id
GET    /v1/expenses/:id/revisions
POST   /v1/expenses/:id/comments

POST   /v1/settlements              PATCH /v1/settlements/:id/confirm
GET    /v1/friends                  POST /v1/friends/requests        PATCH /v1/friends/requests/:id
GET    /v1/activity?cursor=
POST   /v1/attachments/presign      ← returns a presigned PUT; blobs never pass through the API
GET    /v1/events                   ← SSE stream of invalidation events
```

**Conventions, all of them non-optional:**
- Every mutation accepts an `Idempotency-Key` header; the response is cached against it for 24h. Combined with client-generated UUIDv7 ids, this makes retries and offline replay safe.
- Every update sends the entity's `version`; a mismatch returns **409** with the current server state so the client can present a real conflict UI rather than silently clobbering.
- Errors are RFC 9457 problem+json: `{ type, title, status, detail, instance, errors? }`. One shape, always.
- Cursor pagination (opaque, encodes `(created_at, id)`). Never `OFFSET` — the activity feed will grow.
- Money crosses the wire as `{ minor: number, currency: string }`. Never a decimal string, never a float.
- `Money` is validated by the shared zod schema on both ends.

### 6.4 Auth

- **Access token**: JWT, 15 min, held **in memory only** (never `localStorage` — XSS reads it).
- **Refresh token**: opaque random 32 bytes, stored hashed in `sessions`, **rotated on every use**. Reuse of a rotated token = token theft → revoke the entire session family and force re-login.
- **Transport**: `httpOnly; Secure; SameSite=Lax` cookie for web. **Tauri cannot rely on cookies** across its custom protocol — the desktop app stores the refresh token in the OS keychain (`tauri-plugin-stronghold` or `tauri-plugin-store` with encryption) and sends it in an `Authorization` header. **Design the API to accept both from day one**; bolting on the header path later means re-testing every auth route.
- Passwords: **argon2id** (`m=19456, t=2, p=1` — the OWASP baseline). Never bcrypt-with-defaults, never SHA-anything.
- Email verification and password reset: single-use hashed tokens, 1 hour TTL.
- Google OAuth for the "Continue with Google" button `AuthModal.jsx` already renders.
- Rate limits: 5 login attempts / 15 min / IP+email, and a global limiter per IP.

### 6.5 Authorization — the part that gets skipped and shouldn't

Every group-scoped resource must be checked. One helper, used everywhere:

```ts
await assertGroupMember(userId, groupId, { minRole: 'MEMBER' });
```

Rules:
- Applied in the **service layer**, not in route handlers, so it cannot be forgotten on a new route that reuses a service.
- A non-member gets **404, not 403**. 403 confirms the resource exists.
- Only the expense's creator or a group ADMIN may edit or delete it. Configurable per group later.
- **For every endpoint there is a test asserting a non-member receives 404.** This is the single highest-value test suite in the API; IDOR is the most common real vulnerability in apps of this exact shape.

---

## 7. Layer 4 — Frontend re-architecture

### 7.1 Build tooling: CRA → Vite

`react-scripts@5` is deprecated and unmaintained, cannot do proper env handling for a Tauri target, and is slow. Migrate to **Vite 6**.

The migration itself: move `public/index.html` to the root and add the module script tag, rename JSX-containing `.js` files to `.jsx` (Vite requires it), replace `process.env.REACT_APP_*` with `import.meta.env.VITE_*`, port `jsconfig.json` path aliases into `vite.config.ts`, and swap Jest for **Vitest** (near drop-in with Testing Library).

While there:
- Remove `"centiverse": "file:"` from dependencies.
- Upgrade **Tailwind v2-postcss7-compat → Tailwind v4**, which drops the PostCSS 7 pin, fixes purging, and moves theming into CSS `@theme` — which aligns perfectly with the existing `variables.css` token approach.
- Delete root `test.js`, or move it to `scripts/` if it's worth keeping.
- Add `.env` to `.gitignore` and **rotate the Gemini key** regardless of it being untracked.
- Fix Tauri: `beforeDevCommand: "pnpm --filter web dev"`, `devUrl: "http://localhost:5173"`, `frontendDist: "../../apps/web/dist"`, and real `tauri:dev` / `tauri:build` scripts.

### 7.2 TypeScript, incrementally

`allowJs: true`, `checkJs: false`, `strict: true`. Migrate leaf-first: `utils` → `data` → `hooks` → components → pages. New files are `.ts`/`.tsx`, always. `tsc --noEmit` runs in CI from day one so the typed portion cannot regress. Do **not** attempt a big-bang conversion of `GroupDetails.jsx` — it gets decomposed first (§7.4), and the pieces are born typed.

### 7.3 Folder structure — feature-sliced

The current split is `components/` by kind and `pages/` by route, which is why `GroupDetails.jsx` is 3,100 lines: there was nowhere else for group-detail logic to live.

```
apps/web/src/
├── app/                    # bootstrap: providers, router, error boundaries
│   ├── router.tsx
│   └── providers.tsx       # QueryClient, Auth, Theme, Toast
├── data/                   # THE SEAM (§5.2)
│   ├── port.ts   mock/   http/   index.ts
├── features/
│   ├── auth/         {api, components, hooks, model}
│   ├── groups/
│   ├── expenses/           # ExpenseForm, split editors, expense list/row
│   ├── balances/           # summary cards, settle-up flow, settle plan
│   ├── friends/
│   ├── activity/
│   ├── whiteboard/
│   └── account/
├── shared/
│   ├── ui/                 # Radix/shadcn primitives (today's components/ui)
│   ├── money/              # <Amount/>, useCurrency — thin wrappers over core
│   ├── people/             # <PersonName/>, <Avatar/>, displayName()
│   ├── lib/                # cn(), date helpers, hooks
│   └── styles/             # tokens.css, base.css
└── pages/                  # thin route components: compose features, own layout
```

**Rule: a `pages/` file only composes. All logic lives in a feature.**

### 7.4 Decomposing `GroupDetails.jsx` (173 KB → ~15 files)

This is the biggest single refactor. Do it in one dedicated phase, mechanically, with the screen visibly identical at every step.

```
pages/GroupDetails/GroupDetails.tsx        # <300 lines: header, tab router, data loading
features/groups/components/GroupHeader.tsx
features/groups/components/GroupTabs.tsx   # lazy route children, one per tab
  ├─ tabs/ExpensesTab.tsx
  ├─ tabs/BalancesTab.tsx
  ├─ tabs/TotalsTab.tsx
  ├─ tabs/MembersTab.tsx
  └─ tabs/WhiteboardTab.tsx  → features/whiteboard/*
features/expenses/components/QuickAddExpense.tsx
features/expenses/components/ExpenseSplitEditor/
  ├─ EqualSplit.tsx  ExactSplit.tsx  PercentSplit.tsx  SharesSplit.tsx
features/expenses/components/ExpenseRow.tsx  ExpenseList.tsx  ExpenseDetailSheet.tsx
features/balances/components/SettleUpDialog.tsx  BalanceList.tsx  SettlePlan.tsx
features/groups/components/GroupAnalytics.tsx      # the Recharts panels
features/groups/components/GroupExport.tsx         # CSV/JSON/PDF
```

Each tab becomes a lazy route (`/groups/:id/expenses`, `/groups/:id/balances`, …), which gives real URLs for tabs — shareable, back-button-correct — and code-splits a very large page.

The 54 KB `GroupDetails.css` splits alongside, or converts to Tailwind + tokens tab by tab.

Rules for the refactor: **behaviour-preserving only.** No feature changes, no styling changes, no "while I'm here" fixes. One commit per extracted component. If a Playwright smoke test exists for the group screen (write it *before* starting), it must pass unchanged after each commit.

Apply the same treatment to `Account.jsx` (61 KB → one component per section), `Whiteboard.jsx` (61 KB), `Activity.jsx` (41 KB), `GroupList.jsx` (26 KB).

### 7.5 Styling consolidation

Three systems is two too many. **Target: Tailwind v4 + CSS-variable tokens + Radix/shadcn primitives. Remove MUI entirely.**

MUI (`@mui/material`, `@mui/icons-material`, `@emotion/*`) duplicates what Radix already provides, adds a large bundle, and brings a second theming system that fights `variables.css`. `lucide-react` already covers icons.

Migration, not rewrite:
1. Add an ESLint rule banning **new** `@mui/*` imports today.
2. Consolidate tokens: one `shared/styles/tokens.css` defines every design token as a CSS custom property (light + dark). Tailwind v4's `@theme` reads the same variables, so a token has exactly one definition and both systems see it.
3. Convert MUI usage feature by feature as you touch each feature for other reasons.
4. When the MUI import count hits zero, remove the four packages. Expect a large bundle drop.

`ThemeContext.js` stays — reduce it to toggling a `data-theme` attribute and persisting the choice; the tokens do the rest.

### 7.6 Forms and validation

`react-hook-form` + `zodResolver`, using the **same schemas** from `packages/contracts`. `utils/validators.js` (0 bytes) stays empty and gets deleted — validation lives in the contracts, so client and server cannot disagree about what a valid expense is.

The expense form is the hard one. It needs: multi-payer, five split strategies, live per-person preview computed by `@centiverse/core` **as you type**, and a visible running remainder ("₹0.02 left to assign") that blocks submission until it is zero. Build it as a controlled component over a `SplitInput`, with `computeShares` called on every change. Because the same function runs on the server, the preview is guaranteed to match what gets stored.

### 7.7 Optimistic updates

Adding an expense should feel instant. With `onMutate`: insert the client-built expense (client-generated UUIDv7 id, shares from `computeShares`) into the cache, recompute balances locally with the same core functions, roll back on error. Because client and server run identical code with identical tie-breaking, the optimistic result and the server response are **byte-identical** — no flicker, no correction.

This is the concrete payoff of §4.3's determinism requirement.

---

## 8. Layer 5 — Realtime, desktop, offline

### 8.1 Realtime (phase 5)

**SSE, not WebSockets**, for the first pass. `GET /v1/events` streams small invalidation messages:

```json
{ "type": "expense.created", "groupId": "...", "expenseId": "...", "actorId": "..." }
```

The client maps the event to `queryClient.invalidateQueries(qk.groups.expenses(groupId))` and refetches. The server never pushes state — only "something changed here". This is dramatically simpler than a stateful socket protocol, survives proxies and reconnects for free, and is enough for an expense tracker.

Move to WebSockets only when there is genuine bidirectional need — realistically only collaborative whiteboard editing.

### 8.2 Whiteboard

Today it is notes with mentions, attachments, tags, likes, comments and seen-status — a rich per-note model, not a canvas. Keep it server-authoritative: notes are rows, mutations are ordinary API calls, updates arrive via SSE. That covers everything the current UI does.

If simultaneous editing of the *same note body* ever becomes a requirement, that is the point to introduce Yjs + a y-websocket provider for note bodies only, keeping metadata in Postgres. Do not build CRDTs before then.

### 8.3 Desktop and offline (phase 6)

Tauri config fixes are Phase 1. Real offline is Phase 6, and it is cheap **because of decisions already made**:

- Ids are client-generated UUIDv7 → an expense created offline already has its final id.
- Every mutation is idempotent via `Idempotency-Key` → replay is safe.
- Balances are derived by `@centiverse/core`, which runs identically on-device.

So offline is: a SQLite mirror via `tauri-plugin-sql`, plus an **outbox** table of pending mutations. `mockPort`/`httpPort` gains a third sibling, `localFirstPort`, which reads SQLite, writes the outbox, and syncs on reconnect. Conflicts surface through the same `version`/409 mechanism the web app already handles.

Also worth adding on desktop: `tauri-plugin-updater`, a system tray quick-add, native notifications, and deep links (`centiverse://groups/:id`).

---

## 9. Cross-cutting concerns

### 9.1 Testing pyramid

| Layer | Tool | Target |
|---|---|---|
| Domain (`core`) | Vitest + fast-check | **100% branch**, property tests for every invariant |
| Contracts | Vitest | schema round-trip; every fixture parses |
| API services | Vitest + Testcontainers (real Postgres) | every use case; **every endpoint has a non-member → 404 test** |
| API routes | supertest/light-my-request | auth, validation, error shape |
| Web units | Vitest + Testing Library | split editor, money formatting, balance components |
| Web E2E | Playwright against `mockPort` | 6 flows below |

The six E2E flows, which must pass on every PR: sign up → land on dashboard; create group → add members; add an expense with each split type; settle up; edit an expense and see balances change; offline/error state renders and recovers.

### 9.2 CI

`.github/workflows/ci.yml`, required to pass before merge: `typecheck` → `lint` → `test:unit` → `test:api` (Testcontainers) → `build` → `test:e2e`. Plus a Prisma migration check that the schema and migrations agree.

### 9.3 Observability

- **Structured logging**: pino, JSON, with a request id propagated from an inbound `x-request-id` header and returned in responses.
- **Errors**: Sentry on both ends, sharing a release id so a frontend error can be traced to the API deploy.
- **Metrics**: request duration and error rate per route; a domain counter for split-invariant assertion failures (should be permanently zero — if it isn't, that is a P1).
- **The reconciliation job**: nightly, recompute all balances from the ledger and diff against `balance_cache`. Any mismatch alerts. This is the canary for the entire money layer.

### 9.4 Security checklist

- `.env` gitignored; **rotate the Gemini key**; secrets only via the host's secret store; a `.env.example` committed with keys and no values.
- Helmet (or Fastify equivalent), strict CORS allowlist, a real CSP (`tauri.conf.json` currently has `"csp": null` — set one).
- Rate limiting on auth and on all writes.
- Zod validation at every boundary; no unvalidated body reaches a service.
- Prisma only — no string-interpolated SQL.
- Argon2id, rotating refresh tokens, session revocation (§6.4).
- No PII in logs; redact `email`, `Authorization`, `Cookie` in the pino serializer.
- `npm audit` / Dependabot in CI.
- Attachments: presigned uploads, validate content-type and size server-side, serve from a separate origin, never trust the client-supplied filename.

---

## 10. Phased roadmap

Each phase is independently shippable and leaves the app working. Do not start a phase before the previous one's exit criteria are met.

---

### Phase 0 — Hygiene *(half a day)*
Cheap, isolated, unblocks everything.

- `.gitignore` `.env`; rotate the Gemini key; add `.env.example`.
- Remove `"centiverse": "file:"`.
- Delete or relocate root `test.js`.
- Delete the dead components (`Navbar`, `BottomNavigation`, `ExpenseForm`, `ExpenseList`, `ExpenseSummary`, the broken `ActivityFeed`) — they are unimported and unbuilt; they will be rewritten properly in later phases. Keep `ThemeToggle`, fix its import path.
- Commit the current working tree on a branch first. Nothing below should be done on top of uncommitted work.

**Exit:** clean `git status`, `npm run build` succeeds, no secrets tracked.

---

### Phase 1 — Foundation *(2–3 days)*
- pnpm workspace; move `src/` → `apps/web/src`, `src-tauri/` → `apps/desktop`.
- CRA → **Vite 6**; Jest → **Vitest**.
- TypeScript on with `allowJs`; `tsc --noEmit` in CI.
- Tailwind **v2-compat → v4**; consolidate tokens into one `tokens.css`; ESLint rule banning new `@mui/*` imports.
- Fix `tauri.conf.json` (dev command, port, dist path, CSP) and add `tauri:dev` / `tauri:build`.
- GitHub Actions: typecheck, lint, test, build.

**Exit:** `pnpm dev` runs the web app; `pnpm tauri:dev` opens the desktop shell; CI green; the app looks and behaves exactly as before.

---

### Phase 2 — The domain *(3–4 days)*
- Build `packages/core` in full: money, all five split strategies, largest-remainder allocation, pairwise + net balances, `simplifyDebts`.
- Include `ITEMIZED` + `apportionAncillary` (§4.2.1) — the receipt feature depends on it, and it is cheapest to build alongside the other strategies.
- Vitest + fast-check; 100% branch coverage; golden-file fixtures.
- Write `docs/DOMAIN.md` with worked examples (the ₹100/3 case front and centre).
- Build `packages/contracts`: zod entity schemas.
- Kill the `"You"` pseudo-user: real users in data, `useViewer()`, `<PersonName/>`, `displayName()`.
- Wire `formatMoney` into the four places that currently hardcode `$`/USD.

**Exit:** `pnpm --filter core test` at 100% branch; property tests green; `apportionAncillary` reconciles against printed totals on the golden fixtures; no component computes a split or formats a currency by hand.

---

### Phase 3 — The seam *(4–5 days)*
- Define `DataPort` covering every screen.
- Implement `mockPort`: seeded from today's `mockData.js`, but **balances derived by `@centiverse/core`**, persisted to localStorage, simulated latency, injectable errors.
- Add TanStack Query, the query-key factory, and the provider stack.
- Migrate every screen off direct `mockData` imports and onto `data.*` + hooks. Add real loading / empty / error states.
- Delete `context/GroupContext.js` and `context/ExpenseContext.js`.
- Playwright: the six E2E flows, running against `mockPort`.

**Exit:** zero imports of `utils/mockData` outside `data/mock/`; every screen has loading/error/empty states; the numbers on screen are computed and reconcile; E2E green.

---

### Phase 4 — Decomposition *(4–5 days)*
Pure refactor, no behaviour change, E2E green after every commit.

- `GroupDetails.jsx` → the file map in §7.4; tabs become nested lazy routes.
- Then `Account.jsx`, `Whiteboard.jsx`, `Activity.jsx`, `GroupList.jsx`.
- Convert the extracted pieces to TypeScript as they are extracted.
- Build the real `ExpenseSplitEditor` (all five strategies, live preview from `core`, remainder indicator).

**Exit:** no component file over 300 lines; every tab is its own route; E2E unchanged and green.

---

### Phase 5 — Backend *(1.5–2 weeks)*
- `apps/api`: Fastify + Prisma + Postgres; the §6.2 schema; migrations.
- Auth: register / login / refresh-with-rotation / logout / sessions; argon2id; email verification; Google OAuth.
- `assertGroupMember` in the service layer + the full non-member-404 test suite.
- Every endpoint in §6.3, validated by the shared contracts, with idempotency keys and version-based concurrency.
- Implement `httpPort` against it; flip `VITE_DATA_SOURCE=api`.
- Replace `App.js`'s `isAuthenticated = true` with a real session guard and a route loader.
- Seed script that generates the mock dataset in Postgres so the demo data survives.
- Deploy: API on Railway/Fly, Postgres on Neon, web on Vercel/Cloudflare Pages.

**Exit:** two different browsers, two real accounts, one shared group, balances agreeing; `mockPort` still works for the demo build; API test suite green against a real database.

---

### Phase 6 — Depth *(1.5–2 weeks)*
- SSE invalidation stream; live-updating group screens.
- Attachments: presigned R2 uploads, receipts on expenses and whiteboard notes.
- Activity feed backed by `activity_events`; read/unread state.
- Notifications: prefs table honoured, email via Resend, queued.
- Recurring expenses (rrule + scheduled job).
- Real PDF export (replace the `alert()` stub) — server-rendered so web and desktop share it.
- Whiteboard on real persistence.
- Nightly balance reconciliation job + alert.
- **PWA**: manifest, service worker, installable to an Android/iOS home screen, offline shell, web push. This is the mobile story (decision #7) — cheap, and it reuses everything.

**Exit:** two clients on one group see each other's changes without refresh; receipts upload and render; the reconciliation job reports zero drift.

---

### Phase 7 — Offline, packaging, polish *(1–2 weeks)*
- SQLite mirror + outbox `localFirstPort`; offline create/edit; sync on reconnect; conflict UI on 409.
- Tauri updater, tray quick-add, native notifications, deep links.
- *Optional:* Capacitor wrapper for a Play Store APK — native camera (receipts), FCM push, share sheet, from the same React codebase. If you do this, budget a pass to gate framer-motion behind `prefers-reduced-motion` and trim the heaviest animations: the current UI is animation-dense and will feel janky in a WebView on a mid-range phone.
- Remove MUI entirely; bundle audit.
- Accessibility pass: keyboard paths, focus traps in the modals, contrast in both themes, `prefers-reduced-motion` for the framer-motion work.
- Performance: virtualize long expense and activity lists; route-level prefetch.
- Sentry, structured logs, dashboards.

**Exit:** aeroplane mode → add expenses → reconnect → everything syncs, no duplicates, no drift.

---

### Phase 8 — Intelligence layer *(scope to taste)*
Only after the ledger is real, tested and deployed. See §14 for the full design.

- The `suggestions` pipeline (§14.2) — one table, one accept/reject flow, serving every feature below.
- **Itemized claim flow** with manual item entry — the product half of receipt splitting. Ship this before any OCR.
- **Receipt extraction** — VLM with structured output, server-side, confidence per field, mandatory review screen.
- **Natural-language expense entry** — the `SplitInput` contract handed to the model as a tool schema.
- **Duplicate detection**, **split memory**, **recurring detection**, **smart categorization**.
- Optional later: semantic expense search (pgvector), trip burn-rate forecasting, fair-payer suggestion.

**Exit:** four people claim items on one receipt simultaneously from four devices and the shares reconcile to the printed total exactly.

---

## 11. Standing rules for the AI — copy into `CLAUDE.md`

```md
# CentiVerse — working rules

## Read first
- docs/ARCHITECTURE.md  — the plan. Work one phase at a time.
- docs/DOMAIN.md        — money and split rules.
Never start a phase whose predecessor's exit criteria are unmet.

## Non-negotiables
1. Money is `Money { minor: int, currency }`. NEVER a float. NEVER a bare number
   across a function boundary. The only way a Money becomes a string is formatMoney().
2. Splits are computed ONLY by @centiverse/core. No component, service, route or
   SQL query computes a share. If you are about to write `amount / n`, stop.
3. sum(shares) === total and sum(payers) === total. Always. Every strategy, every input.
4. Balances are DERIVED, never authored. balance_cache is a cache; a test that reads
   it as truth is a broken test.
5. simplifyDebts() output is a suggestion for display. It never writes to the ledger.
6. packages/core imports nothing — no React, no Prisma, no Node built-ins.
7. Client and server run the SAME split code with the SAME deterministic tie-break.
8. No component file over 300 lines. If it grows past that, extract.
9. Every group-scoped endpoint calls assertGroupMember in the SERVICE layer, and has a
   test proving a non-member gets 404 (not 403).
10. No new @mui/* imports. Ever.

## Working style
- One phase per session. One logical change per commit. Keep the app running.
- Refactor commits are behaviour-preserving: no feature changes, no styling changes,
  no opportunistic fixes. Note them and do them separately.
- Write the test before the refactor, not after.
- Do not touch utils/mockData.js outside the data/mock/ adapter.
- Do not add a dependency without saying, in the commit message, what it replaces.
- If a task seems to require breaking a non-negotiable, the task is modelled wrong.
  Stop and say so rather than working around it.
- If a decision from ARCHITECTURE.md §12 is still open and blocks you, ask. Do not guess.

## Definition of done for any task
typecheck passes · lint passes · unit tests pass · E2E smoke passes ·
new logic has tests · no console errors in dev · both themes render correctly ·
the diff contains nothing unrelated to the task.
```

---

## 12. Open decisions — yours to make

Recommendations given; override freely, but decide **before** the phase that depends on it.

| # | Decision | Options | Recommendation | Needed by |
|---|---|---|---|---|
| 1 | Backend approach | Own Fastify API / Supabase BaaS / Convex | **Own API** — it's the part that demonstrates SDE skill | ✅ [ADR 0004](adr/0004-backend-stack.md) |
| 2 | ORM | Prisma / Drizzle / raw SQL | **Prisma** — migrations + readable schema | ✅ [ADR 0004](adr/0004-backend-stack.md) |
| 3 | Auth | Roll your own / Better Auth / Clerk | **Roll your own** for the same reason as #1; Better Auth if time is short | ✅ [ADR 0004](adr/0004-backend-stack.md) |
| 4 | Multi-currency depth | Per-group single currency / per-expense with frozen FX | **Per-group single currency in v1**; the schema already has the FX columns for later | Phase 2 |
| 5 | Monorepo | pnpm workspace / single package | **Workspace** — it's what makes the layering enforceable | Phase 1 |
| 6 | Hosting | Railway / Fly / Render / VPS | **Railway** API + **Neon** Postgres + **Cloudflare Pages** web — generous free tiers | ✅ [ADR 0004](adr/0004-backend-stack.md) |
| 7 | Platform | ~~web / Android / RN~~ | **DECIDED — web-first.** Responsive web is the product. PWA (installable, offline, web push) in Phase 6; an optional Capacitor APK for a Play Store listing in Phase 7. No React Native, no native Android. | ✅ decided |
| 8 | Keep MUI? | Remove / keep | **Remove** | Phase 1 (ban) / 7 (delete) |
| 9 | Placeholder members | Real users with null email / separate entity | **Real users, `claimed_at` column** | ✅ [ADR 0004](adr/0004-backend-stack.md) |
| 10 | Whiteboard collaboration | Server-authoritative / CRDT | **Server-authoritative**; CRDT only if simultaneous editing is genuinely wanted | Phase 6 |

---

## 13. Invariants — the things that must never break

If a change would violate one of these, the change is wrong.

1. `sum(expense_shares) === expense.total_minor` and `sum(expense_payers) === expense.total_minor`, enforced in the domain, in tests, and by a database constraint trigger.
2. For any group, `sum(netBalances)` is exactly zero.
3. Money never touches a float. Not in TS, not in JSON, not in Postgres (`bigint` minor units, never `float8`; `numeric` only for FX rates).
4. The same split input produces byte-identical output on client, server, and in a recompute job.
5. The ledger is append-mostly: edits create revisions, deletes are soft. History is never silently rewritten.
6. Derived data (`balance_cache`) always agrees with a from-scratch recompute. The nightly job proves it.
7. A user can only read or write data for groups they are a member of, and cannot learn that a group they aren't in exists.
8. `packages/core` has zero runtime dependencies.
9. Simplified debts are never persisted as settlements.
10. The app builds and runs against `mockPort` with no backend, forever. That is the demo, and it is also the E2E harness.
11. No intelligent feature ever writes to the ledger. Models produce suggestions; humans accept them; acceptance goes through the ordinary domain code and the ordinary validation.

---

## 14. Intelligence layer

Everything here is **Phase 8**. It is built on top of a working, tested, deployed ledger — never before one. The one exception is `ITEMIZED` / `apportionAncillary` (§4.2.1), which is Phase 2 domain work.

### 14.1 Receipt scanning and the claim flow

**The OCR is a commodity; the claim flow is the product.** Build them in that order — claim flow first with manual item entry, extraction second. The feature then still works when extraction fails, which on Indian restaurant bills it regularly will (thermal printers, faded ink, curled paper, GST breakdown lines, abbreviated item names).

**The claim flow is a new expense lifecycle, not just a split type:**

```
DRAFT ──▶ CLAIMING ──▶ FINALIZED
             │
             └─▶ EXPIRED (deadline passed → apply unclaimedPolicy, finalize)
```

- Balances **do not move** while an expense is `CLAIMING`. It shows as pending.
- A claim session needs a deadline plus a nudge, and a "close now" action for the payer — otherwise it hangs forever waiting on one person.
- Live multi-user claiming rides on the Phase 6 SSE stream: everyone opens the same receipt on their own phone and claims simultaneously. This is the demo that sells the project.

New tables:

```sql
receipts       (id uuid PK, expense_id uuid→expenses, attachment_id uuid→attachments,
                extraction jsonb, model text, extracted_at timestamptz, confidence numeric)
receipt_items  (id uuid PK, receipt_id uuid→receipts, label text, amount_minor bigint,
                quantity int, sort_order int, confidence numeric)
item_claims    (item_id uuid→receipt_items, user_id uuid→users, claimed_at timestamptz,
                PRIMARY KEY (item_id, user_id))
```

**Extraction:** a vision model with structured output (Gemini 2.x Flash is cheap and good at receipts; Google Document AI's expense parser and Azure's prebuilt-receipt are the purpose-built alternatives). Hand it the zod line-item schema, get validated JSON back. **Do not train a model.**

Engineering requirements:
- Server-side only. The API key never reaches the client.
- Per-field confidence; anything below threshold is highlighted in the review screen.
- Cache by image hash; cap image dimensions; rate-limit per user.
- **Mandatory reconciliation** against the printed total (§4.2.1). Never write an unreconciled itemization.
- Receipts contain card last-four and sometimes names — treat the blobs as sensitive, private bucket, no public URLs.

### 14.2 The suggestions pipeline — the rule that makes this safe

**No intelligent feature writes to the ledger.** Same principle as `simplifyDebts`: models emit suggestions, humans accept them, and acceptance goes through the ordinary API mutation, the ordinary domain code, and the ordinary validation.

```sql
suggestions (
  id uuid PK, user_id uuid→users, group_id uuid NULL,
  type text,                      -- DUPLICATE | RECURRING | CATEGORY | SPLIT_MEMORY | NL_PARSE | ...
  subject_type text, subject_id uuid,
  payload jsonb, confidence numeric,
  status text CHECK (status IN ('PENDING','ACCEPTED','REJECTED','EXPIRED')),
  created_at timestamptz, resolved_at timestamptz, resolved_by uuid
)
```

Every feature below plugs into this one table and one accept/reject UI. Rejections are labelled training signal, for free.

### 14.3 Feature backlog, ranked by value ÷ effort

**Build first**

| Feature | How | Why it earns its place |
|---|---|---|
| **Natural-language entry** | `SplitInput` zod schema handed to the model as a tool definition; result rendered into the normal form for confirmation | Highest ratio on the list — the contract already *is* the tool schema. Doubles as a command palette. |
| **Duplicate detection** | Same group, similar amount, ≤10 min apart, fuzzy description match | Double-entry is the most common real annoyance in this product category. Not ML, high value. |
| **Split memory** | History lookup: "you usually split Rent 40/30/30 with these three" → prefill | Near-zero cost, feels smarter than anything else here. |
| **Recurring detection** | Periodicity over (description, amount, day-of-month ±2) | Explainable, no black box, genuinely useful. Feeds `recurring_expenses`. |
| **Smart categorization** | Merchant dictionary + rules → embeddings + kNN over the group's own history | Learns that this group's "Chai" is Food. The feedback loop makes it real ML, not a wrapper. |

**Later, if wanted**

- **Semantic expense search** — pgvector over descriptions, notes and comments. "What did we spend on that beach thing."
- **Trip burn-rate forecasting** — "at this pace Thailand lands at ₹1.4L, 12% over budget."
- **Fair-payer suggestion** — suggest whoever is currently most owed should pay next, to minimize future settlements.

**Explicitly out of scope**

- Training a custom OCR model. It is 2026; don't.
- SMS / UPI transaction parsing — not possible from a web app.
- Trust or fraud scoring — creepy, and there is no data to support it.

---

## Appendix A — First three prompts for Claude Code

**Phase 0**
> Read docs/ARCHITECTURE.md. Execute Phase 0 only. Commit the current working tree to a branch first, then do the hygiene items one commit each. Do not touch anything outside Phase 0's list. Report the exit criteria at the end.

**Phase 1**
> Phase 0 is complete. Execute Phase 1 from docs/ARCHITECTURE.md: pnpm workspace, CRA→Vite, Jest→Vitest, TypeScript with allowJs, Tailwind v4, Tauri config fixes, CI. Work in that order, one commit per step, verifying the app still runs after each. The UI must look and behave identically when you're done — if something breaks visually, stop and tell me rather than redesigning it.

**Phase 2**
> Execute Phase 2: build packages/core exactly as specified in ARCHITECTURE.md §4. Start with money.ts and its tests, then the allocator, then each split strategy, then balances, then simplifyDebts. Test-first throughout, including fast-check property tests for every invariant in §4.3 and §4.5. Do not touch apps/web until core is at 100% branch coverage. Then write docs/DOMAIN.md with worked examples.
