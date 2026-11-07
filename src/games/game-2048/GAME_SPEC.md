# #137 Merge to 2048 — Game Specification

The 2048-style sliding merge puzzle under a generic title, with its own look and texts.

## Ruleset (`merge-2048`)

A square board of numbered tiles. A move slides every tile as far as it goes in one direction;
two equal tiles that collide merge into their sum, each tile at most once per move (a row
2 2 2 2 slid left gives 4 4). A move that changes nothing is not a move. After every move a new
tile appears on a random empty cell: a 2 nine times in ten, otherwise a 4. Every merge adds its
value to the score. Reaching the goal tile wins; the player may keep going until no slide changes
the board.

| Board | Size | Goal |
| ----- | ---- | ---- |
| 4×4   | 4    | 2048 |
| 3×3   | 3    | 256  |
| 5×5   | 5    | 4096 |

## Shared merge core (`../shared/merge/`)

`engine.ts` holds the rules as data (`size`, `merge(a, b)`, spawn weights, goal) so that #139
(Fibonacci Merge) uses the same slides, spawns and search with another merge rule. New tiles come
from a seeded generator stored in the state, so a game replays exactly from its seed and moves.

## Modes, play features, controls

New or daily game per board, resume, watch the AI. Arrow keys, WASD or swipes; one-step undo; a
hint names the search's move and can be applied; after the goal the game asks before going on.
Score, best tile and move counter.

## Computer players

| Agent        | Play                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`     | Any slide that moves something.                                                                                                                                                              |
| `corner`     | The hand strategy: down, then left, then right, and up only when forced.                                                                                                                     |
| `expectimax` | Two moves deep over the possible new tiles (at most six sampled cells per chance node), valuing empty cells, monotonic rows and columns, smooth neighbours and the largest tile in a corner. |

Measured (seeds 1–N, whole games): on 4×4 the corner keeper never reached 2048 in 20 games (best
tiles 64–256, average score 2 371); expectimax reached 2048 in 5 of 6 (best tiles 1024–4096,
average score 32 800) at 1.2 ms a move. On 3×3 expectimax reached 256 in 2 of 6 (the corner
keeper 0 of 20); on 5×5 it reached 8192 in 3 of 3 at 3.3 ms a move.

## States and actions

`MergeGameState`: board, score, moves, generator state, best tile, won, over, level, seed, the
directions played, undos, hints, the previous position (for one undo) and whether the player chose
to keep going. Environment actions are directions; episodes end when no slide moves (or after
5 000 moves); return 1 if the goal was reached, score = points.

## Achievements

| id       | Condition                               |
| -------- | --------------------------------------- |
| `goal`   | Make the board's goal tile.             |
| `clean`  | Make it without undo or hints.          |
| `beyond` | Make a tile twice the goal.             |
| `daily`  | Make the goal tile in today's 4×4 game. |

## Graphics and audio

Rounded tiles on a dark board whose hue walks from teal to magenta as tiles grow; a short pop on
new and merged tiles (none with reduced motion); synthesized slide, merge, goal, hint and end
sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`, validated by replaying the directions from the seed. Env
`game-2048` v`1.0.0`: kind `puzzle`, one seat, perfect information, deterministic transitions,
config `{ level }`.

## Testing criteria

Slides and single merges per move, the score of a merge, seeded spawns, the end of the game, tile
ranks, moves with undo and replay validation, expectimax beating the corner keeper on 3×3, the
contract suite; UI: keys, undo, hints, watch mode. E2E desktop + mobile.
