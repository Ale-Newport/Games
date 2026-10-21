# #029 Hex 11×11 — Game Specification

## Ruleset (`hex-11x11-swap`)

- A 11×11 rhombus of hexagonal cells; cell names: column letter from the left, row number
  from the top (`a1` top-left). **Red** (seat 0) moves first and must connect the **top and
  bottom** edges; **Blue** (seat 1) must connect the **left and right** edges.
- Players alternately place a stone of their color on any empty cell; stones never move and are
  never captured.
- **Swap (pie) rule**: on Blue's first turn, instead of placing a stone, Blue may swap: Red's stone
  is replaced by a Blue stone on the mirrored cell (row and column exchanged), and Red moves next.
- The first player to complete a chain between their two edges wins. A full board always has
  exactly one winner, so there are no draws.
- Optional clocks (3+2, 5+5) and resignation from the shared shell.

## States and actions

Shared engine `src/games/shared/hex/engine.ts`: `HexState` = `size`, `board` (0/1/2), `toMove`,
`history` (cells, −2 = swap), `result` (winner and the winning chain), validated by replay. Actions:
cell index `row·11 + col`, or −2 for the swap.

## Modes and difficulty

vs Computer (Red or Blue), Two Players, Watch AI. `HexMctsAgent`: Monte Carlo tree search (UCT +
RAVE/AMAF) over random fills of the board; the swap decision compares the best reply with the best
continuation after swapping.

| Level  | Search                         |
| ------ | ------------------------------ |
| Easy   | 300 playouts, 20% random moves |
| Medium | 6 000 playouts                 |
| Hard   | 1.5 s per move                 |
| Expert | 2.5 s per move                 |

Measured (seeded, colors alternated): Easy vs Random 6–0, Medium vs Easy 6–0, Hard vs Medium 4–2,
Expert vs Hard 3–1 (on 11×11 the longer budget does help, so Expert stays).

## Achievements

| id                                        | Condition                                  |
| ----------------------------------------- | ------------------------------------------ |
| `first-win`                               | Win against the computer.                  |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                           |
| `short-path`                              | Beat the computer using at most 13 stones. |
| `swap-win`                                | Swap as Blue and beat the computer.        |
| `hot-seat`                                | Finish a two-player game.                  |

## Controls

Tap/click a cell; the **Swap** button appears when allowed. Keyboard: arrows move the cursor
(row/column), Enter places; `U` undo, `H` hint (Medium), `R` restart, `N` next round.

## Graphics and audio

SVG rhombus of hexes with red top/bottom and blue left/right edges, colored stones, last-move dot,
dashed hint, gold outline on the winning chain. Synthesized place and swap sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `hex-11x11` v`1.0.0`; `actionSpaceSize` 122 (cells + swap at
121); tensor `[2, 11, 11]`. Agents `random`, `easy`, `medium`, `hard`, `expert`.

## Testing criteria

Shared engine: hex adjacency for winning chains (the "wrong" diagonal does not connect), swap
mirrored and only right after the first stone, exactly one winner on every full board, replay
validation. Module: codec with the swap, the engine completes a one-move connection, swaps a
central opening, strength ordering (seeded), save round trip and tamper rejection, contract
suite; e2e desktop + mobile.
