# #178 Hedgehog Crossing — Game Specification

A crossing game with an original hedgehog, on the shared crossing core (`shared/crossing`) and
arcade shell.

## Ruleset (`crossing-burrows`)

A board 13 columns wide on a 60 Hz clock; positions across are kept in eighths of a column. Every
car, lorry, log, turtle and train moves at a steady speed along its lane and wraps round off-screen,
so where it is depends only on the step count. The hedgehog hops one cell per press (a hop takes 6
steps; holding repeats every 14 steps); it lands mid-column except in a river, where it rides
whatever it stands on. It is run over if a vehicle overlaps it on a road or railway (even mid-hop),
drowns if it stands on water or a dived turtle, and is lost if carried off an edge.

The classic board, bottom to top: the start verge, five road lanes (cars, and lorries two cells
long, alternating directions), a middle verge, five river lanes (logs of three to six cells and
groups of turtles — one group dives from the start, another from level 2; diving turtles flash for
50 steps before going under for 60), and the hedge with five burrows (columns 1, 4, 6, 8, 11).
Hopping into a free burrow scores 50 plus one point per half-second left and sends a new hedgehog
from the start; the hedge and filled burrows kill. A beetle visits an empty burrow every ten
seconds for five (200 more). Ten points per new row reached in a crossing; 30 seconds per crossing;
three lives, one more at 5000. Filling all five burrows scores 1000 and starts a level 15 % faster.

## Players (watch mode and AI Lab)

- `lookahead` (Planner): a beam search over the next six hops or waits from each decision point,
  keeping the 40 best positions at each depth and merging those that reach the same place at the
  same moment, scored on rows gained, score, room from the edges in a river, turtles about to dive
  and, in the classic game, lining up with an empty burrow (one the current carries you towards
  counts as nearer). A wait it decides on is remembered so the next steps need no new search.
- `hopper`: hops forward if it would survive the landing for a moment, else waits or sidesteps.

Measured (5 runs each, 10-minute cap): planner avg 40 496 points and 14.4 levels (most runs reached the 10-minute cap); hopper 1015 points, 35 s.

## States and actions

`Crossing`: rule set, generator, lanes (and the row of the first), position across and row, facing,
the hop in progress, the control held last step and for how long, furthest row, lives, level,
burrows filled and the beetle, time left, the view's lowest row, score, the death pause and its
cause, the step's events, steps. Actions per step: `up`, `down`, `left`, `right`, `idle`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `crossing` v`1.0.0`: kind `real-time` (60 Hz), one
seat, the score as return; a 30-minute step limit.

## Achievements

| id       | Condition                             |
| -------- | ------------------------------------- |
| `home`   | Reach a burrow.                       |
| `beetle` | Reach the burrow with a beetle in it. |
| `level`  | Fill all five burrows.                |
| `score`  | Score 5000 points.                    |

## Graphics and audio

Pavement verges, dark roads with lane dashes, rivers with moving ripples, meadows in two greens
with round trees, railways with sleepers, rails and a red signal; cars in five colours with a
windscreen at the front, grey lorries, brown logs, green turtles that fade when about to dive, a
long red train; the hedgehog is a brown ball of spines with a pale face looking its way, swelling
a little mid-hop; ripples when it drowns. Synthesized sounds for hops, the different ends, burrows,
the beetle, extra lives and levels.

## Testing criteria

The board and lanes, steady wrapping motion, hops and scoring rows, cars, water and logs, burrows
and the hedge, the level, the crossing time, endless lanes and the hawk, the planner beating the
hopper, exact replays; the contract suite; UI: a hop and the end of a run, watch mode. E2E
desktop + mobile.
