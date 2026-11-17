# #230 Painted Night Ride

A calm 3D bicycle exploration game in the spirit of the viral painted-night cycling experience
(generic name, original world and models). The look is inspired by the swirling brushwork of
public-domain post-impressionist night paintings; every texture is painted procedurally in the
browser (no copied artwork).

| File            | Role                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `sim.ts`        | Pure 60 Hz ride: terrain, bike and walking physics, leaps, spins, orbs                           |
| `view3d.ts`     | three.js: painted sky dome, brush-textured hills, village, cypresses, fireflies, orbs, the rider |
| `NightGame.tsx` | Menu, keyboard/touch controls, HUD, toasts, pause, finish, saves                                 |
| `definition.ts` | The simulation side for the AI environment                                                       |

## Specification

### Ruleset (`painted-night-ride-orbs`)

- World: a 125-unit-radius valley of rolling hills (sum of seeded sines), flattened round the
  village and rising at the rim; a church (the steeple is the delivery point) and up to fourteen
  cottages spaced so you can ride between them; two cypresses. Houses, church and trees are
  solid; the rim is a wall.
- Riding: pedalling accelerates 8 u/s² up to 14 u/s; braking 18 u/s² (reverse up to 3); coasting
  drag 0.8; slopes speed you up downhill and slow you uphill (7 × grade). Steering turns up to
  1.9 rad/s, less at low speed. Leaping (Space) launches at 8.5 u/s (gravity 20, about 1.8 units
  high). Holding E in the air spins at 9 rad/s: each full turn completed before landing scores
  100 × turns²; landing more than ~35° into an unfinished turn is a tumble (dazed for 0.8 s).
- Walking (F): up to 4 u/s, tighter turns, a small hop.
- Orbs: 12 (Starlight) or 24 (Constellation, Free ride), at least 12 units apart, 30–110 units out;
  three in ten float 3.2 units up and need a leap. Ride within 2.6 units (and the right height)
  to pick one up. Enter the golden circle (radius 7) at the steeple to deliver what you carry: each
  becomes a new star in the sky.
- Score: 500 per star delivered + trick points + (when finished) 10 × the seconds left of ten
  minutes. Starlight and Constellation end when every orb is delivered; Free ride never ends.

### Courier agent

Rides to the nearest orb, leaps for high ones when lined up, slows to avoid circling, steers
round any house or tree on the straight line to its target (aiming beside it), backs off walls,
and returns to the steeple with four orbs (or the last ones). It finishes every tested ride
(Starlight in 1–2 minutes, Constellation in 2.5–9).

### States and actions

`Ride`: mode, world (seed, terrain phases, obstacles), generator, step, position, height and
vertical speed, heading, speed, ground/walking flags, spin, dazed timer, orbs, carried, delivered,
tricks and trick points, distance travelled, previous buttons, end, events. AI actions: pedal or
brake × steer × leap/spin combinations, plus walk (37).

### Controls

W/↑ pedal, S/↓ brake, A/D or ←/→ steer, Space leap, hold E in the air to spin, F walk, P/Esc
pause. Touch: steer, pedal, brake, leap, spin and walk buttons.

### Graphics and audio

A sky dome painted with thousands of curling strokes, three great swirls, haloed stars and a
crescent moon; delivered orbs appear as new glowing stars. Hills with a stroke texture and
height-tinted vertex colours under blue fog; cottages with lit windows, a church with a tall
spire, flame-shaped cypresses, twinkling fireflies, bobbing glowing orbs, a golden delivery ring
that pulses while you carry orbs. The rider pedals (legs follow the wheels), leans into spins,
wobbles after a tumble and walks beside the bike. Gentle chimes for orbs, an arpeggio for
deliveries, whooshes for leaps and spins. Reduced motion stops the bobbing and twinkling.

### Simplifications

No narrative, music score or day/night cycle; a single valley.

### Achievements

first-star, spin, double, starlight, constellation, quick (Starlight in under 3 minutes).

### Tests

`tests/sim.test.ts` (pedalling, braking, steering, terrain following, leaps, spins and tumbles,
walking, obstacles and the rim, pickups and deliveries, the courier finishing both modes, adapter
contract), `tests/ui.test.tsx`, `tests/e2e/games/painted-night-ride.spec.ts`.
