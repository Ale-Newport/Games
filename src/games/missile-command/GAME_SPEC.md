# #185 City Shield — Game Specification

A city-defence arcade game in the classic falling-rockets mould, with an original name and look.

## Ruleset (`city-shield`)

A 256 × 224 view at 60 steps a second; the ground at y = 204 with six cities and three launchers
(left, middle, right). Each wave sends 10 + 2 × wave rockets in small volleys, each from a random
point at the top towards a random city still standing or a launcher, at 0.22 px/step plus 0.04 a
wave (up to wave 11). From wave 3 a rocket may split into 2 or 3 part way down (chance 10 % per wave
above 2, up to 40 %). The player fires at a point in the sky: an interceptor leaves the nearest
launcher with rounds left (ten each per wave) at 4 px/step (6 from the middle one) and bursts at
the point into a blast that grows to 22 px in 18 steps and fades by step 44. Any rocket inside a
blast is destroyed for 25 × the wave multiplier (×1, rising by one every two waves to ×6) and
bursts too. A rocket reaching the ground ruins its city or puts its launcher out of action for the
rest of the wave. When the sky is clear the wave ends with a bonus of (5 per round left + 100 per
city standing) × the multiplier, a ruined city is rebuilt for every 10 000 points, and the next
wave starts with all launchers restored. The game ends when no city stands.

Controls are discrete actions so the AI can use them too: `idle`, `fire` (at the crosshair), eight
crosshair moves (3 px/step), and `at-c-r` for each cell of a 16 × 12 grid over the sky (16 × 15 px
cells): aim there and fire. A tap or click on the canvas is the cell under it; holding is one shot.

## Players (watch mode and AI Lab)

- `defender`: takes the rocket that will strike soonest among those no blast or interceptor in
  flight already covers (rockets heading for ruined cities last), refines four times the point
  where it will be when an interceptor from the nearest working launcher arrives (plus half a
  blast's growth), and fires at that cell.
- `sniper`: once a second fires at the lowest rocket's current position.

Measured (8 runs each, 15-minute cap): defender averaged 31 655 points and wave 10.4 (217 s);
sniper 17 987 and wave 7.5; doing nothing 250 points (impact blasts) and wave 1.9.

## States and actions

`Shield`: generator, wave, cities, launchers (working, rounds), rockets (position, start, target,
speed, split), interceptors, blasts, rockets still to come and the volley timer, crosshair, fire
held, score, next rebuild threshold, the pause between waves and its bonus, the step's events,
steps, rockets destroyed. Actions: as above (202 in all).

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `missile-command` v`1.0.0`: kind `real-time`
(60 Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id       | Condition                                |
| -------- | ---------------------------------------- |
| `wave`   | Survive a wave.                          |
| `intact` | End a wave with all six cities standing. |
| `ten`    | Reach wave 10.                           |
| `score`  | Score 25 000 points.                     |

## Graphics and audio

A deep night sky, olive ground, cities of little slate towers with lit windows (rubble when
ruined), domed launchers with their remaining rounds as blue pips; rockets as red trails with
flickering heads, interceptors as blue trails towards a marked point, blasts that cycle through
yellow, orange, pink and pale blue; a crosshair; the wave bonus shown between waves. Synthesized
sounds for launches, bursts, hits, splits, losses, an empty launcher, cleared waves and rebuilds.

## Testing criteria

The action set and crosshair; firing from the nearest launcher (once per tap), bursting and fading;
blasts destroying rockets and scoring; cities ruined and launchers knocked out; the wave bonus and
the next wave; rebuilding and the end; splitting from wave 3; the defender outlasting the sniper;
exact replays. The contract suite; UI: the cities falling without defence, watch mode scoring. E2E
desktop + mobile (a real tap on the canvas).
