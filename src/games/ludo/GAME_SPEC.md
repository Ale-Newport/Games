# #145 Ludo — Game Specification

Classic Ludo for two to four players on the shared cross-board race core.

## Ruleset (`ludo-classic`)

A 15×15 cross: four arms of three columns (arm length 6) round a 3×3 centre. The loop runs
clockwise round the outside, 52 squares; each colour starts on the second square of its arm's
outer column and, after 51 squares, turns up the middle column of its own arm (five squares) to
home — 56 steps in all. Four tokens a colour start in the yard. Each turn: roll one die; a 6
brings a token out onto the start square. A token moves forward by the roll; home needs the exact
roll. A 6 gives another roll, and three sixes in a row lose the turn. Landing on a lone rival
token sends it back to its yard, except on the safe squares — the four start squares and the four
stars eight steps after them — where tokens share the square. Two tokens of one colour on a square
cannot be captured (and cannot be landed on by a rival). Capturing a token or bringing one home
earns another roll. A throw with no legal move passes. The first colour home with all four wins.
Two players sit on opposite arms; three on three arms; four on all of them.

## Shared core (`../shared/cross/`)

`geometry.ts` builds the board for any arm length (Parchís and Pachisi use 8); `race.ts` is the
rules engine with options for the exit throws, sixes, the three-sixes penalty, what captures and
homecomings earn (a roll or a bonus move), pairs that are safe or barriers, the safe squares and
the six-as-seven rule; `heuristic.ts` the computer players; `CrossBoard.tsx` and `RaceTable.tsx`
the table.

## Computer players

| Agent       | Play                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `random`    | Any legal move.                                                                                                                                                                                                                       |
| `simple`    | A token out on a six, otherwise the leading token that can move (the easy level).                                                                                                                                                     |
| `heuristic` | A score per move: captures (more for advanced victims), getting out, home and the home column, safe squares, and the danger of standing within a throw of a rival behind, against the danger left behind (the hard level, and hints). |

Measured (seeded dice): with four random players the wins split 11/10/11/8 over 40 games; the
simple rule beat random 145 of 200 two-player games; the heuristic beat the simple rule 151 of 200
two-player games and won 65 of 200 four-player games against three simple players (a quarter would
be even).

## States and actions

`RaceState`: seed and die generator state, the colours in play, token steps per seat (−1 yard),
whose turn, the die, sixes in a row, a pending bonus, the last token moved, phase (roll, move,
bonus, over), the winner, captures per seat, and the action history. Actions: `roll`, `pass`,
`move:<token>`, `bonus:<token>`. Saves are validated by replaying the history.

## Achievements

| id       | Condition                                    |
| -------- | -------------------------------------------- |
| `first`  | Win a game against the computer.             |
| `hard`   | Win against hard computer players.           |
| `four`   | Win a four-player game against the computer. |
| `hunter` | Win after capturing at least three tokens.   |

## Graphics and audio

An SVG board: coloured yards, the loop with coloured start squares and stars, the coloured home
columns, the centre's four triangles; tokens as coloured discs (movable ones pulse), stacks fanned
out; seat chips with tokens home; synthesized roll, move, capture, home, hint and end sounds.

## Save format and AI interface

Save slot schema 1: `{ state, level }`. Env `ludo` v`1.0.0`: kind `turn-based`, 2–4 seats
(config `{ players }`, 2 by default), deterministic transitions (the die generator is in the
state); returns 1 for the winner and 0 for the others.

## Testing criteria

The board layout (52-square loop, starts, home columns), getting out on a six, captures, safe
squares and pairs, the exact roll home, the three-sixes penalty, extra rolls, replay validation,
the agents' choices and finished games, the contract suite for two and four players; UI: rolls and
moves by taps and hints against the computer, watch mode with four players. E2E desktop + mobile.
