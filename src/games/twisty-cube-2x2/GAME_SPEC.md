# #134 Twisty Cube 2×2 — Game Specification

The 2×2 twisty cube under a generic name, with its own look and texts.

## Ruleset (`twisty-cube-2`)

Six faces of 2×2 colored stickers; a turn rotates one face layer a quarter turn — clockwise as
seen from that face (U, D, L, R, F, B), counter-clockwise with a prime (′). The cube is solved
when every face shows one color.

## Cube model (`../shared/cube/cube.ts`)

Every sticker has a position in doubled integer coordinates and an outward normal; a turn rotates
the stickers whose cubie lies in the turning layers by quarter turns about the face's axis. The
model is checked by group identities on every size (R⁴, (R U R′ U′)⁶ and (R U)¹⁰⁵ are the
identity) and by the standard turn directions. Scrambles are seeded random turns that never turn a
face twice in a row.

| Level         | Scramble                                                       |
| ------------- | -------------------------------------------------------------- |
| 3 turns       | 3 random turns                                                 |
| 6 turns       | 6 random turns                                                 |
| Full scramble | 25 random turns (a random state; at most 11 turns from solved) |

## Solver (`../shared/cube/pocket.ts`)

The stickers are read as eight corner cubies (permutation and twist); the whole cube is turned so
that the down-back-left corner sits home, and iterative deepening over the nine U/R/F turns is
guided by exact distance tables for the corner permutation alone (5 040 states) and the twist alone
(729), both built by breadth-first search. Solutions are optimal in face turns: over 200 full
scrambles, 8.65 turns on average and never more than 10 (the most any 2×2 needs is 11), in about
3 ms each. The turns are mapped back to the player's view.

## Modes, play features, controls

New or daily scramble, resume, watch the AI. The cube is drawn in CSS 3D (stickers placed by their
normal); drag to look around; each turn animates its layer. Turn buttons (U U′ R R′ …, colored by
face) and keys (letters, Shift for prime); undo (animated); the turn counter and a timer that starts
with the first turn; hints name the next turn and how many remain.

## Computer players

| Agent    | Play                                                   | Solved within 200 turns (20 per level) |
| -------- | ------------------------------------------------------ | -------------------------------------- |
| `random` | Any turn.                                              | 0 / 0 / 0                              |
| `greedy` | The turn leaving the most stickers on their own color. | 12 / 0 / 0                             |
| `solver` | The optimal solver (the oracle).                       | always, in the fewest turns            |

## States and actions

Shared `CubeState`: level, seed, size, scramble and player turns in notation, stickers, hints,
undos, elapsed time, solved. Environment actions are turns in notation; episodes end solved or
after 200 turns. Save validation regenerates the scramble and replays the turns.

## Achievements

| id      | Condition                                    |
| ------- | -------------------------------------------- |
| `first` | Solve a scramble.                            |
| `own`   | Solve a full scramble without hints.         |
| `speed` | Solve a full scramble quickly without hints. |
| `daily` | Solve today's scramble.                      |

## Graphics and audio

CSS 3D stickers with rounded dark borders in six classic face colors, perspective view and layer
animation (none with reduced motion); synthesized turn clicks, hint and win sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `twisty-cube-2x2` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when solved, score = −turns.

## Testing criteria

Group identities, turn direction, scrambles undone by inverse sequences, simplification,
optimal solutions (5 turns for a 5-turn scramble, at most 11 otherwise), turns and undo, save
validation by replay, greedy legality, following the solver on an easy scramble, the contract
suite; UI: buttons, keys, undo and hints to solved with the result recorded. E2E desktop + mobile.
