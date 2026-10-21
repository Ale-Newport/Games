# #035 Nesting Tic-Tac-Toe — Game Specification

Catalog entry "Gobblet Gobblers". Presented as **Nesting Tic-Tac-Toe** with original art; no
product names, characters or artwork are used.

## Ruleset (`nesting-3x3-six-pieces`)

- 3×3 board. Each player has six cups: two small, two medium, two large. **Orange** (seat 0) moves
  first, **Blue** (seat 1) second.
- A turn either places a cup from the reserve or moves one of the player's visible cups on the
  board, onto an empty cell or **over a strictly smaller cup** of either color (it is covered,
  not captured). A moved cup must go to a different cell.
- Three **visible** cups of one color in a row, column or diagonal win. If, after a move, the
  opponent shows a line (for instance because the mover lifted a cup that covered it), the
  **opponent wins**, even when the mover also shows a line.
- Draws: the same position (stacks, reserves, side to move) three times, or 120 plies.

## States and actions

`GobbleState`: `board` (a stack per cell, bottom first; piece = owner·4 + size), `reserve` per
seat by size, `toMove`, `history`, `keys`, `result`, validated by replay. Actions: `R2>4` (reserve
cup of size 2 onto cell 4) or `3>4` (move the top cup of cell 3 onto cell 4).

## Modes and difficulty

vs Computer (Orange or Blue), Two Players, Watch AI. Generic alpha-beta (`AlphaBetaAgent`) with a
transposition table and an evaluation of visible two-in-a-rows, large cups (they cannot be
covered) kept in reserve or shown, and the center.

| Level  | Search                               |
| ------ | ------------------------------------ |
| Easy   | 2 plies; random move 25% of the time |
| Medium | 4 plies                              |
| Hard   | Iterative deepening for about 1 s    |

Measured (seeded, seats alternated): Easy vs Random 10–0, Medium vs Easy 10–0, Hard vs Medium 6–4
(the first player has a strong advantage in this game).

## Achievements

| id                         | Condition                                         |
| -------------------------- | ------------------------------------------------- |
| `first-win`                | Win against the computer.                         |
| `beat-medium`, `beat-hard` | Beat each level.                                  |
| `mover`                    | Win a game in which you moved a cup on the board. |
| `no-big-cups`              | Win without using a large cup.                    |
| `hot-seat`                 | Finish a two-player game.                         |

## Controls

Tap a cup in your reserve (or one of your visible cups on the board), then a highlighted target
cell. Colored dots in a cell's corner show the covered cups. Keyboard: Tab through reserve slots
and cells, Enter chooses; `U`/`H`/`R`/`N`.

## Graphics and audio

Green board, original top-view cup art (size, rim, highlight) in orange and blue, reserves with
counts, highlighted targets, glowing winning line, dashed hint. Place and cover sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `stacking-gobblers` v`1.0.0`; codec: reserve size s onto
cell c → (s−1)·9 + c, move f → c → 27 + 9f + c (`actionSpaceSize` 108); tensor `[6, 3, 3]` (own and
opponent cups of each size anywhere in a stack). Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

27 opening placements, covering only smaller cups, three visible in a row wins, lifting a cup that
uncovers an opponent line loses, codec bijective, strength ordering (seeded), save round trip and
tamper rejection, contract suite, e2e desktop + mobile.
