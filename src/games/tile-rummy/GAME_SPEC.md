# #161 Tile Rummy — Game Specification

The numbered-tile rummy game in which the whole table may be rearranged, under a generic name with
original art.

## Ruleset (`tile-rummy-30`)

2–4 players. 106 tiles: 1–13 in four colours (red, blue, orange, black), two of each, plus two
jokers. Each player draws 14; the rest is the pool. On a turn a player either **plays** or
**draws** one tile (passing when the pool is empty).

- A play is judged as the whole table after it: every set must be valid; every tile that was on the
  table stays on it; at least one tile comes from the rack.
- Sets: a **run** of three or more consecutive numbers of one colour (13 does not wrap to 1), or a
  **group** of three or four of one number in different colours. A joker stands for any tile (a
  run's extra jokers count above it when there is room, else below).
- **First play**: new sets made only of the player's own tiles, worth at least 30, with the table
  left exactly as it was.
- **End**: the first to empty their rack wins and scores the total left in the other racks (joker
  30); each other player loses their own total. If the pool is empty and every player passes in
  turn, the lowest rack wins, scoring the others' totals minus its own.

Simplifications, stated honestly: a single game (no running score over several), and no rule
forcing a joker taken back from the table to be played in the same turn (here table tiles simply
can never return to a rack, so a joker can only move within the table).

## Computer players

Agents see their own rack, the table and the rack sizes. The move generator (`plays.ts`) finds: the
best disjoint sets in the rack (by value for a first play, by tiles placed afterwards, searched with
a node cap); rack tiles added to table sets (run ends, groups of three) or inserted into runs of five
or more by splitting them; tiles borrowed from the table — a run's end or any tile of a group of four
— to make new sets with rack tiles.

- `random` — any generated play, or a draw.
- `basic` — only lays down sets from its own rack; never touches the table.
- `planner` — the generator's fullest play.

Measured (`tr-bench`, 200 games each): the planner beat the basic player in all 200 two-player
games and won 185 of 200 four-player games against three basic players. Planner self-play: 41 of
50 games ended with a player going out (the rest blocked on an empty pool). The generator is a
heuristic: it does not search every rearrangement of the table, which a human may do.

## States and actions

`RummyGame`: seed, players, racks, pool (in draw order), table (sets of tile ids), turn, who has
made their first play, consecutive passes, phase, winner, final points, the last event, history.
Actions: `draw`, `pass`, `play:<set>|<set>|…` (the whole table, comma-separated tile ids per set).

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by replaying the history from the seed. Env
`tile-rummy` v`1.0.0`: kind `turn-based`, 2–4 seats (config `{ players }`), hidden information
(other racks and the pool order are hidden in observations), legal actions list the generated plays
plus draw/pass while `applyAction` accepts any valid table; returns are final points / 100 clamped
to [−1, 1].

## Achievements

| id      | Condition                        |
| ------- | -------------------------------- |
| `first` | Win a game against the computer. |
| `hard`  | Beat hard computer players.      |
| `out`   | Win by emptying your rack.       |
| `four`  | Win a four-player game.          |

## Graphics and audio

Cream tiles with coloured numbers and a star joker; the table as a green cloth of sets, each set a
tap target, invalid sets outlined red, tiles you placed this turn tinted; a "New set" target; your
rack on wood, sortable by colour or number; chips with every rack's size, the pool and the final
points. Synthesized sounds for selecting, moving, playing, drawing, hints, winning and losing.

## Testing criteria

Run and group reading with jokers and invalid shapes, the generator's rack sets, table additions and
run splits, the first-play rule (value, own tiles, table untouched), rearranging after melding,
drawing, passing and the blocked end, going out and its scoring, observations, replay validation,
the planner beating the basic player, the contract suite for 2 and 4 seats; UI: a tile moved to a
new set and back, a whole game played by hints. E2E desktop + mobile.
