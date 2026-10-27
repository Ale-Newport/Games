# #109 Calcudoku — Game Specification

An original arithmetic-cage puzzle in the style of KenKen (a trademark); only the generic name
"Calcudoku" is used, with original rules text and art.

## Ruleset (`calcudoku-4to7`)

- An N×N **Latin square** (N = 4, 5, 6 or 7 by difficulty): every row and column holds 1–N once;
  there are no boxes.
- The grid is partitioned into connected **cages**, each with a target and an operation: the sum
  (+), the product (×), or — for two cells only — the difference (−) or quotient (÷) of the larger
  by the smaller. A one-cell cage states its digit. Digits may repeat inside a cage when the cells
  share neither row nor column. No digits are given.
- Every puzzle has exactly one solution.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty):

1. A random Latin square.
2. Cages grown at random (2 to 3 or 4 cells), each given an operation: pairs prefer ÷ when it
   divides evenly, then −, +, ×; larger cages + or ×.
3. While the exact solver (with a propagator over each cage's valid digit tuples) finds a second
   solution or gives up, the cage holding a differing cell either gets a new operation (60%) or is
   split there into connected pieces.
4. The puzzle must be solvable by the technique solver within the difficulty's levels; among up to
   60 candidates the one with the fewest one-cell cages is kept.

Techniques: level 1 singles and **cage arithmetic** (remove the digits no tuple of the cage allows,
given its cells' candidates — e.g. "3÷" in a pair leaves only 1 and 3); level 2 pairs and locked
candidates; level 3 triples, X-Wing, Y-Wing, Swordfish.

| Difficulty | Board | Cage sizes | Levels | Measured over 40 seeds: cages (avg) | One-cell cages (avg) | Generation (avg / max) | Levels seen           |
| ---------- | ----- | ---------- | ------ | ----------------------------------- | -------------------- | ---------------------- | --------------------- |
| 4×4        | 4×4   | 2–3        | 1      | 6–8 (6.7)                           | 0.05                 | 2.4 / 9 ms             | all 1                 |
| 5×5        | 5×5   | 2–3        | 1–2    | 9–12 (10.6)                         | 0.10                 | 4.8 / 15 ms            | 32 × 1, 8 × 2         |
| 6×6        | 6×6   | 2–4        | 1–3    | 12–16 (13.5)                        | 0.95                 | 23 / 86 ms             | 19 × 1, 17 × 2, 4 × 3 |
| 7×7        | 7×7   | 2–4        | 2–3    | 15–22 (18.9)                        | 2.05                 | 135 / 360 ms           | 30 × 2, 10 × 3        |

Operations over the 160 puzzles: + 617, × 605, − 420, ÷ 218, one-cell 126.

## Modes

New puzzle or today's puzzle at any size (saved after every move, resumable) and watching the
technique solver place one digit at a time with its reason. Statistics key: the difficulty (size);
a solve is a completion with its time.

## Play features

The shared sudoku table on a Latin square: dashed cage outlines with "target + operation" labels
(e.g. "540×", "4÷"), pencil marks in a 2–4-column mini-grid, automatic note cleaning along rows and
columns, undo/redo, repeated digits marked, "Show mistakes", a full cage that misses its target in
red, a clock with pause, and hints ("First: cage arithmetic. That leaves R1C2 with only 3.").

## Computer players

| Agent    | Play                                                               | Solved (40 puzzles per size) | Time per puzzle |
| -------- | ------------------------------------------------------------------ | ---------------------------- | --------------- |
| `random` | Any digit consistent with the row and column.                      | 0%                           | 0.1–0.3 ms      |
| `logic`  | The technique solver with cage arithmetic (never needed to guess). | 100%                         | 0.1–3.2 ms      |
| `solver` | Tuple propagation + search (the exact oracle).                     | 100%                         | 0.2–2.8 ms      |

## States and actions

Shared `SudokuState` plus `calc` (cells, target, operation); the puzzle is all zeros. Save
validation adds: the cages partition the grid, − and ÷ cages have two cells and one-cell cages are
"=", every target matches the solution, and the solver with the cages confirms the unique solution.
Environment actions `cell:digit`.

## Achievements

| id        | Condition                                                |
| --------- | -------------------------------------------------------- |
| `first`   | Solve a calcudoku.                                       |
| `clean`   | Solve without a mistake or a hint.                       |
| `speed`   | Solve a 6×6 calcudoku in under 10 minutes without hints. |
| `hardest` | Solve a 7×7 calcudoku.                                   |
| `daily`   | Solve today's puzzle.                                    |

## Controls

Tap a cell, then a digit on the pad. Keyboard: arrows move, 1–N place (again to remove),
Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

The shared paper-like grid without box borders, dashed cages with small labels on plates, entries
in the accent colour, mistakes and missed cages in red; the sudoku family's soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `calcudoku` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Every size a Latin square (2N units), no givens, unique, within its levels, targets matching, − and
÷ on pairs, saves valid and wrong targets rejected; cage tuples (quotients, repeats across rows and
columns in an L-shaped cage); missed cages marked; labels; both solvers finishing 7×7; the stuck
ending; the contract suite. UI: notes, digits, undo, a hint, solving through hints with the result
recorded, pausing. E2E desktop + mobile.
