# #171 Space Rocks — Game Specification

A vector space shooter on a wrap-around field, in the mould of the classic rock-blasting arcade
games, under an original name with original art (catalog id `asteroids`), on the shared arcade
shell.

## Ruleset (`space-rocks`)

A 400 × 400 field that wraps at every edge, 60 steps a second.

- **Ship**: turns 0.075 rad a step, thrusts 0.09 px/step² (top speed 5) and keeps its momentum with
  a little drag (×0.992). Up to four shots in the air (7 px a step plus the ship's speed, one second
  of life); fire must be released between shots. Hyperspace drops the ship at a random spot with no
  speed. After a loss the ship reappears in the centre once it is clear, with two seconds of safety.
- **Rocks**: a field of 3 + level large rocks from the edges, at speeds rising with the level. A hit
  splits large (20 points) into two medium (50) and medium into two small (100), faster and turned
  ±46°; small ones vanish.
- **Saucers**: every 20–35 seconds, crossing the field on a wave, firing at the ship every 70 steps
  with an error that shrinks as the levels go on; 200 points.
- **Lives**: three ships, one more every 10 000 points; colliding with a rock, a saucer or its shot
  costs a ship. A cleared field brings the next.

## Players (watch mode and AI Lab)

- `pilot`: predicts which rock will come closest within a second and a half; turns to lead its
  shots on the nearest target (the saucer or the threatening rock first) and fires when lined up;
  thrusts out of a coming collision; jumps to hyperspace only when a hit is unavoidable.
- `turret`: spins in place and fires.

Measured (`rocks-bench`, 30 runs, 20-minute cap): pilot 8283 points and 2.67 fields cleared on
average; turret 2428 and 0.57; idle 0 (lasting 37 s).

## States and actions

`Rocks`: generator, level, ship (position, velocity, angle), shots, rocks (position, velocity,
size, shape), saucer, its shots and timer, lives, next extra life, score, respawn and safety
countdowns, whether fire is held, thrusting, the end, the step's events, steps. Actions per step:
`idle`, `f`, `t`, `tf`, `l`, `lf`, `lt`, `ltf`, `r`, `rf`, `rt`, `rtf` (turn, thrust, fire) and
`h` (hyperspace).

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `asteroids` v`1.0.0`: kind `real-time` (60 Hz),
one seat, the score as return; a 30-minute step limit.

## Achievements

| id      | Condition            |
| ------- | -------------------- |
| `first` | Finish a game.       |
| `field` | Clear a field.       |
| `deep`  | Reach field 5.       |
| `score` | Score 10 000 points. |

## Graphics and audio

Vector outlines: jagged rocks drawn at their wrapped copies near the edges, a violet ship with a
flickering flame, a red saucer, white and red shots, a blinking ship while safe. Synthesized sounds
for shots, explosions large and small, saucers, hyperspace, crashes, extra ships, fields and the end.

## Testing criteria

Turning, momentum and drag, wrapping, fire release and the shot limit, a large rock splitting, a
crash costing a ship, the pilot clearing fields, the contract suite; UI: a run lost while drifting
with the result recorded, watch mode scoring. E2E desktop + mobile.
