# #186 Garden Guard — Game Specification

A crawler shooter in the classic segmented-creature mould, with an original name and look: a
caterpillar, garden stones, a gardener with a hose, a beetle and acorns.

## Ruleset (`garden-guard`)

A grid of 30 × 32 cells of 8 px at 60 steps a second; the gardener's patch is the bottom six rows.
Forty stones (three hit points each) start scattered above the patch. A caterpillar of twelve
segments (from wave 2, up to six of them come as separate heads) crawls one cell sideways every
6 steps (faster in later waves, down to 3); a segment that meets a stone or the edge drops a row and
turns, and in the patch it bounces between the patch's top and the bottom row. The gardener moves
1.6 px a step within the patch, never into a stone, and squirts upwards — one drop in the air at a
time, 8 px a step. A segment hit turns into a stone and the segment behind it becomes a head: 10
points, 100 for a head. A stone hit loses a point of strength (1 point when cleared). A beetle
zigzags through the patch from one side every 4–8 seconds, eating stones it crosses; hitting it
scores 300, 600 or 900 the closer it is. When fewer than four stones are left in the patch, acorns
drop straight down (two hits, 200 points), leaving stones behind. Touching a segment, the beetle or
an acorn costs a life (three; one more every 12 000); damaged stones then grow back (5 points each)
and the caterpillar starts again from the top. Clearing every segment brings the next wave.

## Players (watch mode and AI Lab)

- `gunner`: always squirting, it slides under the column the lowest segment will reach in two
  crawl steps, keeps to the bottom of the patch, and steps away from the beetle, falling acorns and
  segments in the patch.
- `sprinkler`: always squirting, it only drifts under the lowest segment and never dodges.

Measured (8 runs each, 15-minute cap): gunner averaged 18 578 points and wave 11.3 (254 s);
sprinkler 3208 points and wave 1.9; doing nothing 0.

## States and actions

`Guard`: generator, wave, stones, segments (cell, sideways and vertical direction, head), crawl
pace and timer, gardener position, drop, beetle and its timer, acorn, lives, next extra life,
score, death pause, the step's events, steps, heads hit. Actions: `idle`, `fire`, eight moves and
eight moves while squirting.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `centipede` v`1.0.0`: kind `real-time` (60 Hz),
one seat, the score as return; a 30-minute step limit.

## Achievements

| id       | Condition                  |
| -------- | -------------------------- |
| `head`   | Hit a caterpillar's head.  |
| `beetle` | Hit the beetle.            |
| `wave`   | Clear a whole caterpillar. |
| `score`  | Score 15 000 points.       |

## Graphics and audio

Dark soil with grass tufts and a slightly lighter patch; grey pebbles that shrink as they wear; a
green-striped caterpillar with a yellow head, eyes and feelers; a purple beetle with scuttling legs;
brown acorns; blue drops; the gardener in a green hat and blue overalls with a hose nozzle.
Synthesized sounds for squirts, segments, heads, stones, the beetle, acorns, being hurt, waves and
extra lives.

## Testing criteria

The starting garden; crawling and turning at edges and stones; splitting into a stone and a new
head; three-hit stones; the gardener kept in the patch; bouncing in the patch; being hurt and
stones growing back; the next wave; the gunner outscoring the sprinkler; exact replays. The
contract suite; UI: squirting scores and the caterpillar winning; watch mode. E2E desktop + mobile.
