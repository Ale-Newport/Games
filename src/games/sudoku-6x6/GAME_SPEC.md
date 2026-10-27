# #103 Sudoku 6×6 — Game Specification

## Ruleset (`sudoku-6x6-2x3`)

- A 6×6 grid of six 2×3 boxes (two rows by three columns); fill it so every row, column and box
  holds 1–6 exactly once.
- Every puzzle has exactly one solution (checked by the exact solver while clues are removed).

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty): a
random complete grid, then clues removed while the solution stays unique and the techniques needed
stay within the difficulty's levels; a puzzle outside the wanted level is retried (up to 40 grids,
500 for Hard, where only about one grid in fifty ends above singles).

Technique levels as in Classic Sudoku: 1 singles; 2 locked candidates and pairs; 3 triples,
X-Wing, Y-Wing, Swordfish.

| Difficulty | Level | Clues | Measured over 200 seeds: clues (avg) | Generation (avg / max) | Levels and techniques seen                                                               |
| ---------- | ----- | ----- | ------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------- |
| Easy       | 1     | 14    | 14 (14.0)                            | 0.3 / 3 ms             | all level 1; hidden singles in 9                                                         |
| Medium     | 1     | 9–12  | 9–12 (10.1)                          | 0.5 / 1 ms             | all level 1; hidden singles in 69                                                        |
| Hard       | 2–3   | 8–12  | 8–12 (10.1)                          | 26 / 126 ms            | 43 level 2, 157 level 3: Y-Wing 157, box–line 137, X-Wing 38, naked pair 32, Swordfish 3 |

## Modes

New puzzle or today's puzzle at any difficulty (saved after every move, resumable) and watching
the technique solver place one digit at a time with its reason. Statistics key: the difficulty; a
solve is a completion with its time (best time kept).

## Play features

As Classic Sudoku (shared table): pencil marks in a 3×2 mini-grid, automatic note cleaning,
undo/redo, repeated digits marked, optional "Show mistakes", number pad with copies left,
highlights, clock with pause, and hints that explain the next placement (with the techniques
needed first) and fill it in on request.

## Computer players

| Agent    | Play                                                        | Solved (200 puzzles per difficulty) | Time per puzzle |
| -------- | ----------------------------------------------------------- | ----------------------------------- | --------------- |
| `random` | Any digit consistent with the placed ones.                  | Easy 1%, Medium 0%, Hard 0%         | < 0.1 ms        |
| `logic`  | The technique solver (next logical placement).              | 100%                                | 0.1–0.3 ms      |
| `solver` | Exact propagation + backtracking search (the exact oracle). | 100%                                | 0.2–0.4 ms      |

## States and actions

Shared `SudokuState` (see Classic Sudoku); environment actions `cell:digit`.

## Achievements

| id        | Condition                                                   |
| --------- | ----------------------------------------------------------- |
| `first`   | Solve a 6×6 sudoku.                                         |
| `clean`   | Solve without a mistake or a hint.                          |
| `speed`   | Solve a Medium 6×6 sudoku in under 3 minutes without hints. |
| `hardest` | Solve a Hard 6×6 sudoku.                                    |
| `daily`   | Solve today's puzzle.                                       |

## Controls

Tap a cell, then a digit on the pad. Keyboard: arrows move, 1–6 place (again to remove),
Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

The shared paper-like grid with the rectangular box borders, givens bold, entries in the accent
colour, mistakes in red, hint cells tinted; soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `sudoku-6x6` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Every difficulty unique, at its levels and within its clue range, both solvers finishing a Hard
puzzle, the stuck ending, the contract suite; UI: notes, digits, undo, a hint, solving through
hints with the result recorded, pausing; E2E desktop + mobile.
