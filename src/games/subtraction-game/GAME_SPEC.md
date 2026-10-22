# #044 Subtraction Game — Game Specification

## Ruleset (`subtraction-1to3-single-heap`)

- Each round starts with **one heap of 15 to 30 counters**, drawn at random (the AI environment
  draws it from its seed). The first player alternates between rounds.
- A move takes **1, 2 or 3 counters** (subtraction set {1, 2, 3}).
- Normal play: whoever takes the last counter **wins**. There are no draws.
- Theory (used only to test the solver): the player to move loses exactly on multiples of four.

## States and actions

Shared engine `src/games/shared/heaps/engine.ts` (variant `SUBTRACTION`, `takes: [1, 2, 3]`).
Actions: `0:2` (take 2). Replay validation from `start`; restart replays the heap, a new round
draws a new one.

## Modes and difficulty

vs Computer, Two Players, Watch AI. Exact memoized solver, unit-tested against the multiples of
four for every heap up to 30.

| Level  | Play                                                              |
| ------ | ----------------------------------------------------------------- |
| Easy   | Winning move 30% of the time, otherwise random                    |
| Medium | Winning move 75% of the time                                      |
| Hard   | Always a winning move; when lost, takes a single counter (stalls) |

Measured (seeded setups, seats alternated, 40 games per pair): Easy vs Random 27–13, Medium vs
Easy 33–7, Hard vs Medium 33–7. A test checks that Hard never loses a position it starts winning.

## Achievements

| id                         | Condition                         |
| -------------------------- | --------------------------------- |
| `first-win`                | Win against the computer.         |
| `beat-medium`, `beat-hard` | Beat each level.                  |
| `second-wins`              | Win a round the computer started. |
| `hot-seat`                 | Finish a two-player game.         |

## Controls

Only the last three counters can be chosen (1, 2 or 3 to take); tap again or press “Take k from
A” to confirm. Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`.

## Graphics and audio

The shared heap table with one wrapping row of gold counters, the marked counters lifted, a "−k"
badge after each move. Take sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `subtraction-game` v`1.0.0`; shared heap codec
(`actionSpaceSize` 180); tensor `[5]`. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared heap tests (allowed amounts, solver vs multiples of four), module: Hard keeps winning
positions, strength ordering (seeded), round creation / restart, save round trip and tamper
rejection, contract suite, UI (only three choices, taking everything refused, status), e2e
desktop + mobile.
