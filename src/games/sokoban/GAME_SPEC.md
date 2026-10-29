# #127 Sokoban — Game Specification

## Ruleset (`sokoban-generated`)

The keeper walks across and down the warehouse floor and pushes crates by walking into them when
the cell beyond is free; crates are never pulled and never pushed two at once. The warehouse is done
when every crate rests on a goal.

## Levels (`levels.ts`)

Generated offline by `tools/generate-sokoban.ts`: a random walled room with a few wall blocks
(connected floor), crates placed on random goals, then every position reachable by pulling crates
(the reverse of pushing, from every keeper region) explored breadth-first; the position farthest
from solved — in pushes — becomes the level, kept only when no crate starts on a goal.

| Tier   | Levels | Crates | Room | Fewest pushes (range, average) |
| ------ | ------ | ------ | ---- | ------------------------------ |
| Easy   | 60     | 2      | 7×7  | 10–14, 10.7                    |
| Medium | 60     | 3      | 8×7  | 20–27, 20.9                    |
| Hard   | 32     | 4      | 9×8  | 30–41, 31.6                    |

Levels are listed easiest first; the menu shows each tier's levels with solved marks.

## Modes, play features, controls

Level picker by tier with progress, resume, watch the AI. Tap a floor cell to walk there by the
shortest route, tap a crate next to the keeper or swipe to push, arrow keys or WASD; undo (counts a
move) and restart; counters for steps and pushes against the fewest pushes; crates that can no
longer reach any goal (on a dead cell) are marked in red with a warning; hints describe the next
push ("push the crate at R3C4 right") and walk-and-push it; the next warehouse after solving.

## Computer players

| Agent    | Play                                                                                                                                   | Solved within 600 steps     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `random` | Any open step.                                                                                                                         | 0 / 0 / 0                   |
| `greedy` | Walks to and makes the push that brings the crates closest to goals, never onto a dead cell.                                           | 9 of 60 / 0 / 0             |
| `solver` | Breadth-first search over pushes (crates + keeper region) with dead-cell pruning, then shortest walks: the fewest pushes (the oracle). | every level, always optimal |

The solver takes 0.7 / 7 / 273 ms per level on average (845 ms at most on a hard one).

## States and actions

`SokobanState`: tier, index, warehouse, crates, keeper, history, steps, pushes, hints, elapsed time,
solved. Environment actions `U` `D` `L` `R`; episodes end solved or after 600 steps. Save
validation looks the level up again and checks every position.

## Achievements

| id          | Condition                                  |
| ----------- | ------------------------------------------ |
| `first`     | Solve a warehouse.                         |
| `optimal`   | Solve in the fewest pushes, without hints. |
| `ten`       | Solve ten easy warehouses.                 |
| `hard`      | Solve a hard warehouse without hints.      |
| `all-tiers` | Solve a warehouse in every tier.           |

## Graphics and audio

CSS brick walls, sandy floor, red goal rings, wooden crates (green on goals, red-ringed when dead),
a keeper token; synthesized footsteps, pushes, hint and win sounds.

## Save format and AI interface

Save slot schema 1: `{ state, best }` (fewest pushes per solved level). Env `sokoban` v`1.0.0`: kind
`puzzle`, one seat, perfect information, config `{ tier, index }`; return 1 when solved,
score = −pushes.

## Testing criteria

Level notation, crates equal goals, sampled levels solved by the solver in their stored pushes,
walking, pushing, undo, dead crates, shortest walks, the solver plan's optimality, greedy legality,
save validation, the contract suite; UI: keys, restart, hints to the end with the result recorded,
the solved mark in the level picker. E2E desktop + mobile.
