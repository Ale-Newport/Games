# #059 Alquerque — Game Specification

## Ruleset (`alquerque-5x5-forced-capture`)

- A 5×5 board of points joined by orthogonal lines, with diagonals through every other point
  (row + column even). **White** (seat 0) has 12 pieces on the bottom two rows and the two right
  points of the middle row; **Black** (seat 1) mirrors it at the top. Only the center is empty.
  White moves first.
- A non-capturing move steps one point along a line, **forward or sideways, never backward**.
- A capture jumps along a line over an adjacent enemy piece into the empty point beyond (any
  direction, backward included), removing it. **Capturing is compulsory**, and while the jumping
  piece can capture again it **must continue** (each jump is a separate action by the same player).
- A player with no pieces or no legal move loses. Threefold repetition, or 200 plies without a
  capture, is a draw.

## States and actions

`AlquerqueState`: `board`, `toMove`, `chain` (the piece that must keep jumping), `movers`,
`history`, `keys`, `quiet`, `result`, validated by replay. Actions: `f-t`.

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. Generic alpha-beta with a transposition table
(the state key includes an open chain); evaluation = material + room to move (plain steps). Two
earlier evaluations lost to Random in the bench: rewarding advancement made pieces rush to the far
row and run out of moves (2–6–2), and counting legal moves treated a forced capture as the opponent
having few moves, so pieces were offered (1–9).

| Level  | Search                               |
| ------ | ------------------------------------ |
| Easy   | 2 plies; random move 25% of the time |
| Medium | 4 plies                              |
| Hard   | Iterative deepening for about 1 s    |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 8–1–1, Medium vs Easy 10–0,
Hard vs Medium 10–0.

## Achievements

| id                         | Condition                               |
| -------------------------- | --------------------------------------- |
| `first-win`                | Win against the computer.               |
| `beat-medium`, `beat-hard` | Beat each level.                        |
| `dominant`                 | Win with 8 or more of your pieces left. |
| `hot-seat`                 | Finish a two-player game.               |

## Controls

Tap a piece and a marked destination; during a chain the jumping piece stays selected. Keyboard:
arrows, Enter, Esc; `U`/`H`/`R`/`N`. The status line says when a capture is compulsory.

## Graphics and audio

A light wooden board with drawn lines, white and black pieces, landing marks, the last move and
hint ringed, a piece counter. Step and capture sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `alquerque` v`1.0.0`; codec: from·25 + to
(`actionSpaceSize` 625); tensor `[2, 5, 5]`. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Start position and opening moves, no retreat except captures, compulsory captures and chains,
replay validation, codec, strength ordering (seeded), save round trip and tamper rejection,
contract suite, UI (compulsory capture status, capture), e2e desktop + mobile.
