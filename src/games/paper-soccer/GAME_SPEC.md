# #069 Paper Soccer — Game Specification

## Ruleset (`paper-soccer-8x10`)

- A field of 8 × 10 squares (9 × 11 dots) with a goal two squares wide behind the middle of each end
  line (three goal dots each). The ball starts on the center dot. **Orange** (seat 0) attacks the
  top goal and kicks off; Teal attacks the bottom goal.
- A move draws a line from the ball to one of the eight neighboring dots. A line may never be drawn
  twice and never along the border: the side lines, the end lines outside the goal mouth, the
  goals' sides (straight in from a post) and backs.
- If the ball lands on a dot that already had a line through it, or on the border (side lines, end
  lines outside the mouth, the posts), it **bounces**: the same player draws again.
- Reaching a goal dot scores for the side attacking that goal (an own goal counts). A player who
  must move but cannot loses. The game always ends (every move uses up a line).

## Modes and difficulty

vs Computer (Orange or Teal), Two Players, Watch AI. Generic alpha-beta with a transposition table
over single lines (a bounce gives the same player the next ply) and goal-first move ordering.
Evaluation: how far up the field the ball is toward the goal being attacked, discounted when it is
off to the side near a goal, plus a small bonus for having the move.

| Level  | Search                               |
| ------ | ------------------------------------ |
| Easy   | 2 plies; random line 25% of the time |
| Medium | 5 plies                              |
| Hard   | Iterative deepening for about 1 s    |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 9–1, Medium vs Easy 10–0,
Hard vs Medium 8–2.

## States and actions

`PaperSoccerState` = `ball` (dot index (y + 1)·9 + x, y from −1 to 11), `toMove`, `edges` (a flag
per dot and direction, stored both ways), `lines` ([from, to, seat] in order, for drawing),
`history`, `movers`, `result` {winner, reason `goal` | `own-goal` | `stuck`}; validated by replay.
Actions: the direction `"0"`–`"7"` (N, NE, E, SE, S, SW, W, NW).

## Achievements

| id                         | Condition                                |
| -------------------------- | ---------------------------------------- |
| `first-win`                | Win against the computer.                |
| `beat-medium`, `beat-hard` | Beat each level.                         |
| `combo`                    | Score with a turn of five lines or more. |
| `hot-seat`                 | Finish a two-player game.                |

## Controls

Tap one of the yellow dots around the ball. Keyboard: arrows kick orthogonally, the number pad
(7 8 9 / 4 6 / 1 2 3) in all eight directions; `U`/`H`/`R`/`N`. The status line says who attacks
which goal and when a bounce gives another move. The field turns for Teal so you always attack up.

## Graphics and audio

A green pitch with white border, halfway line and center circle, dotted grid, each side's lines in
its color (the newest thicker), the goals tinted, a classic black-and-white ball, the hint dashed in
blue. A kick tone, a ping for bounces and a three-note cheer for goals.

## Save format and AI interface

Shared match envelope (schema 1). Env `paper-soccer` v`1.0.0`; codec: the direction
(`actionSpaceSize` 8); tensor `[9, 117]` (drawn lines per direction, then the ball), turned for
Teal so the observer always attacks up. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Engine: eight opening lines, no redrawn line, bounces off a used dot and the side line, lines along
the border refused, goals and own goals, the goal's side from a post, the stuck loss, replay
validation, a symmetric evaluation that rewards advancing. Module: strength ordering (seeded),
Orange first and bounce movers, save round trip and tamper rejection, contract suite, UI (kick,
the drawn line gone, a bounce), e2e desktop + mobile.
