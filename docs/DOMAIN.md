# CentiVerse — Domain rules

> The money and split rules, with worked examples. Implemented in `packages/core`.
> If this document and the code disagree, the code's tests are the tiebreaker —
> then fix whichever is wrong.

---

## 1. Money

**Money is never a JavaScript number.** It is an integer count of *minor units*
plus a currency:

```ts
money(250000, 'INR')   // ₹2,500.00 — 250000 paise
money(500, 'JPY')      // ¥500       — JPY has no minor unit
money(1234, 'KWD')     // KD1.234    — KWD has three
```

### Why integers

`0.1 + 0.2 === 0.30000000000000004`. A float ledger drifts, and the drift lands
in someone's balance. Integers in minor units are exact to ±9,007,199,254,740,991
— about ₹90 trillion — which is beyond any real group's spending.

### The exponent is per currency

`CURRENCY_EXPONENTS` holds it. **Do not assume 2.**

| Currency | Exponent | 1000 minor units is |
|---|---|---|
| INR, USD, EUR, GBP | 2 | ₹10.00 |
| JPY, KRW, VND | 0 | ¥1,000 |
| KWD, BHD, OMR | 3 | KD1.000 |

### Formatting

`formatMoney(m, locale?)` is the **only** way a Money becomes a string. It takes
a `Money`, never a number, so an amount cannot be rendered without its currency.
That is what makes the old hardcoded-`$` bug *unrepresentable* rather than merely
fixed.

There is deliberately no `toNumber()` returning major units. Only `toMinor()`.

### Parsing rejects rather than guesses

```ts
parseMoney('1,234.56', 'INR')   // ok    → 123456
parseMoney('₹1,234.56', 'INR')  // ok    → 123456
parseMoney('.50', 'INR')        // ok    → 50
parseMoney('12.345', 'INR')     // error → TOO_MANY_DECIMALS (INR has 2)
parseMoney('1.5', 'JPY')        // error → TOO_MANY_DECIMALS (JPY has 0)
parseMoney('1.2.3', 'INR')      // error → AMBIGUOUS_SEPARATORS
parseMoney('1e999', 'INR')      // error → NOT_A_NUMBER
```

That last one matters. An early implementation stripped every non-numeric
character, turning `1e999` into `1999` and quietly inventing ₹19.99. **A parser
that guesses is worse than one that fails.**

### Currencies never mix

Per [ADR 0002](adr/0002-currency-scope.md), a group has one currency and every
expense in it uses that currency. `add`, `sub` and `compareMoney` **throw** on a
mismatch — it is a programming error, not a conversion request.

### Errors vs exceptions

- **Throws** for programmer errors: a non-integer minor unit, mixing currencies.
  These should crash a test, not surface in a UI.
- **Returns `Result`** for anything a user can cause: percentages that don't add
  up, shares that don't sum, an unreconciled receipt. The UI must render these.

---

## 2. The remainder problem

**Split ₹100 three ways.** 10000 paise ÷ 3 = 3333.33… Round each share
independently and you get 3333 × 3 = 9999. **One paisa vanishes.**

Do that a few hundred times across a group and balances never settle to zero.
Users notice; Splitwise's forums are full of it.

### Largest remainder, deterministic tie-break

```
1. exact rational share per participant
2. floor in minor units
3. remainder = total − sum(floors)        // 0 ≤ remainder < participants
4. rank by fractional part DESC, then userId ASC
5. +1 minor unit to the first `remainder` participants
```

Worked, for ₹100 between alice, bob and carol:

| | exact | floor | fraction |
|---|---|---|---|
| alice | 3333.33 | 3333 | .33 |
| bob | 3333.33 | 3333 | .33 |
| carol | 3333.33 | 3333 | .33 |

`remainder = 10000 − 9999 = 1`. All three fractions tie, so **userId ASC**
decides: alice gets the extra paisa.

```
alice 3334 + bob 3333 + carol 3333 = 10000 ✓
```

### Why the userId tie-break is not cosmetic

Without it, the winner depends on array order, which depends on whatever the
caller happened to pass. The client would compute one answer and the server
another, differing by a paisa. Optimistic updates would flicker and correct;
you would chase phantom bugs.

With it, the client, the API and a nightly recompute produce **byte-identical**
shares (invariant 4). That is what lets the optimistic UI insert a locally
computed expense and never need to reconcile it.

---

## 3. Split strategies

All five run through `computeShares(input)`. **Nothing else in the system
computes a share** (non-negotiable 2).

Every expense carries `payers` — an array, from day one. The v1 UI offers a
single payer, but "Priya and I split the hotel deposit" needs no migration.

### EQUAL

```ts
{ kind: 'EQUAL', participants: ['alice', 'bob', 'carol'] }
```
Even split, remainder per §2.

### EXACT

```ts
{ kind: 'EXACT', shares: [
    { userId: 'alice', amount: money(6000, 'INR') },
    { userId: 'bob',   amount: money(4000, 'INR') },
] }
```
Used verbatim. Rejected with `SHARES_DO_NOT_SUM` if they don't total the expense.

### PERCENT — integer basis points

```ts
{ kind: 'PERCENT', shares: [
    { userId: 'alice', bps: 3333 },   // 33.33%
    { userId: 'bob',   bps: 3333 },
    { userId: 'carol', bps: 3334 },
] }
```
**Basis points, never floats.** 33.33% is `3333`. Must total exactly `10000`.
Three-way percentage splits are the classic source of a stray paisa; integers
plus the §2 allocator remove it.

### SHARES — integer weights

```ts
{ kind: 'SHARES', shares: [
    { userId: 'alice', weight: 1 },
    { userId: 'bob',   weight: 2 },   // bob had the double room
] }
```

