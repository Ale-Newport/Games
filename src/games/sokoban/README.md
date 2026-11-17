# #127 Sokoban

The warehouse-keeper puzzle with an original level bank. `levels.ts` (generated offline by
`tools/generate-sokoban.ts`), `engine.ts` (levels, moves, pushes, dead cells, push solver, state),
`ai.ts`, `ai-adapter.ts`, `SokobanGame.tsx` + `Sokoban.module.css`, `HowToPlay.tsx`, `i18n.ts`,
`sounds.ts`, `manifest.ts`, `assets/preview.svg`, `tests/`.

## Specification

### Ruleset (`sokoban-generated`)

The keeper walks across and down the warehouse floor and pushes crates by walking into them when
the cell beyond is free; crates are never pulled and never pushed two at once. The warehouse is done
when every crate rests on a goal.

### Levels (`levels.ts`)

Generated offline by `tools/generate-sokoban.ts`: a random walled room with a few wall blocks
(connected floor), crates placed on random goals, then every position reachable by pulling crates
(the reverse of pushing, from every keeper region) explored breadth-first; the position farthest
from solved — in pushes — becomes the level, kept only when no crate starts on a goal.

| Tier   | Levels | Crates | Room | Fewest pushes (range, average) |
| ------ | ------ | ------ | ---- | ------------------------------ |
| Easy   | 90     | 2      | 7×7  | 10–16, 11.4                    |
| Medium | 90     | 3      | 8×7  | 20–30, 21.7                    |
| Hard   | 60     | 4      | 9×8  | 30–41, 31.9                    |
| Expert | 40     | 5      | 10×9 | 36–52, 39.5                    |

The bank only grows at the end of a tier, so a level's number (and the solved marks saved under
`tier:index`) never changes. The first 60 easy, 60 medium and 32 hard levels are one batch with
minimum pushes 10, 20 and 30; the appended 30 easy, 30 medium and 28 hard levels came from later runs
with minimum pushes 12, 22 and 31 (seeds 2101, 2201 and 2301–2304), duplicates dropped. Each batch
is listed easiest first; the menu shows each tier's levels with solved marks.

Expert rooms get 9–12 wall blocks instead of 2–5 (the generator's optional `walls` argument), which
makes corridors and longer solutions: `generate-sokoban.ts 8 <seed> 5 36 10 9 400000 9` with seeds
2601–2606 gave 48 levels of at least 36 pushes; the 40 the solver finishes fastest were kept.

### Modes, play features, controls

Level picker by tier with progress, resume, watch the AI. Tap a floor cell to walk there by the
shortest route, tap a crate next to the keeper or swipe to push, arrow keys or WASD; undo (counts a
move) and restart; counters for steps and pushes against the fewest pushes; crates that can no
longer reach any goal (on a dead cell) are marked in red with a warning; hints describe the next
push ("push the crate at R3C4 right") and walk-and-push it; the next warehouse after solving.

### Computer players

| Agent    | Play                                                                                                                                   | Solved within 600 steps          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `random` | Any open step.                                                                                                                         | 0 / 0 / 0                        |
| `greedy` | Walks to and makes the push that brings the crates closest to goals, never onto a dead cell.                                           | 9 of 60 / 0 / 0 (first 60/60/32) |
| `solver` | Breadth-first search over pushes (crates + keeper region) with dead-cell pruning, then shortest walks: the fewest pushes (the oracle). | every level, always optimal      |

The solver keeps flat arrays and a stamped flood fill for the keeper's region. Over the whole bank
it takes 0.2 / 1.5 / 72 / 563 ms per level on average (easy / medium / hard / expert; about 2 s at
most on an expert one), always within its 300,000-position limit; plans are cached along their path,
so only the first hint of a level waits for the search.

### States and actions

`SokobanState`: tier, index, warehouse, crates, keeper, history, steps, pushes, hints, elapsed time,
solved. Environment actions `U` `D` `L` `R`; episodes end solved or after 600 steps. Save
validation looks the level up again and checks every position.

### Achievements

| id          | Condition                                          |
| ----------- | -------------------------------------------------- |
| `first`     | Solve a warehouse.                                 |
| `optimal`   | Solve in the fewest pushes, without hints.         |
| `ten`       | Solve ten easy warehouses.                         |
| `hard`      | Solve a hard warehouse without hints.              |
| `all-tiers` | Solve a warehouse in every tier (expert included). |

### Graphics and audio

CSS brick walls, sandy floor, red goal rings, wooden crates (green on goals, red-ringed when dead),
a keeper token; synthesized footsteps, pushes, hint and win sounds.

### Save format and AI interface

Save slot schema 1: `{ state, best }` (fewest pushes per solved level). Env `sokoban` v`1.0.0`: kind
`puzzle`, one seat, perfect information, config `{ tier, index }`; return 1 when solved,
score = −pushes.

### Testing criteria

Level notation, crates equal goals, tier sizes, crates per tier, unique rectangular levels, expert
levels of at least 36 pushes, sampled levels (old and appended, every tier) solved by the solver
within the in-game limit in their stored pushes,
walking, pushing, undo, dead crates, shortest walks, the solver plan's optimality, greedy legality,
save validation, the contract suite; UI: keys, restart, hints to the end with the result recorded,
the solved mark in the level picker, an expert warehouse solved with hints. E2E desktop + mobile.
