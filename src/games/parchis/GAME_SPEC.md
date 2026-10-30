# #147 Parchís — Game Specification

Spanish parchís on the shared cross-board race core (see #145).

## Ruleset (`parchis-spanish`)

The large cross (arm length 8): a 68-square loop and a 7-square corridor up each colour's arm to
the goal; each colour exits on the second square of its arm's outer column and travels 67 loop
squares before turning into its corridor (74 steps, then the goal). Four pawns a colour start at
home. Each turn: roll one die. A 5 brings a pawn out onto the exit square, and must when a pawn can
come out. A pawn moves forward by the roll; the goal needs the exact roll. A 6 rolls again, and
once all of a player's pawns are out of home a 6 counts 7; three sixes in a row send the last pawn
moved back home (unless it is already in its corridor) and end the turn. Landing on a lone rival
pawn off a safe square captures it — it goes home — and earns a bonus move of 20 squares with any
pawn; bringing a pawn to the goal earns a bonus of 10. Two pawns of one colour on a square make a
barrier: no pawn may pass it or land on it (the owner's own included). The twelve safe squares
(each exit and the squares 7 and 12 after it, marked ★) allow no captures. A throw (or bonus) with
no legal move passes. The first colour with all four pawns at the goal wins.

Simplification: the traditional rule that a pawn coming out captures a rival standing on its
exit square is not modelled; the exit square is a safe square like the others.

## Computer players

The shared players of #145 (`random`, `simple` — a pawn out on a five, otherwise the leading pawn
— and `heuristic`), choosing bonus moves the same way. Measured (seeded dice): simple beat random
130 of 200 two-player games; the heuristic beat simple 131 of 200 two-player games and won 105 of
200 four-player games against three simple players (a quarter would be even).

## States, actions, saves, AI interface

As #145: `RaceState`; actions `roll`, `pass`, `move:<token>`, `bonus:<token>`; saves validated by
replay (schema 1 `{ state, level }`). Env `parchis` v`1.0.0`: kind `turn-based`, 2–4 seats (config
`{ players }`), deterministic transitions; returns 1 for the winner, 0 for the others.

## Achievements

| id       | Condition                                    |
| -------- | -------------------------------------------- |
| `first`  | Win a game against the computer.             |
| `hard`   | Win against hard computer players.           |
| `four`   | Win a four-player game against the computer. |
| `hunter` | Win after capturing at least three pawns.    |

## Graphics and audio

The shared SVG cross board at arm length 8 with coloured exits and starred safe squares, the die,
bonus moves shown as +20 / +10; the shared sounds.

## Testing criteria

The 68-square loop and twelve safe squares, the obligatory exit on a 5, six counting seven, barriers
that cannot be passed or landed on, the 20 and 10 bonuses, a four-player computer game finished and
replay-valid, the contract suite for two and four players; UI: rolls and moves by taps and hints,
watch mode. E2E desktop + mobile.
