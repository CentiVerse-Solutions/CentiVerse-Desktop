# ADR 0002 — Currency scope

Status: accepted · decided before Phase 2

## Decision

§12 #4 — **per-group single currency for v1.**

A group declares one `currency`; every expense within it uses that currency.

## Consequences

- `Money` carries its `CurrencyCode`, and `add`/`sub`/`sum` assert matching currencies
  rather than converting. A cross-currency operation is a programming error, not a
  runtime conversion — this makes a whole class of bug unrepresentable.
- `computeShares` and both balance functions operate in a single currency, so no
  FX lookup sits on the hot path of the split engine.
- `formatMoney` still needs the per-currency minor-unit exponent table (§4.1):
  INR/USD = 2, JPY = 0, KWD = 3. Single-currency-per-group does not mean
  two-decimals-everywhere.
- The §6.2 schema keeps `original_currency`, `original_total_minor` and `fx_rate` on
  `expenses`, unused for now. Per-expense FX can land later without a migration.

## Not decided

Whether to add per-expense FX at all. Revisit if trip groups with foreign spending
become a real use case; the schema is already shaped for it.
