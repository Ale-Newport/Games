# #181 Sunny Trail — Game Specification

A side-scrolling platformer with an original hero, enemies and three levels (built from lists of
features: ground with pits, bricks, prize boxes, one-way ledges, stairs, coins, beetles, a
checkpoint and a flag), on the shared tile physics (`shared/platform/physics.ts`).

## Ruleset (`sunny-trail`)

A 320 × 224 view (16-pixel tiles, 14 rows) scrolling over levels 150, 170 and 180 tiles long, at
60 steps a second. The hero (11 × 14) accelerates by 0.12 px/step² on the ground (0.08 in the air)
to 1.8 px/step and slows by 0.18 when not running. A jump starts at −5 px/step; gravity is 0.18
while rising with the button held and 0.4 otherwise (falls capped at 6), so a held jump rises about
69 px and a tap far less; a jump still works up to 6 steps after leaving a ledge, and a press up to
6 steps before landing is remembered. Bodies move one axis at a time in half-pixel sub-steps;
one-way ledges hold only from above. Beetles wake within 240 px of the hero, walk at 0.5 px/step,
turn at walls and fall into pits. Landing on a beetle squashes it for 100 and bounces the hero;
spiky beetles cannot be squashed; any other touch hurts. Prize boxes opened from below give a coin
(10 points) or a berry (200 points and a shield that absorbs one hit, followed by 1.5 s of
safety). Coins are worth 10, and 100 coins are a life. Falling below the screen, being hurt without
a shield, or the 200-second level timer running out costs a life (three); after the checkpoint
flag the next life starts there. Touching the flag pole scores 1000 plus 10 per second left;
finishing the third level wins.

## Players (watch mode and AI Lab)

- `planner`: the levels involve no chance, so it searches them: a beam search over the next six
  moves of eight steps each (run right, run-jump right, wait, back off left, jump left, jump in
  place), keeping the 24 best (merging those that end in the same place), scored on distance along
  the level, score, the shield and staying alive. Each chosen move is remembered for its eight
  steps.
- `runner`: holds right and jumps at walls, gaps and beetles just ahead.

Measured (one run each — the game has no chance): the planner finished all three levels in 81 s
with 12 250 points (one fall, on level 3); the runner cleared level 1 and lost its lives in the
five-tile pit on level 2 (3550 points).

## States and actions

`Trail`: level, opened boxes, coins taken, berries out, hero (box, speed, facing, ground, steps in
the air, jump buffer, shield, safety time), beetles (box, direction, kind, alive, squash, awake),
checkpoint reached, jump held, time, score, coins, lives, death and level-end pauses, won, the
step's events, steps, stomps. Actions per step: `idle`, `left`, `right`, `jump`, `left-jump`,
`right-jump`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `platformer` v`1.0.0`: kind `real-time`
(60 Hz), one seat, the score as return; a 30-minute step limit.

## Achievements

| id      | Condition                |
| ------- | ------------------------ |
| `stomp` | Stomp a beetle.          |
| `berry` | Pick up a berry.         |
| `level` | Finish the first level.  |
| `win`   | Finish all three levels. |

## Graphics and audio

A blue sky with drifting clouds and green hills scrolling slower than the level; earthy ground with
grass on top, red bricks, shimmering yellow prize boxes (brown once opened), wooden ledges,
spinning coins, a checkpoint flag that turns green, an orange goal flag; purple beetles and red
spiky ones with little legs; the hero in a blue cap, red scarf and teal shirt, blinking while safe
and wrapped in a pink bubble while shielded. Synthesized sounds for jumps, coins, stomps, bumps,
berries, the shield, the checkpoint, deaths, extra lives and the flag.

## Testing criteria

Level shapes; ledges, walls and falling in the physics; running, held and tapped jumps; prize boxes
and the berry shield; stomping and being hurt (and the shield); pits and the checkpoint; the flag
and winning; the planner clearing all three levels and the runner not; exact replays. The contract
suite; UI: running into a beetle, watch mode clearing level 1. E2E desktop + mobile.
