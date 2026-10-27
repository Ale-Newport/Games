# #113 Slitherlink — Game Specification

## Ruleset (`slitherlink-loop`)

- A grid of dots (5×5 to 12×12 cells). Draw a single closed loop along the lines between
  neighbouring dots; it never crosses, branches or touches itself (every dot has 0 or 2 lines).
- A number in a cell tells how many of that cell's four sides the loop uses; empty cells are free.
- Every puzzle has exactly one loop; it is solved when exactly the loop's edges are drawn.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and size):

1. A random region of about half the cells, grown cell by cell from a random start, refusing any cell
   that would leave a hole (every outside cell must reach the border) or a pinch (two cells of one
   side touching only at a corner, which would make the boundary touch itself).
2. The region's boundary is the loop; every cell gets its number.
3. Regions whose full set of numbers the techniques cannot draw are skipped.
4. Numbers removed in random order while the exact solver still finds exactly one loop (20 000-node
   budget) and the techniques still draw it.

Techniques: level 1 — **numbers** (a number already met crosses its other sides; one that needs every
open side draws them) and **dots** (two lines at a dot cross the rest; a single open way with no
line crosses it; a line arriving with one way out continues); level 2 — **no early loop** (an edge
joining the two ends of one path would close a loop while other lines or unmet numbers remain: cross
it). The exact solver uses the same propagation plus a single-loop check and branches on an edge at a
path's end.

| Size  | Measured over 20 seeds: numbers shown (avg) | Generation (avg / max) | Levels        |
| ----- | ------------------------------------------- | ---------------------- | ------------- |
| 5×5   | 9–15 (12.7) of 25                           | 4 / 11 ms              | 11 × 1, 9 × 2 |
| 7×7   | 20–25 (22.4) of 49                          | 8 / 11 ms              | 11 × 1, 9 × 2 |
| 10×10 | 40–47 (42.9) of 100                         | 44 / 72 ms             | 6 × 1, 14 × 2 |
| 12×12 | 54–64 (58.8) of 144                         | 110 / 156 ms           | 7 × 1, 13 × 2 |

A first version returned one 5×5 region with all 25 numbers that the techniques still could not
draw; such regions are now skipped.

## Modes

New puzzle or today's puzzle at four sizes (saved after every move, resumable) and watching the
technique solver draw one deduction at a time with its reason. Statistics key: the size; a solve is
a completion with its time.

## Play features

Tap between two dots to cycle the edge (line → cross → empty) or switch the tap to "Line" or
"Cross"; drag from dot to dot to draw a path (starting on a drawn line erases along the way). Numbers
already met fade, broken numbers and dots with three or more lines turn red, "Show mistakes" marks
wrong edges (counted), undo/redo (a drag is one step), a clock with pause, and hints ("The 3 at R2C4
needs every side still open: draw them.", "This edge would close a loop too early: cross it.") that
highlight the cell, dot or edges and apply them on request. The finished loop turns green.

## Computer players

| Agent    | Play                                                         | Solved (20 per size) | Time per puzzle |
| -------- | ------------------------------------------------------------ | -------------------- | --------------- |
| `random` | Draws or crosses any open edge while nothing is broken.      | 0%                   | ≤ 0.4 ms        |
| `logic`  | The technique solver (never needed its fallback).            | 100%                 | 0.8–12.6 ms     |
| `solver` | Propagation + single-loop check + search (the exact oracle). | 100%                 | 2.5–106 ms      |

## States and actions

`SlitherState` = `difficulty`, `seed`, `puzzle` (`rows`, `cols`, `clues`, `solution` edges), `edges`
(0 empty, 1 line, 2 cross), `undo`/`redo`, `mistakes`, `hints`, `elapsedMs`, `solved`. Save
validation regenerates the puzzle from its seed and requires an exact match. Environment actions
`edge:l` / `edge:x` on open edges; the episode ends solved, or when a number or dot breaks or no edge
is left.

## Achievements

| id        | Condition                                                   |
| --------- | ----------------------------------------------------------- |
| `first`   | Solve a slitherlink.                                        |
| `clean`   | Solve without a mistake or a hint.                          |
| `speed`   | Solve a 10×10 slitherlink in under 5 minutes without hints. |
| `hardest` | Solve a 12×12 slitherlink.                                  |
| `daily`   | Solve today's puzzle.                                       |

## Controls

Tap/drag as above. Keyboard: U or Ctrl+Z undo, R or Ctrl+Y redo, H hint, Enter apply the hint, P
pause.

## Graphics and audio

An SVG board of dots and dotted slots; lines in the accent colour (green once solved), small crosses,
bold numbers; the sudoku family's soft sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `slitherlink` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 otherwise. Exact oracle: `solver`.

## Testing criteria

Geometry indexes; region boundaries as loops (one square vs two); a puzzle per size with one loop,
true numbers, unique, drawn by the techniques; every technique step agreeing with the loop; play
(cycle, mistakes, undo/redo, a broken dot, saves, solving); both solvers finishing; the contract
suite. UI: a hint applied and undone, solving through hints with the result recorded, tap modes.
E2E desktop + mobile (tap and drag included).
