# #038 Breakthrough — Game Specification

## Ruleset (`breakthrough-8x8`)

- An 8×8 board; **White** (seat 0) moves first from rows 1–2, **Black** (seat 1) from rows 7–8;
  16 pawns each.
- A pawn moves one cell forward: **straight** onto an empty cell, or **diagonally** onto an empty
  cell or an enemy pawn, which is captured. Straight moves never capture; pawns never retreat.
- The first pawn to reach the far row wins. Capturing every enemy pawn also wins.
- A side with pawns always has a move (its most advanced pawn has a free or capturable diagonal),
  and every move advances a pawn, so the game always ends; there are no draws.

## States and actions

`BreakthroughState`: `board` (0/1/2), `toMove`, `history`, `result` (winner and reason `home` or
`captured`), validated by replay. Actions: `52-44` (from-to). Cells: row·8 + col, a8 top-left. The
board is shown from the human's side (flipped when playing Black).

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. Generic alpha-beta with a transposition table,
captures and advanced moves first; evaluation = material, squared advancement, home-row defenders,
undefended attacked pawns, and a decisive bonus when the side to move has a pawn one step from the
far row.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 3 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seeded, colors alternated, 8 games per pair): Easy vs Random 8–0, Medium vs Easy 7–1,
Hard vs Medium 8–0.

## Achievements

| id                         | Condition                  |
| -------------------------- | -------------------------- |
| `first-win`                | Win against the computer.  |
| `beat-medium`, `beat-hard` | Beat each level.           |
| `untouched`                | Win without losing a pawn. |
| `hot-seat`                 | Finish a two-player game.  |

## Controls

Tap one of your pawns: green dots mark steps and red rings mark captures; tap a target to move.
Keyboard: arrows move the cursor, Enter selects/moves, Esc cancels; `U`/`H`/`R`/`N`.

## Graphics and audio

Wooden checkered board with rank/file labels, original shaded pawns, last move and hint
highlighted, a pawn counter. Step and capture sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `breakthrough` v`1.0.0`; codec: from·6 + step (0–2 up-left,
up, up-right; 3–5 down-left, down, down-right; `actionSpaceSize` 384); tensor `[2, 8, 8]`. Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

22 opening moves, diagonal-only captures, far-row and wipeout wins, a side always has a move,
codec, strength ordering (seeded), save round trip and tamper rejection, contract suite, UI (targets,
step, capture, counter), e2e desktop + mobile.
