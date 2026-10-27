# #108 Kakuro — Game Specification

## Ruleset (`kakuro-runs`)

- A grid of clue (dark) and white cells; the top row and left column are clue cells. Every maximal
  horizontal or vertical stretch of white cells of length ≥ 2 is a **run**; its clue (top right of
  the dark cell before an across run, bottom left before a down run) is the sum of its digits.
- Fill every white cell with 1–9 so each run adds up to its clue with no repeated digit.
- Every puzzle has exactly one solution. When the sums alone allow more than one, a few digits are
  given at the start (shown bold, fixed).

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and difficulty):

1. **Layout**: interior cells start white, 20% become clue cells (with their mirror through the
   centre); a white cell alone on an axis either gains a neighbour or becomes a clue cell, over-long
   runs are cut, and only the largest connected white area is kept. Every white cell must end in an
   across and a down run (layouts below 45% white are redrawn).
2. **Fill**: distinct digits per run by randomized backtracking, extreme digits (1, 2, 8, 9) tried
   first more often — their sums have fewer combinations.
3. **Repair**: while the exact solver finds another solution, a cell where it differs gets another
   digit its runs do not use and the sums are recomputed (up to 30 / 15 / 10 rounds).
4. **Givens**: if still not unique, the solution's digit at a differing cell is given, until unique.
5. The puzzle must be solvable by the techniques below; the fewest-givens candidate is kept (the
   search stops early at 0 / 1 / 2 givens).

| Difficulty | Board (playable) | Longest run | Measured over 30 seeds: white cells (avg) | Runs (avg) | Givens (avg; puzzles with none) | Generation (avg / max) |
| ---------- | ---------------- | ----------- | ----------------------------------------- | ---------- | ------------------------------- | ---------------------- |
| Easy       | 6×6              | 5           | 17–26 (19.8)                              | 14.7       | 0–2 (0.2; 27 of 30)             | 67 / 219 ms            |
| Medium     | 7×7              | 6           | 23–34 (26.8)                              | 19.2       | 0–4 (1.7; 5 of 30)              | 314 / 748 ms           |
| Hard       | 8×8              | 6           | 29–43 (34.2)                              | 24.0       | 1–6 (3.4; 0 of 30)              | 799 / 1552 ms          |

## Techniques (hints and the technique solver)

- **Single**: a cell left with one candidate (the digit both its runs allow).
- **Hidden single**: a digit every remaining combination of a run needs that only one of its cells
  can take.
- **Run combinations**: remove candidates no remaining combination of a run allows (given its
  placed digits and its cells' candidates).

Over the 90 measured puzzles these were enough every time (steps used: hidden singles 1646, run
combinations 1024, singles 620).

## Modes

New puzzle or today's puzzle at any difficulty (saved after every move, resumable) and watching
the technique solver place one digit at a time with its reason. Statistics key: the difficulty; a
solve is a completion with its time.

## Play features

Pencil marks (Notes mode or Shift+digit; "Fill notes" fills what both runs' combinations still
allow), automatic removal of a placed digit from the notes of its runs, undo/redo, "Show mistakes"
(digits differing from the solution, counted), runs that repeat a digit or miss their sum shown in
red (their clue too), the open combinations of the selected cell's runs under the board (e.g.
"across 10 in 2: 19 — down 13 in 3: 346 · 256 · …"), a clock with pause, and hints that point out
wrong digits first, then explain the next placement ("The across 10 must use a 9, and only R2C1 can
take it.") and fill it in on request.

## Computer players

| Agent    | Play                                                                   | Solved (30 puzzles per difficulty) | Time per puzzle |
| -------- | ---------------------------------------------------------------------- | ---------------------------------- | --------------- |
| `random` | Any digit not yet in the cell's runs.                                  | 0%                                 | 0.2–0.3 ms      |
| `logic`  | The technique solver; guesses the fewest-candidate cell only if stuck. | 100%                               | 0.3–0.7 ms      |
| `solver` | Run-combination propagation + search (the exact oracle).               | 100%                               | 0.3–0.9 ms      |

## States and actions

`KakuroState` = `difficulty`, `seed`, `puzzle` (`rows`, `cols`, `white`, `runs` with cells, sum,
direction and clue cell, `solution`, `given`), `values`, `notes`, `undo`/`redo`, `mistakes`,
`hints`, `elapsedMs`, `solved`. Save validation regenerates the puzzle from its seed and difficulty
and requires an exact match, givens kept, digits only in white cells. Environment actions
`cell:digit` (digits not yet in the cell's runs).

## Achievements

| id        | Condition                                                |
| --------- | -------------------------------------------------------- |
| `first`   | Solve a kakuro.                                          |
| `clean`   | Solve without a mistake or a hint.                       |
| `speed`   | Solve a Medium kakuro in under 10 minutes without hints. |
| `hardest` | Solve a Hard kakuro.                                     |
| `daily`   | Solve today's puzzle.                                    |

## Controls

Tap a white cell, then a digit. Keyboard: arrows move (skipping clue cells), 1–9 place (again to
remove), Shift+digit or N for notes, Backspace/Delete/0 erase, U or Ctrl+Z undo, R or Ctrl+Y redo,
H hint, Enter fill the hint, P pause.

## Graphics and audio

Near-black clue cells with a diagonal and light sums (red when their run is broken) in both themes,
grey play cells, givens bold, entries in the accent colour, mistakes in red, the selected runs and
the hint's runs tinted; the sudoku family's soft synthesized sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `kakuro` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Combinations and run pruning, layouts (every white cell in two runs, run lengths, clue row), a
unique and technique-solvable puzzle at each difficulty with consistent sums and givens, play
(notes, undo/redo, mistakes, bad runs, fill notes, save validation, solving), a hint matching the
solution, both solvers finishing, the contract suite; UI: combinations line, notes, digits, undo,
hints through to a recorded solve; E2E desktop + mobile.
