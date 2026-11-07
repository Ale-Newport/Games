# #102 Mini Sudoku 4×4 — Game Specification

## Ruleset (`sudoku-4x4-mini`)

- A 4×4 grid of four 2×2 boxes; fill it so every row, column and box holds 1–4 exactly once.
- Every puzzle has exactly one solution (checked by the exact solver while clues are removed).
- Meant as a first sudoku for children and beginners; the full sudoku toolkit (notes, hints that
  explain, undo) is the same as Classic Sudoku's.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty): a
random complete grid, then clues removed while the solution stays unique. On a 4×4 grid every
puzzle falls to singles (level 1), so the difficulty is the number of clues; four is the fewest
any 4×4 sudoku can have.

| Difficulty | Clues | Measured over 200 seeds: clues (avg) | Generation | Techniques seen |
| ---------- | ----- | ------------------------------------ | ---------- | --------------- |
| Easy       | 8     | 8 (8.0)                              | < 1 ms     | naked singles   |
| Medium     | 6     | 6 (6.0)                              | < 1 ms     | naked singles   |
| Hard       | 4–5   | 4–5 (4.3)                            | < 1 ms     | naked singles   |

## Modes

New puzzle or today's puzzle at any difficulty (saved after every move, resumable) and watching
the technique solver place one digit at a time with its reason. Statistics key: the difficulty; a
solve is a completion with its time (best time kept).

## Play features

As Classic Sudoku (shared table): pencil marks in a 2×2 mini-grid, automatic note cleaning,
undo/redo, repeated digits marked, optional "Show mistakes", number pad with copies left,
highlights, clock with pause, and hints that explain the next placement and fill it in on request.

## Computer players

| Agent    | Play                                                        | Solved (200 puzzles per difficulty) | Time per puzzle |
| -------- | ----------------------------------------------------------- | ----------------------------------- | --------------- |
| `random` | Any digit consistent with the placed ones.                  | Easy 38%, Medium 23%, Hard 8%       | < 0.1 ms        |
| `logic`  | The technique solver (next logical placement).              | 100%                                | < 0.1 ms        |
| `solver` | Exact propagation + backtracking search (the exact oracle). | 100%                                | < 0.1 ms        |

## States and actions

Shared `SudokuState` (see Classic Sudoku): puzzle, solution, values, notes, undo/redo, mistakes,
hints, elapsed time, solved; validated by shape, ranges, givens and the solver. Environment
actions: `cell:digit`.

## Achievements

| id        | Condition                                                 |
| --------- | --------------------------------------------------------- |
| `first`   | Solve a mini sudoku.                                      |
| `clean`   | Solve without a mistake or a hint.                        |
| `speed`   | Solve a Hard mini sudoku in under a minute without hints. |
| `hardest` | Solve a Hard mini sudoku.                                 |
| `daily`   | Solve today's puzzle.                                     |

## Controls

Tap a cell, then a digit on the pad. Keyboard: arrows move, 1–4 place (again to remove),
Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

The shared paper-like grid (big digits on the small board), thick box borders, givens bold,
entries in the accent colour, mistakes in red, hint cells tinted; soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `sudoku-4x4` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Every difficulty unique and within its clue count (Easy > Medium > Hard), both solvers finishing a
Hard puzzle, the stuck ending, the contract suite; UI: notes, digits, undo, a hint, solving
through hints with the result recorded, pausing; E2E desktop + mobile. The shared core has its
own tests (see Classic Sudoku).
