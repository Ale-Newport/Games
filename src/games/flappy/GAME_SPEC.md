# #183 Puffin Flap — Game Specification

A one-button flying game in the familiar flap-through-the-gaps mould, with an original name, a
puffin and sea stacks.

## Ruleset (`puffin-flap`)

A 240 × 360 portrait view with the sea 40 px from the bottom, at 60 steps a second. The puffin
(radius 9, at x = 64) hovers until the first flap. A flap — a fresh press; holding is one flap —
sets its vertical speed to −4.4; gravity adds 0.24 a step (falls capped at 7). Pairs of rock stacks
40 px wide arrive every 132 px, moving at 1.6 px a step; the gap between them is 100 px tall,
placed at random (from the run's seed) but never more than 120 px from the previous gap. Passing a
stack scores a point. From 25 points each gap is 0.6 px smaller (down to 84); from 50 the stacks
speed up by 0.02 a point (up to +0.6). Touching rock, the sea or the top of the sky ends the flight
(after a second's tumble).

## Players (watch mode and AI Lab)

- `planner`: looks only at the stacks in view. Every four steps it tries all 1024 patterns of flaps
  over the next 40 steps (one chance to flap every four steps) and takes the first move of the one
  that stays clearest of the rock edges (and near the middle of the next gap).
- `tracker`: flaps whenever it sinks below a point a little under the middle of the next gap.

Measured (10 runs each, 5-minute cap): planner averaged 108.7 stacks (64 to 271); tracker 64.0
(55 to 80); doing nothing never starts the flight.

## States and actions

`Flight`: generator, height and vertical speed, button held, stacks (position, gap top and size,
scored), score, started, tumble time, the step's events, steps, flaps. Actions per step: `idle`,
`flap`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `flappy` v`1.0.0`: kind `real-time` (60 Hz),
one seat, the score as return; a 30-minute step limit.

## Achievements

| id           | Condition            |
| ------------ | -------------------- |
| `ten`        | Pass 10 sea stacks.  |
| `twentyfive` | Pass 25 sea stacks.  |
| `fifty`      | Pass 50 sea stacks.  |
| `hundred`    | Pass 100 sea stacks. |

## Graphics and audio

A sky fading from blue to warm yellow, a distant headland drifting by, grey-brown rock stacks with
mossy lips at the gap, a sea with rolling crests; the puffin — black back, white face and belly,
striped orange beak, orange feet — tilts with its speed and raises its wing on a flap; the score in
large figures. Synthesized sounds for flaps, points and the crash.

## Testing criteria

Hovering, the flap and holding as one flap, falling into the sea; scoring and crashing into rock;
gaps within reach, narrowing and speeding up; the planner beating the tracker and doing nothing
scoring nothing; exact replays. The contract suite; UI: one flap then the end, watch mode; E2E
desktop + mobile.
