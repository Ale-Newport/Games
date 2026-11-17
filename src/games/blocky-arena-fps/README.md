# #222 Blocky Arena

A fast browser arena shooter in the style of the popular blocky ".io" FPS games (generic name,
original arenas, models and textures): first-person 3D with three.js, free-for-all against bots.

| File            | Role                                                                          |
| --------------- | ----------------------------------------------------------------------------- |
| `maps.ts`       | The two arenas as 32 × 32 height maps (built from rectangles and staircases)  |
| `weapons.ts`    | Rifle, sniper and pistol statistics; the two classes                          |
| `sim.ts`        | Pure 60 Hz rules: movement, hitscan shooting, health, respawns, bots, actions |
| `view3d.ts`     | three.js view: instanced blocks, characters, first-person weapon, tracers     |
| `Game.tsx`      | Menu, pointer lock, keyboard/mouse/touch input, HUD, scoreboard, saves        |
| `definition.ts` | Options and the simulation side for the AI environment                        |

## Specification

### Ruleset (`blocky-arena-ffa`)

- Arenas: 64 × 64 units; each cell is 2 units wide with a height in half units. Courtyard (a
  central keep with stairs, corner bastions, low walls, crates) and Docks (containers, a raised
  walkway with stairs, a two-level stack). Ten spawn points each.
- Movement (60 steps/s): run 7 u/s (crouched 3.4, aiming 4.6, sniper aiming 3.8); ground
  acceleration 10 with friction 6 (stop speed 1); air acceleration with a 0.9 u/s wish cap (air
  strafing); gravity 24, jump 8.2 (≈1.4 units high). Walking up steps of up to 0.55; drops of any
  height. Crouching while running faster than 5 u/s starts a 0.6 s slide (+20 % speed, up to 12;
  friction 0.5). Holding jump on landing jumps again without friction (chained jumps).
- Weapons (hitscan, seeded spread):

  | Weapon | Mag | Fire        | Damage (head ×) | Spread hip / aimed / moving | Reload |
  | ------ | --- | ----------- | --------------- | --------------------------- | ------ |
  | Rifle  | 30  | auto, 10/s  | 22 (×1.5)       | 0.012 / 0.003 / +0.03       | 1.5 s  |
  | Sniper | 3   | bolt, 1.2/s | 90 (×1.5)       | 0.12 / 0 / +0.06            | 1.75 s |
  | Pistol | 10  | semi, 5/s   | 20 (×1.6)       | 0.015 / 0.006 / +0.02       | 1 s    |

  Rifle shots add bloom (0.005 each, up to 0.05, decaying 8 % a step); each shot kicks the view
  up. Rifle and pistol damage falls to 80 % beyond 40 units. Bullets stop at blocks (traced in
  0.1-unit steps). Hit boxes: a head box (0.44 wide, the top 0.45) over a body box (0.7 wide).
  Reloading is automatic on an empty magazine or with R; swapping takes 1/3 s.

- Health 100; regenerates 25/s after 4 s without damage. The dead respawn after 3 s at the spawn
  farthest from living enemies with full health and ammunition.
- Matches: 15 kills or 3 minutes, or 25 kills or 6 minutes; the most kills wins (a tie for first
  is a draw).
- Classes: Rifleman (rifle + pistol) or Marksman (sniper + pistol); a quarter of the bots are
  marksmen.

### Bots

Every 4 steps a bot looks for the nearest enemy within its view distance and field of view (or
within 6 units, or the one that just shot it) with a clear line of sight to the chest or head.
It reacts after a delay, turns towards the target at a limited rate, aims at the chest or (by
preference) the head with an initial error that decays plus a steady wobble, fires in bursts when
on target (snipers scope first), strafes and keeps its range. Without a target it walks A* paths
over the height map (one-level steps up, drops of up to three units) to where it last saw an
enemy or to a spawn, jumping when stuck.

| Level  | Reaction | Turn      | Error / wobble | View       | Head aim | Fires |
| ------ | -------- | --------- | -------------- | ---------- | -------- | ----- |
| easy   | 0.75 s   | 2.7 rad/s | 0.09 / 0.035   | ±52°, 40 u | never    | 45 %  |
| normal | 0.4 s    | 6 rad/s   | 0.04 / 0.014   | ±66°, 60 u | 30 %     | 75 %  |
| hard   | 0.2 s    | 12 rad/s  | 0.014 / 0.004  | ±83°, 80 u | 60 %     | 100 % |

Measured: an idle player is found and killed within about 7 s by five normal bots; the hard bot
brain on your seat wins most matches against easy and normal bots.

### States and actions

`Match`: arena, generator, step, bot level, kill goal, step limit, fighters (position, velocity,
view, health, alive and respawn, weapon, ammunition, reload, cooldown, crouch, slide, ground,
last damage and attacker, kills, deaths, streaks, headshots, aiming, bloom, previous buttons,
bot mind), recent shots (for tracers), kill feed, end, events. Human input is continuous (look
deltas, movement axes, buttons). The AI environment uses 270 discrete actions: move (none or one
of 8 directions) × turn (none, ±0.02, ±0.08 rad) × look (none, ±0.02) × fire.

### Scoring and saves

Kills are recorded (win, loss or draw; mode `<arena>-<level>`). Leaving to the menu saves the
match to resume (`schema 1`, validated).

### Controls

Click to capture the mouse (pointer lock; losing it pauses). Mouse look, WASD/arrows, Space jump
(hold to chain), Shift/C crouch and slide, left click fire, right click aim, R reload, Q/1/2
swap, Tab scoreboard, P/Esc pause. Without pointer lock, dragging on the arena also looks. Touch:
a movement stick, drag on the right half to look, and Fire, Aim (toggle), Jump, Crouch, Reload
and Swap buttons.

### Graphics and audio

three.js: instanced half-unit blocks with a pixel texture tinted by height band, a textured
floor, sky colour and fog per arena, hemisphere and sun light; blocky characters (legs swing with
speed, crouch, name tags); a first-person rifle, sniper or pistol with recoil, reload dip and
muzzle flash; tracers; field-of-view zoom when aiming and a scope overlay for the sniper. HUD:
time and goal, top three, kill feed, crosshair that opens with spread, hit markers (white, gold
for heads, red for kills), damage vignette, health bar, ammunition, death and respawn notice,
scoreboard. Synthesized gunshots per weapon, hits, kills, damage, death, reloads, swaps, spawns
and match end. Reduced motion hides the muzzle flash and leg swing. Without WebGL the match still
runs but the arena shows a notice instead of the 3D view.

### Simplifications

No online multiplayer (static site) — bots stand in for players. Two arenas and two classes;
no ramps, no knives or grenades, no custom skins. Hit detection uses boxes, not the character
models.

### Achievements

first-blood, win, win-hard, headhunter (5 headshot kills in a match), streak-5, marksman-win.

### Tests

`tests/sim.test.ts` (running and friction, jump height, stairs and walls, slide and chained
jumps, hit boxes, firing/damage/recoil/reload, headshots, cover, kills/respawn/regeneration,
A* paths, a bot match to its end, an idle player hunted, adapter contract), `tests/ui.test.tsx`,
`tests/e2e/games/blocky-arena-fps.spec.ts` (desktop and touch).
