# #104 Sudoku 16×16 — Game Specification

## Ruleset (`sudoku-16x16-hex`)

- A 16×16 grid of sixteen 4×4 boxes; fill it so every row, column and box holds the sixteen
  symbols exactly once: 1–9 and A–G (A = 10 … G = 16).
- Every puzzle has exactly one solution (checked by the exact solver while clues are removed).

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty): a
random complete grid, then clues removed in centre-symmetric pairs while the solution stays unique
and the techniques needed stay within the difficulty's levels.

On this grid a rare uniqueness check can explode (one measured removal took 58 s before the fix),
so every check runs with a budget of 200 search nodes and a check that runs out keeps the clue:
puzzles stay provably unique and generation stays bounded. The complete grid itself is filled with
a budget too and restarted with fresh choices if it runs out.

| Difficulty | Level | Clues   | Measured over 30 seeds: clues (avg) | Generation (avg / max, Node) | Levels and techniques seen                                                                         |
| ---------- | ----- | ------- | ----------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Easy       | 1     | 130     | 130                                 | 12 / 24 ms                   | all level 1                                                                                        |
| Medium     | 1     | 100–116 | 100–110 (103.7)                     | 225 / 367 ms                 | all level 1, hidden singles in every one                                                           |
| Hard       | 2–3   | 90–116  | 98–110 (102.9)                      | 288 / 456 ms                 | 17 level 2, 13 level 3: box–line 30, pairs 24–18, naked triple 12, Y-Wing 4, X-Wing 2, Swordfish 1 |

In the browser's development build a Hard puzzle took 1.3 s; the menu shows "Building a puzzle…"
meanwhile.

## Modes

New puzzle or today's puzzle at any difficulty (saved after every move with the clock, so a long
puzzle can take several sittings) and watching the technique solver place one symbol at a time
with its reason. Statistics key: the difficulty; a solve is a completion with its time.

## Play features

As Classic Sudoku (shared table): pencil marks in a 4×4 mini-grid, automatic note cleaning,
undo/redo, repeated symbols marked, optional "Show mistakes", a two-row pad of sixteen symbols with
copies left, highlights, clock with pause, and hints that explain the next placement (with the
techniques needed first) and fill it in on request.

## Computer players

| Agent    | Play                                                        | Solved (30 puzzles per difficulty) | Time per puzzle |
| -------- | ----------------------------------------------------------- | ---------------------------------- | --------------- |
| `random` | Any symbol consistent with the placed ones.                 | 0%                                 | 1–2 ms          |
| `logic`  | The technique solver (next logical placement).              | 100%                               | 8–20 ms         |
| `solver` | Exact propagation + backtracking search (the exact oracle). | 100%                               | 16–25 ms        |

## States and actions

Shared `SudokuState` (see Classic Sudoku); environment actions `cell:digit` with digits 1–16.

## Achievements

| id        | Condition                                                     |
| --------- | ------------------------------------------------------------- |
| `first`   | Solve a 16×16 sudoku.                                         |
| `clean`   | Solve without a mistake or a hint.                            |
| `speed`   | Solve an Easy 16×16 sudoku in under 30 minutes without hints. |
| `hardest` | Solve a Hard 16×16 sudoku.                                    |
| `daily`   | Solve today's puzzle.                                         |

## Controls

Tap a cell, then a symbol on the pad. Keyboard: arrows move, 1–9 and A–G place (again to remove),
Shift+symbol or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

The shared paper-like grid with thick 4×4 box borders, givens bold, entries in the accent colour,
mistakes in red, hint cells tinted; soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `sudoku-16x16` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Every difficulty unique, at its levels and within its clue range, both solvers finishing a Hard
puzzle, the stuck ending, the contract suite (fewer playouts: each Hard grid takes ~0.3 s); UI:
notes, symbols (A–G), undo, a hint, solving through hints with the result recorded, pausing; E2E
desktop + mobile. The shared core's tests cover the search budget.
