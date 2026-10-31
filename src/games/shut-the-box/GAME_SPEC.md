# #154 Shut the Box — Game Specification

The pub dice game of nine numbered tiles, solved exactly.

## Ruleset (`shut-the-box-9`)

Tiles 1–9 start open. The player throws two dice — or one die, if they choose, once the open tiles
add up to 6 or less — and must shut open tiles that add up to the throw. When no set of open tiles
matches the throw, the turn is over and scores the sum of the tiles still open; shutting every tile
("shutting the box") scores 0. Solo, the goal is the lowest score. With 2–4 players each plays one
turn on a fresh box; the lowest score wins (ties share the win), and shutting the box wins at once.

## Computer players

- `random`.
- `simple` ("Big tiles first") — shuts the fewest tiles it can, the highest first.
- `solver` ("Perfect") — the solved game: dynamic programming over all 512 boxes (bitmasks of
  open tiles), settled from the emptiest boxes up, gives the lowest expected final score from every box, which
  tiles to shut for every throw and whether one die is the better throw.

Measured: under best play the expected score from a fresh box is 11.02. Over 20 000 solo turns the
perfect player averaged 10.89 and shut the box 10.2% of the time; the simple player averaged 11.20
and shut it 7.2%. Head to head (20 000 two-player games) the perfect player won 48.8%, the simple
player 47.5%, with 3.7% ties — the dice decide most games, which is the honest nature of this game.
The perfect player minimizes the expected score, not the chance of beating a particular score.

## States and actions

`ShutGame` (`match.ts`): seed and generator state, players, the box of the player to move (a
bitmask), final scores so far, whose turn, the dice, phase (`roll`/`shut`/`over`), winners,
history. Actions: `roll:2`, `roll:1` (when allowed), `shut:<mask>`.

## Saves and AI interface

Saves: schema 1 `{ state, level }`, validated by replaying the history from the seed. Env
`shut-the-box` v`1.0.0`: kind `turn-based`, 1–4 seats (config `{ players }`), deterministic
transitions (dice come from the stored generator). Returns: solo 1 − score/45; otherwise 1 shared
among the winners. No exact oracle is declared: the solver is exact for the solo score, not for
beating other players.

## Achievements

| id      | Condition                        |
| ------- | -------------------------------- |
| `first` | Finish a game.                   |
| `shut`  | Shut every tile.                 |
| `low`   | Finish with 5 or less left open. |
| `beat`  | Win a game against the computer. |

## Graphics and audio

A wooden box with nine flip-down tiles, the dice, tap tiles to choose a set that adds up to the
throw, hints that highlight the perfect choice with its expected final score; synthesized sounds
for throws, tiles, a stuck box, a shut box, hints, wins and losses.

## Testing criteria

The ways to shut a throw, one die only at 6 or less, the turn ending when nothing matches, scoring,
shutting the box winning at once, the lowest score winning and ties, replay validation, the solved
expected score, the perfect player outscoring the simple player, the contract suite; UI: a solo turn
with hints and a game against the computer. E2E desktop + mobile.
