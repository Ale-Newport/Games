# #143 Royal Game of Ur — Game Specification

The race game from the Royal Cemetery at Ur (about 2600 BCE), with the rules Irving Finkel
reconstructed from a Babylonian tablet of about 177 BCE.

## Ruleset (`ur-finkel`)

Two sides of seven pieces. Each side's path is 14 squares: four private squares, the eight shared
squares of the middle row (5–12, the same squares in the same order for both), and two private
squares; a piece leaves at 15 with an exact throw. The throw is four binary (tetrahedral) dice:
0–4 with chances 1, 4, 6, 4, 1 in 16. A move takes one piece (or a new piece from the start)
exactly that far; a piece may not land on its own side's piece; landing on an opposing piece on a
shared square sends it back to the start, except on the central rosette (square 8), which is safe
and so cannot be entered while the opponent holds it. Landing on a rosette (4, 8, 14) gives
another throw. A 0, or a throw no piece can use, passes the turn. The first to bear off all seven
wins. The seed decides who starts.

## Board

The historical shape: three rows of eight, the outer rows missing their fifth and sixth squares
(that gap holds the pieces waiting to enter, shown beside the board); rosettes on the four corner
squares of the outer blocks and the middle of the central row.

## Computer players

| Agent    | Play                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal move.                                                                                                                                                                                   |
| `greedy` | The move whose result evaluates best (with a bonus for rosettes): progress, pieces off, pieces at risk on the shared row weighted by the chance of the throw that hits them, the central rosette. |
| `search` | Expectiminimax three moves deep over the five throws, following the extra turns rosettes give.                                                                                                    |

Measured (seeded throws): greedy beat random 100 of 100; a two-move search beat greedy 70 of 100,
and the three-move search the game uses beat greedy 59 of 60 at about 0.5 ms a move.

## States and actions

`UrGame`: seed and dice generator state, the position (occupied squares per side, pieces waiting
and off), whose turn, the current dice, phase (throw, move, over), the winner, captures per side,
and the action history. Actions: `throw`, `pass`, `move:<square>` (0 enters a piece). Saves are
validated by replaying the history from the seed.

## Achievements

| id        | Condition                                  |
| --------- | ------------------------------------------ |
| `first`   | Win a game against the computer.           |
| `hard`    | Beat the hard computer.                    |
| `shutout` | Win before the computer bears off a piece. |
| `raider`  | Win after capturing at least three pieces. |

## Graphics and audio

An SVG board in sand and lapis with blue rosettes, ivory and dark pieces (movable ones ringed in
gold), the four pyramid dice with their marked tips, trays of pieces to enter and borne off;
synthesized throw, move, rosette, capture, hint and end sounds.

## Save format and AI interface

Save slot schema 1: `{ state, opponent }`. Env `royal-game-of-ur` v`1.0.0`: kind `turn-based`, two
seats, zero-sum, deterministic transitions (the dice generator is in the state); returns ±1.

## Testing criteria

Throw odds, entering, exact moves and bearing off, no landing on one's own piece, captures on the
shared row only and never on the central rosette, extra throws, the board layout, turns and
passes with replay validation, the search preferring a capture, computer games finished, the
contract suite; UI: throws and moves by taps and hints against the computer, watch mode. E2E
desktop + mobile.
