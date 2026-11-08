# #200 Wanderer Rescue — Game Specification

A puzzle platformer in the style of the classic lead-the-walkers-home games, with an original name,
look and levels.

## Ruleset (`wanderer-rescue`)

- **World**: an 80 × 45 grid of 4 px cells (air, earth, steel, water) under a 30 px skill bar. Steps
  at 60 a second; the wanderers move one cell every fourth step (a tick, 15 a second).
- **Wanderers** (one cell wide, two tall) drop from the hatch every `rate` ticks, facing right. A
  walker steps forward; climbs a step of one or two cells; turns at anything higher (or at a
  blocker); starts falling where the ground ends. Landing after a fall of more than 16 cells kills;
  so does water or leaving the map. Reaching the exit door saves it.
- **Skills** (limited per level): climber (permanent: climbs walls, falls back from a ceiling),
  floater (permanent: falls one cell every other tick, never splats), blocker (stands still; others
  turn at it), digger (every other tick removes three cells of earth below and moves down; stops at
  steel or air), basher (removes up to three cells of earth ahead and moves forward until there is
  nothing left to bash; steel turns it back), builder (every other tick lays an earth step ahead
  and climbs onto it, twelve in all; stops at a wall). Blocker, digger, basher and builder need a
  walker on the ground (digger: on earth).
- **Levels** (original layouts): 1 Mind the Gap (build over water), 2 Dig Deep (dig through a
  floor), 3 Brick Wall (bash), 4 Turn Back (block at a cliff, then bash home the other way), 5 Long
  Way Down (floaters), 6 Final Exam (dig, bridge, bash). Each has a number of wanderers and a number
  needed home.
- **Ending a level**: when every wanderer is home, lost, or standing as a blocker; after 1800 ticks
  (2 minutes), when those still out are lost; or when the player ends it. Enough home: next level;
  otherwise a try is lost and the level restarts. Three tries; clearing level 6 wins.
- **Score**: 100 per wanderer home, plus for a cleared level 500 × its number and the ticks left.
- **Start**: any level can be chosen as the first (practice).

## Players (watch mode and AI Lab)

- `planner`: when a level starts (or when it first sees one), a beam search (3 wide, up to 12
  orders) adds one order at a time — a skill, for one of the first three wanderers not blocking, at
  a moment worth trying (at an edge, facing a wall, just dropped, or every tenth tick) — and plays
  each candidate out with the real rules for up to 900 ticks with the first eight wanderers. Value:
  10 000 per wanderer home, −25 per cell of the closest each other one got to the exit, −300 per
  wanderer lost (still out at the end counts), small costs for time and skills. It then hands out
  each skill at its tick. Plans are remembered.
- `idle` (Onlooker): hands out nothing.

Measured: the planner cleared all six levels with no try lost, bringing home 10/10, 10/10, 10/10,
9/10, 8/8 and 15/15 (needed 7, 9, 9, 8, 6, 10); its search took 0.04–1.1 s per level in Node (the
first frame of a level pauses that long in the browser). The onlooker saves none and loses its three
tries on level 1. Earlier versions of the planner valued staying alive, which made it wait until
the clock ran out before digging; counting those still out at the end as lost fixed it. A first
Final Exam layout let followers splat in the digger's shaft (a fall of 18 cells); the upper floor
was lowered and a steel post added. Playing by hand showed that in Dig Deep digging early let the
followers fall 18 cells down the finished shaft; the lower floor was raised so any fall through it
is survivable.

## States and actions

`Rescue`: the level (index, grid, wanderers, skills left, still to drop, ticks, home, lost, done),
tries, chosen skill, highlighted wanderer, key cooldown, total home, levels cleared, score, the
end-of-level pause, whether it was won, victory, the step's events, steps. Actions (102): `idle`,
`prev`/`next` (skill), `up`/`down` (highlight), `assign`, `end`, `pick-<skill>`, `give-<skill>-<i>`.

## Saves and AI interface

Leaving a game for the menu saves it to resume. Env `rescue-walkers` v`1.0.0`: kind `real-time` (60
Hz), one seat, the score as return; a 30-minute step limit. Config: `{ options: { start } }`.

## Achievements

| id         | Condition                             |
| ---------- | ------------------------------------- |
| `first`    | Clear a level.                        |
| `everyone` | Bring every wanderer home on a level. |
| `half`     | Clear level 3.                        |
| `all`      | Clear all six levels.                 |

## Graphics and audio

A dusk-violet cave, earth cells with a mossy top edge, riveted steel, rippling water, a wooden hatch,
a golden arched exit, wanderers with green hair and blue clothes in poses for each job (arms out to
block, a spade, a brick, a pink umbrella), a yellow frame on the highlighted one, and a skill bar
with symbols, counts and the time left. Synthesized sounds for skills, wanderers home or lost,
cleared and failed levels, and the final victory.

## Testing criteria

Walking, steps and turning; fatal falls, floaters and water; blockers; digging (and steel);
bashing (and steel); building twelve steps; climbing; skill limits and timing; the exit and the end
of a level; the drop rate; keyboard skill choice, highlight and hand-out; three failures ending the
game; the planner clearing all six levels; exact replays. The contract suite (from level 1 and
level 4); UI: ending a level early, watch mode clearing level 1. E2E desktop + mobile.
