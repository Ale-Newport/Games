# #124 8-Puzzle — Game Specification

## Ruleset (`eight-puzzle-3x3`)

Eight tiles numbered 1–8 and one gap on a 3×3 board. A tile next to the gap slides into it; the
puzzle is solved with 1–8 in reading order and the gap bottom-right. Only half of all permutations
are reachable (even inversion count); every scramble is.

| Level  | Scramble                                  | Optimal length (100 seeds)               |
| ------ | ----------------------------------------- | ---------------------------------------- |
| Easy   | 12 random gap moves (no immediate return) | 11.4 on average                          |
| Medium | 40 random gap moves                       | 21.2                                     |
| Random | any solvable permutation                  | 22.2 (the known mean is ≈22; maximum 31) |

## Modes, play features, controls

New or daily puzzle, resume, watch the AI. Tapping a tile in the gap's row or column pushes the
whole line (each tile counts as a move); arrow keys slide toward the gap; undo (counts a move);
number or picture tiles (an original sunset hillside, numbers in the corner); tiles already home
tinted; the move counter against the best possible (known from the start); hints that name the
next tile and the moves left on the shortest solution; pause.

## Computer players (shared `ai.ts`)

| Agent    | Play                                                                                | Solved within 200 moves (100 per level) | Moves when solved              |
| -------- | ----------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------ |
| `random` | Any tile next to the gap.                                                           | 1 / 0 / 0                               | —                              |
| `greedy` | The slide lowering Manhattan distance + linear conflicts most, never straight back. | 96 / 92 / 94                            | 44.9 / 79.9 / 75.9             |
| `solver` | IDA* with Manhattan distance + linear conflicts: optimal (the oracle).              | 100 / 100 / 100                         | 11.4 / 21.2 / 22.2 (= optimal) |

The optimal solver takes about 1 ms per board; it finds the hardest 3×3 board in 31 moves.

## States and actions

Shared `SlideState`: level, seed, size, start, board, history (for undo), moves, hints, elapsed
time, solved, optimal length. Environment actions `t:<tile>` for tiles next to the gap; episodes end
solved or after 200 moves. Save validation regenerates the scramble and replays the history.

## Achievements

| id        | Condition                                               |
| --------- | ------------------------------------------------------- |
| `first`   | Solve a puzzle.                                         |
| `optimal` | Solve in the fewest moves possible, without hints.      |
| `hardest` | Solve a random board without hints.                     |
| `speed`   | Solve a random board in under 30 seconds without hints. |
| `daily`   | Solve today's puzzle.                                   |

## Graphics and audio

Wooden CSS tiles that slide with a short transition (none with reduced motion), lilac when home;
picture tiles cut from one SVG. Synthesized slide, blocked tap, hint and win sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `eight-puzzle` v`1.0.0`: kind `puzzle`, one seat,
perfect information, config `{ level }`; return 1 when solved, score = −moves.

## Testing criteria

Solvability (odd and even sizes), single and line slides, an admissible heuristic and optimal
solutions that solve, the 31-move hardest board, move counting with undo, following the solver for
exactly the optimal length, greedy legality, save validation, the contract suite; UI: line slide,
undo, hints to the end with the result recorded, picture tiles, the AI solving. E2E desktop +
mobile.
