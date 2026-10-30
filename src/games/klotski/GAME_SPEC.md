# #140 Sliding Blocks — Game Specification

The klotski-style sliding-block puzzle under a generic title, with its own look and texts.

## Ruleset (`sliding-blocks-4x5`)

A tray 4 cells wide and 5 tall holds one 2×2 block, 1×2 upright blocks, 2×1 flat blocks and 1×1
squares, leaving two free cells. Blocks slide through free cells and never leave the tray, except
that the puzzle is solved when the big block stands at the bottom middle (over the exit). A move
takes one block to any cell it can reach through free cells, round corners included; moving the
same block again straight away is the same move. Identical blocks are interchangeable, so a
position is one 20-character key (A/a big block, V/v upright, H/h flat, S square, `.` free).

## Puzzle bank (`puzzles.ts`, `tools/generate-klotski.ts`)

The generator lays out random block sets (ten mixes of upright, flat and square blocks), explores
the whole position space reachable from each layout, and measures every position's distance to a
solved one by breadth-first search. From each space it keeps positions at a spread of distances
per level, preferring the big block in the top row.

| Level       | Fewest moves | Puzzles |
| ----------- | ------------ | ------- |
| Easy        | 11–25        | 36      |
| Medium      | 26–49        | 32      |
| Hard        | 59–138       | 32      |
| Traditional | 81           | 1       |

The traditional layout (big block top middle, four upright blocks, one flat block, four squares)
takes 81 moves, the known minimum in this move count. Every bank entry's minimum is confirmed by
the game's own solver.

## Solver (`engine.ts`)

Breadth-first search over positions from the current one (each move expanded as every reachable
cell of every block), returning the relocations of a shortest solution. Over the whole bank it
takes 12 ms on average for easy puzzles and at most about 0.4 s for the hardest; plans are cached
along their path, so successive hints are instant.

## Modes, play features, controls

New or daily puzzle per level (the traditional layout has one), resume, watch the AI. Drag a block
anywhere it can reach, or tap it to mark every reachable spot and tap one; Tab and the arrow keys
move a selected block one cell; undo per relocation; hints name the block and its destination;
moves against the minimum and a timer.

## Computer players

| Agent    | Play                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| `random` | Any relocation.                                                              |
| `greedy` | The relocation bringing the big block nearest the exit, never straight back. |
| `solver` | Breadth-first search: always a shortest solution (the oracle).               |

Measured over the bank (300 relocations at most): the greedy mover solved 11 of 36 easy puzzles
and none of the medium, hard or traditional ones; the solver solves all of them in their minimum.

## States and actions

`KlotskiState`: level, bank index, the position, relocations [from, to] (top-left cells), moves,
hints, undos, solved. Environment actions are "from:to"; episodes end solved or after 300
relocations; return 1 when solved, score = −moves.

## Achievements

| id        | Condition                                         |
| --------- | ------------------------------------------------- |
| `first`   | Solve a puzzle.                                   |
| `optimal` | Solve a puzzle in its fewest moves without hints. |
| `classic` | Solve the traditional layout without hints.       |
| `daily`   | Solve today's puzzle.                             |

## Graphics and audio

A wooden tray with a yellow gap in the bottom rail; blocks as rounded wooden pieces (red big
block); a moved block slides in from where it was, and the big block drops out of the tray when
solved (no animation with reduced motion); synthesized slide, hint and win sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`, validated by replaying the relocations from the bank
position. Env `klotski` v`1.0.0`: kind `puzzle`, one seat, deterministic, config `{ level }`.

## Testing criteria

Blocks read from keys, free-path reach round corners, the traditional layout solved in 81, the
bank's minima, move counting (one block moved twice is one move), undo, replay validation, the
solver following its plan in the minimum, greedy legality, the contract suite; UI: tap-to-move,
undo, hints to the exit, watch mode to the exit. E2E desktop + mobile.
