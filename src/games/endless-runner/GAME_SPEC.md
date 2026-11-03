# #196 Rooftop Dash — Game Specification

An endless runner with an original name and look.

## Ruleset (`rooftop-dash`)

A 360 × 200 side view at 60 steps a second. The courier stands 24 px tall (12 sliding) at a fixed
place on screen and runs right on her own at 3 px a step, rising evenly to 6 after 40 000 px (2000
m; 20 px = 1 m). Actions: `idle`, `jump`, `duck`.

- **Jump** from a roof (or up to 5 steps after running off its edge): an upward speed of 7.5. While
  the button stays held on the way up, gravity is 0.45 (a full jump rises about 62 px); released or
  falling, 0.9. Holding the button on a roof keeps hopping.
- **Slide** (`duck`) on a roof lowers her to 12 px; in the air it dives (gravity 1.6).
- **Roofs** are generated from the seed one after another: a height between 110 and 175 (screen y),
  at most 40 px higher or 30 px lower than the last, 150–400 px long, after a gap of at least 24 px
  and at most two thirds of what a full jump at that speed clears (minus her width); gaps lean
  longer with the distance.
- **Chimneys** (12 × 16) and **drones** (16 × 14, hovering 16–30 px above the roof, so a standing
  courier hits them and a sliding one passes under; a long jump clears them too): none, one, or on
  long roofs two, more often with the distance, never in the first 60 + 12 × speed px of a roof or
  the last 40 + 6 × speed. **Coins** in a row or an arc of up to five.
- **The end**: dropping below the screen, running into the side of a higher roof, or touching a
  chimney or a drone (landing on a chimney top counts). One run, no lives.
- **Score**: metres run + 10 per coin.

## Players (watch mode and AI Lab)

- `runner`: looks 60 steps ahead with the real movement code and tries waiting or starting now a
  short (3-step), medium (9) or full (40) jump or a 30-step slide, each followed by none or one more
  such move on any of the next steps that are multiples of six (aligned to the clock so its plans
  stay stable from step to step). It keeps the plan that survives longest, then the one ending on a
  roof and collecting more coins, preferring to wait.
- `hopper`: a full jump whenever a gap, a higher roof or a chimney or drone comes within 10 + 5 ×
  speed px; it never slides.

Measured (6 seeds, 10-minute limit): the runner was still running in all six, at 10 027 m with
831–952 coins; the hopper fell or crashed at 437–805 m (627 m on average). An idle courier falls
into the first gap.

## States and actions

`Run`: generator, the roofs and things in reach, the courier's world x and body (feet, vertical
speed, steps in the air, sliding, steps the jump has been held), coins, the dying countdown, how it
ended, the step's events, steps.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `endless-runner` v`1.0.0`: kind `real-time` (60
Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id      | Condition                    |
| ------- | ---------------------------- |
| `m500`  | Run 500 m.                   |
| `m2000` | Run 2000 m in one go.        |
| `coins` | Collect 50 coins in one run. |
| `score` | Score 5000 points.           |

## Graphics and audio

A violet night sky with a moon and a slower far skyline, dark buildings with lit windows under grey
roof edges, brick chimneys, drones with spinning rotors and a red light, gold coins, and the
courier: red cap, orange jacket, parcel bag, running legs, a low slide pose. Synthesized sounds for
jumps, landings, coins, every 500 m, crashes and falls.

## Testing criteria

Running and speeding up; held jumps going higher; hopping and the late jump off an edge; gaps,
higher roofs, chimneys and drones (slide or jump); diving; coins and score; the world built ahead
and forgotten behind; the planner running three minutes on three seeds while the hopper and an idle
courier do not; exact replays. The contract suite; UI: falling into the first gap, watch mode.
E2E desktop + mobile.
