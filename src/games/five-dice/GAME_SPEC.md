# #149 Five Dice — Game Specification

The scorecard dice classic under a generic name, with its own look and texts.

## Ruleset (`five-dice-13`)

1–4 players, thirteen rounds. A turn rolls five dice up to three times, holding any dice between
rolls, then scores the hand in one open box (possibly for 0). Boxes: ones to sixes (the sum of that
face), three and four of a kind (the sum of all five), full house 25, small straight (four in a
row) 30, large straight (five in a row) 40, five of a kind 50, chance (the sum). A 35-point bonus
when the upper boxes total 63 or more. Every further five of a kind, once that box holds 50, adds
100 and is a joker: it must go in its face's upper box if open, otherwise any lower box scores it in
full (a full house 25, straights 30 and 40). Highest total wins.

## Shared scorecard core (`../shared/scorecard/`)

`turn.ts` plans a turn exactly: over the 252 hands of five dice, every set of dice to keep and every
outcome of rerolling the rest, with the value of standing at any point given by the game (memoized
per hand and rolls left); `game.ts` holds the state, actions (`roll:<mask>`, `score:<box>`) and
replay validation for any `ScoreRules`; `planner.ts` the computer players; `ScorecardTable.tsx` the
table, shared with Generala.

## Computer players

| Agent     | Play                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`  | Random holds and boxes.                                                                                                                                                         |
| `simple`  | Keeps its most common face; scores the box that pays most now (25 or more ends the turn).                                                                                       |
| `planner` | Plans every roll of the turn exactly; a box is worth its score minus its typical value later (its par), with upper boxes also judged against three of their face for the bonus. |

Measured: the planner averaged 240.6 points over 200 solo games (best play is known to average
about 254.6) at about 3 ms a turn; in 200 two-player games it averaged 238.6 against the simple
player's 188.2 and won 160.

## States and actions

`DiceGame`: seed and dice generator state, players, cards, bonuses (the extra fives of a kind),
whose turn, the dice, rolls used, phase, an instant winner (Generala only), and the action history.
Saves are validated by replay.

## Achievements

| id         | Condition                           |
| ---------- | ----------------------------------- |
| `first`    | Finish a game.                      |
| `score250` | Score 250 points or more.           |
| `fiveKind` | Score 50 in the five-of-a-kind box. |
| `beat`     | Win a game against the computer.    |

## Graphics and audio

Ivory dice that rise and take a gold ring when held, the scorecard with every player's column and
the current hand's score previewed in each open box (tap to take it), the upper total and the grand
total; synthesized roll, score, zero, hint and end sounds.

## Save format and AI interface

Save slot schema 1: `{ state, level }`. Env `five-dice` v`1.0.0`: kind `turn-based`, 1–4 seats
(config `{ players }`, 2 by default), deterministic transitions; returns 1 for the winner (0.5 each
on a tie).

## Testing criteria

Every box's scoring, the upper bonus, the five-of-a-kind extras and joker rule, the planner's hand,
keep and outcome enumeration, chasing five of a kind with four alike, the planner outscoring the
simple player, rolls with holds and scoring through the action API, replay validation, the contract
suite; UI: a roll, a hold, a hint and a box scored; a computer player's turns. E2E desktop + mobile.
