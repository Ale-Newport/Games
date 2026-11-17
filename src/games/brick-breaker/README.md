# #168 Enhanced Brick Breaker

The simulation, rule sets, players and drawing live in the shared brick core `../shared/bricks/`
(`sim.ts`, `rules.ts`, `definition.ts`) on the shared arcade shell `../shared/arcade/`. This folder
binds them: `definition.ts` (strings and achievements), `Game.tsx`, `ai-adapter.ts`,
`HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg`, `tests/`.

## Specification

A brick breaker with designed walls, tough and gold bricks and power capsules, on the shared brick
core and arcade shell.

### Ruleset (`brick-breaker-fifteen-walls`, v2)

Fifteen original walls, played in order with rising difficulty. Bricks take one, two or three hits (blue, violet, plum, with the hits left
written on them); gold blocks never break and are not needed to clear a wall. Bricks score 10, 10,
8, 8, 6, 6 and 4 points by row. Three lives. Each broken brick has a 14% chance of dropping a capsule;
caught with the paddle: **W** a wider paddle (96 px, 15 s), **M** two more balls, **S** slower balls
(65%, 10 s), **L** a laser (two shots per press, 10 s), **+** an extra life. Clearing a wall brings the
next (the ball back to its starting speed); clearing the fifteenth ends the game, with at most 5008
points.

| #   | Wall      | Shape                                                             |
| --- | --------- | ----------------------------------------------------------------- |
| 1   | Lintel    | A two-hit row over five plain rows.                               |
| 2   | Badge     | A tapered crest of three- and two-hit bricks, two gold studs.     |
| 3   | Lattice   | Staggered three- and two-hit bricks over a gold-studded band.     |
| 4   | Keep      | A plain frame around a three-hit block with a gold core.          |
| 5   | Layers    | Bands of three, two and one hits, gold ends and gold pairs.       |
| 6   | Stairs    | A staircase climbing from the right, toughest at its top step.    |
| 7   | Hourglass | Three-hit lids top and bottom, a gold waist.                      |
| 8   | Bridges   | A three-hit roof and a gold-and-two-hit bridge over open gaps.    |
| 9   | Fortress  | Gold side walls around rings of two and three hits, a gold heart. |
| 10  | Comb      | A three-hit spine with teeth of two and one, gold tips.           |
| 11  | Diamond   | Rings of three, two and one hits around a gold centre.            |
| 12  | Zigzag    | A diagonal band from top left to bottom right, broken by gold.    |
| 13  | Gates     | Two-hit rows behind three gold bars with openings to aim through. |
| 14  | Vault     | A gold shell, open above and below, around rings of three to one. |
| 15  | Crown     | Eight rows, mostly two and three hits, gold studs throughout.     |

Every breakable brick of every wall can be reached by the ball (no brick is sealed in by gold); the
data is `ENHANCED_WALLS` in `../shared/bricks/rules.ts`.

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

Measured (a scratch bench over seeds 1–10, 90-minute cap): both players cleared all fifteen walls
in all 10 runs (5008 points) — the planner in 47.9 minutes on average, the follower in 74.4 (it
plays slow, steep rallies). Each wall alone, started fresh, takes the planner from about 1 to 6
minutes.

### States and actions

As #167 (`Bricks`), with capsules, shots and timers in use. Actions: `left`, `right`, `idle`, `fire`,
`left-fire`, `right-fire` (fire launches and shoots the laser).

### Saves and AI interface

Leaving a run for the menu saves it to resume. Env `brick-breaker` v`2.0.0`: kind `real-time` (60
Hz), one seat, the score as return; a 90-minute step limit (a full game takes the planner about 48).

### Achievements

| id         | Condition                |
| ---------- | ------------------------ |
| `first`    | Clear the first wall.    |
| `capsules` | Catch a capsule.         |
| `all`      | Clear all fifteen walls. |
| `score`    | Score 1500 points.       |

### Graphics and audio

Bricks coloured and numbered by hits left, gold blocks, lettered capsules in their own colours, a
red paddle while the laser is on, laser bolts, ball trails (none with reduced motion); synthesized
sounds for hits, dents, gold, capsules, lasers, lost balls, cleared walls and the end.

### Testing criteria

The shared core's tests (walls, launching, scoring, angles, lives, capsules, landing prediction;
the walls themselves: fifteen, distinct, ten columns a row, something to break, every brick
reachable past the gold, rising toughness, each cleared by the planner, each leading to the next
and the last ending the game) plus this game's rule binding, the contract suite; UI: a run lost by an idle paddle, watch mode
scoring. E2E desktop + mobile.
