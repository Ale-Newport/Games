# #139 Fibonacci Merge — Game Specification

The Fibonacci variant of the sliding merge puzzle, on the shared merge core of #137.

## Ruleset (`fibonacci-merge`)

As in #137, a move slides every tile as far as it goes and each tile merges at most once per
move, but two tiles merge only when they are consecutive Fibonacci numbers (1 and 2, 2 and 3,
3 and 5, 5 and 8…) or both 1; they make the next number (the sum). Equal tiles above 1 do not
merge. New tiles are 1s (three times in four) or 2s. Every merge adds its value to the score.

| Board | Size | Goal |
| ----- | ---- | ---- |
| 4×4   | 4    | 2584 |
| 3×3   | 3    | 144  |
| 5×5   | 5    | 4181 |

## Modes, play features, controls

As #137: new or daily game per board, resume, watch the AI; arrow keys, WASD or swipes; one-step
undo; hints from the search; keep going after the goal.

## Computer players

The shared agents of #137 (`random`, `corner`, `expectimax`); the search evaluates boards by the
logarithm of the tiles, which suits the Fibonacci growth as well.

Measured (seeds 1–N, whole games, at most 5 000 moves as in the environment): on 4×4 the corner
keeper never reached 2584 in 20 games (best tiles 55–987, average score 5 443) while expectimax
reached it in 6 of 6 (best tiles 2584–4181, average score 61 365) at 1.8 ms a move. On 3×3
expectimax made 144 in 6 of 6 (corner 0 of 20, best 89). On 5×5 expectimax made 4181 in 3 of 3
before the 5 000-move cap (the corner keeper in 4 of 20), at 2.7 ms a move; the 5×5 goal is set to
4181 for that reason.

## States and actions

The shared `MergeGameState` of #137. Environment actions are directions; episodes end when no slide
moves (or after 5 000 moves); return 1 if the goal was reached, score = points.

## Achievements

| id       | Condition                                             |
| -------- | ----------------------------------------------------- |
| `goal`   | Make the board's goal tile.                           |
| `clean`  | Make it without undo or hints.                        |
| `beyond` | Make a tile of at least twice the goal (6765 on 4×4). |
| `daily`  | Make the goal tile in today's 4×4 game.               |

## Graphics and audio

The shared merge table: tile colors step through the sequence (1, 2, 3, 5, 8…); shared sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`, validated by replay. Env `fibonacci-2048` v`1.0.0`: kind
`puzzle`, one seat, perfect information, deterministic transitions, config `{ level }`.

## Testing criteria

The Fibonacci merge rule, slides with one merge per tile, seeded spawns of 1s and 2s, ranks by
place in the sequence, moves with undo and replay validation, expectimax beating the corner keeper
on 3×3, the contract suite; UI: keys, undo, hints, watch mode. E2E desktop + mobile.
