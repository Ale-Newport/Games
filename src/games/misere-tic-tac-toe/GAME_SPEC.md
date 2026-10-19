# #004 Misère Tic-Tac-Toe — Game Specification

## Ruleset (`misere-3x3`)

- 3×3 board, X (seat 0) moves first in round 1; players alternate placing marks in empty cells.
- **Completing a line of three of your own marks (row, column or diagonal) loses immediately**;
  the opponent wins. (Also called "Notakto-style" or "toetac-tic" in the literature; here both
  players have their own marks, the classical misère form.)
- If the board fills with no line completed, the round is a draw.
- Match option _Alternate who starts each round_ (default on).

Known theory, proven by our exact solver test (`src/games/shared/mnk/tests/solver.test.ts`):
the game is a draw with perfect play, and **the center is the only opening that does not lose for
X** — every other first move loses against perfect play. (After a center opening, X can hold the
draw by answering each O move with the point-symmetric cell.)

## States, actions, flow

Shared m,n,k family (`src/games/shared/mnk/`): `board[9]`, `toMove`, `history`, `firstPlayer`,
`result` (`reason: 'misere-line'` with the completed line and the _winner_ = the other player, or a
draw). Action `place(cell)`, cell 0–8. UI: undo, hint, restart, next round, menu; watch mode.

## Modes and difficulty

vs Computer (X or O), Two Players, Watch AI.

| Level   | Agent                                                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Easy    | Alpha-beta 2 plies with the misère line heuristic; random move 45% of the time                                                                                      |
| Medium  | Alpha-beta 4 plies with the misère heuristic; random move 10% of the time                                                                                           |
| Perfect | Exact solver (`MnkSolverAgent`, misère); never loses; among value-preserving moves prefers the position the misère heuristic rates best, then breaks ties at random |

Misère heuristic: the open-line heuristic with the sign flipped (owning open lines is a liability).

## Scoring, statistics, achievements

Scoreboard and stats as in #001.

| id             | Condition                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `first-win`    | Win a round against the computer.                                                                              |
| `beat-medium`  | Beat Medium.                                                                                                   |
| `perfect-draw` | Draw against Perfect.                                                                                          |
| `squeeze`      | Win (not watch) when your opponent's last move was forced: every empty cell would complete one of their lines. |
| `win-as-o`     | Beat the computer while playing O.                                                                             |
| `hot-seat`     | Finish a two-player round.                                                                                     |

## Controls

Click/tap; arrows/WASD + Enter/Space; keypad digits 1–9 (7 8 9 = top row); `U`/`H`/`R`/`N`.

## Graphics and audio

Shared `MnkBoard`; the completed line is drawn in the **loser's** color, and the status shows an
extra line explaining who completed it. Shared sounds.

## Save format (`schema 1`) and AI interface

Shared match envelope. Env `misere-tic-tac-toe` v`1.0.0`, ruleset `misere-3x3`, turn-based,
2 players, deterministic, perfect information, zero-sum, action = cell 0–8, tensor `[3,3,3]`.
Agents `random`, `easy`, `medium`, `perfect` (exact oracle).

## Testing criteria

Completing a line loses for the mover (all 8 lines, both seats); draw on full board; a forced
completion on the last cell; exhaustive enumeration of positions; Perfect never loses against every
opponent reply sequence (both seats); Perfect vs Perfect draws; adapter contract; UI; e2e.
