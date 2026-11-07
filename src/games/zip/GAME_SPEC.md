# #123 Number Trail (Zip) — Game Specification

A numbered Hamiltonian-path puzzle under its own name, with generated puzzles, look and texts.

## Ruleset (`number-trail`)

Draw one trail through every cell of an n×n grid, moving between side-adjacent cells, never across
a wall; it starts on 1, passes the numbers in order and ends on the last number. Every puzzle has
exactly one trail. While drawing, the trail cannot enter a number out of order, nor the last number
before every other cell is covered.

## Generator

From the seed: a random trail through every cell (randomized depth-first search ordered by
Warnsdorff's rule), numbers on its first and last cells and on a few random cells along it. While a
second trail exists, the counter returns it and the generator blocks it where it first leaves the
intended trail: a wall on that step (with a level-dependent chance, if the intended trail does not
use it) or a new number there. When the uniqueness search runs out of budget, a number is added in
the middle of the longest unnumbered stretch.

The counter is a depth-first search with pruning: checkerboard parity of the cells left, all
unvisited cells reachable, every unvisited cell keeping two possible neighbours (the end one), and
a forced step into a cell left with exactly two ways in.

| Level | Grid | Numbers (avg) | Walls (avg) | Generation (avg / max, 20 seeds) |
| ----- | ---- | ------------- | ----------- | -------------------------------- |
| 5×5   | 5×5  | 7.3           | 3.1         | 5.4 / 31 ms                      |
| 6×6   | 6×6  | 9.2           | 3.6         | 2.4 / 7 ms                       |
| 7×7   | 7×7  | 12.8          | 8.8         | 67 / 433 ms                      |
| 8×8   | 8×8  | 15.8          | 11.5        | 456 / 1537 ms                    |

## Modes, play features, controls

New or daily puzzle, resume, watch the AI. Drag from the trail's end (fast drags walk one step at a
time toward the pointer), drag back over the trail or tap a trail cell to cut back, undo one step,
arrow keys extend, messages when a number is out of order or the last number is reached too early.
Hints: when the trail has left the solution, where to go back to (and "Go back" does it);
otherwise the next cell, explained when it is forced (two ways in left) or a number. Pause hides the
grid.

## Computer players

| Agent    | Play                                                                                         | Solved (20 per level)                          |
| -------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `random` | Any open neighbour.                                                                          | 0 / 0 / 0 / 0                                  |
| `greedy` | Forced cells first, then the neighbour with the fewest onward ways, nearest the next number. | 15 / 10 / 11 / 7 (coverage 89 / 82 / 73 / 71%) |
| `solver` | Follows the unique trail (the oracle).                                                       | all                                            |

## States and actions

`TrailState`: level, seed, puzzle (numbers, walls, solution), path, hints, elapsed time, solved.
Environment actions `m:cell` (legal extensions); the episode ends solved or stuck. Save validation
regenerates the puzzle and replays the path.

## Achievements

| id       | Condition                                      |
| -------- | ---------------------------------------------- |
| `first`  | Solve a puzzle.                                |
| `clean`  | Solve without hints.                           |
| `speed`  | Solve a 7×7 in under 45 seconds without hints. |
| `expert` | Solve an 8×8 without hints.                    |
| `daily`  | Solve today's puzzle.                          |

## Graphics and audio

The grid in the board tokens, numbers in solid discs above an SVG trail in the accent color (green
once solved), thick walls, the trail's end outlined, dashed hint outline. The shared puzzle sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `zip` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when solved, score = cells agreeing with the solution.

## Testing criteria

Unique trails equal to the solution for every level (counted with a large budget), adjacency,
walls, numbers in order, determinism, extension rules, cutting back, the forced cell always on the
solution, the greedy walker's legality, save validation, the contract suite; UI: tapping forward,
cutting back, undo, hints to the end with the result recorded, the "go back" hint after leaving the
solution. E2E desktop + mobile.
