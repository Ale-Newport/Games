# #125 15-Puzzle — Game Specification

## Ruleset (`fifteen-puzzle-4x4`)

Fifteen tiles and one gap on a 4×4 board; slide tiles into the gap until 1–15 are in reading order
with the gap bottom-right. On a 4×4 board a position is solvable when the inversion count plus the
gap's row counted from the bottom is odd; every scramble is solvable.

| Level  | Scramble                 | Shortest solution known at the start (20 seeds) | Solver moves (avg) |
| ------ | ------------------------ | ----------------------------------------------- | ------------------ |
| Easy   | 30 random gap moves      | 20 / 20 (25.5 moves on average)                 | 25.5 (optimal)     |
| Medium | 70 random gap moves      | 8 / 20 (36.5)                                   | 40.7               |
| Random | any solvable permutation | 1 / 20                                          | 54.2               |

The best possible count is shown only when the optimal search finishes within its budget
(60 000 nodes) at the start.

## Solver

IDA* with Manhattan distance plus linear conflicts, optimal within its node budget; otherwise
weighted A* (f = g + w·h with w = 1.4, then 1.8 and 2.5 if needed), whose solutions are at most w
times the optimal — for random boards it averaged 54.2 moves against the known mean of about 52.6.
A hint's plan is cached along the path, so following hints costs one search: about 0.1 s for a
random board in the browser.

## Modes, play features, controls

As the 8-Puzzle (shared table): new or daily puzzle, resume, watch the AI, line slides by tapping,
arrow keys, undo, number or picture tiles, hints naming the next tile and the moves left (said to be
the shortest only when the solution is optimal), pause.

## Computer players (shared `ai.ts`)

| Agent    | Solved within 600 moves (20 per level) | Moves when solved  |
| -------- | -------------------------------------- | ------------------ |
| `random` | 0 / 0 / 0                              | —                  |
| `greedy` | 10 / 7 / 4                             | 359 / 362 / 275    |
| `solver` | 20 / 20 / 20                           | 25.5 / 40.7 / 54.2 |

## States and actions

Shared `SlideState`; environment actions `t:<tile>`; episodes end solved or after 600 moves; save
validation regenerates the scramble and replays the history.

## Achievements

| id        | Condition                                                  |
| --------- | ---------------------------------------------------------- |
| `first`   | Solve a puzzle.                                            |
| `optimal` | Solve in the fewest moves possible (when known), no hints. |
| `hardest` | Solve a random board without hints.                        |
| `speed`   | Solve a random board in under two minutes without hints.   |
| `daily`   | Solve today's puzzle.                                      |

## Graphics and audio

The shared wooden tiles, picture tiles and sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `fifteen-puzzle` v`1.0.0`: kind `puzzle`, one seat,
perfect information, config `{ level }`; return 1 when solved, score = −moves.

## Testing criteria

4×4 solvability, weighted A* solutions that solve and are never shorter than the heuristic, optimal
lengths for easy scrambles followed exactly, save validation, the contract suite; UI: a 4×4 board
solved through hints with the result recorded. E2E desktop + mobile.
