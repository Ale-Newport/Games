# #133 Towers of Hanoi — Game Specification

## Ruleset (`hanoi-towers`)

Disks of different sizes start stacked on the first peg; move the whole tower to the last peg, one
top disk at a time, never placing a disk on a smaller one.

| Level   | Disks | Pegs | Fewest moves                      |
| ------- | ----- | ---- | --------------------------------- |
| 3 disks | 3     | 3    | 7 (2³ − 1)                        |
| 5 disks | 5     | 3    | 31                                |
| 7 disks | 7     | 3    | 127                               |
| 4 pegs  | 6     | 4    | 17 (the four-peg "Reve's puzzle") |

## Solver

A breadth-first table of the distance to the goal for every position (pegs^disks: up to 4 096),
built in milliseconds; from any position the next move is one that lowers the distance, so hints
and the AI are exact even after detours.

## Modes, play features, controls

Choice of tower, resume, watch the AI. Tap a peg to lift its top disk (it rises above the peg), then
another peg to drop it; refused drops explain the rule; number keys pick pegs; undo (counts a move),
restart; the move counter against the fewest possible; hints name the move and the moves left.

## Computer players

| Agent    | Play                                                                       | Result (from the start)                                                                                       |
| -------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `random` | Any legal move.                                                            | 3 disks: always, 122 moves on average; 5 disks: 1 of 20 within 600 moves; 7 disks and 4 pegs: rarely or never |
| `cyclic` | The hand rule (smallest disk round a ring of three pegs every other move). | optimal on three pegs (7 / 31 / 127); 63 on four pegs, where 17 is possible                                   |
| `solver` | The distance table (the oracle).                                           | always the fewest moves                                                                                       |

## States and actions

`HanoiState`: level, position (the peg of each disk), history, moves, hints, elapsed time, solved.
Environment actions `from>to`; episodes end moved or after 600 moves. Save validation checks every
position.

## Achievements

| id        | Condition                                               |
| --------- | ------------------------------------------------------- |
| `first`   | Move a tower.                                           |
| `optimal` | Move a tower in the fewest moves, without hints.        |
| `seven`   | Move seven disks in exactly 127 moves, without hints.   |
| `four`    | Move six disks on four pegs in 17 moves, without hints. |

## Graphics and audio

Wooden base, poles (the goal pole green) and rounded colored disks numbered by size; synthesized
lift, drop, blocked, hint and win sounds.

## Save format and AI interface

Save slot schema 1: `{ state }`. Env `towers-of-hanoi` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when moved, score = −moves.

## Testing criteria

The fewest moves for every level (7, 31, 127, 17), legal moves only, undo, the solver and the cyclic
rule finishing three-peg towers optimally, the solver finishing four pegs in 17, exact hints after a
detour, save validation, the contract suite; UI: taps, a refused drop, the seven-move solution by
keys with the result recorded. E2E desktop + mobile.
