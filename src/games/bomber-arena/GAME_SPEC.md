# #189 Blast Arena — Game Specification

A bomb-laying arena game in the classic mould, with an original name and look: four little robot
blasters, stone pillars, wooden crates.

## Ruleset (`blast-arena`)

A 15 × 13 arena at 60 steps a second: a steel edge, pillars on every even–even cell, and crates on
70 % of the other cells (the corners and two cells along from them left clear); 12 % of crates hide
an extra bomb, 12 % a longer flame, 6 % more speed. The player (white) and three computer blasters
start in the corners with one bomb, a flame of 2 and a walk of 14 steps a cell (speed takes 2 off,
down to 8). A blaster walks to a free neighbouring cell (not a pillar, crate, bomb or another
blaster) or drops a bomb on its cell (one per bomb it holds at a time). A bomb bursts after 150
steps into a cross as long as its flame, stopped by pillars and by the first crate (which burns,
showing any power-up); flame lasts 30 steps, sets off bombs it reaches, burns power-ups lying in the
open, and knocks out any blaster in it (or more than half-way into it). In the last 40 seconds of a
round's 120 the arena fills in a spiral from the edge inwards, a cell every 15 steps, crushing
anyone there. The last blaster standing wins the round (if the last ones fall together, it is a
draw); the first to two round wins takes the match. Points for the player: 10 a crate it burns, 50
a power-up, 200 a rival knocked out as one of its bombs bursts, 1000 a round won.

## Players (watch mode and AI Lab)

The three computer blasters are tacticians. For the player's seat:

- `tactician`: works out when each cell will burn (bombs, chains and the closing arena) and flees
  a cell that will burn by a route whose cells are not burning while it passes, keeping out of the
  way of other blasters; it drops a bomb when a crate or a rival lies within its flame and a safe
  cell is still reachable with the bomb down; otherwise it heads for power-ups, then cells next to
  crates or rivals, only through cells that will not burn.
- `rookie`: wanders and drops bombs at random (a hash of the step, not the game's generator), but
  flees flames the same way.

Measured (10 matches each against three tacticians, 10-minute cap): tactician won 2 matches and 8
rounds; rookie and doing nothing won none. Before fixing the flight, tacticians mostly blew
themselves up (91 of 127 knock-outs in a sample); now 16 of 60.

## States and actions

`Arena`: generator, round, cells, power-ups, blasters (cell, walk target and steps, pace, bombs,
flame, in play, round wins, facing), bombs (cell, owner, fuse, flame), fire, time, round pause and
winner, score, rivals knocked out, crates burnt, the step's events, steps. Actions: `idle`, `up`,
`down`, `left`, `right`, `bomb`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `bomber-arena` v`1.0.0`: kind `real-time`
(60 Hz), one seat (the computer blasters are part of the world), the score as return; a 30-minute
step limit.

## Achievements

| id      | Condition                       |
| ------- | ------------------------------- |
| `round` | Win a round.                    |
| `kill`  | Catch a rival in your flames.   |
| `match` | Win a match.                    |
| `sweep` | Win a match two rounds to none. |

## Graphics and audio

A green checked floor, stone pillars with lit edges, crossed wooden crates, power-up tiles (a white
bomb, an orange flame, a blue arrow), black bombs that swell faster as the fuse runs down, flame in
yellow, orange and red as it dies, four round robots (white, red, blue, yellow) with antennae and
eyes looking their way; a star in the winner's colour between rounds. Synthesized sounds for drops,
bursts, power-ups, knock-outs, the closing arena and round results.

## Testing criteria

The arena; walking and blocking; flame shapes and chains; knock-outs, rounds and the match;
power-ups; the closing arena; the tactician winning rounds where the rookie and an idle player do
not; exact replays. The contract suite; UI: walking and a bomb; watch mode. E2E desktop + mobile.
