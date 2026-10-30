# #144 Senet — Game Specification

Ancient Egypt's game of passing, played for some two thousand years; its rules are lost, and this
follows Timothy Kendall's widely used reconstruction.

## Ruleset (`senet-kendall`)

30 squares in three rows of ten, travelled in an S (row one left to right, row two right to left,
row three left to right). Five pieces a side start alternating on squares 1–10 (light on the odd
squares). The throw is four two-sided sticks: the light faces up count 1–4 (chances 4, 6, 4, 1 in 16) and none up counts 5 (1 in 16); a 1, 4 or 5 gives another throw. A piece moves forward by the
throw and may not land on its own piece. Landing on a lone opposing piece swaps the two; two
opposing pieces in a row protect each other, and three or more in a row cannot be passed. Every
piece must stop exactly on 26, the House of Happiness; from there a 5 bears it off and 1–4 take
it to 27–30. Square 27, the Water, sends a piece back to 15 (or the first free square before
it). A piece leaves 28 (the Three Truths) with exactly 3, 29 (Re-Atoum) with exactly 2 and 30 (Ra)
with exactly 1. Squares 26–30 cannot be attacked. With no legal move the turn passes (and any
extra throw is lost). The first to bear off all five wins; the seed decides who starts.

## Computer players

| Agent    | Play                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `random` | Any legal move.                                                                                                                                                                |
| `greedy` | The move whose result evaluates best: progress, pieces off, lone pieces within reach of an opposing piece 1–5 behind (weighted by the chance of that throw), pairs and threes. |
| `search` | Expectiminimax two moves deep over the five throws, following the extra throws.                                                                                                |

Measured (seeded throws): random against random split 26–24 over 50 games; greedy beat random 71
of 100; the two-move search beat greedy 60 of 100 at 0.06 ms a move. A three-move search won only
32 of 60 against greedy in a test run, so the game uses two: senet is a game of much chance.

## States and actions

`SenetGame`: seed and stick generator state, the board (30 squares), pieces off, whose turn, the
current sticks, phase (throw, move, over), the winner, swaps per side, and the action history.
Actions: `throw`, `pass`, `move:<square>`. Saves are validated by replaying the history.

## Achievements

| id        | Condition                                            |
| --------- | ---------------------------------------------------- |
| `first`   | Win a game against the computer.                     |
| `hard`    | Beat the hard computer.                              |
| `shutout` | Win before the computer bears off a piece.           |
| `swapper` | Win after swapping with opposing pieces three times. |

## Graphics and audio

An SVG board in sand on a wooden frame, the houses of the last row marked (☥, ≈, III, II, I),
light cones against dark spools as on the surviving boards, the four sticks showing their faces,
trays of borne-off pieces; synthesized stick, move, swap, water, hint and end sounds.

## Save format and AI interface

Save slot schema 1: `{ state, opponent }`. Env `senet` v`1.0.0`: kind `turn-based`, two seats,
zero-sum, deterministic transitions (the stick generator is in the state); returns ±1.

## Testing criteria

The start, throw odds and extra throws, the S route, swaps, protection and blockades, the stop on
26, the Water and the exact exits, turns and passes with replay validation, the greedy and search
players preferring a swap and finishing games, the contract suite; UI: throws and moves by taps
and hints against the computer, watch mode. E2E desktop + mobile.
