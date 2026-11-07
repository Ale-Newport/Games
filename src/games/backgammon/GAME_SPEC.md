# #141 Backgammon — Game Specification

Standard backgammon with the doubling cube, played against the computer or by two people on one
device.

## Ruleset (`backgammon-standard`)

24 points, 15 checkers a side in the standard start (2 on the 24-point, 5 on the 13, 3 on the 8,
5 on the 6, mirrored for the opponent). The opening roll (one die each, rerolled on ties) decides
who starts, with those two dice. Each turn: roll two dice (doubles play four times); a checker
moves by a die to a point not held by two or more opposing checkers, hitting a single one to the
bar; checkers on the bar must enter first; as many dice as possible must be used, and the larger
one when only one of two fits; once all fifteen are home a checker bears off with the exact die,
or a higher die from the farthest point. A game is worth 1, 2 (gammon: the loser bore off none)
or 3 (backgammon: and still has a checker in the winner's home or on the bar), times the cube.

Matches go to 1, 3 or 5 points. In longer matches, before rolling the player who may use the cube
(either player while it is in the middle, then its owner) may double; the opponent takes (the
value doubles and the cube passes to them) or drops (losing the current value). The Crawford rule
applies: no doubling in the game right after a player first reaches match point minus one. A
1-point match has no cube.

## Moves on the table

Legal plays are generated as every order of single steps for the roll that uses the most dice
(and the larger die when only one fits); the table lets the player make the steps one at a time
along those orders — tap a checker (or the bar), then one of the marked points or the tray — and
take steps back until the last die is played, which commits the turn. A play is one of the
distinct resulting positions (16 for an opening 3-1). When no play exists the turn passes after a
short notice.

## Computer players

| Agent        | Play                                                                                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`     | Any legal action, cube decisions included.                                                                                                                                                                              |
| `greedy`     | The play whose result evaluates best: race (pips), shots at its blots (rolls that hit, out of 36), made home and outfield points, primes, anchors, the bar, checkers off, stacks; a pure pip race once contact is over. |
| `expectimax` | The six best plays by that evaluation, each judged by the average over the opponent's 21 rolls of the position after the opponent's greedy reply.                                                                       |

Doubling: a win chance is estimated from the evaluation (a logistic curve) or, in a pure race,
from the pip lead relative to the race length. Players double between 68% and 90% and take when
they still win at least 24% of the time.

Measured on single games (seeded dice): greedy beat random 98 of 100; expectimax beat greedy 75 of
120 (62.5%) at about 11 ms a move (greedy 0.1 ms). The greedy evaluation's choice for an opening
3-1 is the classic one, making the 5-point.

## States and actions

`MatchState`: seed and dice generator state, match length, score, Crawford flags, the position,
whose turn, dice, phase (roll, move, doubled, game over, match over), cube value and owner, the
last game's result, the action history and game count. Actions: `roll`, `double`, `take`, `drop`,
`pass`, `next`, and `play:` with the steps as from/to pairs (25 the bar, 0 off). Saves are
validated by replaying the history from the seed.

## Achievements

| id       | Condition                                 |
| -------- | ----------------------------------------- |
| `first`  | Win a match against the computer.         |
| `gammon` | Win a gammon or backgammon against it.    |
| `hard`   | Win a match against the hard computer.    |
| `long`   | Win a 5-point match against the computer. |

## Graphics and audio

An SVG board shared with Narde (`../shared/raceboard/`): wooden frame, felt, alternating points,
ivory and dark checkers with counts past five, the bar, the trays, dice in the mover's colors, the
reachable points marked; the cube beside the score leans toward its owner. Synthesized dice,
checker, hit, hint and end sounds.

## Save format and AI interface

Save slot schema 1: `{ state, opponent }`. Env `backgammon` v`1.0.0`: kind `turn-based`, two
seats, zero-sum, deterministic transitions (the dice generator is in the state), config
`{ matchTo }` (1 by default); returns ±1 for the match winner.

## Testing criteria

Pips and opening plays, entering, blocked points and hits, using both dice or the larger, bearing
off rules, gammon and backgammon values, contact, the opening 3-1 choice, doubling and taking
thresholds, the match flow with the cube and drops, a computer-against-computer match finished
and replay-valid, the contract suite; UI: turns by taps and hints against the computer, a double
answered, watch mode. E2E desktop + mobile.
