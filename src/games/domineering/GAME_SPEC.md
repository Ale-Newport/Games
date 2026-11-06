# #047 Domineering — Game Specification

## Ruleset (`domineering-8x8`)

- An 8×8 grid. **Blue** (seat 0) places only **vertical** dominoes; **Orange** (seat 1) only
  **horizontal** ones. Each domino covers two empty neighboring cells.
- The first player alternates between rounds.
- A player who cannot place a domino on their turn **loses** (normal play). There are no draws.

## States and actions

Shared engine `src/games/shared/dominoes/engine.ts`: `DominoState` = `cells` (−1 or the index of
the covering domino), `first`, `toMove`, `history`, `result`, validated by replay. Actions:
`r,c,v` / `r,c,h` (top-left cell, 0-based from the top-left, and orientation).

## Modes and difficulty

vs Computer (either orientation), Two Players, Watch AI. `DominoSearchAgent`: alpha-beta on a
mutable occupancy array, iterative deepening, transposition table, moves ordered by how many of the
opponent's placements they destroy; evaluation = own placements − opponent's + 2 × (own − opponent's
"safe" placements that can never be blocked).

| Level  | Search                                  |
| ------ | --------------------------------------- |
| Easy   | 1 ply; random placement 30% of the time |
| Medium | 2 plies                                 |
| Hard   | Iterative deepening for about 1 s       |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 10–0, Medium vs Easy 9–1,
Hard vs Medium 10–0. The search solves small boards exactly in tests (first player wins 2 × 2 and
3 × 3 whichever orientation moves first).

## Achievements

| id                         | Condition                                   |
| -------------------------- | ------------------------------------------- |
| `first-win`                | Win against the computer.                   |
| `beat-medium`, `beat-hard` | Beat each level.                            |
| `horizontal-win`           | Win as the horizontal player.               |
| `shutout`                  | Win with 20 dominoes or fewer on the board. |
| `hot-seat`                 | Finish a two-player game.                   |

## Controls

Tap a cell, then one of the neighbors highlighted in green (only the mover's orientation lights
up); if a single domino fits, tap the same cell again. Keyboard: arrows, Enter, Esc;
`U`/`H`/`R`/`N`. The status line says whose orientation is to play.

## Graphics and audio

A light grid on a slate frame; dominoes in blue (vertical) and orange (horizontal) with two pips,
the last one outlined in gold; the chosen cell in amber and its partners in green. Clack sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `domineering` v`1.0.0`; codec: (r·8 + c)·2 + (0 v, 1 h)
(`actionSpaceSize` 128); tensor `[8, 8]` (covered cells). Agents `random`, `easy`, `medium`,
`hard`.

## Testing criteria

Shared: opening counts per variant, coverage and overlap, the stuck player loses, replay
validation, codec, exact small-board results (Cram parity, Domineering 2 × 2 / 3 × 3). Module:
orientation per seat, strength ordering (seeded), save round trip and tamper rejection, contract
suite, UI (anchor, orientation-filtered partners, placement, status), e2e desktop + mobile.
