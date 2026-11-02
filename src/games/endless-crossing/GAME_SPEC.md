# #179 Endless Crossing — Game Specification

A crossing game with an original hedgehog, on the shared crossing core (`shared/crossing`) and
arcade shell.

## Ruleset (`crossing-endless`)

A board 13 columns wide on a 60 Hz clock; positions across are kept in eighths of a column. Every
car, lorry, log, turtle and train moves at a steady speed along its lane and wraps round off-screen,
so where it is depends only on the step count. The hedgehog hops one cell per press (a hop takes 6
steps; holding repeats every 14 steps); it lands mid-column except in a river, where it rides
whatever it stands on. It is run over if a vehicle overlaps it on a road or railway (even mid-hop),
drowns if it stands on water or a dived turtle, and is lost if carried off an edge.

Lanes are generated as the hedgehog goes, from the run's seed: a meadow to start, then meadows
(up to three trees that block the way), roads (one to three cars or lorries), rivers (two or three
logs; rivers next to rivers flow opposite ways) and railways (a train two and a half boards long,
at four eighths a step, coming round every 8 to 13 seconds, announced by a signal that flashes for
the 75 steps before it arrives). Speeds rise over the first 300 rows. The view's lowest row creeps
up on its own (from 0.24 rows a second, faster further on) and keeps the hedgehog within six rows
of the bottom; falling below it lets the hawk in. One life; the score is the furthest row.

## Players (watch mode and AI Lab)

- `lookahead` (Planner): a beam search over the next six hops or waits from each decision point,
  keeping the 40 best positions at each depth and merging those that reach the same place at the
  same moment, scored on rows gained, score, room from the edges in a river, turtles about to dive
  and, in the classic game, lining up with an empty burrow (one the current carries you towards
  counts as nearer). A wait it decides on is remembered so the next steps need no new search.
- `hopper`: hops forward if it would survive the landing for a moment, else waits or sidesteps.

Measured (5 runs each, 10-minute cap): planner avg 1237 rows over 395 s; hopper 18 rows, 18 s.

## States and actions

`Crossing`: rule set, generator, lanes (and the row of the first), position across and row, facing,
the hop in progress, the control held last step and for how long, furthest row, lives, level,
burrows filled and the beetle, time left, the view's lowest row, score, the death pause and its
cause, the step's events, steps. Actions per step: `up`, `down`, `left`, `right`, `idle`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `endless-crossing` v`1.0.0`: kind `real-time` (60 Hz), one
seat, the score as return; a 30-minute step limit.

## Achievements

| id            | Condition      |
| ------------- | -------------- |
| `twenty`      | Reach row 20.  |
| `hundred`     | Reach row 100. |
| `twofifty`    | Reach row 250. |
| `fivehundred` | Reach row 500. |

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
