# #190 Neon Trails — Game Specification

A trail-racing game in the classic light-wall mould, with an original name and look.

## Ruleset (`neon-trails`)

A 48 × 36 grid at 60 steps a second; racers move one cell every 4 steps, all at once, leaving a
trail in every cell they pass. A turn takes effect on the next move; turning straight back is
ignored. A racer moving into the edge, any trail, or the same cell as another racer that move is
out. The last racer moving wins the round (100 points to the player); if the last ones go out
together, the round is drawn. The first to three round wins takes the match. One rival (a duel from
the left and right) or three (from four sides), each start shifted at random by up to three cells
so that no two racers mirror each other. The player scores a point for every move survived.

## Players (watch mode and AI Lab)

The computer racers are strategists. For the player's seat:

- `strategist`: for each turn open to it, counts the room it would leave (cells reachable, up to 600) and the cells it would reach before any rival (a breadth-first race from everyone at once),
  and avoids cells a rival could also enter on its next move; it prefers going straight on ties.
- `cruiser`: keeps straight until the cell ahead is taken, then turns to the side with more room.

Measured (12 matches each, 10-minute cap): with one rival, strategist won 5 matches (25 rounds),
cruiser none (2 rounds); with three rivals, strategist won 5 matches (25 rounds), cruiser none (3
rounds); doing nothing never wins a round. Before the starts were shifted, four strategists from
mirrored corners drew every round.

## States and actions

`Trails`: generator, number of rivals, round, trail owners by cell, racers (cell, heading, queued
turn, moving, round wins), move countdown, round pause and winner, score, the step's events, steps.
Actions: `idle` (straight on), `up`, `down`, `left`, `right`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `light-cycles` v`1.0.0`: kind `real-time`
(60 Hz), one seat (the rivals are part of the world), the score as return; a 30-minute step limit.

## Achievements

| id        | Condition                           |
| --------- | ----------------------------------- |
| `round`   | Win a round.                        |
| `match`   | Win a match.                        |
| `crowd`   | Win a match against three rivals.   |
| `perfect` | Win a match without losing a round. |

## Graphics and audio

A black grid with faint blue lines, trails in cyan (the player), pink, orange and lime (dimmed once
their racer is out), bright white heads with a coloured glow; a star in the winner's colour between
rounds. Synthesized sounds for the engine hum, crashes, rivals going out and round results.

## Testing criteria

Moving, trails and ignored reversals; crashing into edges and trails and winning the round; head-on
draws; the match; four separate starts; the strategist outlasting the cruiser and doing nothing
winning nothing; exact replays. The contract suite; UI: steering into the edge, watch mode. E2E
desktop + mobile with three rivals.
