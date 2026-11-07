# #060 Yoté — Game Specification

## Ruleset (`yote-5x6-bonus-removal`)

- A 5 × 6 board; each player starts with **12 pieces in hand**. **Light** (seat 0) moves first.
- A turn is one of: **place** a piece from hand on any empty square; **step** a piece one square
  orthogonally to an empty square; or **jump** orthogonally over an adjacent enemy piece into the
  empty square beyond, capturing it.
- After a capture the capturer also **removes one more enemy piece** of their choice from the
  board — or from the hand if the opponent has none on the board (a second action by the same
  player).
- A player with no pieces left (board and hand) or no legal move loses. When both sides have
  three pieces or fewer, or after threefold repetition or 200 plies, the game is drawn.

## States and actions

`YoteState`: `board`, `hands`, `toMove`, `bonus` (a removal is owed), `movers`, `history`, `keys`,
`result`, validated by replay. Actions: `+p`, `f-t`, `xq`, `xh`.

## Modes and difficulty

vs Computer (Light or Dark), Two Players, Watch AI. Generic alpha-beta with a transposition table
(the key includes the hands and a pending removal); evaluation = pieces in hand (worth a little
more) and on the board, room to move, and pieces that can be jumped next turn.

| Level  | Search                               |
| ------ | ------------------------------------ |
| Easy   | 2 plies; random move 25% of the time |
| Medium | 3 plies                              |
| Hard   | Iterative deepening for about 1 s    |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 10–0, Medium vs Easy 10–0,
Hard vs Medium 9–0–1.

## Achievements

| id                         | Condition                               |
| -------------------------- | --------------------------------------- |
| `first-win`                | Win against the computer.               |
| `beat-medium`, `beat-hard` | Beat each level.                        |
| `dominant`                 | Win with 8 or more of your pieces left. |
| `hot-seat`                 | Finish a two-player game.               |

## Controls

Tap an empty square to place; tap your piece and a destination (green dot) to step or jump; for
the bonus removal tap an enemy piece outlined in red, or press “Take one from their hand”.
Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`.

## Graphics and audio

A carved wooden board of round hollows, light shell and dark stone pieces, hand trays above and
below, the last move and hint marked. Drop and capture sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `yote` v`1.0.0`; codec: place p → p, move → 30 + 30f + t,
remove q → 930 + q, from hand → 960 (`actionSpaceSize` 961); tensor `[2, 5, 6]`. Agents `random`,
`easy`, `medium`, `hard`.

## Testing criteria

30 opening placements, jump plus bonus removal (board, then hand), replay validation, codec,
strength ordering (seeded), save round trip and tamper rejection, contract suite, UI (place, jump,
bonus from hand), e2e desktop + mobile.
