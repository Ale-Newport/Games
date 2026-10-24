# #066 Chinese Checkers — Game Specification

## Ruleset (`star-121-two-player`)

- The 121-hole six-pointed star (union of two triangles in axial coordinates). Two players use
  opposite points with **ten marbles** each: Orange (seat 0) the bottom point, Teal the top. Rounds
  alternate who opens.
- A move is either a **step** to an adjacent empty hole in any of the six directions, or a **chain
  of hops**: each hop goes over one adjacent marble of either color to the empty hole straight
  beyond it; the chain may turn and stop anywhere. Nothing is captured.
- A marble that has reached the opposite point may move within it but never leave it.
- **Win**: every hole of the opposite point is occupied and at least one by your marbles (the
  standard rule against blocking by staying home).
- A player with no legal move loses (not seen in play). After **400 plies** the player whose
  marbles have less distance left wins (equal is a draw).

## Modes and difficulty

vs Computer (Orange or Teal), Two Players, Watch AI. Shared jump-race search: generic alpha-beta
with a transposition table and gain-first ordering; evaluation = the opponent's total distance to go
minus your own (hex distance to the far tip, so the point itself is the unique closest
arrangement), the straggler counted 1.5 times extra, squashed with tanh.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 2 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, 6 games per pair, seed 9): Easy vs Random 6–0, Medium vs Easy 5–1, Hard
vs Medium 6–0. Every game ended by filling the point (about 96–133 plies on average).

## States and actions

Shared engine `src/games/shared/jump-race/engine.ts`: `JumpRaceState` = `board` (121 holes, row by
row from the top, left to right; 0 empty, 1 Orange, 2 Teal), `toMove`, `first`, `history`,
`result` {winner, reason `camp` | `stuck` | `limit`}; validated by replay from `first`. Actions:
`"from-to"` hole indices. Holes are named `row·hole`, rows counted 1–17 from the bottom and holes
from the left.

## Achievements

| id                         | Condition                                      |
| -------------------------- | ---------------------------------------------- |
| `first-win`                | Win against the computer.                      |
| `beat-medium`, `beat-hard` | Beat each level.                               |
| `long-hop`                 | Win after making a chain of four hops or more. |
| `hot-seat`                 | Finish a two-player game.                      |

## Controls

Tap one of your marbles (movable ones are ringed), then a marked hole — green, or yellow inside your
goal point. Keyboard: arrows move the cursor to the nearest hole that way, Enter picks / moves, Esc
cancels; `U`/`H`/`R`/`N`. The board turns so your point is at the bottom; the status line counts the
marbles that have arrived on each side.

## Graphics and audio

A wooden star with dark holes, the two playing points tinted in their owners' colors, glossy
marbles, the last move's hop path drawn as a dashed line and the hint as a blue line. A soft step
tone and a rising double hop for jumps.

## Save format and AI interface

Shared match envelope (schema 1). Env `chinese-checkers` v`1.0.0`; codec: from·121 + to
(`actionSpaceSize` 14 641); tensor `[2, 121]` (the observer's marbles, then the opponent's). Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared jump-race tests (see #065). Module: 14 opening moves, strength ordering (seeded), alternating
opener, save round trip and tamper rejection, contract suite, UI (pick and move with hole names),
e2e desktop + mobile.
