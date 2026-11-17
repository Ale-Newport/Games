# #167 Breakout

The simulation, rule sets, players and drawing live in the shared brick core `../shared/bricks/`
(`sim.ts`, `rules.ts`, `definition.ts`) on the shared arcade shell `../shared/arcade/`. This folder
binds them: `definition.ts` (strings and achievements), `Game.tsx`, `ai-adapter.ts`,
`HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg`, `tests/`.

## Specification

The classic wall-breaking game, on the shared brick core (`shared/bricks`) and arcade shell.

### Ruleset (`breakout-six-walls`, v2)

Six walls of eight rows by ten columns, in four colour bands (red, orange, green, yellow from the
top) worth 7, 5, 3 and 1 points a brick. Every brick breaks in one hit. Three balls for the whole
game. Breaking bricks in the top four rows speeds the ball up (from 4 to at most 7.5 px a step). The
first time a ball reaches the top wall the paddle shrinks from 64 to 40 px. Clearing a wall brings
the next (the paddle back to full size, the ball back to its starting speed); clearing the sixth
ends the game with the maximum 1340 points.

| #   | Wall         | Bricks | Points | Shape                                                      |
| --- | ------------ | ------ | ------ | ---------------------------------------------------------- |
| 1   | Classic      | 80     | 320    | Eight full rows.                                           |
| 2   | Checkerboard | 40     | 160    | Alternate bricks, row by row.                              |
| 3   | Pyramid      | 60     | 192    | A narrow peak (the valuable top rows) on four full rows.   |
| 4   | Window       | 60     | 240    | A hollow frame: break in and the ball rattles inside.      |
| 5   | Pillars      | 56     | 248    | A two-row roof on four pillars, with shafts between them.  |
| 6   | Chevrons     | 48     | 180    | Diagonal bands and side pockets that throw the ball about. |

The walls are original patterns in the spirit of the plain game (no gold or tough bricks); their
data is `BREAKOUT_WALLS` in `../shared/bricks/rules.ts`.

### Physics (shared brick core)

A 360 × 480 field at 60 steps a second. The ball (7 px) moves along x then y each step, bouncing off
the side and top walls and off any brick it enters (which takes a hit); off the paddle it leaves at
an angle set by where it struck, from vertical (centre) to 60° (edge). A ball that has broken
nothing for ten seconds is turned 15–40° off its course at the next paddle touch, so that no loop
can stall a wall forever. A missed ball is gone; with none left a life is lost and the next ball
waits on the paddle until launched or for two seconds.

### Players (watch mode and AI Lab)

- `planner`: meets the falling ball where it will land (unfolding wall bounces), striking it with
  the side of the paddle that steers it towards the remaining bricks; launches at once; catches
  capsules and fires the laser under bricks.
- `follower`: follows the lowest ball.

Measured (a scratch bench over seeds 1–10): both players cleared all six walls in all 10 runs
(1340 points), in about 12 minutes of play (planner 11.6, follower 12.2); the paddle is quicker than
the ball, so these players never miss — the challenge is for human hands.

### States and actions

`Bricks`: rule set, generator, wall number, bricks (position, hits left, gold, row), balls, the
waiting ball's countdown, paddle position and width, lives, score, speed, capsules, laser shots,
power timers, laser cooldown, capsules caught, the shrunk flag, steps since a brick broke, the end,
whether a wall was cleared, the step's events. Actions per step: `left`, `right`, `idle`, `fire`,
`left-fire`, `right-fire` (fire launches the waiting ball).

### Saves and AI interface

Leaving a run for the menu saves it (schema 1, structurally validated) to resume. Env `breakout`
v`2.0.0`: kind `real-time` (60 Hz), one seat, the score as return; a 30-minute step limit.

### Achievements

| id        | Condition              |
| --------- | ---------------------- |
| `first`   | Reach the top wall.    |
| `wall`    | Clear the first wall.  |
| `both`    | Clear all six walls.   |
| `perfect` | Score all 1340 points. |

### Graphics and audio

Coloured brick bands with a highlight edge, a violet paddle, a white ball with a short trail (none
with reduced motion); synthesized sounds for the paddle, walls, bricks, a lost ball, a cleared wall
and the end.

### Testing criteria

Walls built, launching, a brick broken and scored by row, angled paddle returns, a lost ball and
life, the shrinking paddle, landing prediction, the planner clearing the whole game (1340); the
walls themselves (six, distinct, the classic one first, ten columns a row, plain bricks only, every
brick reachable by the ball, each cleared by the planner, each leading to the next and the last
ending the game); the
contract suite; UI: a run lost by an idle paddle with touch input and the result recorded, watch
mode scoring. E2E desktop + mobile.
