# #176 Maze Chase — Game Specification

A maze chase with an original name, mazes and art, on the shared maze core (`shared/maze`) and
arcade shell.

## Maze generation

Mazes are generated, not drawn: corridor junctions sit on a lattice of odd coordinates; starting
from every link open, links are removed in mirror-image pairs in an order fixed by the maze's seed,
as long as every junction keeps two ways out (no dead ends) and the maze stays connected. A walled
house with a door on top sits in the middle; a tunnel row wraps round both sides.

## Ruleset (`maze-classic`)

A maze 19 tiles wide and 21 high on a 60 Hz clock; positions are kept in eighths of a tile and
turns happen at tile centres (a turn asked for early waits for the next junction; reversing is
immediate). Seeds are worth 10, the four power cells 50. Four sentinels leave the walled house in
turn (by seeds eaten, or after four seconds without eating) and alternate scatter spells in their
corners (7, 7, 5, 5 s) with chase spells (20 s; the last one lasts for ever), each chasing in its
own way: the first heads for the rover's tile, the second for four tiles ahead of it, the third for
the point that puts the rover between it and the first, the fourth chases from afar but drifts to
its corner when close. Each picks, at each junction and never turning back, the way that is
shortest through the corridors to its target. A power cell turns them blue (6 s on level 1, 0.75 s
less a level, at least 1 s): they slow, wander at random and can be caught for 200, 400, 800 and
1600; their eyes race home and they come out again. Touching a hunting sentinel costs a life (three,
one more at 10 000). A bonus gem appears after 70 and 170 seeds for 9.5 s (100 up to 5000 by
level). Clearing the maze starts the next level, a little faster for everyone.

One maze (generated from seed 7), the gem waits below the house; sentinels never deviate from
their rule.

## Players (watch mode and AI Lab)

- `runner`: at each tile it scores every way it can go: how much sooner it reaches the nearest seed
  (power cells count more with a sentinel near), blue sentinels it can reach while they are blue,
  the gem, and above all its safety margin — how many tiles ahead of the nearest hunting sentinel
  it would be.
- `grazer`: heads for the nearest seed and ignores the sentinels.

Measured (8 runs each, 30-minute cap): runner avg 8494 points, 1.0 maze cleared, 97 s; grazer 4071, 0.38, 50 s; standing still 40 points, 37 s.

## States and actions

`MazeGame`: rule set, generator, level, maze, seeds left, rover (position, direction, wanted turn),
sentinels (position, direction, mode: house, leaving, active, frightened, eyes; release count),
scatter/chase phase, blue time, catch combo, gem, lives, score, the death and level-clear pauses,
the step's events, steps. Actions per step: `up`, `down`, `left`, `right`, `idle`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `maze-chase` v`1.0.0`: kind `real-time` (60 Hz),
one seat, the score as return; a 30-minute step limit.

## Achievements

| id      | Condition                                     |
| ------- | --------------------------------------------- |
| `hunt`  | Catch a blue sentinel.                        |
| `combo` | Catch all four sentinels with one power cell. |
| `clear` | Clear a maze of seeds.                        |
| `score` | Score 10 000 points.                          |

## Graphics and audio

Dark blocks with bright teal edges for walls, a pink door, small gold seeds and pulsing power rings;
the rover is a cyan rounded square with a visor facing its way (it shrinks away when caught); the
sentinels are coloured diamonds with one eye looking where they go, dark blue (blinking at the end)
while frightened, just an eye when going home; the gem is a hexagon. The walls flash as a level
clears. Synthesized sounds for seeds, power cells, catches, the gem, being caught, extra lives and
clearing.

## Testing criteria

Mazes symmetric, connected and without dead ends, the tunnel wrapping; moving and stopping at
walls; seeds and power cells scoring; blue sentinels caught for 200 then 400; eyes going home and
coming back out; lives and the game's end; clearing a level (and the maze changing in the advanced
game); a still player caught within a minute; the runner beating the grazer; exact replays. The
contract suite; UI: steering, scoring and being caught; watch mode. E2E desktop + mobile.
