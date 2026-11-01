# #172 Classic Snake — Game Specification

The snake game on the shared snake core (`shared/snake`) and arcade shell.

## Ruleset (`snake-walls`)

A 20 × 20 grid on a 60 Hz clock. The snake (three cells to start) moves one cell every 9 steps,
quickening by a step every four apples down to one move every 3 steps. It turns on command (a
turn is queued for the next move; turning straight back is ignored). An apple adds a cell and 10
points, plus 5 more for every five apples eaten. Running into a wall (where there are walls), a
block or its own body ends the run; filling the board ends it too. Walls are deadly. One mode: play until you crash.

## Players (watch mode and AI Lab)

- `pathfinder`: breadth-first search to the fruit (the golden fruit first while it has time left);
  it takes the first step only if, after it, the snake could still reach its own tail (or has room
  to spare); otherwise it follows its tail, and failing that it moves where the flood fill finds the
  most room.
- `greedy`: heads straight for the apple, avoiding only the next cell's dangers.

Measured (`snake-bench`, 30 runs, 30-minute cap): pathfinder: average length 105 and 7145 points over 725 s; greedy: length 31 and 678 points over 38 s (it traps itself).

## States and actions

`Snake`: rule set, generator, body (head first), direction and queued turn, apple, golden fruit
and its time, blocks, apples and golden fruit eaten, score, move timer, sprint clock, the end, the
step's events, steps. Actions per step: `up`, `down`, `left`, `right`, `idle`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `snake` v`1.0.0`: kind `real-time` (60 Hz), one
seat, the score as return; a 30-minute step limit.

## Achievements

| id       | Condition          |
| -------- | ------------------ |
| `first`  | Eat an apple.      |
| `twenty` | Reach length 20.   |
| `fifty`  | Reach length 50.   |
| `score`  | Score 1000 points. |

## Graphics and audio

A dark checkered board (red walls in the classic game), a green snake fading towards its tail with
eyes facing its way, a red apple with a leaf, grey blocks, a golden diamond that blinks before it
goes; synthesized sounds for eating, golden fruit, new blocks, the sprint's end, crashes and a full
board.

## Testing criteria

Moving and turning (never straight back), eating, growing and scoring, the quickening pace, walls
killing or wrapping, biting itself, blocks every fifth apple, the sprint clock, the pathfinder
growing long; the contract suite; UI: a run into a wall, watch mode eating. E2E desktop +
mobile.
