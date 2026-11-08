# #195 Circuit Sprint — Game Specification

A top-down racing game with an original name and circuits.

## Ruleset (`circuit-sprint`)

A 320 × 240 view of the whole circuit at 60 steps a second. Three circuits (Oval, Kidney, Loop), each
a closed Catmull–Rom curve through a handful of control points, about 240 points round, 26 px of
tarmac wide; no two stretches come within 30 px of each other. Four cars start on a two-by-two grid
behind the line after a two-second countdown. A car accelerates by 0.05 px/step² up to 2.6 (times a
computer driver's pace of 0.90–0.97), brakes by 0.1 (and, held at a standstill, reverses to −0.8),
coasts with 1 % drag, and turns up to 0.05 rad a step, scaled by its speed up to 0.8. More than 13
px from the centre line it is on grass, with a top speed of 1.1. Cars closer than 8 px are pushed
apart and lose 10 % of their speed. A lap counts on crossing the line forwards after going more
than 70 % of the way round. Three laps; the race ends when the player finishes, or two minutes
after the first car does. Standings: finishing order, then distance covered. Score: (5 − place) ×
1000, plus 10 per second under four minutes if the player finished.

## Players (watch mode and AI Lab)

The computer cars are drivers with caution 1. For the player's car:

- `driver` (caution 0.8): aims at a point on the centre line 6 + 4 × speed points ahead, swung 9 px
  to the side when a car is close in front; wants a speed of max(0.9, 2.6 − 1.9 × the bend in the
  stretch ahead) ÷ caution, braking down to it (never into reverse) and creeping forward while
  turning when badly lined up.
- `cautious`: the same with caution 1.5.

Measured (6 races per circuit against the field): driver won every race on the Oval and the Kidney
and came third on every Loop race (its S-bend favours the slower rival cars); cautious came third on
every Oval race and fourth on every Kidney and Loop race; doing nothing comes last. On their own, a bolder driver laps faster (caution 0.85: 19.6 s
for three laps of the Oval; 1.3: 27.6 s). Earlier drivers braked into reverse and stalled before
sharp bends (a negative wanted speed), and two first designs had hairpins tighter than a car can
turn; the circuits were redrawn.

## States and actions

`Race`: generator, circuit, cars (position, heading, speed, nearest centre-line point, laps,
finishing step, furthest point this lap, pace), countdown, clock, finishers, the step's events,
steps. Actions: `idle`, `gas`, `brake`, `left`, `right` and gas or brake with either turn.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `top-down-racing` v`1.0.0`: kind `real-time`
(60 Hz), one seat (the rivals are part of the world), the score as return; a 30-minute step limit.

## Achievements

| id       | Condition                |
| -------- | ------------------------ |
| `lap`    | Complete a lap.          |
| `finish` | Finish a race.           |
| `win`    | Win a race.              |
| `loop`   | Win on the Loop circuit. |

## Graphics and audio

Grass with darker tufts, grey tarmac edged in white with a dashed centre line, a chequered start
line, four little cars (red for the player, blue, yellow, green) with windscreens and wheels, three
start lights. Synthesized sounds for the engine, the countdown, laps, bumps and finishes.

## Testing criteria

Circuits on screen and clear of themselves; the countdown, acceleration, top speed, braking and
steering needing speed; grass; bumps; laps and finishing first alone; no lap for backing over the
line; the driver finishing every circuit and an idle car coming last; exact replays. The contract
suite; UI: the clock and falling to last; watch mode. E2E desktop + mobile on the Loop.
