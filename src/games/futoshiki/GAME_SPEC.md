# #110 Futoshiki — Game Specification

## Ruleset (`futoshiki-4to7`)

- An N×N **Latin square** (N = 4, 5, 6 or 7 by difficulty): every row and column holds 1–N once.
- Some pairs of orthogonal neighbours carry an inequality sign; its point faces the smaller digit.
- A few digits may be given. Every puzzle has exactly one solution.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty): a
random Latin square; signs on a share of the neighbour pairs (35% / 30% / 25% / 22%), oriented by the
solution; then givens removed in random order while the solution stays unique (exact solver with an
inequality propagator) and the technique solver stays within the difficulty's levels. A candidate
outside the levels is retried with a new square and new signs (40 / 40 / 60 / 120 tries).

Techniques: level 1 singles and **inequalities** (a cell below a neighbour can be at most that
neighbour's largest candidate minus one, a cell above at least its smallest plus one); level 2 pairs
and locked candidates; level 3 triples, X-Wing, Y-Wing, Swordfish.

| Difficulty | Board | Measured over 40 seeds: signs (avg) | Givens (avg) | Generation (avg / max) | Levels seen           | Techniques seen beyond singles and inequalities                  |
| ---------- | ----- | ----------------------------------- | ------------ | ---------------------- | --------------------- | ---------------------------------------------------------------- |
| 4×4        | 4×4   | 3–14 (8.2)                          | 0–4 (1.9)    | 0.4 / 3 ms             | all 1                 | —                                                                |
| 5×5        | 5×5   | 8–20 (12.3)                         | 1–5 (3.7)    | 0.7 / 1 ms             | 39 × 1, 1 × 2         | naked pair (1)                                                   |
| 6×6        | 6×6   | 9–22 (16.2)                         | 2–10 (6.3)   | 16 / 78 ms             | 1 × 1, 23 × 2, 16 × 3 | naked pair 27, Y-Wing 9, X-Wing 9, hidden pair 5                 |
| 7×7        | 7×7   | 9–28 (18.4)                         | 8–15 (11.4)  | 38 / 164 ms            | all 3                 | X-Wing 21, Y-Wing 18, naked pair 18, naked triple 9, Swordfish 2 |

When no candidate reaches the wanted level in its tries, the hardest one found is kept (one 6×6
puzzle in 40 stayed at level 1).

## Modes

New puzzle or today's puzzle at any size (saved after every move, resumable) and watching the
technique solver place one digit at a time with its reason. Statistics key: the difficulty (size);
a solve is a completion with its time.

## Play features

The shared sudoku table on a Latin square with amber chevrons on the borders between signed
neighbours (red once both digits are placed and break the sign), pencil marks, automatic note
cleaning, undo/redo, repeated digits marked, "Show mistakes", a clock with pause, and hints
("First: inequality signs. In this column, 3 fits only in R3C1.").

## Computer players

| Agent    | Play                                                    | Solved (40 puzzles per size) | Time per puzzle |
| -------- | ------------------------------------------------------- | ---------------------------- | --------------- |
| `random` | Any digit consistent with the row and column.           | 0%                           | ≤ 0.1 ms        |
| `logic`  | The technique solver with inequalities (never guessed). | 100%                         | 0.2–1.1 ms      |
| `solver` | Inequality propagation + search (the exact oracle).     | 100%                         | 0.2–0.9 ms      |

## States and actions

Shared `SudokuState` plus `signs` (`less`, `more` cells). Save validation adds: every sign joins
orthogonal neighbours and holds in the solution, and the solver with the signs confirms the unique
solution. Environment actions `cell:digit`.

## Achievements

| id        | Condition                                               |
| --------- | ------------------------------------------------------- |
| `first`   | Solve a futoshiki.                                      |
| `clean`   | Solve without a mistake or a hint.                      |
| `speed`   | Solve a 6×6 futoshiki in under 8 minutes without hints. |
| `hardest` | Solve a 7×7 futoshiki.                                  |
| `daily`   | Solve today's puzzle.                                   |

## Controls

Tap a cell, then a digit on the pad. Keyboard: arrows move, 1–N place (again to remove),
Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

The shared paper-like grid without box borders, chevrons drawn in SVG on the cell borders; the
sudoku family's soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `futoshiki` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Every size a Latin square with signs true of the solution, unique, within its levels; saves valid
and a flipped sign rejected; a broken sign marked; both solvers finishing 7×7; the stuck ending; the
contract suite. UI: notes, digits, undo, a hint, solving through hints with the result recorded,
pausing. E2E desktop + mobile.
