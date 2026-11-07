# #170 Diving Swarm — Game Specification

A fixed shooter with diving attackers, in the mould of the late-seventies swarm shooters, under an
original name with original sprites (catalog id `diving-swarm`), on the shared arcade shell.

## Ruleset (`diving-swarm-36`)

A 360 × 480 field at 60 steps a second.

- **Swarm**: 36 fliers — 2 gold commanders, 6 red guards, 8 violet and 20 blue drones — swaying
  side to side in formation. Worth 60/50/40/30 in formation, 150/100/80/60 while diving.
- **Dives**: every 1–3 seconds (sooner in later swarms) a flier from the flanks dives: a loop out
  and down for about a second, then a swaying run at the column where your ship was, firing up to
  two bullets aimed towards you. A commander takes up to two neighbouring guards. Divers that miss
  leave the bottom and return to their place.
- **Ship**: 2.6 px a step along the bottom, one missile in the air at a time (8 px a step). A bullet
  or a collision costs a ship (1.5 s; the divers return home meanwhile). Three ships, one more at
  5000 points. A cleared swarm returns faster (dives and bullets up to 60% quicker).

## Players (watch mode and AI Lab)

- `pilot`: dodges bullets that will reach it and divers heading its way, otherwise goes for the
  nearest target with divers first, and fires when lined up.
- `sweeper`: sweeps side to side, firing constantly.

Measured (`swarm-bench`, 30 runs, 20-minute cap): pilot 6426 points and 2.97 swarms cleared on
average (about 5 minutes); sweeper 733 points; standing still scores nothing and lasts 85 seconds.

## States and actions

`Swarm`: generator, swarm number, fliers (slot, row, alive, dive progress and aim), sway, dive
timer, ship position, missile, bullets, lives, extra ship given, score, explosion countdown, the
end, the step's events, steps. Actions per step: `left`, `right`, `idle`, `fire`, `left-fire`,
`right-fire`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `diving-swarm` v`1.0.0`: kind `real-time` (60
Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id        | Condition               |
| --------- | ----------------------- |
| `first`   | Finish a game.          |
| `wave`    | Clear a swarm.          |
| `veteran` | Reach the fourth swarm. |
| `score`   | Score 8000 points.      |

## Graphics and audio

Original winged fliers in four colours that flap, commanders with a crest, divers' eyes lit, a
scrolling starfield (still with reduced motion), a white arrow ship, an expanding burst when hit;
synthesized sounds for missiles, kills, commanders, dives, hits, extra ships, swarms and the end.

## Testing criteria

The swaying formation, dives looping and descending, kills scored in formation and diving, a bullet
costing a ship, the pilot scoring, the contract suite; UI: a run lost standing still with the
result recorded, watch mode scoring. E2E desktop + mobile.
