# #180 Girder Climb — Game Specification

A single-screen climbing arcade game in the classic girder mould, with an original name, cast and
layout: a runaway robot, rolling drums, a climber in a hard hat and a kitten to rescue.

## Ruleset (`girder-climb-drums`)

A 224 × 256 screen on a 60 Hz clock. Six girders zigzag up the screen, each sloping so that drums
roll the opposite way to the one below; a short platform at the top holds the kitten. Thirteen
ladders join them, four of them broken (drums only). The climber walks at 0.75 px a step along the
slope, climbs whole ladders at 0.55 (a sideways press within 6 px of either end steps off), and jumps a fixed arc (about 20 px high, 38 steps, keeping the
sideways speed it had); walking off a girder end or landing more than 20 px below the take-off is a
fatal fall. The robot throws a drum every 170 steps on level 1 (15 fewer a level, at least 80,
±30 %). Drums roll downhill at 0.9 px a step (+0.12 a level, up to level 7), drop off the low end
onto the girder below, and at the top of each ladder they pass take it down with chance 15 % (40 %
when the climber is lower down), +4 % a level; they end in the recycler at the bottom left. A drum
touching the climber costs a life; jumping clear over one scores 100. Two hammers hang on the way:
touching one gives ten seconds of smashing (300 a drum within reach) but no jumping or climbing.
The bonus starts at 5000 (+1000 a level, up to 8000) and drops 100 every two seconds; reaching
the kitten scores it and starts the next level; at zero the climber loses a life. Three lives, one
more at 10 000; losing a life restarts the climb with a fresh bonus and no drums.

## Players (watch mode and AI Lab)

- `climber`: heads for the nearest whole ladder up (the kitten on the top platform), jumps a drum
  rolling at it once the drum is within jumping range, waits at a ladder's foot while a drum is on
  the ladder or about to pass its top, steps aside from drums dropping from above, and backs down
  a ladder when a drum comes down it.
- `walker`: the same route without jumping or waiting.

Measured (6 runs each, 10-minute cap): climber averaged 7900 points and 1.5 rescues over 66 s;
walker 2283 points and 0.5 rescues; standing still scores nothing (47 s).

## States and actions

`Girders`: generator, level, climber (position, mode — walk, climb, jump, fall — girder or ladder,
speed, take-off height, facing, hammer time), drums (position, mode — roll, ladder, fall — girder or
ladder, direction, fall speed, jumped over, ladders already passed), throw timer, hammers left,
bonus, lives, score, death and rescue pauses, the step's events, steps, highest girder, jumps and
smashes. Actions per step: `idle`, `left`, `right`, `up`, `down`, `jump`, `jump-left`, `jump-right`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `girder-climb` v`1.0.0`: kind `real-time`
(60 Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id       | Condition                    |
| -------- | ---------------------------- |
| `hop`    | Jump over a drum.            |
| `smash`  | Smash a drum with a hammer.  |
| `rescue` | Reach the kitten at the top. |
| `score`  | Score 20 000 points.         |

## Graphics and audio

Orange riveted girders with cross-bracing, cyan ladders (broken ones missing their middle), a boxy
grey robot with a red visor and blinking antenna that raises its arms to throw, blue banded drums
that spin as they roll, a recycler bin, a climber in a yellow hard hat and blue overalls, swinging
a hammer when holding one, and an orange kitten. Synthesized sounds for jumps, clearing and
smashing drums, the hammer, throws, the different ends, the rescue and extra lives.

## Testing criteria

The zigzag layout and ladders; walking the slope and climbing up and down; broken ladders; safe
jumps and fatal falls; jumping a drum and being hit; the hammer; the rescue and next level; the
bonus running out; the climber rescuing and beating the walker; exact replays. The contract suite;
UI: walking, jumping and the end of a run; watch mode. E2E desktop + mobile.
