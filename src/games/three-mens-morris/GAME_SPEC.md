# #031 Three Men's Morris — Game Specification

## Ruleset (`three-mens-morris`)

- Board: a 3×3 grid of points joined orthogonally and along both diagonals; rows and columns are the winning lines. Points use a1… coordinates (files from the left, ranks from the bottom).
- **White** (seat 0) starts; each player first places 3 pieces, one per turn, on empty points.
- Then each turn slides one own piece to a free adjacent point along a line (diagonals included).
- A player who gets three pieces on a **row or column** (in either phase) wins at once; the diagonals are only for moving.
- A player who has no legal move on their turn (blocked) loses.
- Draws: the same position (board, side to move, pieces in hand) three times, or 60 plies of movement without a mill.

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

| Level  | Search                                  |
| ------ | --------------------------------------- |
| Easy   | 2 plies; random move 30% of the time    |
| Medium | 4 plies                                 |
| Hard   | iterative deepening to 16 plies (0.8 s) |

Measured (seeded, colors alternated, `mm-bench`, 12 games per pair): Easy vs Random
12–0–0, Medium vs Easy 8–0–4, Hard vs Medium 0–0–12. Three men's morris is a draw with good play,
so Medium already holds every game; Hard differs by never allowing a draw it could avoid and by
punishing slips faster, which the bench cannot show between two sound players.

## Achievements

| id                         | Condition                                       |
| -------------------------- | ----------------------------------------------- |
| `first-win`                | Win against the computer.                       |
| `beat-medium`, `beat-hard` | Beat each level.                                |
| `quick-line`               | Beat the computer during the placement phase.   |
| `slide-win`                | Beat the computer by sliding a piece into line. |
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

Shared match envelope (schema 1). Env `three-mens-morris` v`1.0.0`; packed action codec
`((from+1)·N + to)·(N+1) + remove+1`; tensor `[3, N]` (own, opponent, pieces in hand). Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared engine: board geometry (points, lines, edges), mill removal and protected mills, movement
along lines, flying with three pieces, two-piece and blocked losses, Three Men's lines vs diagonals,
random games of all variants end and validate. Module: codec bijective on game prefixes, strength
ordering (seeded), White first, save round trip and tamper rejection, contract suite; e2e desktop + mobile.
