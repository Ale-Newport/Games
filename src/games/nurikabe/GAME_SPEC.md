# #115 Nurikabe — Game Specification

## Ruleset (`nurikabe-islands`)

Shade cells of a grid (the sea; 5×5 to 8×8) so that:

1. the unshaded cells form islands, each containing exactly one number equal to its size;
2. all shaded cells are orthogonally connected;
3. no 2×2 block is entirely shaded.

Every puzzle has exactly one solution; it is solved when exactly the sea is shaded (dots marking land
are optional notes). Numbered cells are fixed land.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and size):

1. Islands grown from random free cells to random sizes (up to 3 or 4), never touching another
   island and never cutting the sea in two, until 35–45% of the grid is land.
2. Remaining 2×2 pools are broken by growing a touching island into the pool (if it touches only
   one island) or starting a one-cell island there, keeping the sea connected.
3. Each island's number is placed on a random cell of it.
4. Kept when the exact solver (the techniques as propagation, pool/size/two-numbers pruning, sea
   connectivity, search) finds exactly one shading and the technique solver reaches it (up to 1500
   tries).

Techniques: level 1 — **complete island** (its surroundings are sea), **between two islands** (a
cell touching two numbered islands is sea), **unreachable** (no unfinished island can reach the
cell within its remaining size); level 2 — **pool** (three sea cells of a 2×2 block make the fourth
land), **island exit** (an unfinished island with one way out grows there), **sea exit** (a sea
patch with one way out, while other sea exists, flows there).

| Size | Largest island | Measured over 20 seeds: islands | Generation (avg / max) | Levels | Techniques used (puzzles)                                |
| ---- | -------------- | ------------------------------- | ---------------------- | ------ | -------------------------------------------------------- |
| 5×5  | 4              | 4–7                             | 14 / 52 ms             | all 2  | pool 19, island exit 16, sea exit 10, between islands 9  |
| 6×6  | 4              | 6–9                             | 63 / 256 ms            | all 2  | pool 20, island exit 20, sea exit 15, between islands 14 |
| 7×7  | 3              | 9–13                            | 26 / 53 ms             | all 2  | pool 20, island exit 18, sea exit 16, between islands 15 |
| 8×8  | 3              | 13–17                           | 154 / 434 ms           | all 2  | pool 20, island exit 20, between islands 18, sea exit 13 |

Larger boards (9×9 and up) were tried: random islands there are rarely unique (only 1–2 of 5 seeds
succeeded within 400 tries, at 1–11 s each), so the sizes stop at 8×8. Most failures at every size
were pools, now broken in place; a version without that step failed 3 of 5 7×7 seeds.

## Modes

New puzzle or today's puzzle at four sizes (saved after every move, resumable) and watching the
technique solver decide the cells with its reasons. Statistics key: the size; a solve is a
completion with its time.

## Play features

Tap to cycle a cell (undecided → sea → land dot → undecided) or switch the tap to "Sea" or "Land".
Shaded 2×2 blocks and islands with two numbers or too many cells are outlined in red (with a message
for pools); "Show mistakes" outlines marks that contradict the solution (counted); undo/redo; a clock
with pause; hints that clear wrong marks first, then explain the next deduction and apply all the
cells it decides ("The island of 1 is complete: every cell around it is sea, starting with R2C3.").

## Computer players

| Agent    | Play                                                       | Solved (20 per size) | Time per puzzle |
| -------- | ---------------------------------------------------------- | -------------------- | --------------- |
| `random` | Shades or dots any undecided cell while nothing is broken. | 0%                   | ≤ 0.1 ms        |
| `logic`  | The technique solver (never needed its fallback).          | 100%                 | ≤ 1 ms          |
| `solver` | Propagation + pruning + search (the exact oracle).         | 100%                 | 2–20 ms         |

## States and actions

`NuriState` = `difficulty`, `seed`, `puzzle` (`rows`, `cols`, `numbers`, `solution` sea cells),
`marks` (0 undecided, 1 land, 2 sea; numbered cells always land), `undo`/`redo`, `mistakes`, `hints`,
`elapsedMs`, `solved`. Save validation regenerates the puzzle from its seed and requires an exact
match. Environment actions `cell:s` / `cell:l` on undecided cells; the episode ends solved, or stuck
on a broken rule or with no cell left.

## Achievements

| id        | Condition                                              |
| --------- | ------------------------------------------------------ |
| `first`   | Solve a nurikabe.                                      |
| `clean`   | Solve without a mistake or a hint.                     |
| `speed`   | Solve a 7×7 nurikabe in under 5 minutes without hints. |
| `hardest` | Solve an 8×8 nurikabe.                                 |
| `daily`   | Solve today's puzzle.                                  |

## Controls

Tap as above. Keyboard: arrows move, Space sea/clear, K land/clear, Backspace clear, U or Ctrl+Z
undo, R or Ctrl+Y redo, H hint, Enter apply the hint, P pause.

## Graphics and audio

Sand-coloured land, a deep-blue hatched sea in both themes, numbers in round plates, small dots for
land marks; the sudoku family's soft sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `nurikabe` v`1.0.0`: kind `puzzle`, one seat, config
`{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Shading checks (islands, one sea, pools); a puzzle per size that is valid, unique and reached by
the techniques; every technique step agreeing with the solution; play (cycle, numbered cells fixed,
mistakes, undo/redo, pools flagged, saves, solving); both solvers finishing; the contract suite. UI:
tap cycle, undo, hints through to a recorded solve. E2E desktop + mobile.
