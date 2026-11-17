# #180 Girder Climb

`sim.ts` holds the four stages, the simulation and the two players; `definition.ts` the drawing,
controls, sounds and strings for the shared arcade shell `../shared/arcade/`. Also `Game.tsx`,
`ai-adapter.ts`, `HowToPlay.tsx`, `manifest.ts`, `assets/preview.svg`, `tests/`.

## Specification

A single-screen climbing arcade game in the classic girder mould, with an original name, cast and
layout: a runaway robot, rolling drums, a climber in a hard hat and a kitten to rescue.

### Ruleset (`girder-climb-drums`, v2)

A 224 × 256 screen on a 60 Hz clock. Four original stages (`STAGES` in `sim.ts`), each a floor,
sloping girders, ladders (some broken: drums only), two hammers, the robot on a high girder and a
short platform at the top holding the kitten:

| #   | Stage    | Layout                                                                                                                                                                                                                                                                                |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Zigzag   | Six full-width girders, each sloping the opposite way to the one below, so drums cross every girder; 13 ladders (4 broken). Recycler bottom left.                                                                                                                                     |
| 2   | Funnel   | Five levels, each a valley of two girders sloping down to a gap; the gaps alternate left and right of centre, so drums pour back and forth through the middle — where the main ladders stand. Short outer girders are off the route. 17 ladders (5 broken).                           |
| 3   | Cascade  | Peaks and valleys in turn. The robot stands on the top peak and throws to both sides in turn; drums run off the peaks' ends, back along the valleys to their middle gaps and out again. The peaks can be walked across, and the route switches sides on them. 19 ladders (10 broken). |
| 4   | Stairway | Five short overlapping girders climb from the bottom left to the top right, all sloping down to the left; every drum runs down each step and drops onto the one below. The robot throws less often here. 8 ladders (2 broken).                                                        |

Reaching the kitten moves on to the next stage; after the fourth the first comes round again and
the drums speed up. The climber walks at 0.75 px a step along the
slope, climbs whole ladders at 0.55 (a sideways press within 6 px of either end steps off), and jumps a fixed arc (about 20 px high, 38 steps, keeping the
sideways speed it had); walking off a girder end or landing more than 20 px below the take-off is a
fatal fall. The robot throws a drum every 170 steps in the first round of stages (15 fewer each round
after, at least 80, ±30 %), times the stage's own gap (Zigzag 1, Funnel 0.95, Cascade 0.85,
Stairway 1.5). Drums roll downhill at 0.9 px a step (+0.12 a round, up to the seventh), drop off
the low end onto whatever girder lies below, and at the top of each ladder they pass take it down
with chance 15 % (40 % when the climber is lower down), +4 % a round; they end in the recycler on
the floor or roll off the screen. A drum
touching the climber costs a life; jumping clear over one scores 100. Two hammers hang on the way:
touching one gives ten seconds of smashing (300 a drum within reach) but no jumping or climbing.
The bonus starts at 5000 (+1000 a round, up to 8000) and drops 100 every two seconds; reaching
the kitten scores it and starts the next level (the next stage); at zero the climber loses a life. Three lives, one
more at 10 000; losing a life restarts the climb with a fresh bonus and no drums.

### Players (watch mode and AI Lab)

- `climber`: follows the stage's route — from each girder, the nearest whole ladder (or walk
  across a peak) that brings the kitten a move closer — jumps a drum rolling at it once the drum is
  within jumping range, waits at a ladder's foot while a drum is on the ladder or would pass its top
  before the climb is over, steps aside from drums dropping from above, and backs down a ladder
  when a drum comes down it.
- `walker`: the same route without jumping or waiting.

Measured (a scratch bench, 20 runs each, 10-minute cap): climber averaged 12 365 points and 2.75
rescues over 84 s (reaching level 9 at best); walker 2825 points and 0.65 rescues; standing still
scores nothing (47 s). Each stage started fresh, 40 runs: the climber rescued the kitten in 37
(Zigzag), 30 (Funnel), 34 (Cascade) and 23 (Stairway); the walker in 13, 16, 28 and 10.

### States and actions

`Girders`: generator, level (the stage is `(level − 1) mod 4`, the round `⌊(level − 1) / 4⌋`), climber (position, mode — walk, climb, jump, fall — girder or ladder,
speed, take-off height, facing, hammer time), drums (position, mode — roll, ladder, fall — girder or
ladder, direction, fall speed, jumped over, ladders already passed), throw timer, hammers left,
bonus, lives, score, death and rescue pauses, the step's events, steps, highest girder, jumps and
smashes. Actions per step: `idle`, `left`, `right`, `up`, `down`, `jump`, `jump-left`, `jump-right`.

### Saves and AI interface

Leaving a run for the menu saves it to resume. Env `girder-climb` v`2.0.0`: kind `real-time`
(60 Hz), one seat, the score as return; a 30-minute step limit.

### Achievements

| id       | Condition                    |
| -------- | ---------------------------- |
| `hop`    | Jump over a drum.            |
| `smash`  | Smash a drum with a hammer.  |
| `rescue` | Reach the kitten at the top. |
| `score`  | Score 20 000 points.         |

### Graphics and audio

Orange riveted girders with cross-bracing, cyan ladders (broken ones missing their middle), a boxy
grey robot with a red visor and blinking antenna that raises its arms to throw, blue banded drums
that spin as they roll, a recycler bin, a climber in a yellow hard hat and blue overalls, swinging
a hammer when holding one, and an orange kitten; the HUD shows the stage (1/4 to 4/4) beside the
level. Synthesized sounds for jumps, clearing and
smashing drums, the hammer, throws, the different ends, the rescue and extra lives.

### Testing criteria

Four distinct stages; for each, a sound layout (on screen, every ladder joining the girders it
names, upwards and a storey long, no girder across a ladder, kitten, hammers and throws on their
girders), the kitten reachable from the floor by whole ladders and joins, no girder without a way
on up, every kind of throw rolling through to the recycler or off screen, and the climber rescuing
the kitten; completing a stage leading to the next in order and the fifth level returning to the
first stage with a bigger bonus and faster drums; walking across a peak. The zigzag's alternating
slopes; walking the slope and climbing up and down; broken ladders; safe
jumps and fatal falls; jumping a drum and being hit; the hammer; the rescue and next stage; the
bonus running out; the climber rescuing and beating the walker; exact replays. The contract suite;
UI: walking, jumping and the end of a run; watch mode. E2E desktop + mobile.
