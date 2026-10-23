# #057 Fox and Geese — Game Specification

## Ruleset (`fox-and-geese-13-orthogonal`)

- A 33-point cross-shaped board (a 7×7 grid without its 2×2 corners), joined by horizontal and
  vertical lines only. **Geese** (seat 0): 13 on the top three rows of the cross. **Fox** (seat 1):
  one, on the center. The geese move first.
- Geese step one point **down or sideways**, never back up, and never capture.
- The fox steps one point in any direction, or **jumps** over an adjacent goose into the empty
  point beyond, capturing it; he may chain further jumps (in any direction) or stop.
- The geese win by leaving the fox without a move. The fox wins with **8 captures** — or when the
  geese stall: threefold repetition or 250 plies count as an escape (sideways moves would otherwise
  let the geese shuffle forever). Geese with no legal move lose.

## States and actions

Shared engine `src/games/shared/hunt/engine.ts`: `HuntState` = `board` (−1 off the board, 0 empty,
1 prey, 2 hunter), `inHand`, `captured`, `toMove`, `chain` (the fox's point while he may jump
again), `movers`, `history`, `keys`, `result`, validated by replay. Actions: `f-t`, `stop`.

## Modes and difficulty

vs Computer (either side), Two Players, Watch AI. Generic alpha-beta; evaluation (fox's view):
captures, fox steps and jumps (zero is a loss), and the geese's advance down the board.

| Level  | Search                               |
| ------ | ------------------------------------ |
| Easy   | 2 plies; random move 25% of the time |
| Medium | 4 plies                              |
| Hard   | Iterative deepening for about 1 s    |

Measured (seats alternated, seed 9): Easy vs Random 14–6 and Medium vs Easy 17–3 (20 games each),
Hard vs Medium 7–3 (10 games). Tuning notes: with repetition as a draw the geese side drew most
games by shuffling sideways, so stalling now counts for the fox and the evaluation rewards the
geese for advancing; Easy at 1 ply and Medium at 3 plies did not separate (6–4, 5–5).

## Achievements

| id                         | Condition                                |
| -------------------------- | ---------------------------------------- |
| `first-win`                | Win against the computer.                |
| `beat-medium`, `beat-hard` | Beat each level.                         |
| `prey-win` / `hunter-win`  | Win as the geese / as the fox.           |
| `no-losses`                | Win as the geese without losing a goose. |
| `hot-seat`                 | Finish a two-player game.                |

## Controls

Tap a piece, then a point marked in yellow; during a jump chain press “End the jumps” to stop.
Keyboard: arrows (skipping holes in the cross), Enter, Esc; `U`/`H`/`R`/`N`.

## Graphics and audio

A meadow board with drawn lines, original round goose pieces with beaks and an orange fox with
ears, the last move and hint ringed, a capture counter. Step and jump sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `fox-and-geese` v`1.0.0`; codec: placement p → p, move
f → t → 49 + 49f + t, stop last (`actionSpaceSize` 2451); tensor `[3, 7, 7]` (prey, hunters,
board points). Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared: setups, geese never step back, fox jump chains and stop, tigers' single jumps and strong
points, capture goal, trapped hunters, stalling escape, replay validation, codec. Module: strength
ordering (seeded), prey first, save round trip and tamper rejection, contract suite, UI, e2e
desktop + mobile.
