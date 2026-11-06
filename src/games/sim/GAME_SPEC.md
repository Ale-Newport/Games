# #049 Sim — Game Specification

## Ruleset (`sim-six-points`)

- Six points (A–F) on a hexagon and the 15 lines joining every pair. **Red** (seat 0) and **Blue**
  (seat 1) take turns coloring one free line; the first player alternates between rounds.
- A player who completes a **triangle of their own color** (three of the six points joined by
  lines of that color) **loses** at once. Mixed-color triangles do not count.
- Every two-coloring of the 15 lines contains a one-colored triangle (Ramsey's R(3, 3) = 6), so the
  game always ends; there are no draws. With perfect play the second player wins.

## States and actions

`SimState`: `lines` (0 or the seat + 1), `first`, `toMove`, `history`, `result` (winner and the
closed triangle), validated by replay. Actions: `0-3` (the line between points A and D).

## Modes and difficulty

vs Computer, Two Players, Watch AI. Exact memoized solver over (own lines, opponent lines) bitmasks:
about 112 000 positions from the empty board, solved in milliseconds; it confirms the
second-player win in a unit test.

| Level  | Play                                                                           |
| ------ | ------------------------------------------------------------------------------ |
| Easy   | Never closes its own triangle if it can avoid it; winning line 30% of the time |
| Medium | Winning line 75% of the time                                                   |
| Hard   | Always a winning line; when lost, the line leaving you fewest winning replies  |

Measured (seats alternated, 40 games per pair, seed 21): Easy vs Random 38–2, Medium vs Easy 33–7,
Hard vs Medium 28–12. A test checks that Hard never loses as the second player.

## Achievements

| id                         | Condition                             |
| -------------------------- | ------------------------------------- |
| `first-win`                | Win against the computer.             |
| `beat-medium`, `beat-hard` | Beat each level.                      |
| `first-mover`              | Win a round in which you moved first. |
| `hot-seat`                 | Finish a two-player game.             |

## Controls

Tap a line to color it (wide touch areas stop short of the points); on hover a line that would
close your own triangle turns red, and its accessible name says so. Keyboard: arrows walk the free
lines, Enter colors; `U`/`H`/`R`/`N`.

## Graphics and audio

A dark hexagon with lettered points, dashed free lines, red and blue colored lines, the last line
glowing, the hint dashed green and the losing triangle filled at the end. A stroke sound per seat.

## Save format and AI interface

Shared match envelope (schema 1). Env `sim` v`1.0.0`; codec: line number 0–14 in the order 0-1,
0-2, …, 4-5 (`actionSpaceSize` 15); tensor `[2, 15]` (observer's lines, opponent's lines). Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

15 lines / 20 triangles, own triangle loses (mixed does not), Ramsey property on random colorings,
replay validation, codec, second-player win, Hard never loses second, strength ordering (seeded),
save round trip and tamper rejection, contract suite, UI (coloring, danger warning, game over),
e2e desktop + mobile.
