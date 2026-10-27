# #105 X-Sudoku — Game Specification

## Ruleset (`x-sudoku-9x9-diagonals`)

- Classic 9×9 sudoku with 3×3 boxes plus the two main diagonals: every row, column, box and both
  diagonals hold 1–9 exactly once (the centre cell lies on both diagonals; 17 cells are diagonal).
- Every puzzle has exactly one solution (checked by the exact solver, which treats the diagonals as
  units, while clues are removed).

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty): a
random complete X-Sudoku grid, then clues removed in centre-symmetric pairs while the solution stays
unique and the techniques needed stay within the difficulty's levels. The diagonals take part in
every technique (singles, locked candidates between a diagonal and a box, subsets).

| Difficulty | Level | Clues | Measured over 100 seeds: clues (avg) | Generation (avg / max) | Techniques seen                                                                                    |
| ---------- | ----- | ----- | ------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------- |
| Easy       | 1     | 32    | 32                                   | 1.2 / 7 ms             | naked singles, hidden singles (28)                                                                 |
| Medium     | 1     | 22–28 | 22–28 (23.1)                         | 6.6 / 17 ms            | naked singles, hidden singles (98)                                                                 |
| Hard       | 2     | 20–28 | 20–25 (21.9)                         | 15 / 48 ms             | box–line (100), pointing (45), naked pair (22), hidden pair (15)                                   |
| Expert     | 3     | 20–28 | 20–27 (22.6)                         | 53 / 349 ms            | Y-Wing (85), X-Wing (19), naked triple (14), hidden triple (5), Swordfish (1) and the level-2 ones |

All 400 measured puzzles graded exactly at their difficulty's level. The extra units let X-Sudoku
puzzles use fewer clues than classic ones at the same level.

## Modes

New puzzle or today's puzzle at any difficulty (saved after every move, resumable) and watching
the technique solver place one digit at a time with its reason. Statistics key: the difficulty; a
solve is a completion with its time.

## Play features

As Classic Sudoku (shared table), with the diagonal cells tinted and two dashed lines drawn corner
to corner. Repeated digits on a diagonal count as conflicts; a placed digit also leaves the notes of
its diagonal peers; hints can say "In this diagonal, 4 fits only in R2C8".

## Computer players

| Agent    | Play                                                        | Solved (100 puzzles per difficulty) | Time per puzzle |
| -------- | ----------------------------------------------------------- | ----------------------------------- | --------------- |
| `random` | Any digit consistent with the placed ones.                  | 0%                                  | 0.1–0.2 ms      |
| `logic`  | The technique solver (next logical placement).              | 100%                                | 0.7–1.9 ms      |
| `solver` | Exact propagation + backtracking search (the exact oracle). | 100%                                | 1.4–2.0 ms      |

## States and actions

Shared `SudokuState` (see Classic Sudoku); environment actions `cell:digit`, legal only when the
digit is absent from the cell's row, column, box and diagonals.

## Achievements

| id        | Condition                                                  |
| --------- | ---------------------------------------------------------- |
| `first`   | Solve an X-Sudoku.                                         |
| `clean`   | Solve without a mistake or a hint.                         |
| `speed`   | Solve a Medium X-Sudoku in under 10 minutes without hints. |
| `hardest` | Solve an Expert X-Sudoku.                                  |
| `daily`   | Solve today's puzzle.                                      |

## Controls

Tap a cell, then a digit on the pad. Keyboard: arrows move, 1–9 place (again to remove),
Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

The shared paper-like grid; diagonal cells tinted amber (layered under the selection and hint
highlights) with dashed diagonal lines; soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `x-sudoku` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Every difficulty unique, at its level and within its clue range, solutions valid on both
diagonals, 17 diagonal cells, both solvers finishing Expert, the stuck ending, the contract suite;
UI: notes, digits, undo, a hint, solving through hints with the result recorded, pausing; E2E
desktop + mobile.
