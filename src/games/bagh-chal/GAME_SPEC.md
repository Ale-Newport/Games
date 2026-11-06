# #058 Bagh-Chal — Game Specification

## Ruleset (`bagh-chal-5x5`)

- A 5×5 board of points joined by orthogonal lines, with diagonals through every other point
  (row + column even). **Tigers** (seat 1): four, on the corners. **Goats** (seat 0): twenty, off
  the board. The goats move first.
- Placement: while goats remain in hand, each goat turn places one goat on any empty point.
- Movement: afterwards goats step one point along a line. They never capture.
- A tiger steps one point along a line, or **jumps** over an adjacent goat in a straight line into
  the empty point beyond, eating it — one jump per turn.
- The tigers win by eating **5 goats**; the goats win by leaving no tiger a move. Threefold
  repetition or 300 plies is a draw.

## States and actions

Shared engine `src/games/shared/hunt/engine.ts` (variant `BAGH_CHAL`). Actions: `+12` (place),
`f-t` (step or jump).

## Modes and difficulty

vs Computer (either side), Two Players, Watch AI. Generic alpha-beta; evaluation (tigers' view):
captures, tiger steps and jumps (zero is a loss), goats left hanging.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 3 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 7–0–3, Medium vs Easy
8–1–1, Hard vs Medium 10–0.

## Achievements

| id                         | Condition                               |
| -------------------------- | --------------------------------------- |
| `first-win`                | Win against the computer.               |
| `beat-medium`, `beat-hard` | Beat each level.                        |
| `prey-win` / `hunter-win`  | Win as the goats / as the tigers.       |
| `no-losses`                | Win as the goats without losing a goat. |
| `hot-seat`                 | Finish a two-player game.               |

## Controls

While goats are in hand tap a marked point to place one; otherwise tap a piece and a marked
destination. Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`. The status line says when goats are
being placed; the counter shows goats eaten and goats in hand.

## Graphics and audio

A meadow board with its diagonals, original goat pieces and striped orange tigers, the last move
and hint ringed, a counter. Step and jump sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `bagh-chal` v`1.0.0`; codec: placement p → p, move
f → t → 25 + 25f + t, stop last (`actionSpaceSize` 651); tensor `[3, 5, 5]`. Agents `random`,
`easy`, `medium`, `hard`.

## Testing criteria

Shared hunt tests (placement, single tiger jumps, diagonals only from strong points, capture goal,
trapped tigers), module: strength ordering (seeded), goats first, save round trip and tamper
rejection, contract suite, UI (placement counter, tiger move), e2e desktop + mobile.
