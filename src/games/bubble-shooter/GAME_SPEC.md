# #199 Bubble Cannon — Game Specification

A bubble shooter with an original name and look.

## Ruleset (`bubble-cannon`)

- **Board**: a 200 × 320 view; a honeycomb of bubbles (radius 10) in rows of 10 and 9 alternately,
  hanging from the ceiling. A dashed line near the bottom; a bubble stuck in the last row it allows
  ends the game.
- **The cannon** aims across 65 angles from 80° left to 80° right of straight up (`left`/`right`
  turn it by half a step a step; `aim-k` sets it, as a finger does; `fire` shoots; `shoot-k` sets
  and shoots at once). It fires the current bubble at 8 px a step; it bounces off the side walls and
  sticks at the nearest free cell when it touches a bubble or the ceiling. `swap` exchanges the
  current and next bubbles. A finger aims while down and fires when it lifts.
- **Popping**: a group of three or more of one colour including the new bubble pops (10 points
  each); bubbles then no longer connected to the ceiling drop (20 each).
- **New rows**: each shot that pops nothing counts down; at zero a new random row is added at the
  top and the honeycomb moves down one row. The count is 8 − level shots, never fewer than 4.
- **Levels**: level n starts with min(9, 4 + n) rows of min(6, 3 + n) colours (neighbours along a
  row share a colour 35 % of the time). Clearing the board scores 1000 × level and, after a short
  pause, starts the next level. Only colours still on the board come up in the cannon.
- **Score**: pops, drops and clears; one game until the line is reached.

## Players (watch mode and AI Lab)

- `aimer`: for the current bubble and (if different) the next, tries all 65 angles with the real
  flight code and fires the best: anything that pops scores 100 + 10 per pop + 25 per drop; a shot
  that pops nothing scores 12 per same-coloured neighbour, minus 4 per row down (minus 500 near the
  line). It swaps first when the next bubble is better.
- `sprayer`: fires straight at the nearest bubble of its colour (anywhere if none), without
  considering what is in the way.

Measured (6 seeds, 10-minute limit): the aimer was still playing after 10 minutes in all six, on
levels 7–11 with 35 660–73 180 points (404–436 shots); the sprayer was buried on level 1 after
15–27 shots (120–760 points).

## States and actions

`Bubbles`: generator, the honeycomb and its row parity, colours, level, aim, current and next
bubble, the bubble in flight, shots before a new row, shots, popped, dropped, score, the level-clear
pause, whether a finger is aiming, the step's events, steps.

## Saves and AI interface

Leaving a game for the menu saves it to resume. Env `bubble-shooter` v`1.0.0`: kind `real-time` (60
Hz), one seat, the score as return; a 30-minute step limit. 135 actions: `idle`, `left`, `right`,
`fire`, `swap`, `aim-0…64`, `shoot-0…64`.

## Achievements

| id       | Condition                                   |
| -------- | ------------------------------------------- |
| `pop`    | Pop a group of bubbles.                     |
| `drop`   | Drop bubbles by popping what holds them up. |
| `clear`  | Clear a board.                              |
| `level5` | Reach level 5.                              |

## Graphics and audio

A deep-blue backdrop, glossy bubbles in six colours each with its own dark mark (dot, ring, cross,
triangle, square, plus) for colour-blind play, a dashed red line, a cannon that turns with the aim,
a dotted aiming guide along the first stretch (bank shots shown), the next bubble with a swap sign,
pips for the shots left before a new row (red when two or fewer) and the clear bonus. Synthesized
sounds for firing, sticking, popping, dropping, swapping, new rows, clears and the end.

## Testing criteria

The first board; mutual neighbours; a straight shot landing where the AI predicts; wall bounces;
popping and dropping with their points (and a clear); the countdown and the new row; the line
ending the game; the next level; swapping; aiming with a finger; the aimer playing five minutes on
three seeds while the sprayer is buried on level 1; exact replays. The contract suite; UI: firing
straight until buried, watch mode. E2E desktop + mobile.
