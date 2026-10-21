# #028 Hex 7×7 — Game Specification

## Ruleset (`hex-7x7-swap`)

- A 7×7 rhombus of hexagonal cells; cell names: column letter from the left, row number
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
cell index `row·7 + col`, or −2 for the swap.

## Modes and difficulty

vs Computer (Red or Blue), Two Players, Watch AI. `HexMctsAgent`: Monte Carlo tree search (UCT +
RAVE/AMAF) over random fills of the board; the swap decision compares the best reply with the best
continuation after swapping.

| Level  | Search                         |
| ------ | ------------------------------ |
| Easy   | 300 playouts, 20% random moves |
| Medium | 6 000 playouts                 |
| Hard   | 1 s per move                   |

Measured (seeded, colors alternated): Easy vs Random 6–0, Medium vs Easy 6–0, Hard vs Medium 4–2. A
2-second Expert level was dropped: on 7×7 it went 1–3 against Hard, so more time did not help.

## Achievements

| id                         | Condition                                 |
| -------------------------- | ----------------------------------------- |
| `first-win`                | Win against the computer.                 |
| `beat-medium`, `beat-hard` | Beat each level.                          |
| `short-path`               | Beat the computer using at most 9 stones. |
| `swap-win`                 | Swap as Blue and beat the computer.       |
| `hot-seat`                 | Finish a two-player game.                 |

## Controls

Tap/click a cell; the **Swap** button appears when allowed. Keyboard: arrows move the cursor
(row/column), Enter places; `U` undo, `H` hint (Medium), `R` restart, `N` next round.

## Graphics and audio

SVG rhombus of hexes with red top/bottom and blue left/right edges, colored stones, last-move dot,
dashed hint, gold outline on the winning chain. Synthesized place and swap sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `hex-7x7` v`1.0.0`; `actionSpaceSize` 50 (cells + swap at
49); tensor `[2, 7, 7]`. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared engine: hex adjacency for winning chains (the "wrong" diagonal does not connect), swap
mirrored and only right after the first stone, exactly one winner on every full board, replay
validation. Module: codec with the swap, the engine completes a one-move connection, swaps a
central opening, strength ordering (seeded), save round trip and tamper rejection, contract
suite, UI (swap button, winning chain); e2e desktop + mobile.
