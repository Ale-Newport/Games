# #193 Nebula Strike — Game Specification

A vertical scrolling shooter with an original name and look.

## Ruleset (`nebula-strike`)

A 240 × 320 portrait view at 60 steps a second. The fighter flies at 2.2 px a step within the lower
65 % of the screen and fires every 7 steps: 1, 2, 3, 4 or 5 shots in a fan by power. Only its core
(radius 3, plus 2 of grace) can be hit. Waves come every 40–110 steps (sooner on later stages) for
a minute: four darters weaving down and firing aimed shots, three swoopers curving in from a side,
a heavy tank that stops near the top and fires three-way spreads (8 hits), or a carrier that crosses
the top and drops a pickup when destroyed (P: power, or B: a bomb). Then a boss arrives (160 hits,
+60 a stage) and sweeps side to side, alternating aimed five-shot bursts with rotating rings of 14
bullets. Bringing it down starts the next stage, with faster enemies and bullets and more hit points.
A bomb (three to start, at most six) clears all enemy bullets and deals 10 damage to every enemy (25
to the boss). Losing a life costs a level of power and gives 2.5 s of safety. Points: darter 100,
swooper 150, carrier 300, tank 600, boss 10 000 (all × (1 + 0.5 per stage beyond the first)),
pickups 500. Three lives, one more every 50 000.

## Players (watch mode and AI Lab)

- `ace`: always firing (as everyone is), it tries each of its nine moves for the next 20 steps
  against the enemy bullets and bodies moving straight on, and takes the one with the largest
  margin, breaking near-ties by lining up under its target (the boss, else the lowest enemy) and
  staying low; it bombs when no move keeps it clear.
- `sweeper`: keeps low and slides under the lowest enemy, never dodging.

Measured (8 runs each, 10-minute cap): ace averaged 329 578 points and 4.6 stages cleared (543 s,
642 kills); sweeper 7031 points and no stage (35 s); doing nothing lasts 16 s.

## States and actions

`Strike`: generator, stage, stage clock, fighter position, power, bombs, bomb held, fire timer,
shots, enemies (kind, position, hit points, flight time, phase, fire timer), enemy bullets, pickups,
bomb flash, safety, next wave, boss out, lives, score, next extra life, death pause, the step's
events, steps, kills. Actions: `idle`, `bomb` and eight moves.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `vertical-shmup` v`1.0.0`: kind `real-time`
(60 Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id       | Condition             |
| -------- | --------------------- |
| `pickup` | Pick up a power-up.   |
| `boss`   | Bring down a boss.    |
| `stage3` | Reach stage 3.        |
| `score`  | Score 100 000 points. |

## Graphics and audio

Deep space with a drifting purple nebula and stars scrolling at three speeds; a pale fighter with a
blue core, blinking while safe; red darters, purple swoopers, green tanks, yellow carriers marked P,
a magenta boss with a pulsing core and a health bar; cyan shots, pink bullets; orange and red pickup
squares; a white flash for a bomb. Synthesized sounds for firing, kills, bombs, pickups, the boss
and its fall, being hit and extra lives.

## Testing criteria

Flight limits, auto-fire and spreads; shots killing and scoring; being hit and the safety after;
bombs (once per press); pickups; the boss and the next stage; the ace outlasting the sweeper; exact
replays. The contract suite; UI: a bomb and being shot down; watch mode. E2E desktop + mobile.
