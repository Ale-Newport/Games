# #033 Quarto — Game Specification

## Ruleset (`quarto-standard`)

- A 4×4 board and 16 distinct pieces, each with four binary traits: **tall/short**, **dark/light**,
  **square/round**, **hollow/solid**.
- Player 1 opens by choosing a piece for Player 2. From then on each turn the player **places** the
  piece they were given on an empty cell and **chooses** the next piece for the opponent.
- A player who completes a line of four (row, column or one of the two diagonals) whose pieces all
  share at least one trait — all tall, all dark, all square, all hollow, or all the opposites —
  wins at once. The announcement ("Quarto!") is automatic, so there is no claiming rule.
- A full board without such a line is a draw. Player 1 always makes the opening give; in the
  menu players choose which seat they take.

## States and actions

`QuartoState`: `board` (piece id 0–15 or −1 per cell), `inHand` (piece to place, −1 before the
first give), `toMove`, `history`, `result` (winner and line, or draw), validated by replay.
Actions: `give:7` (opening), `5:give:12` (place on cell 5, give piece 12), or `5` when that
placement wins or is the last one.

## Modes and difficulty

vs Computer, Two Players, Watch AI. `QuartoSearchAgent`: negamax alpha-beta over whole turns with
iterative deepening; winning placements first; pieces that would hand the opponent an immediate
win are only given when nothing else is left; leaves are scored by the number of safe pieces left.

| Level  | Search                                                     |
| ------ | ---------------------------------------------------------- |
| Easy   | One turn (takes wins, avoids giving one); 30% random moves |
| Medium | Two full turns                                             |
| Hard   | Iterative deepening for about 1 s                          |

Measured (seeded, seats alternated): Easy vs Random 10–0, Medium vs Easy 9–0–1, Hard vs Medium
8–0–2.

## Achievements

| id                         | Condition                                   |
| -------------------------- | ------------------------------------------- |
| `first-win`                | Win against the computer.                   |
| `beat-medium`, `beat-hard` | Beat each level.                            |
| `early-quarto`             | Win with at most eight pieces on the board. |
| `stalemate-hard`           | Draw against Hard.                          |
| `hot-seat`                 | Finish a two-player game.                   |

## Controls

Tap a cell to place the piece in hand (a winning or final placement plays at once), then a piece
from the pool to give it; the opening move is only a give. Keyboard: Tab through cells and pieces,
Enter chooses; `U`/`H`/`R`/`N`.

## Graphics and audio

Round wooden board with 16 sockets; original top-view pieces (size = tall/short, color, outline =
square/round, a hole = hollow); "to place" slot and the pool of remaining pieces; the winning line
glows; dashed hint on the suggested cell and piece. Place and give sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `quarto` v`1.0.0`; codec: give p → p, place c → 16 + c,
place c and give p → 32 + 16c + p (`actionSpaceSize` 288); tensor `[9, 4, 4]` (occupied, then
each trait set/unset per cell). Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Lines sharing a set or an unset trait win, mixed lines do not; give/place alternation and
immediate end on a winning placement (no give); the engine never hands over a winning piece when a
safe one exists; codec bijective over full games; strength ordering (seeded); save round trip and
tamper rejection; contract suite; UI (give, place-and-give, win); e2e desktop + mobile.
