# #032 Six Men's Morris — Game Specification

## Ruleset (`six-mens-morris`)

- Board: 16 points on two concentric squares joined at their midpoints; 8 lines of three (the squares' sides). Points use a1… coordinates (files from the left, ranks from the bottom).
- **White** (seat 0) starts; each player first places 6 pieces, one per turn, on empty points.
- Then each turn slides one own piece to a free adjacent point along a line.
- Closing a **mill** (three own pieces on a line, by placing or moving) removes one opponent piece of your choice that is not in a mill — any piece if all of them are in mills. Removed pieces never return.
- A player reduced to **two pieces** (board + still to place) loses.
- A player who has no legal move on their turn (blocked) loses.
- Draws: the same position (board, side to move, pieces in hand) three times, or 100 plies of movement without a mill.

## States and actions

Shared engine `src/games/shared/morris/engine.ts`: `MorrisState` = `board` (0/1/2 per point),
`toMove`, `inHand`, `history`, `keys` (position keys for repetition), `quiet`, `result`, validated
by replay. Actions: `e4` (place), `e4xd7` (place and remove), `d6-d5` (move), `d6-d5xa1` (move and
remove); a mill-closing move exists once per removable piece.

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. The generic alpha-beta agent with the Morris
evaluation (pieces on board and in hand, mills, open two-in-a-rows, free neighbors of every piece in
all phases — blockades are usually decided while the last pieces are placed), mill-closing moves
ordered first:

| Level  | Search                                |
| ------ | ------------------------------------- |
| Easy   | 1 ply; random move 30% of the time    |
| Medium | 2 plies                               |
| Hard   | iterative deepening to 14 plies (1 s) |

Measured (seeded, colors alternated, `mm-bench`, 12 games per pair): Easy vs Random
10–0–2, Medium vs Easy 10–0–2, Hard vs Medium 7–0–5 (the draws are repetitions).

## Achievements

| id                         | Condition                                       |
| -------------------------- | ----------------------------------------------- |
| `first-win`                | Win against the computer.                       |
| `beat-medium`, `beat-hard` | Beat each level.                                |
| `flawless`                 | Beat the computer without losing a piece.       |
| `miller`                   | Close 5 mills in one game against the computer. |
| `hot-seat`                 | Finish a two-player game.                       |

## Controls

Tap a point to place; to move, tap your piece (its targets light up) and then a target; after closing
a mill the removable opponent pieces are outlined in red — tap one. `Tab` walks the points, `Enter`
selects/places, `Esc` cancels a selection; `U` undo, `H` hint, `R` restart, `N` next round.

## Graphics and audio

Wooden board drawn in SVG with the lines and point dots; ivory and dark pieces; trays with the
pieces still to place; highlighted targets, red dashed outline on removable pieces, placement pop.
Synthesized place and mill sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `six-mens-morris` v`1.0.0`; packed action codec
`((from+1)·N + to)·(N+1) + remove+1`; tensor `[3, N]` (own, opponent, pieces in hand). Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared engine: board geometry (points, lines, edges), mill removal and protected mills, movement
along lines, flying with three pieces, two-piece and blocked losses, Three Men's lines vs diagonals,
random games of all variants end and validate. Module: codec bijective on game prefixes, strength
ordering (seeded), White first, save round trip and tamper rejection, contract suite; e2e desktop + mobile.
