# #003 Ultimate Tic-Tac-Toe — Game Specification

## Ruleset (`ultimate-standard`)

The widely played competitive ruleset:

- The board is a 3×3 grid of **local boards**, each a 3×3 Tic-Tac-Toe board (81 cells).
- **X** (seat 0) moves first and may play in any cell of any local board.
- **Sending rule:** a move in cell _c_ (0–8, row-major) of a local board sends the opponent to the
  local board in position _c_ of the global grid; they must play there.
- **Free choice:** if the board they are sent to is already decided (won or full), they may play
  in any empty cell of any undecided local board.
- A local board is **won** by the first player to get three in a row in it. It is then closed: no
  more moves may be made there, and it counts as that player's mark on the global board.
- A local board that fills up without a line is **drawn**: closed, and it counts for nobody.
- The game is **won** by the first player to win three local boards in a row (row, column or
  diagonal of the global grid).
- If every local board is decided and nobody has three in a row globally, the game is a **draw**.
  (No tie-break by number of boards won — documented choice; some casual rulesets use one.)
- Match option _Alternate who starts each round_ (default on).

## States

`cells[81]` (index = board × 9 + cell; 0 empty, 1 X, 2 O), `boards[9]` (0 open, 1 won by X,
2 won by O, 3 drawn), `forced` (index of the board the mover must play in, or −1 for free choice),
`toMove`, `firstPlayer`, `history[]`, `result` (win with the three global board indices, or draw).

## Actions

`place(i)`, `i ∈ 0..80`. Legal iff the game is not over, cell `i` is empty, its board is open, and
`forced` is −1 or equals `⌊i / 9⌋`. UI actions as in the shared two-player shell: undo, hint,
restart, next round, menu, pause/step in watch mode.

## Modes and difficulty

vs Computer (play as X or O), Two Players (hot-seat), Watch AI.

| Level  | Agent                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Easy   | Alpha-beta 2 plies with the Ultimate heuristic; random move 35% of the time                                                                                   |
| Medium | Alpha-beta, iterative deepening to 4 plies within 150 ms, heuristic                                                                                           |
| Hard   | Monte Carlo Tree Search (UCT), up to 20,000 simulations within 600 ms (chosen by measurement: 13–2–1 vs Medium, 6–2–4 vs time-limited alpha-beta to depth 10) |

Ultimate heuristic (from the evaluated player's perspective): won boards weighted by position
(center 3, corners 2, edges 1.5); global lines open to one side weighted by boards held (1 → 2,
2 → 10); in open local boards, two-in-a-row threats (+0.5 × board weight); a small penalty for
giving the opponent free choice. Squashed with tanh. Exact solving is not feasible (the game tree
is enormous), so no level is claimed to be perfect.

## Scoring, statistics, achievements

Scoreboard X / O / draws; stats per round (`vs-ai:<level>`, `local`).

| id                | Condition                                                                |
| ----------------- | ------------------------------------------------------------------------ |
| `first-win`       | Win a round against the computer.                                        |
| `beat-medium`     | Beat Medium.                                                             |
| `beat-hard`       | Beat Hard.                                                               |
| `diagonal-boards` | Win with a global diagonal.                                              |
| `comeback`        | Win after the opponent had won more local boards than you at some point. |
| `hot-seat`        | Finish a two-player round.                                               |

## Controls

Click/tap a cell. Keyboard: arrows/WASD move the cursor over the 9×9 grid; Enter/Space place;
digits 1–9 (keypad layout) place in the cell of the **forced** board (ignored on free choice);
`U` undo, `H` hint, `R` restart, `N` next round.

## Graphics and audio

Custom SVG/CSS board: 3×3 local boards with gaps; playable boards glow (accent outline), others
dim; won boards show a large animated X/O over their faded cells; drawn boards greyed; last move
and hint markers; global winning line across board centers; player colors from tokens, colorblind
palette, reduced motion. Sounds: shared placement/win/lose/draw/invalid/hint plus a distinct
"board captured" chime.

## Save format (`schema 1`)

Shared two-player match envelope; the round state is validated by replaying its history.

## AI interface

Env `ultimate-tic-tac-toe` v`1.0.0`, ruleset `ultimate-standard`, turn-based, 2 players,
deterministic, perfect information, zero-sum. Action = cell 0–80 (`actionSpaceSize` 81).
Observation tensor `[4, 9, 9]` in the 9×9 visual layout: own marks, opponent marks, legal-move
mask, X-to-move plane. Config `{ firstPlayer?: 0 | 1 }`. Agents: `random`, `easy`, `medium`, `hard`.

## Testing criteria

Sending rule; free choice when sent to a won or full board; local win closes the board;
drawn local board; global row/column/diagonal win; drawn boards never count; draw when all boards
closed; illegal moves (wrong board, closed board, occupied); undo/replay; random-playout stress via
the contract suite; agent strength ordering (seeded); UI and e2e on desktop and mobile.
