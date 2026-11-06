# #043 Wythoff's Game — Game Specification

## Ruleset (`wythoff-two-heaps`)

- Each round starts with **two heaps of 4 to 15 counters**, drawn at random (the AI environment
  draws them from its seed). The first player alternates between rounds.
- A move takes **any number of counters from one heap**, or **the same number from both heaps**
  (equivalently: a chess queen moving toward the corner of a board).
- Normal play: whoever takes the last counter **wins**. There are no draws.
- Theory (used only to test the solver): the positions lost for the player to move are the pairs
  (⌊nφ⌋, ⌊nφ⌋ + n) and their mirror images, φ = (1 + √5) / 2.

## States and actions

Shared engine `src/games/shared/heaps/engine.ts` (variant `WYTHOFF`, `both: true`). Actions:
`0:3` (take 3 from heap A), `b:2` (take 2 from both). Replay validation from `start`; restart
replays the setup, a new round draws a new one.

## Modes and difficulty

vs Computer, Two Players, Watch AI. Exact memoized solver, unit-tested against the golden-ratio
pairs on every position up to 15 × 15.

| Level  | Play                                                                     |
| ------ | ------------------------------------------------------------------------ |
| Easy   | Winning move 30% of the time, otherwise random                           |
| Medium | Winning move 75% of the time                                             |
| Hard   | Always a winning move; when lost, takes one counter from the larger heap |

Measured (seeded setups, seats alternated, 40 games per pair): Easy vs Random 28–12, Medium vs
Easy 34–6, Hard vs Medium 31–9. A test checks that Hard never loses a position it starts winning.

## Achievements

| id                         | Condition                         |
| -------------------------- | --------------------------------- |
| `first-win`                | Win against the computer.         |
| `beat-medium`, `beat-hard` | Beat each level.                  |
| `second-wins`              | Win a round the computer started. |
| `hot-seat`                 | Finish a two-player game.         |

## Controls

Tap a counter to mark it and those to its right; switch on “From both heaps” (or press `B`) to
mark the same amount in both heaps; tap again or press “Take …” to confirm. Keyboard: arrows,
Enter, `B`, Esc; `U`/`H`/`R`/`N`.

## Graphics and audio

The shared heap table: felt, gold counters, marked counters lifted in both heaps when the double
move is on, a "−k" badge on the heaps just taken from. Take sound.

## Save format and AI interface

Shared match envelope (schema 1). Env `wythoff` v`1.0.0`; shared heap codec (`b:k` →
150 + k − 1; `actionSpaceSize` 180); tensor `[5]`. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared heap tests (both-heaps moves, solver vs golden-ratio pairs), module: Hard keeps winning
positions, strength ordering (seeded), round creation / restart, save round trip and tamper
rejection, contract suite, UI (double move marks both heaps and resets the toggle), e2e desktop +
mobile.
