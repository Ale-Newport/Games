# #142 Narde — Game Specification

Long narde (long nardy), the race game of the Caucasus, Iran and Central Asia, on the race board
shared with Backgammon.

## Ruleset (`long-narde`)

24 points; each side's 15 checkers start on its head (its point 24), the two heads in opposite
corners, and both sides travel the same way round toward their home (their points 1–6). An
opening die each (rerolled on ties) decides who starts. Each turn: roll two dice (doubles play
four times) and move a checker per die to a point holding none of the opponent's checkers — a
single checker holds a point and there is no hitting. Only one checker may leave the head per
turn, except on a side's first turn with 6-6, 4-4 or 3-3, when two may. A play may not leave six
of the player's points in a row unless an opposing checker already stands past them (nearer its own
home than all six, or borne off); such steps are not offered. As many dice as possible must be
used, and the larger die when only one of two fits. Once all fifteen are home a checker bears off
with the exact die, or a higher die from the farthest point. A win is worth 1 (oin), or 2 (mars)
when the loser has borne off nothing. Matches go to 1, 3 or 5 points.

Coordinates: each side numbers points along its own path; side 1's point q is physical point
((q + 11) mod 24) + 1, which is its own inverse.

## Moves on the table

As in Backgammon: legal step orders for the roll, made one step at a time (tap a checker, then a
marked point or the tray), steps taken back until the last die commits the play; no play passes
the turn after a short notice; the opening dice are shown.

## Computer players

| Agent        | Play                                                                                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`     | Any legal play.                                                                                                                                                                                       |
| `greedy`     | The play whose result evaluates best: race (pips), the player's points standing in front of the opponent's checkers (runs counting more), points held, a penalty for stacks over three, checkers off. |
| `expectimax` | The six best plays by that evaluation, judged by the average over the opponent's 21 rolls of the position after its greedy reply.                                                                     |

The evaluation's weights were tuned by greedy-against-greedy matches: weighting blocks 3 instead
of 1.4 won 122 of 200 games against the first version, and a heavier stack penalty (2.5) won 182
of 300 against that. Measured on single games (seeded dice): greedy beat random 59 of 60;
expectimax beat greedy 69 of 120 (57.5%) at about 9 ms a move.

## States and actions

`NardeMatch`: seed and dice generator state, match length, score, the position, whose turn, dice,
phase (roll, move, game over, match over), first-turn flags, the opening dice, the last result,
the action history and game count. Actions: `roll`, `pass`, `next`, and `play:` with the steps as
from/to pairs (0 off). Saves are validated by replaying the history from the seed.

## Achievements

| id      | Condition                                 |
| ------- | ----------------------------------------- |
| `first` | Win a match against the computer.         |
| `mars`  | Win a game by mars against it.            |
| `hard`  | Win a match against the hard computer.    |
| `long`  | Win a 5-point match against the computer. |

## Graphics and audio

The shared SVG race board (no bar in use), ivory and dark checkers with counts past five, the dice
in the mover's colors, reachable points marked; synthesized dice, checker, hint and end sounds.

## Save format and AI interface

Save slot schema 1: `{ state, opponent }`. Env `narde` v`1.0.0`: kind `turn-based`, two seats,
zero-sum, deterministic transitions (the dice generator is in the state), config `{ matchTo }`
(1 by default); returns ±1 for the match winner.

## Testing criteria

The start and the board mapping, the head rule with its first-turn doubles, blocking by a single
checker, the six-point rule (never offered, allowed once an opponent is past), oin and mars, the
opening and match flow with replay validation, a computer match finished, the contract suite; UI:
turns by taps and hints against the computer, watch mode. E2E desktop + mobile.
