# #101 Classic Sudoku 9×9 — Game Specification

## Ruleset (`sudoku-9x9-classic`)

- A 9×9 grid of nine 3×3 boxes; fill it so every row, column and box holds 1–9 exactly once.
- Every puzzle has exactly one solution (checked by the exact solver while clues are removed).

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty):
a random complete grid, then clues removed in pairs symmetric through the centre while the
solution stays unique and the techniques needed stay within the difficulty's levels; a puzzle
outside the wanted level is retried (up to 40 grids, 150 for Expert).

Technique levels (`../shared/sudoku/logic.ts`): 1 naked and hidden singles; 2 locked candidates
(pointing, box–line reduction), naked and hidden pairs; 3 naked and hidden triples, X-Wing,
Y-Wing, Swordfish.

| Difficulty | Level | Clues | Measured over 100 seeds: clues (avg) | Generation (avg / max) | Techniques seen                                                                      |
| ---------- | ----- | ----- | ------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------ |
| Easy       | 1     | 36–40 | 36–37 (36.1)                         | 1.1 / 8 ms             | naked singles (all), hidden singles (16)                                             |
| Medium     | 1     | 26–32 | 26–32 (28.1)                         | 2.7 / 9 ms             | naked singles, hidden singles (92)                                                   |
| Hard       | 2     | 22–32 | 24–32 (27.4)                         | 22 / 104 ms            | box–line (95), naked pair (18), pointing (17), hidden pair (16)                      |
| Expert     | 3     | 20–32 | 24–31 (27.8)                         | 53 / 321 ms            | Y-Wing (95), X-Wing (25), naked triple (5), Swordfish (3), hidden triple (2) + below |

All 400 measured puzzles graded exactly at their difficulty's level.

## Modes

New puzzle or today's puzzle at any difficulty (saved after every move, with the clock, resumable)
and watching the technique solver place one digit at a time with its reason. Statistics key: the
difficulty; a solve is a completion with its time (best time kept).

## Play features

Pencil marks (Notes mode or Shift+digit; "Fill notes" fills every candidate), automatic removal of
a placed digit from its peers' notes, undo/redo (500 moves), repeated digits always marked and,
with "Show mistakes", digits that differ from the solution (counted as mistakes), number pad with
the copies left, highlighted row/column/box and same digits, a clock that pauses (hiding the
board) and stops while the page is hidden.

Hints: wrong digits are pointed out first; otherwise the technique solver finds the next
placement and explains it ("R6C2 can only be 3…", "In this box, 7 fits only in R5C6"), naming
the techniques needed first (e.g. "First: box–line reduction, hidden pair, Y-Wing."), highlights
the cells involved, and fills it in on request (counted as a hint).

## Computer players

| Agent    | Play                                                                                                   | Solved (100 puzzles per difficulty) | Time per puzzle |
| -------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------- | --------------- |
| `random` | Any digit consistent with the placed ones.                                                             | 0% at every difficulty              | 0.1–0.2 ms      |
| `logic`  | The technique solver: the next logical placement; when stuck, the fewest-candidate cell's first digit. | 100% at every difficulty            | 0.5–1.3 ms      |
| `solver` | Exact propagation + backtracking search (the exact oracle).                                            | 100% at every difficulty            | 1.1–1.6 ms      |

## States and actions

`SudokuState` = `difficulty`, `seed`, `puzzle`, `solution`, `values`, `notes` (digit masks),
`undo`/`redo` (changed cells with their previous values and notes), `mistakes`, `hints`,
`elapsedMs`, `solved`. Save validation: shapes and ranges, givens kept, and the solver confirming
the puzzle has exactly the stored solution. Environment actions: `cell:digit` (digits consistent
with the placed ones).

## Achievements

| id        | Condition                                            |
| --------- | ---------------------------------------------------- |
| `first`   | Solve a sudoku.                                      |
| `clean`   | Solve without a mistake or a hint.                   |
| `speed`   | Solve a Medium sudoku in under 10 minutes, no hints. |
| `hardest` | Solve an Expert sudoku.                              |
| `daily`   | Solve today's puzzle.                                |

## Controls

Tap a cell, then a digit on the pad. Keyboard: arrows move, 1–9 place (again to remove),
Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

A paper-like grid themed for light and dark, thick box borders, givens bold, entries in the accent
colour, mistakes in red, pencil marks in a 3×3 mini-grid with the selected digit emphasised, the
hint's cells tinted. Soft synthesized pencil, erase, mistake, completed-unit and solved sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `sudoku-9x9` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck (an empty cell with
no candidate); score = correct digits placed. Exact oracle: `solver`.

## Testing criteria

Shared core: geometry, candidates and conflicts, solving and uniqueness, random grids, graded and
symmetric generation, deterministic seeds, every technique step consistent with the solution,
play (notes, auto-cleaning, undo/redo, mistakes, erase, givens locked, solving) and save
validation. Game: every difficulty at its level and clue range, both solvers finishing Expert,
the stuck ending, the contract suite. UI: notes, digits, undo, a hint, solving through hints with
the result recorded, pausing. E2E desktop + mobile.
