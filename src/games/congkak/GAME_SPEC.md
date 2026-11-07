# #064 Congkak — Game Specification

## Ruleset (`congkak-7x7-relay`)

- Two rows of seven houses with seven seeds each, and a store at each player's right. **South**
  (seat 0) moves first in round one; rounds alternate who opens.
- A move sows every seed of one of your houses counter-clockwise, through your own store but never
  your opponent's.
- **Relay sowing**: if the last seed lands in a house that already held seeds, pick them all up and
  keep sowing from there.
- Ending in your store gives another turn; ending in an empty house of your own captures the seeds
  opposite (and the last seed) into your store.
- As soon as either row is empty each player adds the seeds on their side to their store; most
  seeds wins. Threefold repetition or 400 plies end the game the same way.
- Traditional Congkak opens with both players sowing at once; with alternating turns the opening
  is decisive — in the bench whoever opened won 77–21 to 82–16 whatever the levels. Rounds alternate
  the opener. (A pie rule was tried to balance it and did not change the outcome, so it is not used.)

## Modes and difficulty

vs Computer (South or North), Two Players, Watch AI. Generic alpha-beta; evaluation = store
difference plus a quarter of the seeds on each row.

| Level  | Search                               |
| ------ | ------------------------------------ |
| Easy   | 2 plies; random move 20% of the time |
| Medium | 3 plies                              |
| Hard   | Iterative deepening for about 1 s    |

Measured (seats alternated, seed 9): Easy vs Random 20–0 and Medium vs Easy 19–1 (20 games each).
Hard vs Medium splits 10–10 because the opener wins, so strength shows in the margins (6 games per
seat): Hard opening against Medium wins by 90 seeds on average, Medium opening against Hard by 59;
Medium opening against Easy wins by 75, and Medium still wins as the second player (+14).

## States and actions

Shared engine `src/games/shared/mancala/engine.ts`: `MancalaState` = `pits` (South 0…n−1 left to
right, North n…2n−1 right to left — sowing runs through increasing indices), `stores`, `toMove`,
`movers`, `history`, `keys`, `result`, validated by replay. Actions: the pit index.

## Achievements

| id                         | Condition                                |
| -------------------------- | ---------------------------------------- |
| `first-win`                | Win against the computer.                |
| `beat-medium`, `beat-hard` | Beat each level.                         |
| `big-store`                | Win with 60 or more seeds in your store. |
| `hot-seat`                 | Finish a two-player game.                |

## Controls

Tap one of your highlighted pits to sow it. Keyboard: ←/→ choose a pit, Enter sows;
`U`/`H`/`R`/`N`. The board turns so your row is at the bottom; the status line says when you sow
again.

## Graphics and audio

A carved wooden board with round pits and long stores, pebble seeds drawn in rings with exact
counts, the last pit and hint ringed. Sowing patter and a capture chime.

## Save format and AI interface

Shared match envelope (schema 1). Env `congkak` v`1.0.0`; codec: the pit index (`actionSpaceSize`
15); tensor `[16]` (the observer's pits, the opponent's, both stores, scaled). Outcome carries
the final counts. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared mancala tests (relay sowing), module: strength ordering (seeded), South first, save round trip
and tamper rejection, contract suite, UI (sowing updates the pits), e2e desktop + mobile.
