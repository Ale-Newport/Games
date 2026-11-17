# #221 Cell Arena

The eat-or-be-eaten cell game of the ".io" browser era (generic name, original look): you and 10–25
computer cells in a square dish full of pellets and spiky viruses.

| File            | Role                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| `sim.ts`        | Pure 30 Hz simulation: movement, split, eject, merge, eating, viruses, bots    |
| `definition.ts` | Arcade definition: camera and zoom, grid, pellets, cells, viruses, leaderboard |
| `ai-adapter.ts` | Environment (your cells; the bots are part of it) and two agents               |

## Specification

### Ruleset (`cell-arena-ffa`)

- A 5,000 × 5,000 dish. Radius 4·√mass + 2; speed 9·mass^-0.22 units a step towards the steering
  point (slower within 60 units of it). Holding still gathers your cells together; cells free to
  merge also drift towards your centre of mass.
- Eating: a cell swallows a pellet it covers (worth 1), and a blob, virus or other player's cell
  with mass ≤ 80 % of its own (ratio 1.25) once that cell's centre is inside its radius minus 40 %
  of the smaller radius. The eater gains the whole mass.
- Split (a fresh press): every cell of 35+ mass halves, the new half is launched towards the
  pointer (decaying impulse ×0.88 a step); at most 16 cells. Cells of one player push apart until
  their merge time — 20 s + 1.5 % of the pre-split mass in seconds — then merge when overlapping.
- Eject (at most every 3 steps): every cell of 35+ mass loses 16 and fires a 13-mass blob.
- Viruses (22, mass 100): cells smaller than a virus pass under it; a cell that eats one gains its
  mass and bursts into as many equal pieces as it may have (up to 12 new ones, ≥ 20 mass each).
  A virus fed seven blobs fires a new virus in the direction of the last blob.
- Cells over 200 mass lose 0.008 % of their mass a step. 3,200 pellets are kept in the dish.
- You start with one cell of mass 12; the run ends when you have no cells left. The score is the
  largest total mass reached. Bots that die are replaced after 2 s, away from you.

### Bots

Each step a bot flees from any cell that could eat its smallest cell when it is close (and big
bots also flee viruses), keeps off the edges, chases the most valuable cell it can eat within its
vision (350 / 550 / 750 + twice its radius for easy / normal / hard) — normal and hard bots split
to catch prey when half their mass still out-eats it and it is within a split's reach — and
otherwise heads for the densest pellets nearby or drifts. Easy bots never split.

### States and actions

`Dish`: generator, step, level, bot count, players (id, name, hue, bot, alive, kills, best, respawn,
drift, last eject), cells (id, owner, position, impulse, mass, merge step), pellets (flat x, y,
hue), blobs (ejected mass and viruses), ids, end, eater, best rank, previous split, events.
Actions: `idle`, `s`, `w`, and `d0`–`d15` (steer to one of 16 directions) each optionally with `s`
(split) or `w` (eject) — 51 in all.

### Scoring and saves

Best total mass is recorded (mode `<cells>-<level>`). Leaving saves the run (`ca` slot).

### Controls

Mouse over the dish steers (no press needed); Space splits; X or Shift ejects. Arrows/WASD steer in
8 directions. Touch: drag to steer, split and eject buttons. P pause, R restart.

### Graphics and audio

Camera on your centre of mass, zooming out as you grow and to keep your split cells on screen;
grid floor and red edge; coloured pellets; cells with darker rims, names and (yours) mass; spiky
green viruses drawn over small cells and under big ones; a top-10 leaderboard, score, rank and a
minimap of the leaders. Sounds for eating, gulping, splitting, ejecting, merging, bursting,
losing a cell, kills and death. Canvas words are localized.

### Simplifications

No online players (static site); bots stand in for them. Game modes other than free-for-all,
skins and the exact original speed and decay curves are not reproduced.

### Achievements

mass-200, mass-1000, mass-3000, kill, kills-5 (one life), top (#1 on the leaderboard).

### Tests

`tests/sim.test.ts` (movement and speed, eating ratio, split/press/merge, eject and its rate,
viruses, being eaten, control mapping, a bot run, adapter contract), `tests/ui.test.tsx`,
`tests/e2e/games/cell-arena.spec.ts`.
