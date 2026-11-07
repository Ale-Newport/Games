# #151 Farkle — Game Specification

The push-your-luck dice game played with six dice, under a common modern scoring table.

## Ruleset (`farkle-10000`)

1–4 players, first to 10 000. A turn rolls six dice; the player sets aside at least one scoring
combination from the roll and then banks the turn's points or rolls the dice left. A roll with
nothing to score is a farkle: the turn's points are lost. When all six dice have scored ("hot
dice") the player may roll all six again. A player's first bank must be worth 500 or more. Once
someone reaches 10 000 every other player gets one last turn, in which a bank must beat the leader;
the highest score wins. Solo, the game counts the turns needed to reach 10 000.

Scoring (dice set aside together, every die must score): a single 1 is 100, a single 5 is 50;
three of a kind 100 × the face (1000 for 1s); four, five and six of a kind 1000, 2000, 3000; a
straight 1–6 1500; three pairs 1500; four of a kind with a pair 1500; two triplets 2500.

Rule variations differ from table to table; this is one fixed, documented set (shown in How to
play), not a claim to be the only one.

## Computer players

- `random`.
- `cautious` — sets aside everything that scores and banks at 300 or with two dice or fewer left.
- `planner` — plays each turn by dynamic programming over (dice left, points at stake, in steps of
  50 up to 3000): for each scoring choice it compares banking with the expected bank of rolling on.
  The tables give 600.7 points for a turn from scratch; it banks with one die left from 350, two
  from 300, three from 450 and four from 1050, and almost never with five or six. It respects the
  opening rule and banks at once when that wins the final round.

Measured (`fk-bench`, 400 two-player games, seats alternated): the planner beat the cautious player
in 241 (60.3%). Solo it needed 17.4 turns on average to reach 10 000, against 19.2 for the cautious
player. Simplification, stated honestly: the turn tables maximize the expected points of a turn and
do not model the opening rule or the race (how far behind or ahead the player is).

## States and actions

`FarkleGame` (`match.ts`): seed and generator state, scores, opened flags, turn, the dice of the
roll, dice aside, stake, phase (`roll`/`choose`/`over`), the final-round seat, winner, farkles and
turns per seat, the last event, history. Actions: `roll`; `keep:<counts>:roll` and
`keep:<counts>:bank` (six digits: dice set aside per face).

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by replaying the history from the seed. Env `farkle`
v`1.0.0`: kind `turn-based`, 1–4 seats (config `{ players }`), deterministic transitions (dice come
from the stored generator), returns 1 for the winner.

## Achievements

| id      | Condition                               |
| ------- | --------------------------------------- |
| `first` | Finish a game.                          |
| `fast`  | Reach 10 000 solo in 20 turns or fewer. |
| `beat`  | Win a game against the computer.        |
| `clean` | Win without a single farkle.            |

## Graphics and audio

Six dice that tap to select a scoring set (the dice set aside sit apart), the stake and the banked
scores, a live preview of the points of the selection, hints that highlight the planner's choice;
synthesized sounds for rolls, keeps, banks, farkles, hints, wins and losses.

## Testing criteria

Every scoring pattern, every scoring choice listed, the turn tables (≈600 from six dice; banking 400
with one die left beats rolling), a farkle, the opening rule and hot dice, agents finishing games
that replay, the contract suite; UI: a solo game following hints, watch mode. E2E desktop + mobile.
