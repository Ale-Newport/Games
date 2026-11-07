# #155 Colour Rows — Game Specification

A roll-and-cross dice game in the family of the modern "cross the coloured rows" games, under an
original name, art and text. Catalog id `qwixx`.

## Ruleset (`colour-rows`)

1–4 players, one sheet each with four rows: red and yellow run 2→12, green and blue 12→2. The
players take turns throwing six dice: two white and one per colour.

1. White step: in seat order from the thrower, every player may cross the sum of the white dice in
   any one row, or pass.
2. Colour step: the thrower may also cross one white die plus one coloured die in that colour's row,
   or pass.
3. A thrower who crossed nothing in either step takes a penalty (−5).

Numbers are crossed left to right; skipped numbers are lost. The last number of a row (12 or 2) may
be crossed only after five crosses in that row; crossing it locks the row for everyone, adds the
lock as one more cross, and removes that row's die. Rows locked during a step can still be crossed
by the others in that same step. The game ends when a player has four penalties or two rows are
locked (a game ended by locks in the white step gives the thrower no penalty). A row with n crosses
scores n(n+1)/2; the highest total wins (ties share). Solo, the goal is a high score.

Simplification, stated honestly: in the physical game everyone uses the white sum at the same time;
here the decisions are taken one at a time in seat order (locks still apply when the step ends), so
later players see the earlier choices of that step — a small information difference.

## Computer players

- `random`.
- `careful` — crosses only numbers that skip nothing; as thrower, if it has crossed nothing, takes
  the closest colour option that skips two numbers or fewer rather than a penalty.
- `planner` — values a sheet as Σ triangle(crosses + expected future crosses) − 5 × penalties, where
  each open number is weighted by how often two dice make it (a 7 counts 1, a 2 or 12 one sixth) and
  scaled by 0.8 (tuned in self-play over 0.3–1.2), and the lock counts only when five crosses are in
  reach. As thrower it plans the white and colour steps together, penalty included.

Measured (`cr-bench`, 1000 games each): two-player, the planner beat the careful player in 923 (3
ties), averaging 92.5 points to 49.0 over 28.5 throws; against three careful players it won 873.
Solo the planner averaged 96.8 (best 175, 2.1 penalties) and the careful player 69.4 (3.7
penalties). The planner is a heuristic, not a solved policy.

## States and actions

`RowsGame`: seed and generator state, players, sheets (crossed positions per row, rows locked by
the player, penalties), rows locked, the thrower, the dice (coloured dice of locked rows removed),
phase (`roll`/`white`/`colour`/`over`), the white-step queue, whether the thrower crossed anything,
locks pending and made this throw, the last throw's event (penalty, locks), history. Actions:
`roll`, `pass`, `mark:<row>:<number>`.

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by replaying the history from the seed. Env `qwixx`
v`1.0.0`: kind `turn-based`, 1–4 seats (config `{ players }`), the current player is whoever
decides now, deterministic transitions (dice come from the stored generator). Returns: 1 shared by
the winners; solo, (score + 20) / 180 clamped to [0, 1].

## Achievements

| id        | Condition                        |
| --------- | -------------------------------- |
| `first`   | Finish a game.                   |
| `century` | Score 100 points or more.        |
| `lock`    | Lock a row yourself.             |
| `beat`    | Win a game against the computer. |

## Graphics and audio

Six dice (the coloured ones dim during the white step), a printed-style sheet with four coloured
rows, the numbers you can cross pulsing, crosses, skipped numbers faded, locks, row scores,
penalty boxes and the total; score chips for every player; synthesized sounds for throws, crosses,
passes, penalties, locks, hints, wins and losses.

## Testing criteria

The white step for everyone and the colour step for the thrower, crossing left to right, the
penalty, the five-cross lock with its die removed and its extra cross, the end on two locks or four
penalties, replay validation, the planner's sheet values and its win over the careful player, the
contract suite for 1, 2 and 4 seats; UI: a whole game following hints against the computer, and a
solo cross. E2E desktop + mobile.
