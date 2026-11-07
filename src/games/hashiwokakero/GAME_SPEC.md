# #114 Bridges (Hashiwokakero) — Game Specification

## Ruleset (`hashiwokakero-bridges`)

- Numbered islands sit on a grid of water (7×7 to 13×13). Draw bridges so that:
  1. every island has exactly as many bridges as its number;
  2. bridges are straight, horizontal or vertical, between two facing islands with nothing between;
  3. at most two bridges join the same pair;
  4. bridges never cross each other or an island;
  5. all islands end up connected.
- Every puzzle has exactly one solution; it is solved when every pair has the solution's bridges.

## Puzzles

Generated from a seed (`?deal=N` fixes it; the daily puzzle's seed is the date and size): a first
island at random, then repeatedly a straight bridge (one, or two 35% of the time) from a random
island in a random direction to a new island 2 or more cells away, never over another island or
bridge and never right next to an island, until the wanted island count (10 / 16 / 24 / 32, at least
85% reached). Numbers come from the bridges; facing pairs that the growth did not use start empty
(they may become cycles' alternatives). Kept when the exact solver (bound propagation per island,
crossing exclusion, search, connectivity) finds exactly one solution and the technique solver
reaches it.

Techniques: level 1 — **full island** (its number equals everything its pairs can still take: draw
them all), **forced bridge** (without at least k bridges to a neighbour the number is out of reach),
**finished island** (its bridges are all drawn: the rest are empty), **crossings** (a drawn bridge
closes the pairs it crosses); level 2 — **isolation** (two 1s, or two 2s with a double bridge, would
form a closed group).

| Size  | Measured over 30 seeds: islands | Generation (avg / max) | Levels        | Techniques used (puzzles) |
| ----- | ------------------------------- | ---------------------- | ------------- | ------------------------- |
| 7×7   | 9–10                            | 1 / 3 ms               | 25 × 1, 5 × 2 | isolation 5               |
| 9×9   | 14–16                           | 1 / 2 ms               | 26 × 1, 4 × 2 | crossings 14, isolation 4 |
| 11×11 | 21–24                           | 2 / 3 ms               | 24 × 1, 6 × 2 | crossings 22, isolation 6 |
| 13×13 | 28–32                           | 3 / 9 ms               | 21 × 1, 9 × 2 | crossings 25, isolation 9 |

## Modes

New puzzle or today's puzzle at four sizes (saved after every move, resumable) and watching the
technique solver add one bridge at a time with its reason. Statistics key: the size; a solve is a
completion with its time.

## Play features

Tap the water between two islands to cycle the bridges (one → two → none), or tap an island and then
another. A bridge blocked by a crossing one is refused with a message. Islands turn green when
complete and red when over their number; "Show mistakes" marks pairs with more bridges than the
solution (counted); undo/redo; a clock with pause; hints that point out over-full pairs first, then
explain the next bridge ("First: finished islands. The 3 at R3C6 cannot reach its number without a
bridge to R1C6: draw it.") with the island ringed and the slot dashed, applied on request. The
finished network turns green.

## Computer players

| Agent    | Play                                                           | Solved (20 per size) | Time per puzzle |
| -------- | -------------------------------------------------------------- | -------------------- | --------------- |
| `random` | Adds any bridge that still fits (no island over, no crossing). | 15% / 10% / 0% / 0%  | ≤ 0.3 ms        |
| `logic`  | The technique solver (never needed its fallback).              | 100%                 | ≤ 1 ms          |
| `solver` | Bound propagation + search + connectivity (the exact oracle).  | 100%                 | ≤ 0.8 ms        |

## States and actions

`HashiState` = `difficulty`, `seed`, `puzzle` (`rows`, `cols`, `islands` (cell, number), `pairs`
(islands, direction, cells between), `crossings`, `solution`), `bridges` per pair, `undo`/`redo`,
`mistakes`, `hints`, `elapsedMs`, `solved`. Save validation regenerates the puzzle from its seed and
requires an exact match. Environment actions `pair:count` (one more bridge where it still fits); the
episode ends solved or when nothing fits.

## Achievements

| id        | Condition                                            |
| --------- | ---------------------------------------------------- |
| `first`   | Solve a bridges puzzle.                              |
| `clean`   | Solve without a mistake or a hint.                   |
| `speed`   | Solve an 11×11 sea in under 5 minutes without hints. |
| `hardest` | Solve a 13×13 sea.                                   |
| `daily`   | Solve today's puzzle.                                |

## Controls

Tap as above. Keyboard: U or Ctrl+Z undo, R or Ctrl+Y redo, H hint, Enter apply the hint, P pause.

## Graphics and audio

An SVG sea in a soft blue, round numbered islands (green when complete, red when over), single and
double bridges as parallel lines; the sudoku family's soft sounds. The generic name "Bridges" is
used with "Hashiwokakero" as the puzzle's common name.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `hashiwokakero` v`1.0.0`: kind `puzzle`, one seat,
config `{ difficulty }`, one puzzle per episode; return 1 when solved, 0 when stuck. Exact oracle:
`solver`.

## Testing criteria

Facing pairs and crossings; a puzzle per size whose solution matches the numbers, never crosses, is
connected and unique, and is reached by the techniques; every deduction staying within the
solution's bounds; play (cycle, crossing refusal, undo/redo, mistakes, saves, solving, island
counts); a hint matching the solution; both solvers finishing; the contract suite. UI: a hint
applied and undone, solving through hints with the result recorded. E2E desktop + mobile.
