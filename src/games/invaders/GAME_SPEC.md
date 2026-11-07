# #169 Invaders from Above — Game Specification

A fixed shooter in the classic mould, under an original name with original sprites (catalog id
`invaders`), on the shared arcade shell.

## Ruleset (`invaders-classic`)

A 360 × 480 field at 60 steps a second.

- **Formation**: 5 rows × 11 invaders (30, 20, 20, 10 and 10 points by row). It moves 4 px every few
  steps — from 42 steps between moves with all 55 down to 2 with one — and steps down 10 px and
  turns at either edge.
- **Bombs**: none in the first two seconds; then up to 2 + wave (at most 5) in the air, from the
  lowest invader of a column (a third of the time the column nearest the cannon), more often in
  later waves (a 0.8% + 0.3% × wave chance each step); 2.6 px a step.
- **Cannon**: 2.2 px a step along the bottom, one shot in the air at a time (7 px a step); a shot
  can also destroy a bomb.
- **Shields**: four arches of 4-px blocks; shots and bombs knock blocks out, invaders crush them as
  they pass.
- **Mystery ship**: every 20–30 seconds, crossing the top; worth 50, 100, 150 or 300.
- **Lives**: three cannons, one more at 1500 points; a bomb costs a cannon (1.5 s explosion).
  Clearing a wave brings a new one starting lower (up to four steps); invaders reaching the cannon's
  row end the game.

## Players (watch mode and AI Lab)

- `gunner`: keeps out of the way of bombs that will land near it, lines up under the nearest
  invader column (or ahead of the mystery ship) and fires when something is above.
- `sweeper`: sweeps side to side, firing whenever it can.

Measured (`inv-bench`, 30 runs, 20-minute cap): gunner 4263 points and 3.3 waves cleared on
average (about 9.5 minutes); sweeper 1226 points; standing still loses all three cannons in about
22 seconds with no points. (A first tuning bombed twice as often: a cannon could fall within four
seconds of the start, too harsh for human play.)

## States and actions

`Invaders`: generator, wave, alive flags, formation origin, direction, march timer and frame,
cannon position, shot, bombs, shield blocks, mystery ship and its timer, lives, extra life given,
score, explosion countdown, the end, the step's events, steps. Actions per step: `left`, `right`,
`idle`, `fire`, `left-fire`, `right-fire`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `invaders` v`1.0.0`: kind `real-time` (60 Hz),
one seat, the score as return; a 30-minute step limit.

## Achievements

| id        | Condition          |
| --------- | ------------------ |
| `first`   | Finish a game.     |
| `wave`    | Clear a wave.      |
| `veteran` | Reach wave 4.      |
| `score`   | Score 3000 points. |

## Graphics and audio

Original two-frame pixel sprites in three ranks and colours, green pixel shields, a red saucer,
zig-zag bombs (straight with reduced motion), a starfield (still with reduced motion), a flashing
cannon when hit; synthesized sounds for shots, kills, the march, the saucer, hits, extra lives,
waves and the end.

## Testing criteria

One shot at a time, a hit scored by row, the march, the step down and turn, the speed-up, a bomb
costing a life, invaders landing ending the game, a new lower wave, the gunner outscoring standing
still, the contract suite; UI: a run lost standing still with the result recorded, watch mode
scoring. E2E desktop + mobile.
