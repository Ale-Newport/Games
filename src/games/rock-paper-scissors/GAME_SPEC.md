# #162 Rock Paper Scissors — Game Specification

The hand game against computer opponents that learn your habits.

## Ruleset (`rps-first-to`)

Each round both players throw rock, paper or scissors at once: paper covers rock, scissors cut
paper, rock crushes scissors; equal throws tie and do not count. The first to win 3, 5 or 10 rounds
wins the match.

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

Saves: schema 1 `{ state, level }`, validated by replaying the history. Kind `simultaneous` (as sequential commitment), two
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

`rps-bench`, 100-round sessions over 30 seeds (share of decided rounds won by the first-named
player): mind reader vs coin flip 50%, vs counter 99%, vs pattern reader 91%, vs a cycler (rock,
paper, scissors, …) 100%, vs beat-your-last-throw 99%, vs always-rock 99%. Pattern reader vs counter
85%; counter vs cycler 1% (it is exploited).

## Testing criteria

The beat relation, rounds and ties, the match target, the hidden pending throw, replay validation,
decisions independent of the pending throw, readers punishing a cycler, the mind reader beating the
pattern reader and the counter, nobody reading a random player; the contract suite for each match
length; UI: a whole match with hints and the read revealed, watch mode. E2E desktop + mobile.
