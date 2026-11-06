# #041 Nim — Game Specification

## Ruleset (`nim-normal-3to5-heaps`)

- Each round starts with **3 to 5 heaps of 1 to 9 counters**, drawn at random (the AI environment
  draws them from its seed). The first player alternates between rounds.
- A move takes **one or more counters from a single heap**.
- Normal play: whoever takes the last counter **wins**. Every move removes a counter, so the game
  always ends; there are no draws.

## States and actions

Shared engine `src/games/shared/heaps/engine.ts`: `HeapsState` = `start`, `heaps`, `first`,
`toMove`, `history`, `result`, validated by replay from `start`. Actions: `2:3` (take 3 from heap
C). Restart replays the same setup; a new round draws a new one.

## Modes and difficulty

vs Computer, Two Players, Watch AI. All levels use an exact memoized solver (win/loss of the side
to move keyed by the sorted heaps; unit-tested against the nim-sum rule on 300 random positions).

| Level  | Play                                                                      |
| ------ | ------------------------------------------------------------------------- |
| Easy   | Winning move 30% of the time, otherwise random                            |
| Medium | Winning move 75% of the time                                              |
| Hard   | Always a winning move; when lost, takes one counter from the largest heap |

Measured (seeded setups, seats alternated, 40 games per pair): Easy vs Random 29–11, Medium vs
Easy 33–7, Hard vs Medium 36–4. A test checks that Hard never loses a position it starts winning.

## Achievements

| id                         | Condition                         |
| -------------------------- | --------------------------------- |
| `first-win`                | Win against the computer.         |
| `beat-medium`, `beat-hard` | Beat each level.                  |
| `second-wins`              | Win a round the computer started. |
| `hot-seat`                 | Finish a two-player game.         |

## Controls

Tap a counter: it and every counter to its right are marked; tap again or press “Take k from X”
to confirm. Keyboard: arrows move between counters and heaps, Enter chooses / confirms, Esc
cancels; `U`/`H`/`R`/`N`. The hint (from the perfect solver) outlines the counters to take.

## Graphics and audio

Felt table, rows of shaded gold counters with heap letters and sizes, marked counters lifted, a
"−k" badge on the heap just taken from. Take sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `nim` v`1.0.0`; codec: heap h, amount k → 30h + k − 1
(`actionSpaceSize` 180, shared by the heap games); tensor `[5]` (heap sizes / 30). Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared: legal moves per variant, last-counter results (normal and misère), seeded setups, replay
validation, codec, solver vs nim-sum / misère rule / Wythoff pairs / multiples of four. Module:
Hard keeps winning positions, strength ordering (seeded), round creation / restart, save round
trip and tamper rejection, contract suite, UI (mark, confirm, status), e2e desktop + mobile.
