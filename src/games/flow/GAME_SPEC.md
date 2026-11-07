# #130 Color Links (Flow) — Game Specification

A path-drawing puzzle of the Numberlink family under its own name, with generated puzzles, its own
palette (each dot also carries a letter) and texts.

## Ruleset (`color-links`)

Pairs of same-colored dots sit on an n×n grid. Join every pair with a path through side-adjacent
cells; paths never cross or share a cell, and together they must cover every cell. Any filling that
joins every pair is accepted.

## Generator

From the seed: a random path through every cell (depth-first, Warnsdorff-ordered with noise), cut
into one stretch per color of at least three cells, the stretch ends becoming the dots; of 20 cuts,
the one with the fewest sideways shortcuts (a stretch touching itself, which would let its dots
skip cells) is kept. The stretches are a guaranteed solution (the reference for hints and the AI).

| Level | Grid | Colors | Generation (avg / max, 30 seeds) |
| ----- | ---- | ------ | -------------------------------- |
| 5×5   | 5×5  | 5      | 111 / 222 ms                     |
| 7×7   | 7×7  | 7      | 137 / 225 ms                     |
| 9×9   | 9×9  | 9      | 198 / 312 ms                     |

## Modes, play features, controls

New or daily puzzle, resume, watch the AI. Drag from a dot (restarting that color) or from a path
(continuing it); dragging back over a path shortens it; crossing another color cuts that path;
another color's dot blocks; reaching the twin dot completes the color (fast drags walk one step at
a time toward the pointer). Counters for pairs joined and cells filled; a message when every pair is
joined but cells are still empty; clear all; hints reveal one whole reference path (cutting what
overlaps it).

## Computer players

| Agent    | Play                                                                       | Solved (30 per level) |
| -------- | -------------------------------------------------------------------------- | --------------------- |
| `random` | Extends any color into any free cell.                                      | 0 / 0 / 0             |
| `greedy` | The most constrained color, hugging walls and paths, toward its other dot. | 2 / 0 / 0             |
| `solver` | Draws the reference paths (the oracle).                                    | 30 / 30 / 30          |

Filling the whole grid is what makes the puzzle hard: heading straight for the twin dot leaves
pockets that no color can reach, which is why the greedy baseline rarely finishes.

## States and actions

`LinkState`: level, seed, puzzle (pairs, reference solution), each color's path, strokes, hints,
elapsed time, solved. Environment actions `color:cell` extend a color from its first dot (no
cutting); episodes end solved or stuck. Save validation regenerates the puzzle and checks every
path (starts on a dot, steps to neighbours, no shared cells, no foreign dots).

## Achievements

| id        | Condition                                     |
| --------- | --------------------------------------------- |
| `first`   | Solve a puzzle.                               |
| `perfect` | Solve with one stroke per color and no hints. |
| `hard`    | Solve a 9×9 without hints.                    |
| `daily`   | Solve today's puzzle.                         |

## Graphics and audio

A dark grid with lettered colored dots, thick rounded SVG paths and tinted cells; synthesized
drawing ticks, a chime per joined pair, hint and win sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `flow` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when solved.

## Testing criteria

Stretches of three or more covering the grid, dots at their ends, determinism, starting, extending,
cutting back and cutting other colors, revealed paths solving the puzzle, hints on a differing
color, agents acting legally, save validation, the contract suite; UI: hints revealing paths to the
end with the result recorded, clearing. E2E desktop + mobile.
