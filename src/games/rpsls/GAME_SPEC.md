# #163 Rock Paper Scissors Lizard Wizard — Game Specification

The five-throw extension of rock, paper, scissors, with an original cast (catalog id `rpsls`).

## Ruleset (`rplw-first-to`)

Five throws in a circle — rock, wizard, paper, lizard, scissors — each beating the two before it:
rock crushes scissors and squashes the lizard; the wizard melts rock and enchants scissors; paper
covers rock and binds the wizard in a scroll; the lizard eats paper and bites the wizard; scissors
cut paper and snip the lizard's tail. Equal throws tie and do not count; the first to win 3, 5 or
10 rounds wins.

## Computer players (shared core `shared/throws`)

They read only finished rounds — the pending throw is hidden from the second seat — and throw
what beats their prediction:

- `random` ("Coin flip"): uniform throws from the match seed: the equilibrium, unbeatable in the
  long run.
- `frequency` ("Counter"): beats the opponent's most common throw, older rounds fading (×0.95).
- `markov` ("Pattern reader"): what the opponent threw after the same last two rounds (both
  throws), falling back to one round, then to frequency.
- `meta` ("Mind reader"): an ensemble in the spirit of the "Iocaine Powder" programs: frequency,
  Markov on one and two rounds and repeat-last on the opponent, plus the same predictors applied to
  its own throws (what an opponent reading it would throw), each also shifted one and two steps
  around the circle for second-guessing; every candidate is scored on how its throw would have fared
  (fading ×0.9) and the best plays; with no trusted read it throws at random.

The hint reads the computer the way the mind reader would read you; after each round you can reveal
whether the computer's throw came from a read (and which throws it beats) or at random.

## States and actions

`Duel`: throws (3 or 5), target, seed, rounds (both throws), the pending first throw, round wins,
phase, winner, history. Actions: `throw:<i>`. Seat 0 throws, then seat 1; the round resolves when
both have thrown.

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by replaying the history. Kind `turn-based`, two
seats, hidden information (seat 1's observation hides seat 0's pending throw), config `{ target }`
(3, 5 or 10; 5 by default), zero-sum returns ±1.

## Achievements

| id        | Condition                           |
| --------- | ----------------------------------- |
| `first`   | Win a match.                        |
| `mind`    | Beat the Mind reader.               |
| `streak`  | Win five rounds in a row.           |
| `shutout` | Win a match without losing a round. |

## Graphics and audio

Original SVG throws; both hands' last throws with the round's verb, green and red rims for the
winner and loser, the last twelve rounds as pairs, bars of your own throw counts; synthesized
sounds for the shake, rounds won, lost or tied, hints and the match's end.

## Measured

`rps-bench`, 100-round sessions over 30 seeds: mind reader vs coin flip 51%, vs counter 98%, vs
pattern reader 75%, vs a cycler 99%, vs beat-your-last-throw 98%. With five throws there are fewer
repeats to learn from, so every reader's edge is smaller than with three.

## Testing criteria

Each throw beating exactly two, the named pairs, the shared duel tests (rounds, target, hidden
throw, replays, readers), the mind reader beating the counter with five throws; the contract suite;
UI: a whole match with hints and the read revealed, watch mode. E2E desktop + mobile.
