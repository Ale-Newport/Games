# #122 Royal Regions (Queens) — Game Specification

The colored-regions queens puzzle (one-star "star battle" family) under its own name, with
generated puzzles, its own palette and texts.

## Ruleset (`queens-regions`)

An n×n grid split into n connected colored regions. Place n queens: exactly one in every row,
every column and every region, and no two queens touching (diagonals included). Every puzzle has
exactly one solution.

## Generator

From the seed: a queen layout (one per row and column, no two in consecutive rows adjacent), then
regions grown at random around the queens (one region per queen). While a second solution exists,
one of its queens that is not part of the intended layout moves its cell into a neighbouring region
(regions stay connected and the intended queens never move), up to 120 changes. The puzzle is kept
when the solution is unique and the technique solver reaches it, using the level's hardest
technique (otherwise up to 4000 attempts, with an easier fallback).

| Level | Grid  | Techniques        | Generation (avg / max) | Technique steps |
| ----- | ----- | ----------------- | ---------------------- | --------------- |
| 6×6   | 6×6   | singles, confined | 2.4 / 13 ms            | 12.7            |
| 8×8   | 8×8   | + groups          | 24 / 123 ms            | 18.2            |
| 9×9   | 9×9   | + attack          | 14 / 92 ms             | 24.0            |
| 10×10 | 10×10 | all               | 83 / 338 ms            | 26.8            |

## Techniques (`nextStep`)

1. **Single** — crosses implied by a queen (its row, column, region, neighbours); a row, column or
   region with one free cell gets its queen.
2. **Confined** — a region whose free cells lie in one row/column claims it (other cells there are
   crossed); a row/column whose free cells lie in one region claims that region.
3. **Group** — k regions whose free cells lie within k rows/columns claim them; k lines whose free
   cells lie within k regions claim those regions (k = 2–4).
4. **Attack** — a cell whose queen would leave some row, column or region without a free cell is
   crossed.

## Modes, play features, controls

New or daily puzzle, resume, watch the AI. Tap cycles empty → ✕ → queen (or queen-only taps);
dragging crosses every empty cell it passes; optional automatic crosses around a placed queen;
clashing queens shown at once; mistakes counted against the solution; undo/redo; pause; hints that
point at the cells and explain the step (with region color names), or flag wrong marks first;
keyboard: arrows, Space, Q, X, Backspace, U, R, H, P.

## Computer players

| Agent    | Play                                                   | Solved (30 per level)          | Time per puzzle |
| -------- | ------------------------------------------------------ | ------------------------------ | --------------- |
| `random` | Crosses any empty cell or places a non-clashing queen. | 0 / 0 / 0 / 0                  | —               |
| `logic`  | The techniques above, one mark at a time.              | 30 / 30 / 30 / 30, no mistakes | 0.4–3.6 ms      |
| `solver` | Exact backtracking by rows (the oracle).               | all                            | —               |

## States and actions

`QueensState`: level, seed, puzzle, marks (0 empty, 1 ✕, 2 queen), undo/redo, mistakes, hints,
elapsed time, solved. Environment actions `cell:x` / `cell:q` (queens only where they clash with
none); the episode ends solved or stuck. Save validation regenerates the puzzle from the seed.

## Achievements

| id       | Condition                                     |
| -------- | --------------------------------------------- |
| `first`  | Solve a puzzle.                               |
| `clean`  | Solve without mistakes or hints.              |
| `speed`  | Solve an 8×8 in under a minute without hints. |
| `expert` | Solve a 10×10.                                |
| `daily`  | Solve today's puzzle.                         |

## Graphics and audio

Ten pastel region colors (named in hints and labels) with thick region borders, crown icons,
light crosses, red clash outlines, dashed hint outlines. The shared puzzle sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `queens` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when solved.

## Testing criteria

Connected regions, unique solutions equal to the intended layout, non-adjacent layouts, grading per
level, determinism, attacks and clashes, mistakes/undo/redo, a full technique solve, save
validation, the exact solver, the contract suite; UI: tap cycle, clash message, undo, hints to the
end with the result recorded, automatic crosses. E2E desktop + mobile.
