# #070 Gale — Game Specification

Catalog entry "Bridg-It"; shown under the game's generic name **Gale** (the catalog name is a
trademark). No third-party assets.

## Ruleset (`gale-5`)

- An 11 × 11 lattice. Orange (seat 0) owns the 6 × 5 dots at even rows / odd columns and must link
  the **top** row to the **bottom** row; Teal owns the 5 × 6 dots at odd rows / even columns and
  must link the **left** column to the **right**. Rounds alternate who opens.
- A move builds a bridge between two adjacent dots of your color. Bridges never cross: each of the
  41 interior points with r + c even ("slots") takes exactly one bridge — Orange's runs one way
  through it and Teal's the other.
- The first player to connect their sides wins. A full board always has exactly one winner, so
  there are no draws. (The opener has a winning strategy in theory.)

## Modes and difficulty

vs Computer (Orange or Teal), Two Players, Watch AI. Evaluation after Claude Shannon's 1950s
machine for this game: each side's network is an electrical circuit — own bridges are near-perfect
wires, free slots unit resistors, slots taken by the opponent cut — solved by Gaussian elimination
for the resistance between the two edges; the score is tanh(ln(R_opponent / R_mine)). Generic
alpha-beta with a transposition table, center-first ordering.

| Level  | Search                               |
| ------ | ------------------------------------ |
| Easy   | 1 ply; random bridge 30% of the time |
| Medium | 2 plies                              |
| Hard   | Iterative deepening for about 1 s    |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 10–0, Medium vs Easy 9–1,
Hard vs Medium 10–0.

## States and actions

`GaleState` = `bridges` (121 lattice points; 0 free, 1 Orange, 2 Teal), `toMove`, `first`,
`history`, `result` {winner, reason `connected`}; validated by replay from `first`. Actions: the
slot index r·11 + c as a string. Slots are named by lattice column letter and row number (`f6` is
the center).

## Achievements

| id                         | Condition                        |
| -------------------------- | -------------------------------- |
| `first-win`                | Win against the computer.        |
| `beat-medium`, `beat-hard` | Beat each level.                 |
| `second-wins`              | Win a round the computer opened. |
| `hot-seat`                 | Finish a two-player game.        |

## Controls

Tap a free gap between dots to build your bridge there (a hover tint on desktop). Keyboard: arrows
move the cursor between gaps (a faint preview shows the bridge), Enter builds; `U`/`H`/`R`/`N`. The
status line restates the mover's goal.

## Graphics and audio

A cream board with orange bars on the top and bottom edges and teal bars on the sides, round dots
and thick rounded bridges in each color, the newest bridge highlighted, the hint as a dashed blue
bridge. A short building tone.

## Save format and AI interface

Shared match envelope (schema 1). Env `bridg-it` v`1.0.0`; codec: the slot index
(`actionSpaceSize` 121); tensor `[2, 11, 11]` (the observer's bridges, then the opponent's). Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Engine: 41 slots and the two bridge orientations through each kind of slot, Orange's top-bottom win
with Teal unable to reuse a slot, Teal's left-right win when opening, replay validation from the
opener. Evaluation: equal resistances at the start, a bridge lowers its owner's resistance. Module:
strength ordering (seeded), alternating opener, save round trip and tamper rejection, contract
suite, UI (build, turn passes, taken slot ignored), e2e desktop + mobile.
