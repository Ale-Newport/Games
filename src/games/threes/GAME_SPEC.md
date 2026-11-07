# #138 Number Trios — Game Specification

A threes-style sliding number puzzle under a generic name, with its own look, rules text and
scoring table.

## Ruleset (`number-trios`)

A board of numbered tiles (4×4, 3×3 or 5×5). A move shifts tiles one cell in a direction. In each
line along the move, the first tile (from the leading edge) that can move — into a free cell or
onto a tile it merges with — moves, and every tile behind it follows; so a line moves at most one
cell and merges at most once. A 1 and a 2 merge into a 3; two equal tiles of 3 or more merge into
their double; nothing else merges. After a move the next tile, always shown, enters at the back
edge of one of the lines that moved (chosen at random). Tiles come from a shuffled deck of four
1s, four 2s and four 3s, reshuffled when it runs out; once the board holds a 48, a bonus tile
(6 up to an eighth of the best tile) replaces the draw one time in 21. A 4×4 game starts with nine
tiles. The game ends when no move changes the board; each tile of 3 or more then scores
3^(doublings + 1): 3 → 3, 6 → 9, 12 → 27, 48 → 243.

| Board | Start tiles | Goal |
| ----- | ----------- | ---- |
| 4×4   | 9           | 384  |
| 3×3   | 5           | 48   |
| 5×5   | 14          | 1536 |

## Modes, play features, controls

New or daily game per board, resume, watch the AI. Arrow keys, WASD or swipes; one-step undo; a
hint names the search's move and can be applied; after the goal the game asks before going on.
Score, next tile and best tile on top.

## Computer players

| Agent        | Play                                                                                                                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`     | Any move that changes the board.                                                                                                                                                                                             |
| `corner`     | Down, then left, then right, and up only when forced.                                                                                                                                                                        |
| `expectimax` | Two moves deep: the shown tile at each line that moved, then 1, 2 or 3 at each line, valuing empty cells, pairs ready to merge, monotonic lines and the best tile, with a penalty for 1s and 2s with no partner beside them. |

Measured (seeds 1–N, whole games): on 4×4 the corner keeper never reached 384 in 20 games (best
tiles 12–96, average score 447) while expectimax reached it in 5 of 6 (best tiles 192–1536,
average score 36 452) at 0.17 ms a move. On 3×3 expectimax made 48 in 6 of 6 (corner 3 of 20);
on 5×5 it made 1536 in 6 of 6 (best tiles up to 6144) at 0.36 ms a move.

## States and actions

`TriosGameState`: board, next tile, the rest of the deck, generator state, moves, best tile, won,
over, level, seed, directions played, undos, hints, the previous position (one undo) and whether
the player chose to keep going. Environment actions are directions; episodes end when no move is
left (or after 5 000 moves); return 1 if the goal was reached, score = points.

## Achievements

| id       | Condition                               |
| -------- | --------------------------------------- |
| `goal`   | Make the board's goal tile.             |
| `clean`  | Make it without undo or hints.          |
| `beyond` | Make a tile twice the goal.             |
| `daily`  | Make the goal tile in today's 4×4 game. |

## Graphics and audio

Tall rounded cards: 1s in blue, 2s in coral, 3 and up in cream that deepens to amber as they grow;
the next tile as a card beside the score; a short pop on changed cells (none with reduced
motion); synthesized shift, merge, goal, hint and end sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`, validated by replaying the directions from the seed. Env
`threes` v`1.0.0`: kind `puzzle`, one seat, perfect information, deterministic transitions,
config `{ level }`.

## Testing criteria

The merge rule, one-cell shifts with one merge per line, scoring, the deck, the start and where the
next tile enters, the end of the game, moves with undo and replay validation, expectimax beating
the corner keeper, the contract suite; UI: the next tile, keys, undo, hints, watch mode. E2E
desktop + mobile.
