# #005 Connect Four — "Four in a Row" — Game Specification

Public title: **Four in a Row** / **Cuatro en línea** (generic name; "Connect Four" is a trademark).

## Ruleset (`four-in-a-row-7x6`)

- Vertical board of 7 columns × 6 rows. Two players: **Red** (seat 0) and **Yellow** (seat 1).
  Red moves first in round 1.
- On a turn, a player drops one disc into a column that is not full; it falls to the lowest empty
  cell of that column (gravity).
- The first player with **four of their discs in a row** — horizontally, vertically or diagonally —
  wins immediately.
- If all 42 cells fill with no four in a row, the game is a draw.
- Match option _Alternate who starts each round_ (default on).

Known theory: the game is solved — the first player wins with perfect play by starting in the
center column. Our opponents are strong searchers but **no level is claimed to be perfect**.

## States and actions

Shared gravity family (`src/games/shared/gravity/`): `board[42]` (row 0 = top), `heights[7]`,
`toMove`, `firstPlayer`, `history` (columns), `result` (win with the 4 winning cells, or draw).
Action: column 0–6, legal iff not full and the game is not over.

## Modes and difficulty

vs Computer (play Red or Yellow), Two Players (hot-seat), Watch AI.

| Level  | Agent                                                                                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Easy   | Negamax 2 plies; random move 40% of the time                                                                                                                               |
| Medium | Negamax 5 plies with window heuristic                                                                                                                                      |
| Hard   | Iterative-deepening negamax up to 20 plies within 600 ms (Zobrist TT, center-out ordering, win/forced-block detection); reaches ≈ depth 13 from the empty board on desktop |

All levels (except Random) always take an immediate win and block a single immediate threat.
Window heuristic: every 4-cell window open to one side scores 5^(n−1) (×2 for three discs) for
that side, plus 3 per disc in the center column.

## Scoring, statistics, achievements

Scoreboard Red / Yellow / draws; stats per round (`vs-ai:<level>`, `local`).

| id            | Condition                                                      |
| ------------- | -------------------------------------------------------------- |
| `first-win`   | Win against the computer.                                      |
| `beat-medium` | Beat Medium.                                                   |
| `beat-hard`   | Beat Hard.                                                     |
| `diagonal`    | Win with a diagonal line.                                      |
| `full-board`  | Finish a game that fills all 42 cells (draw or last-disc win). |
| `hot-seat`    | Finish a two-player game.                                      |

## Controls

Click/tap anywhere in a column. Keyboard: ←/→ choose column, ↓ or Enter/Space drop, digits 1–7
drop directly, `U` undo, `H` hint, `R` restart, `N` next round.

## Graphics and audio

Original SVG board: gradient frame with masked holes, discs rendered behind the frame, falling
animation with a small bounce, preview disc above the hovered/selected column, landing-spot outline,
winning discs ringed and the rest dimmed, last-disc marker. Red/yellow discs; colorblind mode
switches to blue/orange; yellow discs always carry a dashed inner ring (shape cue). Shared sounds
with a heavier "drop" sound.

## Save format and AI interface

Shared two-player match envelope (schema 1), round validated by replaying columns. Env
`four-in-a-row` v`1.0.0`, ruleset `four-in-a-row-7x6`, turn-based, 2 players, deterministic,
perfect information, zero-sum. Action = column 0–6 (`actionSpaceSize` 7). Tensor `[3, 6, 7]`.
Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Gravity placement, full columns, all four line directions, no moves after a win, full-board draw
(hard-coded generated sequence), undo/validation (randomized); search agent: takes wins, blocks
threats, agrees with exact negamax on random late positions, beats weaker levels (seeded);
contract suite; UI; e2e desktop + mobile.
