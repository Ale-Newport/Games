# #167 Breakout — Game Specification

The classic wall-breaking game, on the shared brick core (`shared/bricks`) and arcade shell.

## Ruleset (`breakout-two-walls`)

The wall: eight rows of ten bricks in four colour bands (red, orange, green, yellow from the top),
worth 7, 5, 3 and 1 points. Three balls. Breaking bricks in the top four rows speeds the ball up
(from 4 to at most 7.5 px a step). The first time a ball reaches the top wall the paddle shrinks
from 64 to 40 px. Clearing the wall brings a second, identical wall (the paddle back to full size);
clearing both ends the game with the maximum 896 points.

## Physics (shared brick core)

A 360 × 480 field at 60 steps a second. The ball (7 px) moves along x then y each step, bouncing off
the side and top walls and off any brick it enters (which takes a hit); off the paddle it leaves at
an angle set by where it struck, from vertical (centre) to 60° (edge). A ball that has broken
nothing for ten seconds is turned 15–40° off its course at the next paddle touch, so that no loop
can stall a wall forever. A missed ball is gone; with none left a life is lost and the next ball
waits on the paddle until launched or for two seconds.

## Players (watch mode and AI Lab)

- `planner`: meets the falling ball where it will land (unfolding wall bounces), striking it with
  the side of the paddle that steers it towards the remaining bricks; launches at once; catches
  capsules and fires the laser under bricks.
- `follower`: follows the lowest ball.

Measured (`bricks-bench`, 40 runs): both players cleared both walls in all 40 (896 points), in
about 5 minutes of play; the paddle is quicker than the ball, so these players never miss — the
challenge is for human hands.

## States and actions

`Bricks`: rule set, generator, wall number, bricks (position, hits left, gold, row), balls, the
waiting ball's countdown, paddle position and width, lives, score, speed, capsules, laser shots,
power timers, laser cooldown, capsules caught, the shrunk flag, steps since a brick broke, the end,
whether a wall was cleared, the step's events. Actions per step: `left`, `right`, `idle`, `fire`,
`left-fire`, `right-fire` (fire launches the waiting ball).

## Saves and AI interface

Leaving a run for the menu saves it (schema 1, structurally validated) to resume. Env `breakout`
v`1.0.0`: kind `real-time` (60 Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id        | Condition             |
| --------- | --------------------- |
| `first`   | Reach the top wall.   |
| `wall`    | Clear the first wall. |
| `both`    | Clear both walls.     |
| `perfect` | Score all 896 points. |

## Graphics and audio

Coloured brick bands with a highlight edge, a violet paddle, a white ball with a short trail (none
with reduced motion); synthesized sounds for the paddle, walls, bricks, a lost ball, a cleared wall
and the end.

## Testing criteria

Walls built, launching, a brick broken and scored by row, angled paddle returns, a lost ball and
life, the shrinking paddle, landing prediction, the planner clearing the classic game (896); the
contract suite; UI: a run lost by an idle paddle with touch input and the result recorded, watch
mode scoring. E2E desktop + mobile.
