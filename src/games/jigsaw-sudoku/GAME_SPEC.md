# #107 Jigsaw Sudoku — Game Specification

## Ruleset (`jigsaw-sudoku-9x9`)

- A 9×9 grid split into nine irregular regions of nine orthogonally connected cells; every row,
  column and region holds 1–9 exactly once.
- Every puzzle has its own regions and exactly one solution.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty):

1. Regions: the standard 3×3 boxes reshaped by 120 random swaps of two boundary cells between
   neighbouring regions, each kept only if both regions stay connected (sizes never change).
2. A random complete grid for those regions (new regions are drawn in the rare case none fits).
3. Clues removed while the solution stays unique and the techniques needed stay within the
   difficulty's level; a puzzle outside it is retried (40 grids, 80 for Hard, 200 for Expert).

The technique solver treats the regions as boxes, so every technique (locked candidates between a
region and a line included) works on the irregular shapes.

| Difficulty | Level | Clues | Measured over 50 seeds: clues | Generation (avg / max) | Techniques seen                                                                                         |
| ---------- | ----- | ----- | ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Easy       | 1     | 36    | 36                            | 47 / 606 ms            | naked singles, hidden singles (10)                                                                      |
| Medium     | 1     | 26–32 | 26                            | 47 / 608 ms            | naked and hidden singles                                                                                |
| Hard       | 2     | 22–32 | 22                            | 53 / 610 ms            | box–line (50), pointing (18), hidden pair (5), naked pair (4)                                           |
| Expert     | 3     | 20–32 | 20–21                         | 127 / 694 ms           | Y-Wing (27), X-Wing (26), naked triple (7), Swordfish (7), hidden triple (2) and the level-2 techniques |

Irregular regions constrain more than boxes: every measured puzzle reached its difficulty's minimum
clue count. The occasional slow puzzle (~0.6 s) is a region layout that needed redrawing.

## Modes

New puzzle or today's puzzle at any difficulty (saved after every move with its regions, resumable)
and watching the technique solver place one digit at a time with its reason. Statistics key: the
difficulty; a solve is a completion with its time.

## Play features

As Classic Sudoku (shared table), with the regions drawn by thick borders and tinted in up to four
colours so that touching regions differ (tints layered under the highlights). Peers, conflicts,
note cleaning and hints all follow the puzzle's regions.

## Computer players

| Agent    | Play                                                        | Solved (50 puzzles per difficulty) | Time per puzzle |
| -------- | ----------------------------------------------------------- | ---------------------------------- | --------------- |
| `random` | Any digit consistent with the placed ones.                  | 0%                                 | 0.1–0.3 ms      |
| `logic`  | The technique solver (next logical placement).              | 100%                               | 0.7–2.8 ms      |
| `solver` | Exact propagation + backtracking search (the exact oracle). | 100%                               | 1.2–2.5 ms      |

## States and actions

Shared `SudokuState` plus `regions` (a region per cell). Save validation adds: nine regions of nine
cells, each connected, and the solver confirming the unique solution under them. Environment
actions `cell:digit`.

## Achievements

| id        | Condition                                                       |
| --------- | --------------------------------------------------------------- |
| `first`   | Solve a jigsaw sudoku.                                          |
| `clean`   | Solve without a mistake or a hint.                              |
| `speed`   | Solve a Medium jigsaw sudoku in under 10 minutes without hints. |
| `hardest` | Solve an Expert jigsaw sudoku.                                  |
| `daily`   | Solve today's puzzle.                                           |

## Controls

Tap a cell, then a digit on the pad. Keyboard: arrows move, 1–9 place (again to remove),
Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

The shared paper-like grid with bold region borders and four soft region tints (accent, amber,
green, violet); soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `jigsaw-sudoku` v`1.0.0`: kind `puzzle`, one seat,
config `{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Fresh connected regions of nine (different from the boxes and between seeds), every difficulty
unique and at its level, saves valid and disconnected regions rejected, both solvers finishing
Expert, the stuck ending, the contract suite; UI: notes, digits, undo, a hint, solving through
hints with the result recorded, pausing; E2E desktop + mobile.
