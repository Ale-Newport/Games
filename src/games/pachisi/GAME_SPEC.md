# #146 Pachisi — Game Specification

India's cross-and-circle game, on the shared cross-board race core (see #145).

## Ruleset (`pachisi-traditional`)

The large cross: arms of three columns, eight squares long (a 19×19 grid), whose outer columns
and tips make a 68-square loop. Four pieces a colour start in the centre (shown in the corner
yards). The throw is six cowrie shells: the number of mouths up counts 2–6 as itself, one alone
counts 10 and none counts 25 (chances 15, 20, 15, 6, 1 in 64 for 2–6; 6 in 64 for 10; 1 in 64 for
25). The grace throws — 6, 10 and 25 — give another throw and are the only ones that bring a piece
into play. A piece runs down the middle column of its own arm (7 squares), onto the arm's tip, round
the whole loop back to the tip, and up the middle column to the centre: 83 steps; any throw long
enough reaches the centre (throws never show 1). Landing on a rival piece off the castles sends it
back to the centre and gives another throw; the twelve castles (the tips and the fourth square from
the end of each outer column) are safe, and so are two pieces of one colour together. With four
players, opposite arms are partners: they never capture each other, and the partnership wins when
all eight of its pieces are home. With two, the players sit on opposite arms and play alone.

## Engine options used

The race engine gained, for Pachisi: a custom throw (cowries, shown face by face), a custom route
(down the arm, round, back up), partnerships, a "no bonus" homecoming, and reaching home without an
exact throw; for Parchís (#147), an obligatory exit.

## Computer players

The shared players of #145 (`random`, `simple` — a piece in on a grace throw, otherwise the leading
piece — and `heuristic`). Measured (seeded throws): simple beat random 150 of 200 two-player
games; the heuristic beat simple 111 of 200 two-player games, and as a partnership (seats 0 and 2)
won 145 of 200 games against a simple partnership.

## States, actions, saves, AI interface

As #145 (`RaceState`, actions `roll`, `pass`, `move:<token>`, `bonus:<token>`; saves validated by
replay; schema 1 `{ state, level }`), plus the cowrie faces of the last throw. Env `pachisi`
v`1.0.0`: kind `turn-based`, 2–4 seats (config `{ players }`), deterministic transitions; returns 1
for the winning seat and its partner.

## Achievements

| id       | Condition                                  |
| -------- | ------------------------------------------ |
| `first`  | Win a game against the computer.           |
| `hard`   | Win against hard computer players.         |
| `four`   | Win a four-player game with your partner.  |
| `hunter` | Win after capturing at least three pieces. |

## Graphics and audio

The shared SVG cross board at arm length 8 with the castles starred, the six cowries showing their
mouths, coloured middle columns; the shared sounds.

## Testing criteria

The 68-square loop and the 83-step route through the tip twice, the twelve castles, cowrie values,
entering only on a grace throw, partners never captured, captures with another throw, four
computer players finishing as partners, replay validation, the contract suite for two and four
players; UI: throws and moves by taps and hints, watch mode. E2E desktop + mobile.
