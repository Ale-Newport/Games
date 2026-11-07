# #111 Hitori — Game Specification

## Ruleset (`hitori-5to10`)

Shade cells of an N×N numbered grid (N = 5, 7, 8 or 10 by difficulty) so that:

1. no number repeats among the unshaded cells of a row or column;
2. shaded cells never touch side by side (diagonally is allowed);
3. the unshaded cells form one orthogonally connected area.

Only a cell whose number repeats in its row or column is ever shaded (cells with an unrepeated
number are white without being marked). Every puzzle has exactly one solution; it is solved when
exactly its cells are shaded.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty):

1. A random Latin square (shuffled rows, columns and symbols of a cyclic square).
2. Cells to shade chosen at random (22–28% tried), never touching, never cutting the white area.
3. Each shaded cell renumbered to repeat a white number of its row or column (4–12 different
   renumberings tried per layout).
4. Kept when the exact solver (propagation: neighbours of shaded cells are white, twins of white
   cells are shaded, the white area stays connected; then search) finds exactly one solution and the
   technique solver reaches it within the difficulty's levels.

Techniques: level 1 — **next to shaded** (its neighbours stay white), **twin of a kept cell**
(shade it), **sandwich** (in "A B A", B stays white), **adjacent pair** (two equal numbers side by
side: one stays white, so every other copy in that line is shaded); level 2 — **connection** (a cell
whose shading would cut the white area stays white).

| Difficulty | Board | Measured over 40 seeds: shaded cells (avg) | Generation (avg / max) | Levels | Techniques used (puzzles)                    |
| ---------- | ----- | ------------------------------------------ | ---------------------- | ------ | -------------------------------------------- |
| Easy       | 5×5   | 4–7 (5.8)                                  | 2 / 9 ms               | all 1  | sandwich 38, adjacent pair 3                 |
| Medium     | 7×7   | 8–13 (11.6)                                | 2 / 9 ms               | all 2  | connection 40, sandwich 36, adjacent pair 10 |
| Hard       | 8×8   | 14–18 (15.8)                               | 6 / 26 ms              | all 2  | connection 40, sandwich 39, adjacent pair 8  |
| Expert     | 10×10 | 24–27 (25.4)                               | 37 / 152 ms            | all 2  | connection 40, sandwich 40, adjacent pair 4  |

A first generator with one numbering per layout found a unique 10×10 puzzle in only ~2% of tries
(and sometimes none in 300); trying several renumberings per layout fixed it.

## Modes

New puzzle or today's puzzle at any size (saved after every move, resumable) and watching the
technique solver decide one cell at a time with its reason. Statistics key: the difficulty (size);
a solve is a completion with its time.

## Play features

Tap to cycle a cell (undecided → shaded → kept with a circle → undecided) or switch the tap to
"Shade" or "Keep" only. Rule breaks show live (repeated kept numbers in red, touching shaded cells
outlined, a message when the white area is split), "Show mistakes" outlines marks that contradict
the solution (counted), undo/redo, a clock with pause, and hints that clear wrong marks first, then
explain the next deduction ("R3C4 sits between two 5s: one of them is shaded, so R3C4 must stay
white.") and apply it on request.

## Computer players

| Agent    | Play                                                             | Solved (20 puzzles per size) | Time per puzzle |
| -------- | ---------------------------------------------------------------- | ---------------------------- | --------------- |
| `random` | Shades or keeps any undecided cell while no rule is broken.      | 0%                           | 0.1–0.5 ms      |
| `logic`  | The technique solver (the exact solution only if stuck — never). | 100%                         | 0.1–2.5 ms      |
| `solver` | Propagation + search (the exact oracle).                         | 100%                         | 0.5–32 ms       |

## States and actions

`HitoriState` = `difficulty`, `seed`, `puzzle` (`size`, `numbers`, `solution`), `marks` (0 undecided,
1 kept, 2 shaded), `undo`/`redo`, `mistakes`, `hints`, `elapsedMs`, `solved`. Save validation
regenerates the puzzle from its seed and requires an exact match. Environment actions `cell:b` /
`cell:w` on undecided cells; the episode ends solved, or stuck when a rule breaks or no cell is left.

## Achievements

| id        | Condition                                             |
| --------- | ----------------------------------------------------- |
| `first`   | Solve a hitori.                                       |
| `clean`   | Solve without a mistake or a hint.                    |
| `speed`   | Solve an 8×8 hitori in under 5 minutes without hints. |
| `hardest` | Solve a 10×10 hitori.                                 |
| `daily`   | Solve today's puzzle.                                 |

## Controls

Tap a cell (see above). Keyboard: arrows move, Space shade/clear, K keep/clear, Backspace clear,
U or Ctrl+Z undo, R or Ctrl+Y redo, H hint, Enter apply the hint, P pause.

## Graphics and audio

A grey paper grid with bold numbers; shaded cells near-black with a diagonal hatch in both themes,
kept cells ringed in the accent colour, hint cells tinted; the sudoku family's soft sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `hitori` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Twins and connectivity; a puzzle per size whose solution obeys the rules, is unique, and is reached
by the techniques within the level; every technique step agreeing with the solution; play (cycle,
mistakes, undo/redo, rule breaks, saves, solving); both solvers finishing; the contract suite. UI:
tap cycle and modes, undo, a hint, solving through hints with the result recorded. E2E desktop +
mobile.
