# #166 Pong — Game Specification

The original paddle duel, against a computer opponent. First game on the shared real-time arcade
shell (`shared/arcade`), which the arcade games #166–#200 reuse.

## Ruleset (`pong-60hz`)

A 400 × 300 field simulated at 60 steps a second. You move the left paddle (56 px, 5.4 px a step);
the computer moves the right one. The ball (7 px) starts at 4.2 px a step, bounces off the top and
bottom walls, and leaves a paddle at an angle set by where it struck: from straight (centre) up to
60° (edge), 4% faster each hit up to 10 px a step. A ball past a paddle is a point; after a pause the
next serve goes towards the side that conceded, at a random angle of up to ±30°. Games to 3, 5 or 11.

## The computer opponent

When the ball heads its way and passes a reaction line, it predicts where the ball will cross its
side (unfolding wall bounces), adds an aiming error, and moves there at its top speed; otherwise it
drifts to the middle. Levels: easy (3 px/step, ±34 px, reacts in the last 45% of the field), medium
(4, ±24, 50%), hard (5, ±16, 55%).

## Player policies (watch mode and AI Lab)

- `tracker`: moves to the predicted crossing and meets the ball off-centre, away from the computer's
  paddle, for a steep return.
- `follower`: follows the ball's current height.

Measured (`pong-bench`, 100 games to 5 per cell): the tracker beat every level 100/100 (games against
hard last about 8 minutes of play); the follower won 100 against easy, 87 against medium and 20
against hard; an idle paddle lost every game.

## States and actions

`Pong`: generator state, level, target, ball position and velocity, both paddles, scores, serve
countdown and direction, current and best rally, the computer's aim, the step's events, steps.
Actions per step: `up`, `down`, `idle`. A pointer held on the field steers the paddle towards it.

## Saves and AI interface

Leaving a run for the menu saves it (schema 1 `{ state, options }`, structurally validated) to resume.
Env `pong` v`1.0.0`: kind `real-time` (`tickRate` 60), one seat, one action per step, the run's
score as return; a 20-minute step limit ends runs between two players that never miss.

## Achievements

| id        | Condition                       |
| --------- | ------------------------------- |
| `first`   | Win a game.                     |
| `hard`    | Beat the hard computer.         |
| `shutout` | Win without conceding a point.  |
| `rally`   | Keep a rally going for 20 hits. |

## Graphics and audio

A dark court with a dashed net and large faint scores, a violet paddle for you and a gold one for
the computer, a white ball with a short trail (none with reduced motion); synthesized blips for
paddle and wall hits, rising and falling tones for points, and the end's fanfare. Pause, restart,
touch buttons and drag steering come from the shell.

## Testing criteria

Serving, wall bounces, paddle movement, angled returns and rally counting, crossing prediction
through bounces, points and the target, levels separating a simple player, the contract suite; UI:
a short game lost by an idle paddle with touch input, pause and resume, the result recorded; watch
mode scoring. E2E desktop + mobile.