### ADJUSTMENT

```ts
{ kind: 'ADJUSTMENT',
  participants: ['alice', 'bob'],
  adjustments: [{ userId: 'bob', delta: money(2000, 'INR') }] }
```

Bob's ₹20 dessert comes off the top; the rest splits evenly. On a ₹100 bill:

```
10000 − 2000 = 8000, split two ways = 4000 each
alice 4000, bob 4000 + 2000 = 6000        → 10000 ✓
```

**This is the only strategy allowed to produce a negative share.** A large
enough delta on one person credits the others, which is correct: if bob's
adjustment exceeds the bill, alice is owed money.

### ITEMIZED

Delegates to `apportionAncillary` (§5) so there is exactly one implementation of
per-item allocation.

---

## 4. Balances are derived

**Truth is the ledger.** `balance_cache` in the schema is a cache; a nightly job
recomputes from scratch and alerts on any difference. A test that reads the cache
as truth is a broken test.

Sign convention: **positive means you are owed money.**

### Derivation

For each expense: every payer is credited what they paid, every participant is
debited their share. A settlement moves the payer toward zero and the payee away
from it. Both are sign-symmetric, so **net balances always sum to exactly zero**
(invariant 2).

### `netBalances` — worked

Alice pays a ₹30 dinner, split evenly three ways:

```
alice  +3000 (paid) − 1000 (share) = +2000
bob                 − 1000         = −1000
carol               − 1000         = −1000
                                     ------
                                          0 ✓
```

### `pairwiseBalances` — who owes whom

The same dinner:

```
bob:alice   1000
carol:alice 1000
```

Keys are `debtor:creditor`, amounts always positive. Opposing debts between the
same pair net into one edge; edges that reach zero disappear. A payer who also
participated never owes themselves.

**Multiple payers:** each participant's share is apportioned across the payers
pro-rata to what each paid, using the same §2 allocator. If carol owes ₹10 on a
bill where alice paid ₹7.50 and bob ₹2.50:

```
carol:alice 750
carol:bob   250
```

### Why keep pairwise at all

Net position answers "am I up or down". Pairwise answers "why do I owe *you*" —
which is the question people actually argue about, and the one a settlement
screen has to be able to justify.

---

## 5. Itemization and receipts

A restaurant bill is never just line items. `apportionAncillary` handles the
rest, and it is the domain half of the Phase 8 receipt/claim flow.

1. **Each item splits evenly among its claimants**, per item, via the §2
   allocator — so per-item rounding is deterministic and order-independent.
2. **Unclaimed items** resolve by policy before anything else:
   - `BLOCK` — refuse to compute (the default; make a human decide)
   - `SPLIT_EQUALLY` — spread across everyone who claimed something
   - `ASSIGN_TO_PAYER` — the payer eats it
3. **Tax, service charge, tip and discount** apportion **pro-rata by claimed
   subtotal**, then remainder-allocated so the pieces sum exactly. Discount is
   negative.
4. **Reconciliation is mandatory.** Items + extras must equal the printed total
   within **one minor unit**. Outside that, the itemization is rejected and the
   user corrects it.

Worked — alice's ₹300 biryani, bob's ₹100 naan, ₹40 tax:

```
subtotal  40000   alice 30000 (75%), bob 10000 (25%)
tax        4000   alice  3000 (75%), bob  1000 (25%)
                  ---------------------------------
                  alice 33000, bob 11000  = 44000 ✓ matches printed total
```

**An extracted receipt is never trusted.** OCR misreads a digit and the ledger
would silently absorb it; reconciliation is what stops that.

---

## 6. Settlement suggestions

`simplifyDebts(net)` is greedy min-cash-flow: repeatedly match the largest
creditor with the largest debtor. It reduces up to N² edges to at most N−1
transfers.

**It is display-only (invariant 9).** Writing a simplified transfer into the
ledger as though it were a real payment destroys the audit trail — *"why do I owe
Vikram? I never ate with Vikram"* is the support ticket that follows. When a user
acts on a suggestion, record a real settlement between the two actual parties.

Simplification is opt-in per group (`groups.simplify_debts`), because for some
groups the pairwise detail is the entire point.

---

## 7. Invariants

Enforced in the domain, in property tests, and (from Phase 5) by database
constraints.

1. `sum(shares) === total` and `sum(payers) === total`, for every strategy and
   every input.
2. For any group, `sum(netBalances)` is exactly zero.
3. Money never touches a float — not in TS, not in JSON, not in Postgres.
4. The same split input produces byte-identical output on client, server and in
   any recompute job.
5. `simplifyDebts` output is never persisted as a settlement.
6. `packages/core` has zero runtime dependencies.

### How they are tested

- **Unit tests** for each strategy, including the degenerate cases: one
  participant, zero amount, a negative adjustment exceeding the base share, a
  duplicated participant, percentages not summing to 10000.
- **Property tests** (`fast-check`) for conservation, non-negativity,
  determinism, and that `simplifyDebts` preserves every net position.
- **Golden files** — realistic group histories with hand-verified balances in
  `packages/core/test/fixtures/`.

That last category is not redundant. While writing the Thailand fixture, the
hand-computed expectations were **wrong** — and because the wrong numbers still
summed to zero, the conservation property test passed on them. Only the golden
file caught it. Properties prove the total is conserved; golden files prove the
numbers are the *right* ones.

### One documented coverage exception

`computeShares` ends with a `sum(shares) === total` assertion — the first of
§4.3's "enforce it three times". It is unreachable by construction: every
strategy either allocates through the conserving allocator or validates its own
sum. It is excluded from coverage with `/* v8 ignore */` because reaching it
requires a bug, not an input. It stays because it is the last line of defence
before a wrong number reaches someone's balance.
