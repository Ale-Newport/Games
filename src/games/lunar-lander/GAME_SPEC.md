# #184 Moon Touchdown — Game Specification

A lunar landing game in the classic mould, with an original name and look.

## Ruleset (`moon-touchdown`)

A 320 × 240 view that wraps side to side, at 60 steps a second. Gravity adds 0.018 px/step² to the
fall; the engine pushes 0.045 along the lander's axis and burns one unit of fuel a step (1500 to
start); the lander turns 2° a step, up to 90° either way. Each round generates new ground from the
run's seed: a rough ridge sampled every 8 px with three flat pads — ×5 (24 px wide), ×3 (32) and
×2 (40) — and starts the lander near the top at a random place with a small random drift. When a
foot or the body reaches the ground, the touchdown is safe only if both feet are on the same pad,
the fall is at most 0.6 px/step, the drift at most 0.4 and the tilt at most 12°: it scores 50 × the
mark, plus 50 for a fall of at most 0.3. Anything else is a crash and costs 200 fuel. After a
two-second pause a new round starts; the run ends after a round that finishes with no fuel.

## Players (watch mode and AI Lab)

- `pilot`: picks the pad with the best mark weighed against its distance, sets a wanted drift
  towards it (zero once above it) and tilts to get it, keeps its fall to a rate that shrinks with
  height (and climbs if the ground between it and the pad comes close), and stands upright for the
  last metres.
- `braker`: stays upright and only brakes its fall, coming down wherever it is.

Measured (10 runs each): pilot averaged 2515 points, 8.4 touchdowns and 0.9 crashes over 83 s;
braker 115 points, 0.5 touchdowns and 5.6 crashes; doing nothing crashes every round.

## States and actions

`Lander`: generator, round, ground heights and pads, position and speed, tilt, fuel, engine firing,
score, touchdowns and crashes, round pause and outcome, last round's points, the step's events,
steps. Actions per step: `idle`, `left`, `right`, `thrust`, `thrust-left`, `thrust-right`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `lunar-lander` v`1.0.0`: kind `real-time`
(60 Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id          | Condition                        |
| ----------- | -------------------------------- |
| `touchdown` | Land safely on a pad.            |
| `five`      | Land on a ×5 pad.                |
| `clean`     | Land five times without a crash. |
| `score`     | Score 2000 points.               |

## Graphics and audio

A black sky of fixed stars with a crescent of the home planet, grey ground with a lighter rim, pads
in red (×5), yellow (×3) and green (×2) with blinking lights and their mark; a gold-foil lander with
a dark window, splayed legs and a flickering flame; sparks when it crashes. Speed and tilt readouts
in the corner turn green when within the safe limits. Synthesized sounds for the engine, touchdowns,
crashes and an empty tank.

## Testing criteria

Pads and their widths; gravity, thrust along the axis, fuel, wrapping; safe touchdowns and the
three kinds of crash; new rounds and the end; the pilot landing far more often than the braker;
exact replays. The contract suite; UI: the engine burning fuel and a free fall crashing; watch mode
landing. E2E desktop + mobile.
