# #011 Othello / Reversi 6×6 — Game Specification

Public title: **Reversi 6×6**.

## Ruleset (`reversi-6x6`)

Identical rules to #010 on a 6×6 board: start with white on c3 and d4, black on d3 and c4; Black
moves first; a move must bracket and flip at least one line of opposing discs (8 directions); a
player with no legal move must pass; the game ends when neither player can move; more discs wins,
equal counts draw.

The small board is a different game strategically: it is known (published result by J. Feinstein,
1993 — not re-verified by this project) that with perfect play **White wins 16–20**. Our own
measurements agree that the board strongly favors White: Medium as White beats Hard as Black most
of the time.

## Modes, difficulty

vs Computer (Black or White), Two Players, Watch AI. `ReversiSearchAgent` levels tuned for 6×6:

| Level  | Agent                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------- |
| Easy   | 1 ply, random move 30% of the time                                                             |
| Medium | 3 plies; exact endgame in the last 8 empties                                                   |
| Hard   | Iterative deepening up to 14 plies within 800 ms; exact endgame in the last 18 empties (of 32) |

Measured (seeded): Easy vs Random 17–1–2, Medium vs Easy 19–1–0; Hard as White vs Medium as Black
8–0–2 (with 5% randomness on both); seat strongly matters on this board — Hard as Black loses to
Medium as White most of the time.

## Achievements

`first-win`, `beat-medium`, `beat-hard`, `black-victory` (beat the computer playing Black),
`wipeout`, `hot-seat`.

## Controls, graphics, audio, saves, AI interface

As #010 (shared Reversi board and shell). Env `reversi-6x6` v`1.0.0`, ruleset `reversi-6x6`,
actions 0–36 (36 = pass), tensor `[3, 6, 6]`, agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Start position (four legal moves), contract suite, exact endgame vs brute force (shared tests),
Hard as White beats Medium as Black in a seeded batch, UI, e2e.
