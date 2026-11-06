# #036 Teeko — Game Specification

## Ruleset (`teeko-classic`)

- A 5×5 board; **Black** (seat 0) moves first, **Red** (seat 1) second; four markers each.
- **Drop phase**: players alternately place their markers on empty cells until all eight are down.
- **Move phase**: each turn moves one own marker to an adjacent empty cell (any of the eight
  directions); there are no captures and no jumps.
- **Four in a straight line** (row, column or diagonal — 28 lines) or **four forming a 2×2
  square** (16 squares) wins, in either phase.
- Draws: the same position three times, or 200 plies. Teeko is a draw with perfect play (solved).

## States and actions

`TeekoState`: `board` (0/1/2), `toMove`, `history`, `keys`, `result` (winner and shape, or draw),
validated by replay. Actions: `12` (drop) or `12-13` (move). Cells: row·5 + col, a5 top-left.

## Modes and difficulty

vs Computer (Black or Red), Two Players, Watch AI. Generic alpha-beta with a transposition table;
evaluation = open shapes (only one color inside) weighted by markers (1, 4, 20).

| Level  | Search                               |
| ------ | ------------------------------------ |
| Easy   | 2 plies; random move 25% of the time |
| Medium | 4 plies                              |
| Hard   | Iterative deepening for about 1 s    |

Measured (seeded, colors alternated): Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs Medium
10–0.

## Achievements

| id                         | Condition                  |
| -------------------------- | -------------------------- |
| `first-win`                | Win against the computer.  |
| `beat-medium`, `beat-hard` | Beat each level.           |
| `drop-win`                 | Win during the drop phase. |
| `hold-hard`                | Draw against Hard.         |
| `hot-seat`                 | Finish a two-player game.  |

## Controls

Tap a cell to drop; in the move phase tap a marker (its targets light up) and then a target.
Keyboard: arrows move the cursor, Enter selects/drops, Esc cancels; `U`/`H`/`R`/`N`.

## Graphics and audio

Light wooden board with round sockets, shaded black and red markers, highlighted targets, the
winning shape outlined in gold, a drop-phase counter. Tap sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `teeko` v`1.0.0`; codec: drop p → p, move f → t → 25 + 25f

- t (`actionSpaceSize` 650); tensor `[2, 5, 5]`. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

44 shapes (16 squares), square win during the drop phase, single-step moves after it, codec,
strength ordering (seeded), save round trip and tamper rejection, contract suite, UI (drop, select,
targets, move), e2e desktop + mobile.
