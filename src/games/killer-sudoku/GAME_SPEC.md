# #106 Killer Sudoku — Game Specification

## Ruleset (`killer-sudoku-9x9`)

- A 9×9 sudoku (rows, columns and 3×3 boxes hold 1–9 once) with **no given digits**. The grid is
  partitioned into cages (dashed outlines, orthogonally connected); each cage shows the sum of its
  digits, and no digit repeats inside a cage. One-cell cages state their digit outright.
- Every puzzle has exactly one solution.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty):

1. A random complete grid.
2. Cages grown at random over it (each to a random size within the difficulty's range, adding
   orthogonal neighbours whose digit is not yet in the cage).
3. The exact solver — with a cage propagator that keeps only digits some valid combination of the
   cage allows — looks for two solutions (4000-node budget). While it finds a second one (or gives
   up), the cage holding a cell where the solutions differ is split there into connected pieces.
4. The puzzle is kept when the technique solver solves it at the difficulty's level, otherwise a new
   grid is tried.

Techniques (`logic.ts` plus `killer.ts`): level 1 singles and **cage combinations** (remove digits no
combination of the cage's sum allows, given its other cells); level 2 locked candidates, pairs and
the **45 rule** — a unit adds up to 45, so with the cages wholly inside it known, a single empty cell
left over (an innie) is forced, and with the cages touching it known, a single empty cell sticking
out (an outie) is forced; level 3 triples, X-Wing, Y-Wing, Swordfish.

| Difficulty | Cage sizes | Levels | Measured over 40 seeds: cages (avg) | Generation (avg / max) | Levels and techniques seen                                                                   |
| ---------- | ---------- | ------ | ----------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| Easy       | 2–3        | 1      | 36–44 (39.1)                        | 3.5 / 22 ms            | all level 1: cage combinations, singles                                                      |
| Medium     | 2–4        | 1–2    | 31–39 (35.1)                        | 7.1 / 79 ms            | 17 level 1, 23 level 2: box–line 23, pointing 17, naked pair 16, innie 7, outie 4            |
| Hard       | 3–6        | 2–3    | 27–36 (30.7)                        | 261 / 777 ms           | 36 level 2, 4 level 3: box–line 40, naked pair 26, pointing 22, outie 17, innie 9, triples 4 |

Splitting leaves some smaller cages (and a few one-cell cages) than the drawn sizes.

## Modes

New puzzle or today's puzzle at any difficulty (saved after every move, resumable) and watching
the technique solver place one digit at a time with its reason. Statistics key: the difficulty; a
solve is a completion with its time.

## Play features

As Classic Sudoku (shared table), with the cages drawn as dashed outlines and their sums in the top
left corner (notes and digits leave room for them). A cage that repeats a digit or overshoots (or,
when full, misses) its sum is outlined in red. Hints use the cage techniques: "First: cage
combinations. That leaves R9C2 with only 9." or "45 rule: the cages wholly inside this column add up
to 42, so the cell left over, R9C9, is 3."; only the placement and the last two steps leading to it
are highlighted.

## Computer players

| Agent    | Play                                                                      | Solved (40 puzzles per difficulty) | Time per puzzle |
| -------- | ------------------------------------------------------------------------- | ---------------------------------- | --------------- |
| `random` | Any digit consistent with the placed ones (rows, columns, boxes).         | 0%                                 | ~1 ms           |
| `logic`  | The technique solver with the cage techniques (never needed to guess).    | 100%                               | 8–9 ms          |
| `solver` | Exact propagation (with the cage propagator) + search (the exact oracle). | 100%                               | 5–7 ms          |

## States and actions

Shared `SudokuState` plus `cages` (cells, sum); the puzzle is all zeros. Save validation adds: the
cages partition the grid, their sums match the solution, digits are distinct in each, and the
solver with the cages confirms the unique solution. Environment actions `cell:digit` (consistent
with rows, columns and boxes; a broken cage ends the episode stuck once no candidate is left).

## Achievements

| id        | Condition                                                       |
| --------- | --------------------------------------------------------------- |
| `first`   | Solve a killer sudoku.                                          |
| `clean`   | Solve without a mistake or a hint.                              |
| `speed`   | Solve a Medium killer sudoku in under 15 minutes without hints. |
| `hardest` | Solve a Hard killer sudoku.                                     |
| `daily`   | Solve today's puzzle.                                           |

## Controls

Tap a cell, then a digit on the pad. Keyboard: arrows move, 1–9 place (again to remove),
Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo, H hint,
Enter fill the hint, P pause.

## Graphics and audio

The shared paper-like grid with dashed cage outlines inset in each cell, sums on small labels,
broken cages in red; soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `killer-sudoku` v`1.0.0`: kind `puzzle`, one seat,
config `{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Shared: cages connected, distinct, summing right, unique under the cage propagator; pruning and
checks; three Hard puzzles solved by the techniques with every step agreeing with the solution.
Game: every difficulty with no givens, unique, at its levels, within its cage sizes, saves valid
and broken cages rejected; broken cages marked; both solvers finishing Hard; the stuck ending; the
contract suite. UI: notes, digits, undo, a hint, solving through hints with the result recorded,
pausing. E2E desktop + mobile.
