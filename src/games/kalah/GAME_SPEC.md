# #061 Kalah Mancala — Game Specification

## Ruleset (`kalah-6x4`)

- Two rows of six pits with four seeds each, and a store at each player's right. **South**
  (seat 0) moves first.
- A move takes every seed of one of your pits and sows them one per pit counter-clockwise, through
  your own store but never your opponent's.
- Ending in your store gives another turn. Ending in one of your own pits that was empty, with
  seeds in the pit opposite, captures both into your store.
- As soon as either row is empty the game ends; each player adds the seeds on their side to their
  store. Most seeds wins; equal is a draw (threefold repetition or 400 plies end the game the same
  way).

## Modes and difficulty

vs Computer (South or North), Two Players, Watch AI. Generic alpha-beta with a transposition table
(extra turns are consecutive moves by the same player); evaluation = store difference plus a
quarter of the seeds on each row.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 4 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 8–2, Medium vs Easy 10–0,
Hard vs Medium 10–0.

## States and actions

Shared engine `src/games/shared/mancala/engine.ts`: `MancalaState` = `pits` (South 0…n−1 left to
right, North n…2n−1 right to left — sowing runs through increasing indices), `stores`, `toMove`,
`movers`, `history`, `keys`, `result`, validated by replay. Actions: the pit index.

## Achievements

| id                         | Condition                                |
| -------------------------- | ---------------------------------------- |
| `first-win`                | Win against the computer.                |
| `beat-medium`, `beat-hard` | Beat each level.                         |
| `big-store`                | Win with 30 or more seeds in your store. |
| `hot-seat`                 | Finish a two-player game.                |

## Controls

Tap one of your highlighted pits to sow it. Keyboard: ←/→ choose a pit, Enter sows;
`U`/`H`/`R`/`N`. The board turns so your row is at the bottom; the status line says when you sow
again.

## Graphics and audio

A carved wooden board with round pits and long stores, pebble seeds drawn in rings with exact
counts, the last pit and hint ringed. Sowing patter and a capture chime.

## Save format and AI interface

Shared match envelope (schema 1). Env `kalah` v`1.0.0`; codec: the pit index (`actionSpaceSize`
13); tensor `[14]` (the observer's pits, the opponent's, both stores, scaled). Outcome carries
the final counts. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared mancala tests (sowing past the opponent store, extra turn, empty-pit capture), module: strength ordering (seeded), South first, save round trip
and tamper rejection, contract suite, UI (sowing updates the pits), e2e desktop + mobile.
