# #220 Snake Arena

The giant-arena snake game of the ".io" browser era (generic name, original look): you and 10–30
computer snakes in a round arena full of glowing pellets.

| File            | Role                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `sim.ts`        | Pure 30 Hz simulation: steering, bodies, boost, collisions, food, bots    |
| `definition.ts` | Arcade definition: camera and zoom, pellets, snakes, leaderboard, minimap |
| `ai-adapter.ts` | Environment (your snake; the bots are part of it) and two agents          |

## Specification

### Ruleset (`snake-arena-classic`)

- Round arena of radius 2,200; touching the red wall kills.
- Every snake moves 4 units a step (8 boosting) and turns towards its steering at most
  0.14 × (9 / radius)^0.3 radians a step (big snakes turn more slowly).
- Mass m sets the radius 7 + 2.6·log2(1 + m/12) and the number of body points
  min(500, round(6 + 0.9·m^0.75)), spaced at half the radius; the body follows the head's path.
- Boost: needs mass above 12, burns 0.1 mass a step and drops a pellet worth 70 % of the burn
  every 5 steps behind the tail.
- Pellets: 1,800 kept in the arena (12 new a step at most), worth 0.4–1.2; a head within its
  radius + 10 of a pellet eats it.
- A head touching another snake's body (head included) within 80 % of the summed radii dies;
  simultaneous head-on contacts kill both. The dead body becomes pellets worth 75 % of its mass
  in total. The owner of the body touched gets the kill.
- You start at mass 10 in the centre. Your run ends when you die; the score is the largest mass
  (shown as length) you reached. Dead bots are replaced after 2 s by new ones (mass 10 to ~270)
  away from you.

### Bots

Each step a bot picks a target heading: the best nearby pellet by value for distance (preferring
pellets ahead), or, when hunting, a point in front of a smaller snake's head (on normal a quarter
of bots hunt at a time, on hard 60 %; hard bots boost into the cut-off), or back towards the
centre near the wall, or a slowly changing drift. Then it checks five arcs at fixed turning rates
for obstacles (bodies, the wall and where nearby heads will be), looking 55 / 100 / 150 units plus
twice its radius ahead (easy / normal / hard), and takes the clear arc closest to its target, or
heads straight for the target when that way is clear. Measured over 5 minutes with 20 normal bots:
the hunter policy reached length ~600 and about 17 bots died.

### States and actions

`Arena`: generator, step, level, bot count, snakes (id, name, hue, flat body points, heading,
mass, boost, alive, kills, drift, respawn timer, best), flat pellet array (x, y, value, hue), next
id, end, killer, best rank, events. Actions: `idle`, `l`/`r` (turn), `d0`–`d15` (steer to one of 16
directions), each optionally with `b` (boost) — 38 in all.

### Scoring and saves

Best length is recorded (mode `<snakes>-<level>`). Leaving saves the run to resume (`sa` slot).

### Controls

Mouse: move over the arena to steer (no press needed), hold the button to boost. Touch: drag to
steer, boost button. Keyboard: ←/→ turn, ↑ or Space boost. P pause, R restart.

### Graphics and audio

Camera follows your head and zooms out as you grow; dotted floor, tinted outside and red wall;
pulsing glowing pellets (steady with reduced motion); striped snakes with eyes and names, brighter
while boosting; a top-10 leaderboard, your length and rank, a minimap. Synthesized sounds for
eating, big gulps, boosting, kills and death. Canvas words are localized.

### Simplifications

No online players (static site); bots stand in for them. Pellet magnetism and snake skins of the
originals are not included.

### Achievements

length-100, length-500, length-1000, kill, kills-5 (one life), top (#1 on the leaderboard).

### Tests

`tests/sim.test.ts` (movement and turning, boost and its cost, eating, deaths and kill credit, the
wall, action mapping, a long bot run, adapter contract), `tests/ui.test.tsx`,
`tests/e2e/games/snake-arena.spec.ts`.
