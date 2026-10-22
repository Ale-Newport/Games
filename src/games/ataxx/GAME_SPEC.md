# #037 Ataxx — Game Specification

## Ruleset (`ataxx-7x7-open`)

- A 7×7 board with no blocked cells; **Red** (seat 0) moves first, **Blue** (seat 1) second. Red
  starts in the a7 and g1 corners, Blue in g7 and a1.
- A move is a **clone** (to an empty cell adjacent in any of the eight directions: a new piece
  appears and the original stays) or a **jump** (to an empty cell at distance exactly two: the
  piece leaves its origin).
- Every enemy piece adjacent to the destination **converts** to the mover's color.
- A player with no move passes (the only legal action then).
- The game ends when the board is full, a side has no pieces, neither side can move, or after 400
  plies; the side with more pieces wins and equal counts draw. The same position three times is a
  draw.

## States and actions

`AtaxxState`: `board` (0/1/2), `toMove`, `history`, `keys`, `result` (winner or draw with the final
counts), validated by replay. Actions: `+24` (clone onto cell 24 — all clones onto a cell are the
same move), `8-24` (jump) or `pass`. Cells: row·7 + col, a7 top-left.

## Modes and difficulty

vs Computer (Red or Blue), Two Players, Watch AI. Generic alpha-beta with a transposition table and
clone-first ordering; evaluation = piece difference plus a small bonus for fully surrounded pieces.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 2 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seeded, colors alternated): Easy vs Random 8–0, Medium vs Easy 8–0, Hard vs Medium
7–0–1.

## Achievements

| id                         | Condition                     |
| -------------------------- | ----------------------------- |
| `first-win`                | Win against the computer.     |
| `beat-medium`, `beat-hard` | Beat each level.              |
| `wipeout`                  | Win with no enemy piece left. |
| `hot-seat`                 | Finish a two-player game.     |

## Controls

Tap one of your pieces: green dots mark clone targets and amber rings mark jump targets; tap a
target to move. A Pass button appears when you have no move. Keyboard: arrows move the cursor,
Enter selects/moves, Esc cancels; `U`/`H`/`R`/`N`.

## Graphics and audio

Dark slate grid, shaded red and blue pieces that pop in when they appear or convert, the last
destination and hint highlighted, a live piece counter. Distinct clone, jump and conversion sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `ataxx` v`1.0.0`; codec: clone t → t, jump f → t →
49 + 49f + t, pass → 2450 (`actionSpaceSize` 2451); tensor `[2, 7, 7]`; outcome carries the final
counts as scores. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Ring sizes and the 16 opening moves, clone/jump/conversion, pass only without a move, wipeout ends
the game, codec, strength ordering (seeded), save round trip and tamper rejection, contract suite,
UI (targets, clone, jump with conversion, counter), e2e desktop + mobile.
