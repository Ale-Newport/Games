# #153 Summit Rush — Game Specification

A push-your-luck climbing race on eleven columns, in the family of the classic four-dice column
games (original name, art and text). Catalog id `cant-stop`.

## Ruleset (`summit-rush`)

2–4 players. Eleven columns numbered 2 to 12 are 3, 5, 7, 9, 11, 13, 11, 9, 7, 5 and 3 steps tall.
A turn rolls four dice; the player pairs them into two sums (three possible pairings) and climbs one
step in the column of each sum. Three climbers mark this turn's progress: climbing a column without
a climber needs a free one. When only one sum of a pairing can be climbed, either may be chosen.
After each climb the player rolls again or stops; stopping moves the player's markers up to the
climbers. A roll with no pairing that can climb is a bust: the turn's progress is lost. Reaching the
top of a column and stopping claims it: nobody may climb it again and the other players' markers in
it are removed. The first to claim three columns wins.

## Computer players

- `random`.
- `cautious` — climbs with the first pairing and stops once two climbers are out.
- `strategist` — picks the climb that gains the most weighted progress (outer columns are worth
  more, placing a new climber costs, reaching a summit is a bonus), and stops by Michael Keller's
  rule of 28 on the turn's value, or sooner when all three climbers are out and the exact chance of
  a bust (counted over the 1296 rolls) times the turn's value is too high, or when stopping wins.

Measured (`sr-bench`): the strategist beat the cautious player in 1000 of 1000 two-player games
(seats alternated) and won 998 of 1000 four-player games against three cautious players; in
strategist self-play the first seat won 57.3%. The strategist is a heuristic, not a solved policy
(the full game is far too large to solve here).

## States and actions

`SummitGame`: seed and generator state, players, markers per player and column, claimed columns,
whose turn, this turn's climbers, the dice, phase (`roll`/`choose`/`over`), winner, the last event
(bust, or stop with the columns claimed), busts per player, history. Actions: `roll`, `stop` (with
a climber out), `climb:<a>` or `climb:<a>,<b>`.

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by replaying the history from the seed. Env
`cant-stop` v`1.0.0`: kind `turn-based`, 2–4 seats (config `{ players }`), deterministic
transitions (dice come from the stored generator), returns 1 for the winner.

## Achievements

| id       | Condition                        |
| -------- | -------------------------------- |
| `first`  | Win a game against the computer. |
| `hard`   | Beat hard computer players.      |
| `steady` | Win without a single bust.       |
| `edge`   | Win holding the 2 or the 12.     |

## Graphics and audio

Eleven columns of steps with each player's coloured markers, white climbers for the current turn,
claimed columns tinted in the owner's colour; the four dice, one button per possible climb, roll
and stop buttons, hints that highlight the strategist's choice and give the exact chance of a bust;
synthesized sounds for rolls, climbs, busts, stops, summits, hints, wins and losses.

## Testing criteria

The three pairings, climbs limited by the three climbers, the either-sum rule, a bust, a stop that
claims a column and clears the others, the third summit winning, the rule-of-28 value and the exact
bust chances (8.0% with 6-7-8, 56.2% with 2-3-12), replay validation, the strategist beating the
cautious player, the contract suite for 2, 3 and 4 seats; UI: a whole game following hints against
the cautious computer. E2E desktop + mobile.
