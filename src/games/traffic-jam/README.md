# #126 Traffic Jam

A sliding-block parking puzzle under a generic name. `puzzles.ts` (the bank generated offline by
`tools/generate-traffic-jam.ts`), `engine.ts` (boards, slides, breadth-first solver, state), `ai.ts`,
`ai-adapter.ts`, `save.ts` (the save slot: schema, migration, solved puzzles), `JamGame.tsx` +
`Jam.module.css`, `HowToPlay.tsx`, `i18n.ts`, `sounds.ts`,
`manifest.ts`, `assets/preview.svg`, `tests/`.

## Specification

A sliding-block parking puzzle in the style of the classic red-car puzzle, under its own name, with
its own puzzles, look and texts.

### Ruleset (`traffic-jam-6x6`)

A 6×6 lot with cars (two cells) and trucks (three); each vehicle slides only along its length and
never through another. Free the red car, which sits on the third row, by sliding it out through the
gap in the right wall (it is free once it reaches the last two columns). A move slides one vehicle
any distance.

### Puzzles (`puzzles.ts`)

Generated offline by `tools/generate-traffic-jam.ts`: a random layout (no horizontal vehicle on the
exit row besides the red car), its whole space of reachable positions explored, every position's
distance to a free red car computed by breadth-first search from the free positions, and the
position farthest away kept as the puzzle; duplicates are dropped.

| Level  | Puzzles | Vehicles | Fewest moves (range, average) |
| ------ | ------- | -------- | ----------------------------- |
| Easy   | 120     | 6–9      | 6–11, 7.1                     |
| Medium | 120     | 8–11     | 12–19, 14.0                   |
| Hard   | 70      | 10–13    | 20–37, 22.8                   |
| Expert | 87      | 10–14    | 30–45, 33.8                   |

Expert puzzles came from `generate-traffic-jam.ts expert <count> <seed> 30 99 <vmin> 14` (seeds
9101–9106 with 9–14 vehicles, 9201–9208 with 11–14; 14 runs of up to 25 minutes, 87 puzzles in
all): only layouts whose farthest position is 30 or more moves from a free exit are kept. They are
listed by fewest moves; duplicates of any other puzzle are dropped, and every one is confirmed by the
game's solver.

Puzzles are numbered within their level, and a level's bank only grows at the end, so a number
always means the same puzzle. The menu's picker opens any numbered puzzle; a seed (or the date, for
the daily puzzle) picks one at random.

### Modes, play features, controls

A numbered puzzle picker per level (solved puzzles marked, with your best moves in the label), a
random or daily puzzle, resume, watch the AI, and the next puzzle after a solve. Drag a vehicle along its lane (it snaps to cells and
stops at obstacles), or select it with Tab and slide it with the arrows; undo (counts as a move);
the move counter against the fewest possible; hints that name the vehicle by color and the slide
("slide the blue truck down 2"), with “Do it”; pause. Vehicles use colors away from red; the red car
drives out when solved.

### Computer players

| Agent    | Play                                                                                         | Freed within 150 moves (30 per level)                    |
| -------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `random` | Any slide.                                                                                   | 12 / 2 / 0                                               |
| `greedy` | The slide leaving the fewest vehicles between the red car and the exit, never straight back. | 9 / 2 / 0                                                |
| `solver` | Breadth-first search: the fewest moves (the oracle).                                         | 30 / 30 / 30, always optimal (8 / 35 / 98 ms per puzzle) |

These figures cover easy, medium and hard; on the 87 expert puzzles the solver averages about 60 ms
(230 ms at most) and always finds the stored minimum.

The greedy driver is a weak baseline on purpose: clearing the exit row first is the classic trap.

### States and actions

`JamState`: level, index (the puzzle's number in its level), puzzle (vehicles, start, fewest moves),
positions, history, moves, hints, elapsed time, solved. Environment actions `vehicle:start`; episodes
end freed or after 150 moves; config `{ level }` (any of the four), the seed picking the puzzle. Save
validation looks the puzzle up again from the index and checks every position for overlaps.

### Achievements

| id        | Condition                                              |
| --------- | ------------------------------------------------------ |
| `first`   | Free the red car.                                      |
| `optimal` | Free it in the fewest moves, without hints.            |
| `hard`    | Solve a hard puzzle without hints.                     |
| `speed`   | Solve a medium puzzle in under a minute without hints. |
| `daily`   | Solve today's puzzle.                                  |

### Graphics and audio

CSS lot with a grid, the exit gap with an arrow, glossy vehicles (cars lighter, trucks darker) with
windows; synthesized slide, hint and win sounds.

### Save format and AI interface

Save slot schema 2: `{ state, daily, best }` — the puzzle in progress (or null) and the fewest
moves per solved puzzle keyed `level:index`. Schema-1 saves (`{ state, daily }`, states keyed by the
seed) migrate: the seed becomes the index it picks (the old levels' banks are unchanged) and no
puzzles are marked solved. Env `traffic-jam` v`1.0.0`: kind `puzzle`, one seat,
perfect information, config `{ level }`; return 1 when freed, score = −moves.

### Testing criteria

Well-formed boards (no overlaps, the red car on the exit row) whose stored counts the solver
confirms, harder levels with longer solutions, expert puzzles of 30+ moves (the hardest re-solved),
numbered puzzles and seed-to-index agreement, the schema-1 migration and best-move records, lane-bound slides, undo, following the solver for
exactly the fewest moves, the greedy driver's legality, save validation, the contract suite; UI:
keyboard slides, undo, hints to the end with the result recorded; picking an expert puzzle, solving
it with hints, its solved mark and best, the next puzzle. E2E desktop + mobile.
