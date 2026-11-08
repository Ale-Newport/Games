# #194 Canyon Run — Game Specification

A river-raid style scrolling shooter with an original name and look.

## Ruleset (`canyon-run`)

A 240 × 320 portrait view at 60 steps a second; the world scrolls up a river made of rows 8 px high,
derived from the run's seed by hashing (so any row can be rebuilt): stretches of 64 rows open out of
a narrow channel (52 px), follow three keyframes of width (90–210 px, narrowing in later stretches)
and centre, sometimes with an island (from the second stretch), and close into the channel again,
with a bridge on row 60. The jet sits 50 px from the bottom; it steers 2 px a step, flies at 1, 1.8
or 3 px a step (slow, normal, fast) and fires straight ahead, one shot at a time (8 px a step). Fuel
starts at 100 and burns 0.035 × (0.6 + 0.4 × speed) a step; flying over a depot refills 0.6 a step.
Things appear every six rows in the middle of a stretch (from the seed): boats and helicopters,
which start weaving across the water as the jet comes within 180 px, jets (from the second stretch)
crossing the screen, and depots. A shot scores boat 30, helicopter 60, jet 100, depot 80, bridge 500. Touching a bank, an island, an enemy or a standing bridge, or running dry, costs a jet (four;
one more every 10 000 points); the next jet starts just past the last bridge shot down and passed,
with the things of that stretch back in place.

## Players (watch mode and AI Lab)

- `pilot`: steers for the middle of the water five rows ahead (the wider side of an island), but
  never outside the stretch of water it is in from the row behind it to four rows ahead; heads for a
  depot when fuel is below 55 and slows over it; fires at enemies and bridges in its line (sparing
  depots while it needs fuel); sidesteps enemies close ahead; slows on sharp bends and before
  bridges.
- `cruiser`: follows the middle of the river and never fires.

Measured (8 runs each, 10-minute cap): pilot averaged 8040 points and 11.5 bridges (76 s), losing
jets mostly to enemies (29) rather than banks (6); cruiser never passes the first bridge. Earlier
versions of the pilot steered across islands while still beside them (its target looked past the
island's end), and turned while its tail was still beside one.

## States and actions

`Raid`: seed, distance scrolled, jet position, speed, fuel, shot, fire held, things in view (row,
kind, position, speed, awake), rows whose things are gone, bridges down, the checkpoint, lives,
score, next extra jet, death pause and cause, the step's events, steps. Actions: `idle`, `fire`,
eight moves (steer and/or speed) and the same with `-fire`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `river-raid` v`1.0.0`: kind `real-time` (60 Hz),
one seat, the score as return; a 30-minute step limit.

## Achievements

| id       | Condition                |
| -------- | ------------------------ |
| `bridge` | Shoot down a bridge.     |
| `refuel` | Refuel over a depot.     |
| `five`   | Shoot down five bridges. |
| `score`  | Score 10 000 points.     |

## Graphics and audio

Green banks and islands with darker tufts, blue water with drifting ripples, grey bridges striped in
yellow, grey boats, green helicopters with spinning rotors, grey jets, red-and-white striped depots,
a yellow jet; an E–F fuel gauge that flashes red when low. Synthesized sounds for the engine, shots,
hits, bridges, refuelling, checkpoints, crashes and extra jets.

## Testing criteria

The river (same for a seed, in bounds, channels and bridges); steering, speed and fuel; shooting a
boat and refuelling; bridges blocking, falling and becoming the checkpoint; banks and running dry,
restarting at the checkpoint; the pilot passing bridges where the cruiser cannot; exact replays. The
contract suite; UI: steering into the bank; watch mode. E2E desktop + mobile.
