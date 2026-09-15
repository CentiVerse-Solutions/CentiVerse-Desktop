# ADR 0003 — ThemeContext is exempt from the 300-line rule until Phase 7

Status: accepted · Phase 4

## Context

Non-negotiable 8 says no component file may exceed 300 lines. At the end of
Phase 4 exactly one file still does: `context/ThemeContext.jsx`, at 346 lines.

## Decision

Leave it. Do not decompose it in Phase 4.

## Why

Roughly 250 of those lines are the MUI `createTheme` palette and component
overrides — `MuiCard`, `MuiChip`, `MuiButton`, `MuiOutlinedInput` and friends.
They exist only to configure MUI.

§7.5 is explicit about where that goes:

> `ThemeContext.js` stays — reduce it to toggling a `data-theme` attribute and
> persisting the choice; the tokens do the rest.

and it sequences that reduction with removing MUI, which is Phase 7 work
(§12 #8: ban new imports in Phase 1, delete the packages in Phase 7).

Splitting the palette into its own module now would produce a file that Phase 7
deletes outright. That is churn, not decomposition, and it would make the real
change harder to review by burying it in a rename.

## Consequence

Phase 4 exits with one known, deliberate exception to non-negotiable 8, recorded
here rather than left as an unexplained miss. Phase 7 closes it: when MUI goes,
`ThemeContext` becomes a few dozen lines that set `data-theme` and persist it.

Every other component in `apps/web` is under 300 lines.
