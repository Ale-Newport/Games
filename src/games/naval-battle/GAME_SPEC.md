# #164 Naval Battle — Game Specification

The hidden-fleet guessing game, under a generic name with original art (catalog id `naval-battle`).

## Ruleset (`naval-10x10-54332`)

Each side has a hidden 10 × 10 grid with five ships of 5, 4, 3, 3 and 2 cells, in straight
horizontal or vertical lines, not overlapping (touching allowed). Players alternate single shots at
the other grid and are told miss, hit, or sunk (with the ship's size). The first to sink the whole
enemy fleet wins. You place your fleet by hand (pick a ship, tap its bow cell, rotate, pick placed
ships up again) or at random; the computer's fleet is placed at random from the seed.

## Computer players

They use only their own shot results and the sizes of the enemy ships still afloat (announced as
ships sink).

- `random` — any untried cell.
- `hunter` — fires at random on a checkerboard (every ship covers one of its colours) until it
  hits, then tries the ends of a line of hits or the cells around its unsunk hits.
- `analyst` — probability density: for every placement of every ship still afloat that avoids its
  misses and sunk cells it adds weight to the untried cells covered (×41 per unsunk hit the
  placement passes through), and fires at the heaviest cell. The hint uses the analyst.

Measured (`nb-bench`, 300 random fleets, shots needed to sink a fleet when firing alone): analyst
45.3 on average (worst 68), hunter 51.6 (worst 67), random 95.3. Head to head the analyst beat the
hunter in 203 of 300 battles (first shot alternated).

## States and actions

`NavalGame`: seed, both fleets, each seat's shots (cell → miss / hit / sunk), whose turn, phase,
winner, the last shot, history. Actions: `fire:<cell>` (row × 10 + column).

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by checking the placed fleet and replaying the shots.
Env `naval-battle` v`1.0.0`: kind `turn-based`, two seats, hidden information (observations show
the enemy fleet only ship by ship as it sinks), zero-sum returns ±1.

## Achievements

| id          | Condition                  |
| ----------- | -------------------------- |
| `first`     | Win a battle.              |
| `hard`      | Beat the Analyst.          |
| `sharp`     | Win in 50 shots or fewer.  |
| `untouched` | Win without losing a ship. |

## Graphics and audio

Sea-blue grids with A–J and 1–10 coordinates; white splashes for misses, orange for hits, dark red
for sunk ships; your fleet in grey on a smaller grid with the computer's shots; the enemy fleet
revealed at the end; the hint's cell outlined in gold. Synthesized sounds for placing, splashes,
hits, sinkings, hints, winning and losing.

## Testing criteria

Fleet validity and random fleets, miss / hit / sunk, alternating turns, the win, no repeated shots,
hidden enemy fleets, replay validation, the analyst's density around a hit, the analyst beating the
hunter on shots needed, the contract suite; UI: a fleet placed by hand (with a ship picked up and
rotated), a whole battle on hints, watch mode. E2E desktop + mobile.
