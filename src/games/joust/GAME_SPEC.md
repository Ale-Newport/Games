# #191 Sky Lances — Game Specification

An aerial jousting game in the classic flap-and-joust mould, with an original name and look: riders
on winged drakes over a lava pit.

## Ruleset (`sky-lances`)

A 320 × 224 view at 60 steps a second, wrapping round at the sides; seven stone ledges and lava along
the bottom. A rider's flap (a fresh press) adds −1.5 to its vertical speed (at most −3); gravity
adds 0.07 a step (falls capped at 3.5); steering accelerates it sideways by 0.07 (0.14 on a ledge) up
to 2.2, and it slows on a ledge when not steering. Riders land on ledges from above and bump them
from below. Rival riders arrive one every 1.5 s on the ledges, 3 + wave of them (up to 8): bounders,
hunters (from wave 2) and shadows (from wave 4), which take turns hunting the player in four-second
spells (one, two or three spells in four by rank) — aiming a little above it — and otherwise cruise
at a height of their own; keener ranks flap more often and fly faster. When two riders meet, the one
more than 3 px higher wins: a rival unhorsed scores 500, 750 or 1500 and leaves an egg; the player
unhorsed loses a life; level riders bounce apart. An egg falls to a ledge; picking it up scores 250,
500, 750 and then 1000 for each further egg that wave; left for 10 s it hatches into a rider of the
next rank. Touching the lava costs a life. A wave ends when no riders or eggs are left (3000).
Three lives, one more every 20 000.

## Players (watch mode and AI Lab)

- `lancer`: picks the nearest rival (or a lying egg if that is about as close), flies to a point 14
  px above it the short way round, flapping whenever it is below that height and never letting
  itself sink near the lava; when a rival is close and not clearly below, it turns away and climbs
  above it first.
- `glider`: holds a middle height and drifts towards a rival whatever its height.

Measured (8 runs each, 10-minute cap): lancer averaged 80 594 points and wave 7.0 (204 s),
unhorsing 338 riders in all; glider 531 points, never past wave 1 (24 s); doing nothing is
unhorsed within 138 s on average. (Before the rivals hunted in spells, a rider that stood still
was never reached.)

## States and actions

`Lances`: generator, wave, player rider (position, speed, facing, on a ledge), flap held, rivals
(with rank and flap cooldown), eggs (position, fall, rank, time to hatch), riders still to come
and the arrival timer, lives, score, egg chain, next extra life, death and wave pauses, the step's
events, steps, riders unhorsed. Actions: `idle`, `left`, `right`, `flap`, `flap-left`, `flap-right`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `joust` v`1.0.0`: kind `real-time` (60 Hz), one
seat, the score as return; a 30-minute step limit.

## Achievements

| id      | Condition              |
| ------- | ---------------------- |
| `joust` | Unhorse a rival rider. |
| `egg`   | Pick up an egg.        |
| `wave`  | Clear a wave.          |
| `score` | Score 30 000 points.   |

## Graphics and audio

A dusk sky from indigo to rust, grey stone ledges with rocky undersides, orange lava with yellow
bubbles; drakes in teal (the player), red, silver and deep blue whose wings rise on a flap, knights
in gold, pink, white and pale blue with white lances; speckled eggs that flash before hatching.
Synthesized sounds for flaps, unhorsing (both ways), lava, clashes, eggs, hatching, arrivals, waves
and extra lives.

## Testing criteria

Flapping (one per press), gravity and wrapping; landing on ledges; the higher lance winning, losing
and level clashes; eggs picked up and hatching; lava; clearing a wave; the lancer outscoring the
glider; exact replays. The contract suite; UI: flapping and the end; watch mode. E2E desktop +
mobile.
