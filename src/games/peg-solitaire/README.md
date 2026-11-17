# #128 Peg Solitaire

The classic jumping puzzle on eight boards. `engine.ts` (boards, geometry, jumps, solver, state),
`ai.ts`, `ai-adapter.ts`, `PegGame.tsx` + `Peg.module.css`, `HowToPlay.tsx`, `i18n.ts`, `sounds.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.

## Specification

### Ruleset (`peg-solitaire-boards`)

A peg jumps in a straight line over a neighbouring peg into the empty hole just beyond it, and the
jumped peg is removed. The game ends when no jump is left; it is won with a single peg — on the
board's goal hole when it has one (ringed on the board).

| Board                 | Holes | Directions | Start (empty hole)      | Goal                     |
| --------------------- | ----- | ---------- | ----------------------- | ------------------------ |
| English               | 33    | square     | centre                  | centre                   |
| European              | 37    | square     | a left-edge hole        | anywhere                 |
| German (Wiegleb)      | 45    | square     | centre                  | centre                   |
| Asymmetric 3-3-2-2    | 39    | square     | centre of the cross     | centre of the cross      |
| Diamond               | 41    | square     | two above the centre    | two below the centre     |
| Triangle              | 15    | triangular | top                     | anywhere                 |
| Big triangle (6 rows) | 21    | triangular | top                     | top                      |
| Hexagon (side 4)      | 37    | triangular | the hole left of centre | the hole right of centre |

Square boards jump across and down. Triangular boards are stored row by row on a square grid
(row r of a triangle has r + 1 holes at x = 0..r; hexagon row y runs from max(0, y − 3) to
min(6, y + 3)) and also jump along the (1, 1) diagonal, which is the lattice's third direction;
they are drawn with each row shifted half a hole and rows √3/2 apart.

The asymmetric board is a cross with arms of three rows on the top and right and two rows on the
left and bottom. The German board is the 9 × 9 cross with three-by-three arms.

Start and goal holes. The European board cannot be reduced to one peg from its centre; its start
hole was chosen by searching every hole for one with a finish (four of the 37 have one quickly).
The diamond's centre start has **no** single-peg finish at all: a jump flips the parity of the
pegs in all three diagonal classes (x + y mod 3, and x − y mod 3), so those parity differences are
invariant, and no single hole matches the centre-start class (`tests/game.test.ts` checks this).
Its start two above the centre does match the hole two below it, and a finish exists. The hexagon's
centre had no finish within the search budget; the side-of-centre start finishes on the opposite
side in about 1 ms. The big triangle's top-to-top line is found in about 7 ms.

Fix (this revision): the English board's start had been stored as hole 24 (one down and right of
the centre); it is now the true centre, hole 16, and the goal is the same hole.

### Solver

Depth-first search over jumps (pegs as a bit mask), remembering positions known to fail; it returns
a finishing line or proves there is none. From the start it finishes the triangle in 1 ms, the
English board (centre to centre) in about 13 ms, the European board in about 0.35 s, the big
triangle in about 7 ms and the hexagon in about 1 ms. Hints reuse a remembered line when the
position is on it and otherwise search with a 400 000-node budget (saying when no quick finish is
found, or that none exists).

**Known lines for the big square boards.** From the opening of the German (45), asymmetric (39) and
diamond (41) boards the in-browser search does not finish in useful time (5 000 000 nodes, over
20 s, without a result). Each of these boards therefore carries a finishing line (`line` in
`SHAPES`), found offline by a beam search (20 000 positions per level, duplicates merged under the
board's symmetries, positions ranked by the number of peg–hole and peg–edge borders; a few seconds
in C). The tests replay each line jump by jump and check that it ends on the goal hole. Hints and
the solver agent use the line while play stays on it (so watch mode always finishes these boards);
once the player leaves it, hints fall back to the budgeted search, which usually succeeds only
later in the game when fewer pegs are left — the hint then says no quick finish was found.

### Modes, play features, controls

Board choice (eight boards, a wrapping grid in the menu), resume, watch the AI. Tap a peg (only
pegs with a jump can be picked), then one of the highlighted holes; triangular boards are drawn on
a triangular lattice and the goal hole wears a light ring. Undo, restart, pegs left; hints
highlight the jump (and the peg it removes). Keys: U, R, H, Esc.

### Computer players

| Agent    | Play                                                       | One peg left (random 20 games; European 3) | Average pegs left                                |
| -------- | ---------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| `random` | Any jump.                                                  | 0 / 0 / 0                                  | 3.7 / 7.0 / 10.7 (triangle / English / European) |
| `greedy` | Keeps the most jumps available, landing nearer the centre. | 0 / 0 / 0                                  | 2.6 / 4.9 / 8.0                                  |
| `solver` | The finishing line from the search (the oracle).           | always                                     | 1                                                |

These measurements cover the original three boards. On the German, asymmetric and diamond boards
the solver agent follows the known line from the opening (always one peg left on the goal hole);
off the line it searches within its budget and falls back to greedy when the budget runs out.

### States and actions

`PegState`: board, pegs (hexadecimal bit mask), history, jumps, undos, hints, elapsed time, status
(playing, won, stuck). Environment actions `from-to` hole indices; episodes end won or stuck. Save
validation replays the masks from the starting board, jump by jump. Board ids: `english`,
`european`, `german`, `asymmetric`, `diamond`, `triangle`, `triangle21`, `hexagon`.

### Achievements

| id         | Condition                                            |
| ---------- | ---------------------------------------------------- |
| `first`    | Finish any board with one peg.                       |
| `centre`   | Finish the English board with the peg in the centre. |
| `european` | Finish the European board.                           |
| `clean`    | Finish a board without undoing or hints.             |

### Graphics and audio

A wooden board with drilled holes and glossy pegs in CSS; selected, target, hint and jumped-over
marks. Synthesized jump, blocked, hint, win and dead-end sounds.

### Save format and AI interface

Save slot schema 1: `{ state }`. Env `peg-solitaire` v`1.1.0`: kind `puzzle`, one seat, perfect
information, config `{ board }`; return 1 when won, score = −pegs left.

### Testing criteria

Hole counts and opening jumps on all eight boards, start and goal positions, the diamond's
centre-start impossibility by position classes, a finish on every board (solver search, or the
known line replayed jump by jump) ending on the goal hole, the known lines followed through hints
to a win, a position proven hopeless, jumps and undo, following the solver to a win, greedy
legality, save validation, the contract suite (English, triangle, hexagon, German); UI: a jump by
taps, undo, hints to the end with the result recorded, every board offered, the hexagon dealt, the
German board finished by hints. E2E desktop + mobile (English with hints, German and hexagon with
no horizontal overflow, watch mode).
