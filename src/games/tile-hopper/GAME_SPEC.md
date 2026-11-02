# #187 Cube Hopper — Game Specification

An isometric pyramid-hopping game in the classic recolour-the-cubes mould, with an original name
and look: a teal hopper, bouncing balls, a chasing spring and floating discs.

## Ruleset (`cube-hopper`)

A pyramid of 7 rows (28 cubes) at 60 steps a second. The hopper hops diagonally (up-left, up-right,
down-left, down-right); a hop takes 18 steps and the hopper is out of reach in mid-air. Each landing
changes the cube's top: on level 1 once finishes it, on level 2 it takes two, on level 3 each
landing toggles it. A colour change towards the goal scores 25. Hopping off the pyramid is a fall,
unless one of the two discs floats there (beside a middle row, one each side): the hopper rides it
to the top in 1.5 s, the balls vanish, and a spring within two cells jumps after it and falls (500).
Balls drop on to the second row every few seconds (sooner on later rounds and levels) and bounce
down a row at a time, left or right at random: red ones kill on contact; a purple one, on reaching
the bottom row, hatches into a spring that hops towards the hopper (or where it is landing); a
green one (rare) freezes everything for 4 s when caught (100). Rounds: four per level, three levels
(the third repeats); clearing a round scores 1000 + 250 per earlier round of the level + 50 per
unused disc. Three lives, one more every 8000.

## Players (watch mode and AI Lab)

- `planner`: breadth-first through the pyramid to the nearest cube still to be done (or a green
  ball), never through cells a ball or the spring could reach in the next hop or two near it; with
  the spring within two cells and a disc in reach it takes the disc; with nothing safe it stays put
  or steps to any safe neighbour.
- `eager`: hops towards the nearest unfinished cube, ignoring everything else.

Measured (8 runs each, 15-minute cap): planner averaged 14 291 points and 5.3 rounds cleared
(147 s), luring the spring off 22 times in all; eager 9213 points and 4.0 rounds (71 s).

## States and actions

`Cubes`: generator, level, round, cube tops, hopper (cell, hop target and time), facing, balls
(cell, hop, kind, wait), spring, discs, disc ride, freeze, next ball, lives, score, next extra life,
death and clear pauses and the cause, the step's events, steps, springs lured. Actions: `idle` and
the four diagonal hops.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `tile-hopper` v`1.0.0`: kind `real-time` (60 Hz),
one seat, the score as return; a 30-minute step limit.

## Achievements

| id       | Condition                        |
| -------- | -------------------------------- |
| `round`  | Clear a round.                   |
| `lure`   | Lure the spring off the pyramid. |
| `level2` | Reach level 2.                   |
| `score`  | Score 15 000 points.             |

## Graphics and audio

Isometric cubes with slate sides and tops in blue, purple (level 2's middle step) and yellow, a
target swatch, spinning colour-cycling discs, red, purple and green balls, a purple coiled spring
with yellow eyes, a teal hopper with big eyes that look the way it hops, a pale wash while frozen,
cubes flashing white as a round clears. Synthesized sounds for hops, colour changes, discs, lures,
hatching, the freeze, being caught, falling, clears and extra lives.

## Testing criteria

The pyramid, hops, landings and falls; two-step and toggling levels; discs and luring; red and
green balls; hatching and chasing; clearing rounds and reaching level 2; the planner outscoring the
eager hopper; exact replays. The contract suite; UI: a hop colouring a cube and the end; watch mode.
E2E desktop + mobile.
