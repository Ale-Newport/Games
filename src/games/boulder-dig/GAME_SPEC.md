# #188 Gem Digger — Game Specification

A cave-digging game in the classic falling-boulders mould, with an original name and look: a
miner in a yellow helmet, cyan gems, sparks and moths.

## Ruleset (`gem-digger`)

Caves of 40 × 22 cells (a 20 × 14 view that follows the digger) at 60 steps a second; the cave moves
in ticks of 8 steps. Each cave is generated from the run's seed: steel around the edge, earth with
boulders (12 % plus 1 % a cave, up to 18 %), gems (4.5 %) and open patches, a few wall runs, and
2–6 pockets each holding a spark or a moth; the digger starts top left (its corner cleared of
boulders), the exit bottom right; the gems needed are 55 % of those placed (at least 8). On each
tick the digger moves a cell (digging earth), takes a gem (10 points, 15 beyond the quota), or
pushes a boulder sideways into empty space after leaning on it for two ticks; then, from the bottom
row up, boulders and gems fall into empty cells below and roll off boulders, gems and walls into an
empty cell beside and below; one that was falling and lands on the digger, a spark or a moth
crushes it in a 3 × 3 blast (moths leave gems). Sparks keep a wall on their left, moths on their
right; either one next to the digger blows up with it. With enough gems the exit opens; walking in
scores a point per second left and leads to the next cave. Losing a life (crushed, caught, or the
150-second clock) replays the same cave. Three lives.

## Players (watch mode and AI Lab)

- `miner`: the cave has no chance once made, so on each tick it tries every sequence of three moves
  (left, right, up, down, wait), plays the cave forward, and requires that some way out survives the
  next two ticks; among the safe sequences it takes the one that collects gems soonest and leaves it
  nearest (by the shortest way through earth, avoiding the enemies' neighbourhood) the next gem or
  the open exit, preferring an earlier exit.
- `grabber`: digs straight for the nearest gem by the shortest way, checking nothing.

Measured (4 runs each, 6-minute cap): miner cleared 7.5 caves on average (3229 points), losing a
life only once in all to the clock; grabber 401 points and 0.3 caves, caught by sparks and moths
within 39 s on average.

## States and actions

`Dig`: generator and the generator at the cave's start, cave number, cells, falling objects,
enemy facings, blasts, digger cell, gems needed and held, exit open, time, tick countdown, push
lean, lives, score, death and exit pauses and the cause, the step's events, steps. Actions: `idle`,
`up`, `down`, `left`, `right`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `boulder-dig` v`1.0.0`: kind `real-time`
(60 Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id      | Condition                             |
| ------- | ------------------------------------- |
| `exit`  | Leave a cave through its exit.        |
| `moth`  | Turn a moth into gems with a boulder. |
| `deep`  | Reach cave 4.                         |
| `score` | Score 2000 points.                    |

## Graphics and audio

Riveted steel, brick walls, speckled brown earth, shaded grey boulders, glinting cyan gems,
spinning orange sparks, flapping purple moths, an exit that flashes green once open, the digger in
a yellow helmet with a lamp, orange-white blasts and a red wash on a lost life. Synthesized sounds
for steps, gems, boulders and gems landing, pushes, the exit opening and leaving, blasts, deaths
and the clock.

## Testing criteria

Cave generation; moving on ticks and digging; falling and rolling; crushing (and resting boulders
not crushing); pushing; gems, the exit and the next cave; sparks and moths; replaying the cave and
the clock; the miner collecting more than the grabber; exact replays. The contract suite; UI:
digging with the touch pad; watch mode collecting gems. E2E desktop + mobile.
