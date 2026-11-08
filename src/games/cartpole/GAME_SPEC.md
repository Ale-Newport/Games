# #198 Balancing Cart — Game Specification

The classic cart-and-pole balancing problem, played by hand. The name is generic.

## Ruleset (`balancing-cart`)

- **Physics**: the textbook cart-pole equations (cart 1 kg, pole 0.1 kg, gravity 9.8), one Euler
  step every 1/60 s. Actions: `idle`, `left`, `right` — a 4 N push on the cart. Pushing right
  swings the pole left, so a pole leaning right is caught by pushing right.
- **Poles** (option): long (6 m, half-length 3) or short (4 m). The textbook pole (1 m with a 10 N
  push) falls in well under a second, faster than a person reacts: with a reaction time of a
  quarter second no fixed bang-bang controller kept it up for even a second in our tests, while on
  4–6 m poles one lasted the full minute without wind. The poles are therefore tall and the push
  gentler; this is a deliberate change from the machine-learning benchmark.
- **The start**: the cart in the middle of the rail, the pole leaning 0.02–0.04 rad one way.
- **The end**: the pole past 0.42 rad (24°) or the cart more than 2.4 m from the middle.
- **Wind**: calm for 20 s, then a gust every 3–6 s for a quarter second, a sideways push on the
  pole of 60–100 % of a strength that grows from 1 N to 3 N over the next two minutes.
- **Score**: tenths of a second balanced.

## Players (watch mode and AI Lab)

- `balancer`: pushes right when 10 × lean + 10 × swing + 0.5 × offset + speed is positive (left
  when negative); the gains were chosen by a grid search over runs with gusts.
- `leaner`: pushes the way the pole leans (and nothing within 0.01 rad).

Measured (6 seeds, 10-minute limit): the balancer kept both poles up for the full 10 minutes in all
runs; the leaner kept them up but drifted off the rail after 15–18 s (long) and 11–14 s (short); an
idle cart drops the long pole in about 2 s and the short one in about 1.7 s. A simulated person (a
quarter-second delay, deciding every 3 steps, best fixed gains) lasted 43 s (long) and 35 s (short)
over three seeds — the gusts are what end most runs.

## States and actions

`Cart`: generator, pole, cart position and speed, pole angle and rate, the current gust and its
steps left, steps to the next gust, pushes, how it ended, the step's events, steps.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `cartpole` v`1.0.0`: kind `real-time` (60 Hz),
one seat, the score as return; a 30-minute step limit. Config: `{ options: { pole } }`.

## Achievements

| id        | Condition                                 |
| --------- | ----------------------------------------- |
| `ten`     | Balance for 10 seconds.                   |
| `weather` | Keep balancing 10 seconds into the gusts. |
| `minute`  | Balance for 60 seconds.                   |
| `short`   | Balance the short pole for 60 seconds.    |

## Graphics and audio

A dark stage, the rail with red end stops and metre marks, a blue cart on two wheels, a yellow pole
with an orange weight, a fan showing the 24° limit that reddens as the pole nears it, wind streaks
during gusts, and the seconds left of the calm start. Synthesized sounds for gusts, every 10 s and
the fall.

## Testing criteria

The start; falling when left alone (the short pole sooner); the push direction and gravity; running
off the rail; the calm, the number and growth of the gusts; the score; the balancer holding both
poles for five minutes while the leaner runs off the rail; exact replays. The contract suite with
both poles; UI: the short pole falling, a held push, watch mode. E2E desktop + mobile.
