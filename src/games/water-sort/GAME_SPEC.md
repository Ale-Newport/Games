# #131 Water Sort — Game Specification

## Ruleset (`water-sort-4`)

Tubes of four units hold colored liquid, bottom first. A pour moves the whole top layer of one color
from a tube to an empty tube or to one whose top is the same color — as much as fits. Sorted when
every tube is empty or full of a single color.

| Level     | Colors | Tubes (two empty) | Solver moves (30 seeds) |
| --------- | ------ | ----------------- | ----------------------- |
| 4 colors  | 4      | 6                 | 13.2                    |
| 7 colors  | 7      | 9                 | 24.8                    |
| 10 colors | 10     | 12                | 38.2                    |
| 12 colors | 12     | 14                | 45.3                    |

Shuffles are seeded permutations of the units; the first one from the seed that the solver can
finish is used (all tried so far could be).

## Solver (shared)

Depth-first search over pours, remembering positions already explored (tubes sorted so that equal
positions match), preferring pours onto one-color tubes; pointless pours (a finished tube, or a
one-color tube into an empty one) are skipped. It solves every level in about a millisecond (not
the fewest moves). Hints replan from wherever the player stands and say when no finish is left.

## Modes, play features, controls

New or daily puzzle, resume, watch the AI. Tap a tube to lift its top layer (it rises), then the
tube to pour into; refused pours explain why; number keys pick tubes; undo (replays from the start),
restart; hints highlight the pour.

## Computer players (shared `ai.ts`)

| Agent    | Play                                                               | Sorted within 300 moves (30 per level) |
| -------- | ------------------------------------------------------------------ | -------------------------------------- |
| `random` | Any allowed pour.                                                  | 30 / 19 / 2 / 3                        |
| `greedy` | Onto one-color tubes first, avoiding empties, never straight back. | 29 / 16 / 2 / 2                        |
| `solver` | The search above (the oracle).                                     | 30 / 30 / 30 / 30                      |

## States and actions

Shared `SortState`: level, seed, start, tubes, history of pours, undos, hints, elapsed time, solved.
Environment actions `from>to`; episodes end sorted, stuck or after 300 moves. Save validation
regenerates the shuffle and replays every pour.

## Achievements

| id        | Condition                         |
| --------- | --------------------------------- |
| `first`   | Sort a set of tubes.              |
| `clean`   | Sort without undo or hints.       |
| `hardest` | Sort twelve colors without hints. |
| `daily`   | Sort today's puzzle.              |

## Graphics and audio

CSS glass tubes with rounded bottoms and flat liquid layers in twelve colors (named in labels);
synthesized lift, pour, blocked, hint and win sounds.

## Save format and AI interface

Save slot schema 1: `{ state, daily }`. Env `water-sort` v`1.0.0`: kind `puzzle`, one seat, perfect
information, config `{ level }`; return 1 when sorted, score = −moves.

## Testing criteria

Whole-run pours, same-color and capacity rules, sorted detection, skipped pointless pours, every
level solvable and solved by the solver, moves, undo, save validation by replay, legal agent moves,
the contract suite; UI: a pour by taps, undo, hints to the end with the result recorded. E2E desktop

- mobile.
