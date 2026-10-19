# #009 Pente — Game Specification

## Ruleset (`pente-tournament-19x19`)

Standard Pente with the tournament opening rule:

- 19×19 board, intersections. **Black** (seat 0) always moves first (players choose a color).
- Black's first stone must be on the center point. **Tournament rule:** Black's second stone
  (move 3 of the game) must be at least 3 points from the center (Chebyshev distance ≥ 3).
- **Captures:** when a player places a stone that brackets exactly two opposing stones in a
  straight line (horizontal, vertical or diagonal), those two stones are removed. One move can
  capture several pairs. Exactly two — three or more in a row cannot be captured. Placing a stone
  into a bracketed position is safe (only the placing player captures).
- **Winning:** five or more stones in a row (overlines count), **or** five captured pairs (ten
  stones). Five-in-a-row is checked first after the move's captures are removed.
- A full board with no winner is a draw.

## States and actions

`board[361]`, `toMove`, `firstPlayer`, `history` (points), `captures[2]` (pairs captured per
seat), `lastCaptured` (points emptied by the last move — display only, deterministic from
history), `result` (five with the line, captures, or draw). Action: point 0–360.

## Modes and difficulty

vs Computer (Black or White), Two Players, Watch AI. Agents: the generic `AlphaBetaAgent` with a
Pente evaluation (5-point windows with tempo weighting, explicit four/double-four detection,
captured-pair values, vulnerable-pair risk and capture chances) and capture-aware candidate pruning:

| Level  | Agent                                                         |
| ------ | ------------------------------------------------------------- |
| Easy   | 1 ply over 12 candidates; random move 30% of the time         |
| Medium | 2 plies over 10 candidates                                    |
| Hard   | Iterative deepening up to 5 plies over 10 candidates (900 ms) |

Measured (seeded, with 8% randomness added to both sides for game variety): Easy vs Random 10–0,
Medium vs Easy 15–1, Hard (d5/k10) vs Medium 20–4 (avg 171 ms, max 485 ms). Development found and
fixed a horizon bug: without tempo-aware threat detection, 3- and 4-ply searches lost to 2-ply.

## Achievements

`first-win`, `beat-medium`, `beat-hard`, `capture-win` (win by five pairs), `double-capture`
(capture two pairs with one move at any point in the game), `hot-seat`.

## Controls, graphics, audio

Shared `GoBoard` at 19×19 (mouse; touch preview + confirm; arrows/Enter; `U`/`H`/`R`/`N`), wide side
layout. Live capture counter under the status; points emptied by the last capture shown as dashed
red circles; tournament-rule points marked and disabled on move 3; winning five line. Click sound,
plus a capture chime.

## Save format and AI interface

Shared two-player match envelope; rounds validated by replay. Env `pente` v`1.0.0`, ruleset
`pente-tournament-19x19`, action = point (`actionSpaceSize` 361), tensor `[4, 19, 19]` (own,
opponent, own captures/5, opponent captures/5); outcome `scores` = captured pairs. Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Center opening and tournament rule; captures in all directions, double captures, no capture of
three, safe move into a bracket; five and capture wins; random-game replay validation; contract
suite; agent tactics (blocks five, takes winning capture); UI; e2e.
