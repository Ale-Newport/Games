# #175 Falling Blocks Classic — Game Specification

A falling-block puzzle following the late-eighties console conventions, under a generic name with
original art (catalog id `falling-blocks-classic`), on the shared falling-blocks core and arcade
shell.

## Ruleset (`falling-blocks-classic`)

A 10 × 20 well (two hidden rows above), 60 steps a second.

- **Pieces**: drawn from eight (the eighth, or a repeat of the last piece, rerolls once from seven);
  one piece of preview; no hold.
- **Moves**: rotation both ways without wall kicks; sideways with a 16-step auto-repeat delay and a
  6-step repeat; soft drop (one row every two steps at most, a point a row); no hard drop, no ghost.
- **Locking**: when gravity can no longer move the piece down; then a 10-step entry delay (20 after
  a clear, with the rows flashing).
- **Gravity**: the classic frames-per-row table — 48, 43, 38, 33, 28, 23, 18, 13, 8, 6 for levels
  0–9; 5 for 10–12; 4 for 13–15; 3 for 16–18; 2 for 19–28; 1 from 29.
- **Levels**: start at 0, 9 or 18; the first level-up after min(10 × start + 10, max(100,
  10 × start − 50)) lines, then every ten lines.
- **Scoring**: 40, 100, 300 and 1200 × (level + 1) for one to four lines. Play until you top out.

Simplification, stated honestly: pieces rotate inside their own boxes as in the modern game (the
original console used slightly different pivots), and the entry delay does not depend on the height
the piece locked at.

## Players (watch mode and AI Lab)

- `planner`: for the current piece, every rotation and column reachable by rotating at the spawn
  height and sliding is dropped and the resulting board scored with the published El-Tetris weights
  (landing height −4.50, rows cleared × piece cells cleared 3.42, row transitions −3.22, column
  transitions −9.35, holes −7.90, well sums −3.39); the best is keyed in — rotate, tap sideways
  (alternating presses with releases), drop. Results are cached per board.
- `dropper`: drops each piece where it appears.

Measured (`blocks-bench`, 30-minute cap): the planner was still playing after 30 minutes from level 0
(about 1120 lines, 2.8 million points); the dropper tops out within about five seconds.

## States and actions

As #174 (`Blocks`). Actions are the held controls packed: `L`/`R` move, `C`/`A` rotate, `S` soft
drop (18 combinations and `idle`).

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `falling-blocks-classic` v`1.0.0`: kind
`real-time` (60 Hz), one seat (config `{ options: { start } }`), the score as return; a 30-minute step
limit.

## Achievements

| id        | Condition                            |
| --------- | ------------------------------------ |
| `first`   | Clear a line.                        |
| `four`    | Clear four lines with one piece.     |
| `hundred` | Clear 100 lines.                     |
| `ten`     | Climb to level 10 by clearing lines. |

## Graphics and audio

As #174 without the ghost, hold box or callouts, and with one preview piece.

## Testing criteria

The classic gravity table and scoring (a four at level 5 worth 7200 plus soft-drop points), the
reroll draw with one preview, presses and slower auto-repeat, the planner clearing lines; the
contract suite; UI: a run topped out, watch mode clearing lines. E2E desktop + mobile.
