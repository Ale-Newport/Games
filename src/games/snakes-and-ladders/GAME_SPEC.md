# #148 Snakes and Ladders — Game Specification

The old race game of luck on a board of its own, plus a Choice variant that turns it into a game
of judgement.

## Ruleset (`snakes-ladders-exact`)

A 10×10 board numbered 1–100 in a boustrophedon from the bottom left. Nine ladders (3→22, 8→30,
21→42, 28→76, 36→44, 50→67, 58→79, 71→92, 80→99) and ten snakes (17→7, 33→15, 48→26, 62→41,
64→60, 74→53, 87→57, 93→68, 95→75, 97→78). Two to four players start off the board. A turn moves a
counter by the throw; landing at a ladder's foot climbs it, on a snake's head slides down it.
Reaching 100 needs the exact throw: a throw that would pass it leaves the counter where it is. The
first to 100 wins. **Classic**: one die, no decisions. **Choice**: two dice are thrown and the
player moves by either one.

The layout was tuned so that a classic game is not too long: the expected number of turns to finish
alone is 34.8 with one die and 14.8 when choosing well between two.

## The planner

The expected number of turns to reach 100 from every square, when each turn picks the better of
two dice, is computed exactly by value iteration (E(s) = 1 + the average over the 36 throws of the
smaller of E after either die; 11 ms). The planner moves by the die that leaves the smaller expected
number of turns; the hint shows that number.

| Agent     | Play                                                                  |
| --------- | --------------------------------------------------------------------- |
| `random`  | Either die.                                                           |
| `naive`   | Always the larger die.                                                |
| `planner` | The die with the fewest expected turns left (the exact solo optimum). |

Measured over 2000 two-player Choice games: the planner beat the larger-die player 1831 times
moving first and 1825 times moving second (about 91%).

## States and actions

`SnakesGame`: seed and dice generator state, variant, players, positions, whose turn, the dice,
phase (roll, choose, over), the winner, the last move (for messages), ladders climbed and snakes
met per player, and the action history. Actions: `roll` (which also moves in the classic game),
`use:0`, `use:1`. Saves are validated by replay.

## Achievements

| id        | Condition                                    |
| --------- | -------------------------------------------- |
| `first`   | Win a game against the computer.             |
| `choice`  | Win a Choice game against the computer.      |
| `charmed` | Win without sliding down a snake.            |
| `four`    | Win a four-player game against the computer. |

## Graphics and audio

An SVG board in two creams with numbered squares, wooden ladders with rungs and curving green
snakes, coloured counters sharing squares side by side, the dice as buttons in the Choice game;
synthesized dice, step, ladder, snake, hint and end sounds.

## Save format and AI interface

Save slot schema 1: `{ state, opponents }`. Env `snakes-and-ladders` v`1.0.0`: kind `turn-based`,
2–4 seats (config `{ variant, players }`, Choice for two by default), deterministic transitions;
returns 1 for the winner.

## Testing criteria

The board numbering, ladders up and snakes down, the exact finish, the expected-turn values, the
classic and Choice turns, replay validation, the planner avoiding a snake the larger die would hit,
the contract suite; UI: a classic game against the computer to the end, a Choice turn with a hint.
E2E desktop + mobile.
