# #197 Cloud Climber — Game Specification

A vertical jumping game with an original name and look.

## Ruleset (`cloud-climber`)

A 240 × 360 view at 60 steps a second; the sides wrap round. Actions: `idle`, `left`, `right`.

- **The climber** (16 × 20) falls with gravity 0.25 (at most 9 px a step). Steering accelerates her
  sideways by 0.45 up to 4 px a step; letting go slows her by 15 % a step.
- **Clouds** (40 px wide) hold her only from above: falling onto one bounces her up at 8.5 (about
  145 px). Drifting clouds (lavender) move side to side, faster higher up; thin clouds (dotted) burst
  under her with no bounce; a spring (in a cloud's middle 16 px) launches her at 13 (about 340 px).
- **The path**: clouds that are not thin come every 40 to 60 px at the ground, up to 100 px from 6000
  m (the greatest gap is well under a bounce); 6 % are springs, and drifting ones grow from none to
  45 %. Thin clouds are scattered between them (25 % to 65 % of steps).
- **Storm sprites** from 300 m up (4 % to 12 % of path clouds, 45 px above one), patrolling side to
  side. Landing on one from above pops it with a bounce; touching one any other way ends the climb.
- **The view** rises to keep her in its upper half and never comes back down; dropping 10 px below
  it ends the climb.
- **Score**: the greatest height reached, in metres (10 px each).

## Players (watch mode and AI Lab)

- `planner`: tries holding left, right or nothing, or one of them and then another after 4, 8, 16 or
  32 steps, each played forward (clouds and sprites drifting) until the next bounce, and steers by
  the plan with the highest bounce (springs count 150 px more). It rejects plans that touch a sprite
  or fall out of view, and bounces after which no steering gets 45 steps up without touching one.
- `drifter`: works out from her speed where she last bounced and steers straight for the nearest
  non-thin cloud above that; it ignores sprites and drift.

Measured (6 seeds, 10-minute limit): the planner was still climbing in all six, at 8560–8819 m,
popping 21–36 sprites; the drifter climbed 345–1049 m and was always caught by a sprite. A first
planner looked only to the next bounce and bounced straight into sprites above (two of four seeds
ended that way in three minutes); the escape check fixed that. A first drifter aimed at the nearest
cloud above her current height and kept bouncing on one cloud.

## States and actions

`Climb`: generator, the clouds and sprites in reach, the climber (x, feet, speeds), the best
height, the view's top, the next path cloud's height, pops, springs used, the dying countdown, how it
ended, the step's events, steps.

## Saves and AI interface

Leaving a climb for the menu saves it to resume. Env `vertical-jumper` v`1.0.0`: kind `real-time` (60
Hz), one seat, the height as return; a 30-minute step limit.

## Achievements

| id       | Condition            |
| -------- | -------------------- |
| `spring` | Bounce off a spring. |
| `pop`    | Pop a storm sprite.  |
| `m500`   | Climb 500 m.         |
| `m2000`  | Climb 2000 m.        |

## Graphics and audio

A sky that darkens towards space (stars appear) as she climbs, a height mark every 100 m, puffy
white clouds, lavender drifting ones, dotted thin ones, red coiled springs, grey storm sprites with eyes
and a lightning tail, and the climber: green hood, round face, little boots, leaning the way she
moves; anything near a side is drawn on both. Synthesized sounds for bounces, springs, bursts,
pops, every 100 m, hits and falls.

## Testing criteria

Bouncing by herself to the expected height; rising through clouds; steering, top speed and wrapping;
thin clouds bursting; springs (and their off-centre bounce); sprites fatal from the side and popped
from above; falling out of view and the view never sinking; the path's gaps; the score; the planner
climbing three minutes on three seeds while the drifter is caught; exact replays. The contract
suite; UI: falling after steering off the first cloud, watch mode. E2E desktop + mobile.
