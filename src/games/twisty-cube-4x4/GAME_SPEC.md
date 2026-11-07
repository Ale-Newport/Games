# #136 Twisty Cube 4×4 — Game Specification

The 4×4 twisty cube under a generic name, with its own look and texts.

## Ruleset (`twisty-cube-4`)

Six faces of 4×4 colored stickers; a turn rotates one face layer a quarter turn — clockwise as
seen from that face (U, D, L, R, F, B), counter-clockwise with a prime (′) and wide turns (Uw, Rw…: the two outer layers). The cube is solved
when every face shows one color.

## Cube model (`../shared/cube/cube.ts`)

Every sticker has a position in doubled integer coordinates and an outward normal; a turn rotates
the stickers whose cubie lies in the turning layers by quarter turns about the face's axis. The
model is checked by group identities on every size (R⁴, (R U R′ U′)⁶ and (R U)¹⁰⁵ are the
identity) and by the standard turn directions. Scrambles are seeded random turns that never turn a
face twice in a row.

| Level         | Scramble                       |
| ------------- | ------------------------------ |
| 3 turns       | 3 random turns (outer or wide) |
| 8 turns       | 8 random turns                 |
| Full scramble | 40 random turns                |

## Hints and the AI

There is no 4×4 search here: hints and the AI undo the scramble and the player's turns, merged so
that consecutive turns of one face combine or cancel. That always leads back to solved — about as
long as the scramble plus the player's turns (40+ from a full scramble), not the shortest way.
The rules page says so.

## Modes, play features, controls

New or daily scramble, resume, watch the AI. The cube is drawn in CSS 3D (stickers placed by their
normal); drag to look around; each turn animates its layer. Turn buttons (U U′ R R′ …, colored by
face, plus a wide-turn switch) and keys (letters, Shift for prime, W for wide); undo (animated); the turn counter and a timer that starts
with the first turn; hints name the next turn and how many remain.

## Computer players

| Agent    | Play                                                   | Solved within 200 turns (20 per level) |
| -------- | ------------------------------------------------------ | -------------------------------------- |
| `random` | Any turn (outer or wide).                              | 0 / 0 / 0                              |
| `greedy` | The turn leaving the most stickers on their own color. | 8 / 0 / 0                              |
| `solver` | Undoes the scramble and the turns so far.              | always (not shortest)                  |

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

Save slot schema 1: `{ state, daily }`. Env `twisty-cube-4x4` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when solved, score = −turns.

## Testing criteria

Group identities, turn direction, scrambles undone by inverse sequences, simplification,
wide turns differing from outer ones, hints undoing scramble and turns, turns and undo, save
validation by replay, greedy legality, following the solver on an easy scramble, the contract
suite; UI: buttons, keys, undo and hints to solved with the result recorded. E2E desktop + mobile.
