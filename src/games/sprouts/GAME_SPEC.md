# #051 Sprouts — Game Specification

## Ruleset (`sprouts-grid-3to5`)

- Each round starts with **3 to 5 spots** (drawn at random; the AI environment draws the count from
  its seed); the first player alternates between rounds.
- A move draws a **curve** joining two spots, or a spot to itself (a loop). Curves may not cross or
  touch other curves or pass through spots. A **new spot** appears on every new curve.
- A spot may have at most **three curve ends**: starting spots have three lives, new spots one (a
  loop uses two lives of its spot).
- The player who cannot draw a curve **loses**. There are no draws.

### Grid geometry (how this version draws)

Curves are real geometry on a 35 × 35 grid: a curve is a 4-connected path of cells. The free
neighbor cells of every living spot are reserved — other curves may not use them — so a curve can
pass close to a spot without cutting it off from a region (the grid counterpart of pencil curves
that pass arbitrarily close). Regions are connected areas of free cells; two spots can be joined
exactly when both reach a common region, and a loop needs two of its spot's reserved cells in the
same region. The new spot goes on the most central straight stretch of the curve with free room on
both sides. One difference from pencil Sprouts remains possible: a new spot boxed in by curves on
both sides cannot be used. A unit test plays 120 random games and checks every one lasts between
2n and 3n − 1 moves, the bounds of pencil Sprouts.

## States and actions

`SproutsState`: `spotCount`, `spots` (cell and lives), `curves` (cells), `first`, `toMove`,
`history`, `result`, validated by replay. Actions: `c0.c1.….ck` (the curve's cells, spot to spot).

## Modes and difficulty

vs Computer, Two Players, Watch AI. Flat Monte Carlo: candidate curves come from every joinable pair
(and loop), routed by Dijkstra — the shortest route plus extra routes with random costs, which go
around obstacles on different sides and so split regions differently; each candidate is scored by
random playouts to the end (Hard allocates playouts with UCB1).

| Level  | Search                                                                 |
| ------ | ---------------------------------------------------------------------- |
| Easy   | 3 playouts per curve, one route per pair; random curve 30% of the time |
| Medium | 15 playouts per curve, one route per pair                              |
| Hard   | 90 playouts per curve, two routes per pair (capped at 4 s)             |

Measured (seats alternated, 12 games per pair, seed 9): Easy vs Random 10–2, Medium vs Easy 8–4,
Hard vs Medium 11–1. With 3–5 spots the first player wins with perfect play; an earlier Medium with
30 playouts already played close to that and tied Hard 6–6, so Medium was made lighter.

## Achievements

| id                         | Condition                     |
| -------------------------- | ----------------------------- |
| `first-win`                | Win against the computer.     |
| `beat-medium`, `beat-hard` | Beat each level.              |
| `five-spots`               | Win starting from five spots. |
| `hot-seat`                 | Finish a two-player game.     |

## Controls

Drag from a spot to another spot (or back to the same spot); moving back over the line rubs it out;
releasing next to a spot finishes on it. Illegal curves are refused with a reason (crossing,
crowding a spot, no lives…). Or tap a spot and then another (the same one for a loop) and the
shortest legal curve is drawn. Keyboard: Tab to a spot, Enter to choose; `U`/`H`/`R`/`N`.

## Graphics and audio

Paper with smoothed ink curves in each player's color, white living spots with green life dots,
dark dead spots, the curve being drawn in violet (red and dashed while it crosses something), the
hint as a dashed green curve. Pen sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `sprouts` v`1.0.0`. Curves are variable-length actions:
`getLegalActions` lists one representative curve per joinable pair or loop (the shortest), while
`applyAction` accepts any legal curve; there is no fixed action codec. Tensor `[3, 35, 35]`
(curve cells, spots, lives). Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Starting pairs and loops, lives and new spots, illegal curves (crossing, gap, ends, too short),
move-count bounds over 120 random games, every joinable pair routable and legal, replay
validation, Easy beats Random, save round trip and tamper rejection, contract suite, UI (choosing
two spots draws a curve), e2e desktop + mobile (a mouse-drawn curve, then keyboard choice vs CPU).
