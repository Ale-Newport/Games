# #129 Lights Out — Game Specification

## Ruleset (`lights-out-grids`)

Pressing a light switches it and its neighbours: the four beside it, or — in the diagonal variant —
the four diagonal ones. Switch every light off. Presses commute and a double press cancels, so a
solution is a set of cells.

| Level    | Grid | Neighbourhood | Scramble presses | Fewest presses (100 seeds) |
| -------- | ---- | ------------- | ---------------- | -------------------------- |
| 4×4      | 4×4  | plus          | 4                | 4.00                       |
| 5×5      | 5×5  | plus          | 9                | 8.84                       |
| 7×7      | 7×7  | plus          | 16               | 16.00                      |
| Diagonal | 5×5  | diagonal      | 9                | 8.00                       |

Scrambles are random presses on the dark board, so every puzzle is solvable.

## Solver

Gaussian elimination over GF(2) on the press matrix gives one solution; every combination of the
null space (dimension 0–2 here; 2 for the classic 5×5, whose all-on board needs the known minimum
of 15) is tried, and the fewest presses kept. It takes under a millisecond.

## Modes, play features, controls

New or daily puzzle, resume, watch the AI. Tap a light (a hover preview outlines the lights it
would switch); arrow keys and Space; undo, restart; the press counter against the fewest possible;
hints that point at a press of an optimal solution.

## Computer players

| Agent    | Play                                                                         | Solved within 120 presses (100 per level) | Presses                 |
| -------- | ---------------------------------------------------------------------------- | ----------------------------------------- | ----------------------- |
| `random` | Any light.                                                                   | 2 / 0 / 0 / 0                             | —                       |
| `chase`  | Light chasing: press below every lit light, row by row, then finish exactly. | 100 / 100 / 100 / 100                     | 5.9 / 21.4 / 55.8 / 8.0 |
| `solver` | The fewest presses (the oracle).                                             | 100 / 100 / 100 / 100                     | optimal                 |

## States and actions

`LightsState`: level, seed, start, lights, presses, hints, elapsed time, solved, fewest presses.
Environment actions `p:cell`; episodes end dark or after 120 presses. Save validation regenerates
the scramble and replays the presses.

## Achievements

| id         | Condition                                   |
| ---------- | ------------------------------------------- |
| `first`    | Switch a grid off.                          |
| `optimal`  | Solve in the fewest presses, without hints. |
| `large`    | Solve a 7×7 without hints.                  |
| `diagonal` | Solve a diagonal grid without hints.        |
| `daily`    | Solve today's puzzle.                       |

## Graphics and audio

Glowing CSS lights on a dark panel (green when all off); synthesized switch clicks, hint and a
lights-out chime.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `lights-out` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when dark, score = −presses.

## Testing criteria

Plus and diagonal neighbourhoods, the all-on 5×5 minimum of 15, an unsolvable single corner light,
following the solver for exactly the optimum on every level, light chasing to the end, undo, save
validation, the contract suite; UI: a press, undo, hints to the end with the result recorded. E2E
desktop + mobile.
