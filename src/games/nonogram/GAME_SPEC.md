# #112 Nonogram — Game Specification

Also known as paint-by-numbers or griddlers; the generic name is used (Picross is a trademark).

## Ruleset (`nonogram-line-solvable`)

- A grid with a clue beside every row and above every column: the lengths, in order, of its runs
  of consecutive filled cells, separated by at least one empty cell ("0" for an empty line).
- Fill cells until every line matches its clue; crosses only mark cells known to be empty.
- Every puzzle can be solved line by line (the line solver alone finishes it), which also proves its
  solution unique; it is solved when exactly the solution's cells are filled.

## Puzzles

- **Random** (5×5, 10×10, 15×15) from a seed (`?deal=N`; the daily puzzle's seed is the date and
  size): noise at 48–50% density smoothed twice by a majority rule (blobby shapes), pictures under
  30% filled redrawn, then repaired: while the line solver leaves cells undecided, one of them is
  flipped in the picture and the clues recomputed.
- **Pictures**: ten original hand-drawn pictures (heart, house, cat, fish, pine, mug, key at 10×10;
  umbrella, snail, rocket at 15×15), each checked by the tests to be line-solvable and unique; the
  gallery shows a picture's thumbnail and name once solved.

| Size  | Measured over 40 seeds: filled | Line passes to solve (avg) | Generation (avg / max) |
| ----- | ------------------------------ | -------------------------- | ---------------------- |
| 5×5   | 63%                            | 5–18 (10.1)                | 0.2 / 1 ms             |
| 10×10 | 49%                            | 20–51 (36.7)               | 1.1 / 1 ms             |
| 15×15 | 48%                            | 51–100 (78.1)              | 7.4 / 74 ms            |

## The line solver

For a line's clue and its known cells, every placement of the runs consistent with them is
considered (dynamic programming over "runs from b on fit from cell p on"); a cell filled in all
placements is filled, a cell empty in all is empty. The exact solver propagates this over all lines
and branches on an undecided cell when stuck (counting solutions, used to prove uniqueness).

## Modes

Random puzzles (new or today's) at three sizes, the picture gallery, and watching the line solver
paint one line at a time with its reason. Saved after every move, resumable. Statistics key: the
size, or `picture:<id>`; a solve is a completion with its time.

## Play features

Tap or drag (locked to the row or column it starts on) to fill — or to cross with the Cross tool or
the right mouse button; painting over the same mark clears. Clues of finished lines are struck
through, the selected cell's row and column clues are tinted, cells every five are separated by a
thicker line, "Show mistakes" marks wrong cells (counted), undo/redo (a drag is one step), a clock
with pause, and hints ("Row 1 (8 1): every way its runs can fit agrees on some cells (decided: 3).")
that highlight the line and its cells and apply them on request. A solved picture is shown in plain
ink and named.

## Computer players

| Agent    | Play                                          | Solved (10 per size) | Time per puzzle |
| -------- | --------------------------------------------- | -------------------- | --------------- |
| `random` | Fills or crosses any unknown cell.            | 0%                   | ≤ 4 ms          |
| `logic`  | The line solver, one decided cell at a time.  | 100%                 | ≤ 10 ms         |
| `solver` | Line propagation + search (the exact oracle). | 100%                 | ≤ 76 ms         |

## States and actions

`NonoState` = `kind` (a size id or `picture:<id>`), `seed`, `puzzle` (`rows`, `cols`, `solution`,
`rowClues`, `colClues`, `picture`), `grid` (0 unknown, 1 filled, 2 crossed), `undo`/`redo`,
`mistakes`, `hints`, `elapsedMs`, `solved`. Save validation regenerates the puzzle from its kind and
seed and requires an exact match. Environment actions `cell:f` / `cell:x` on unknown cells; the
episode ends solved or with every cell marked.

## Achievements

| id        | Condition                                                       |
| --------- | --------------------------------------------------------------- |
| `first`   | Solve a nonogram.                                               |
| `clean`   | Solve without a mistake or a hint.                              |
| `speed`   | Solve a random 10×10 nonogram in under 5 minutes without hints. |
| `hardest` | Solve a 15×15 nonogram.                                         |
| `picture` | Solve a picture from the gallery.                               |
| `gallery` | Solve every picture in the gallery.                             |
| `daily`   | Solve today's puzzle.                                           |

## Controls

Tap/drag as above. Keyboard: arrows move, Space fill/clear, X cross/clear, Backspace clear, U or
Ctrl+Z undo, R or Ctrl+Y redo, H hint, Enter apply the hint, P pause.

## Graphics and audio

Clue headers sized to the grid (the board scales to the screen, 15×15 fits a phone), accent-coloured
fills, grey crosses, struck-through finished clues; the sudoku family's soft sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `nonogram` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 otherwise. Exact oracle: `solver`.

## Testing criteria

Runs, single-line overlap, empty and full lines, contradictions, finished-line detection; every
picture line-solvable and unique; random puzzles of each size line-solvable with the solver finding
the picture, and a two-solution grid caught; play (fill, cross, mistakes, undo/redo, multi-cell
changes, saves, solving); both solvers finishing; the contract suite. UI: solving a picture through
hints with the result and achievement recorded; tools and undo. E2E desktop + mobile.
