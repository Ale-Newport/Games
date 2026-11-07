# #168 Enhanced Brick Breaker — Game Specification

A brick breaker with designed walls, tough and gold bricks and power capsules, on the shared brick
core and arcade shell.

## Ruleset (`brick-breaker-five-walls`)

Five original walls. Bricks take one, two or three hits (blue, violet, plum, with the hits left
written on them); gold blocks never break and are not needed to clear a wall. Bricks score 10, 10,
8, 8, 6, 6 and 4 points by row. Three lives. Each broken brick has a 14% chance of dropping a capsule;
caught with the paddle: **W** a wider paddle (96 px, 15 s), **M** two more balls, **S** slower balls
(65%, 10 s), **L** a laser (two shots per press, 10 s), **+** an extra life. Clearing the fifth wall
ends the game.

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

Measured (`bricks-bench`, 40 runs, 15-minute cap): the planner averaged 1998 points and cleared all
five walls in 33 runs; the follower averaged 1658 and never finished within the cap (it plays slow,
steep rallies).

## States and actions

As #167 (`Bricks`), with capsules, shots and timers in use. Actions: `left`, `right`, `idle`, `fire`,
`left-fire`, `right-fire` (fire launches and shoots the laser).

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `brick-breaker` v`1.0.0`: kind `real-time` (60
Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id         | Condition             |
| ---------- | --------------------- |
| `first`    | Clear the first wall. |
| `capsules` | Catch a capsule.      |
| `all`      | Clear all five walls. |
| `score`    | Score 1500 points.    |

## Graphics and audio

Bricks coloured and numbered by hits left, gold blocks, lettered capsules in their own colours, a
red paddle while the laser is on, laser bolts, ball trails (none with reduced motion); synthesized
sounds for hits, dents, gold, capsules, lasers, lost balls, cleared walls and the end.

## Testing criteria

The shared core's tests (walls, launching, scoring, angles, lives, capsules, landing prediction)
plus this game's rule binding, the contract suite; UI: a run lost by an idle paddle, watch mode
scoring. E2E desktop + mobile.
