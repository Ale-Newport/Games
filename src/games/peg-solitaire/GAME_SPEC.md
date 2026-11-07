# #128 Peg Solitaire — Game Specification

## Ruleset (`peg-solitaire-boards`)

A peg jumps in a straight line over a neighbouring peg into the empty hole just beyond it, and the
jumped peg is removed. The game ends when no jump is left; it is won with a single peg (on the
English board, in the centre).

| Board    | Holes | Directions                       | Start                  | Goal             |
| -------- | ----- | -------------------------------- | ---------------------- | ---------------- |
| English  | 33    | across and down                  | centre empty           | last peg centred |
| European | 37    | across and down                  | a left-edge hole empty | one peg          |
| Triangle | 15    | six (along the triangle's sides) | top empty              | one peg          |

The European board cannot be reduced to one peg from its centre; the start hole was chosen by
searching every hole for one with a finish (four of the 37 have one quickly).

## Solver

Depth-first search over jumps (pegs as a bit mask), remembering positions known to fail; it returns
a finishing line or proves there is none. From the start it finishes the triangle in 1 ms, the
English board in 33 ms and the European board in about 0.35 s. Hints reuse a remembered line when
the position is on it and otherwise search with a 400 000-node budget (saying when no quick finish
is found, or that none exists).

## Modes, play features, controls

Board choice, resume, watch the AI. Tap a peg (only pegs with a jump can be picked), then one of the
highlighted holes; the triangle is drawn as a triangle. Undo, restart, pegs left; hints highlight
the jump (and the peg it removes). Keys: U, R, H, Esc.

## Computer players

| Agent    | Play                                                       | One peg left (random 20 games; European 3) | Average pegs left                                |
| -------- | ---------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| `random` | Any jump.                                                  | 0 / 0 / 0                                  | 3.7 / 7.0 / 10.7 (triangle / English / European) |
| `greedy` | Keeps the most jumps available, landing nearer the centre. | 0 / 0 / 0                                  | 2.6 / 4.9 / 8.0                                  |
| `solver` | The finishing line from the search (the oracle).           | always                                     | 1                                                |

## States and actions

`PegState`: board, pegs (hexadecimal bit mask), history, jumps, undos, hints, elapsed time, status
(playing, won, stuck). Environment actions `from-to` hole indices; episodes end won or stuck. Save
validation replays the masks from the starting board, jump by jump.

## Achievements

| id         | Condition                                            |
| ---------- | ---------------------------------------------------- |
| `first`    | Finish any board with one peg.                       |
| `centre`   | Finish the English board with the peg in the centre. |
| `european` | Finish the European board.                           |
| `clean`    | Finish a board without undoing or hints.             |

## Graphics and audio

A wooden board with drilled holes and glossy pegs in CSS; selected, target, hint and jumped-over
marks. Synthesized jump, blocked, hint, win and dead-end sounds.

## Save format and AI interface

Save slot schema 1: `{ state }`. Env `peg-solitaire` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ board }`; return 1 when won, score = −pegs left.

## Testing criteria

Hole counts and opening jumps, finishes found on every board (with the English peg centred), a
position proven hopeless, jumps and undo, following the solver to a win, greedy legality, save
validation, the contract suite; UI: a jump by taps, undo, hints to the end with the result
recorded. E2E desktop + mobile.
