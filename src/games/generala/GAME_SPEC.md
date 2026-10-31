# #150 Generala — Game Specification

The scorecard dice game of Argentina, Uruguay and much of Latin America and Spain, on the shared
scorecard core of #149.

## Ruleset (`generala-11`)

1–4 players, eleven rounds. A turn rolls five dice up to three times, holding any between rolls,
then scores the hand in an open box or crosses one out with 0. Boxes: ones to sixes (the sum of
that number); straight 20 (1-2-3-4-5, 2-3-4-5-6 or 3-4-5-6-1); full house 30; four of a kind 40;
generala (five alike) 50; double generala 100 (only once the generala box holds 50). A straight,
full house or four of a kind made on the turn's first roll ("served") scores 5 more. A served
generala wins the game at once. Otherwise the highest total wins.

## Computer players

The shared players of #149: `random`, `simple` and the `planner`, which plans each turn exactly —
standing early when a served hand pays — and values each box by its score minus its typical value
later. Measured: in 200 two-player games the planner averaged 156.9 against the simple player's
129.3 and won 146; solo it averaged 151.1 (a served generala ended 1 of 200 games, about the 0.9%
the odds give over eleven turns).

## States, actions, saves, AI interface

As #149 (`DiceGame`; actions `roll:<mask>`, `score:<box>`; replay validation; schema 1
`{ state, level }`), with the instant winner recorded. Env `generala` v`1.0.0`: kind `turn-based`,
1–4 seats (config `{ players }`), deterministic transitions; returns 1 for the winner (0.5 each on
a tie).

## Achievements

| id         | Condition                           |
| ---------- | ----------------------------------- |
| `first`    | Finish a game.                      |
| `served`   | Win at once with a served generala. |
| `score250` | Score 250 points or more.           |
| `beat`     | Win a game against the computer.    |

## Graphics and audio

The shared scorecard table: held dice rise with a gold ring, each open box previews the hand's
score (served bonuses included); the shared sounds.

## Testing criteria

Every box's scoring with and without the served bonus, the three straights, double generala only
after a generala, the instant win, the planner outscoring the simple player and standing on a
served four of a kind when only that box pays, replay validation, the contract suite; UI: a roll,
a hold, a hint and a box scored; a computer player's turns. E2E desktop + mobile.
