# #048 Cram — Game Specification

## Ruleset (`cram-5x6`)

- A 5×6 grid (5 rows, 6 columns). Both players — **Blue** (seat 0) and **Orange** (seat 1) —
  place 1×2 dominoes **horizontally or vertically** on two empty neighboring cells.
- The first player alternates between rounds.
- A player who cannot place a domino on their turn **loses** (normal play). There are no draws.
- Theory: on a board with one odd side the first player wins by covering the center and mirroring
  through it; on even × even boards the second player wins by mirroring.

## States and actions

Shared engine `src/games/shared/dominoes/engine.ts` (variant `CRAM`). Actions `r,c,v` / `r,c,h`.

## Modes and difficulty

vs Computer, Two Players, Watch AI. `DominoSearchAgent` with the impartial evaluation: Cram gives
both sides the same placements, so leaves score a parity estimate — how many more dominoes fit
(packed greedily), odd favoring the side to move. A zero evaluation was tried first and left Easy
and Medium no better than chance (5–5, 4–6); the parity estimate separates them.

| Level  | Search                                  |
| ------ | --------------------------------------- |
| Easy   | 1 ply; random placement 30% of the time |
| Medium | 4 plies                                 |
| Hard   | Iterative deepening for about 1 s       |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 7–3, Medium vs Easy 10–0,
Hard vs Medium 10–0. Shared tests solve small Cram boards exactly (2×2, 2×4, 4×4 second-player
wins; 2×3, 3×4 first-player wins).

## Achievements

| id                         | Condition                                   |
| -------------------------- | ------------------------------------------- |
| `first-win`                | Win against the computer.                   |
| `beat-medium`, `beat-hard` | Beat each level.                            |
| `second-wins`              | Win a round the computer started.           |
| `quick-squeeze`            | Win with 11 dominoes or fewer on the board. |
| `hot-seat`                 | Finish a two-player game.                   |

## Controls

Tap a cell, then a neighbor highlighted in green (both directions are offered); if only one fits,
tap the same cell again. Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`.

## Graphics and audio

The shared domino grid: blue and orange dominoes with pips, the last one outlined, the chosen cell
in amber and its partners in green. Clack sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `cram` v`1.0.0`; codec (r·6 + c)·2 + (0 v, 1 h)
(`actionSpaceSize` 60); tensor `[5, 6]`. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared domino tests (exact small-board results), module: 49 opening placements in both directions,
strength ordering (seeded), save round trip and tamper rejection, contract suite, UI (four
partners, placement, single-partner second tap), e2e desktop + mobile.
