# #132 Ball Sort — Game Specification

## Ruleset (`ball-sort`)

Tubes hold colored balls, bottom first. A move takes the top ball of one tube to an empty tube or
onto a ball of the same color, if there is room. Sorted when every tube is empty or full of a single
color.

| Level     | Colors | Tube size | Tubes (two empty) | Solver moves (30 seeds) |
| --------- | ------ | --------- | ----------------- | ----------------------- |
| 4 colors  | 4      | 4         | 6                 | 18.8                    |
| 7 colors  | 7      | 4         | 9                 | 34.6                    |
| 9 colors  | 9      | 5         | 11                | 73.0                    |
| 12 colors | 12     | 5         | 14                | 107.0                   |

Shuffles are seeded permutations; the first one from the seed that the solver can finish is used.

## Solver (shared with Water Sort)

Depth-first search over moves with memory of explored positions; it solves every level in
0.1–10 ms (not the fewest moves). Hints replan from the current position.

## Modes, play features, controls

As Water Sort (shared table): new or daily puzzle, resume, watch the AI, tap to lift the top ball
and tap to drop it, number keys, undo, restart, hints; balls are drawn as shaded spheres.

## Computer players (shared `ai.ts`)

| Agent    | Play                                                               | Sorted within 300 moves (30 per level) |
| -------- | ------------------------------------------------------------------ | -------------------------------------- |
| `random` | Any allowed move.                                                  | 30 / 18 / 2 / 0                        |
| `greedy` | Onto one-color tubes first, avoiding empties, never straight back. | 30 / 17 / 0 / 0                        |
| `solver` | The search (the oracle).                                           | 30 / 30 / 30 / 30                      |

## States and actions

Shared `SortState`; environment actions `from>to`; episodes end sorted, stuck or after 300 moves;
save validation regenerates the shuffle and replays every move.

## Achievements

| id        | Condition                         |
| --------- | --------------------------------- |
| `first`   | Sort a set of tubes.              |
| `clean`   | Sort without undo or hints.       |
| `hardest` | Sort twelve colors without hints. |
| `daily`   | Sort today's puzzle.              |

## Graphics and audio

CSS tubes with shaded balls in twelve colors; the shared sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `ball-sort` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when sorted, score = −moves.

## Testing criteria

One-ball moves, same-color and capacity rules, every level solvable and solved by the solver, moves,
undo, save validation by replay, legal agent moves, the contract suite; UI: a move by taps, undo,
hints to the end with the result recorded. E2E desktop + mobile.
