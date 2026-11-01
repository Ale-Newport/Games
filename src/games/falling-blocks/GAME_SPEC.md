# #174 Falling Blocks — Game Specification

A falling-block puzzle following the modern conventions, under a generic name with original art
(catalog id `falling-blocks`), on the shared falling-blocks core (`shared/blocks`) and arcade shell.

## Ruleset (`falling-blocks-modern`)

A 10 × 20 well (two hidden rows above), 60 steps a second.

- **Pieces**: the seven tetrominoes from a shuffled 7-bag; five pieces of preview; hold (swap with
  the held piece, once per piece).
- **Moves**: rotation both ways with the standard wall-kick tables (I separate); sideways with a
  10-step auto-repeat delay and a 2-step repeat; soft drop (20× gravity, 1 point a row); hard drop
  (2 points a row, locks at once); a ghost piece.
- **Locking**: half a second on the ground; a successful move or rotation there restarts it, up to
  15 times. A piece locked entirely above the visible well, or a spawn that does not fit, ends the
  game.
- **Gravity**: (0.8 − 0.007 × (level − 1))^(level − 1) seconds a row; level 1 to start, +1 every ten
  lines.
- **Scoring** (× level): single 100, double 300, triple 500, four 800; T-spins (a T locked right
  after a rotation with three of its four box corners filled) 400/800/1200/1600 for 0–3 lines;
  back-to-back fours or T-spin clears ×1.5; combos 50 × combo × level.
- **Modes**: marathon (150 lines) and sprint (40 lines, timed).

Simplification, stated honestly: T-spin minis are not distinguished from full T-spins.

## Players (watch mode and AI Lab)

- `planner`: for the current piece, every rotation and column reachable by rotating at the spawn
  height and sliding is dropped and the resulting board scored with the published El-Tetris weights
  (landing height −4.50, rows cleared × piece cells cleared 3.42, row transitions −3.22, column
  transitions −9.35, holes −7.90, well sums −3.39); the best is keyed in — rotate, tap sideways
  (alternating presses with releases), drop. Results are cached per board.
- `dropper`: drops each piece where it appears.

Measured (`blocks-bench`): the planner completed the 150-line marathon in every run (about 165 000
points in 98 s of game time — it hard-drops at once); the dropper tops out within a second or two.

## States and actions

`Blocks`: rule set, generator, board, the falling piece, queue, bag, hold, entry delay, rows being
cleared, level and starting level, lines and goal, score, gravity and lock counters, lock resets,
auto-repeat, the previous step's controls, last-rotation flag, combo, back-to-back, the last clear,
fours and T-spins, the end, won, the step's events, steps. Actions are the held controls packed:
`L`/`R` move, `C`/`A` rotate, `S` soft drop, `H` hard drop, `K` hold (54 combinations and `idle`);
presses are told from holds by comparing with the previous step.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `falling-blocks` v`1.0.0`: kind `real-time` (60
Hz), one seat, the score as return; a 30-minute step limit. Sprint times are recorded as times.

## Achievements

| id      | Condition                        |
| ------- | -------------------------------- |
| `first` | Clear a line.                    |
| `four`  | Clear four lines with one piece. |
| `tspin` | Score a T-spin.                  |
| `goal`  | Complete a marathon or a sprint. |

## Graphics and audio

Bevelled blocks in seven colours, a dark grid, an outlined ghost, the next five pieces and the hold
box beside the well, flashing rows as they clear (steady with reduced motion), T-spin, four and
combo callouts; synthesized sounds for moves, rotations, drops, locks, holds, clears, fours,
T-spins, levels, the goal and topping out.

## Testing criteria

Rotation states and kicks, the 7-bag, presses versus holds and auto-repeat, hard drop, a line
cleared and removed, gravity, the planner finishing a sprint; the contract suite; UI: a run topped
out with soft drop held, watch mode clearing lines. E2E desktop + mobile.
