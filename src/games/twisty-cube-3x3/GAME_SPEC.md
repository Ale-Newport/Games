# #135 Twisty Cube 3×3 — Game Specification

The 3×3 twisty cube under a generic name, with its own look and texts.

## Ruleset (`twisty-cube-3`)

Six faces of 3×3 colored stickers; a turn rotates one face layer a quarter turn — clockwise as
seen from that face (U, D, L, R, F, B), counter-clockwise with a prime (′). The cube is solved
when every face shows one color.

## Cube model (`../shared/cube/cube.ts`)

Every sticker has a position in doubled integer coordinates and an outward normal; a turn rotates
the stickers whose cubie lies in the turning layers by quarter turns about the face's axis. The
model is checked by group identities on every size (R⁴, (R U R′ U′)⁶ and (R U)¹⁰⁵ are the
identity) and by the standard turn directions. Scrambles are seeded random turns that never turn a
face twice in a row.

| Level         | Scramble        |
| ------------- | --------------- |
| 3 turns       | 3 random turns  |
| 7 turns       | 7 random turns  |
| Full scramble | 25 random turns |

## Solver (`../shared/cube/twophase.ts`)

A two-phase solver after Kociemba. Phase 1 brings the cube into the subgroup ⟨U, D, R2, L2, F2,
B2⟩ (corner twist, edge flip and the four middle-layer edges home); phase 2 solves within it.
Both phases search by iterative deepening over coordinate move tables (twist 2 187, flip 2 048,
slice 495; corner and edge permutations 40 320, slice permutation 24), pruned by exact
breadth-first tables for pairs of coordinates (about four million entries in all, built in about
0.5 s on first use). The search keeps any solution of at most 22 turns and goes on looking for
shorter ones until its time is up; the game gives it 60 ms. Over 20 scrambles per level: 3 turns
for every 3-turn scramble, 7 for 7-turn ones (once 6, once 8), and 20.6 on average (18–22) for
full scrambles. Short scrambles finish early, so their hints are as short as the scramble.

## Modes, play features, controls

New or daily scramble, resume, watch the AI. The cube is drawn in CSS 3D (stickers placed by their
normal); drag to look around; each turn animates its layer. Turn buttons (U U′ R R′ …, colored by
face) and keys (letters, Shift for prime); undo (animated); the turn counter and a timer that starts
with the first turn; hints name the next turn and how many remain.

## Computer players

| Agent    | Play                                                   | Solved within 200 turns (20 per level)      |
| -------- | ------------------------------------------------------ | ------------------------------------------- |
| `random` | Any turn.                                              | 0 / 0 / 0                                   |
| `greedy` | The turn leaving the most stickers on their own color. | 14 / 0 / 0                                  |
| `solver` | The two-phase solver (near-optimal).                   | always, about 22 turns from a full scramble |

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

Save slot schema 1: `{ state, daily }`. Env `twisty-cube-3x3` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when solved, score = −turns.

## Testing criteria

Group identities, turn direction, scrambles undone by inverse sequences, simplification,
two-phase solutions of at most 24 turns that solve, the solved cube read as identity cubies, turns and undo, save
validation by replay, greedy legality, following the solver on an easy scramble, the contract
suite; UI: buttons, keys, undo and hints to solved with the result recorded. E2E desktop + mobile.
