# #062 Oware — Game Specification

## Ruleset (`oware-abapa`)

- Two rows of six pits with four seeds each; captured seeds are set aside (no stores in play).
  **South** (seat 0) moves first.
- A move sows every seed of one of your pits counter-clockwise; with 12 or more seeds the starting
  pit is skipped each lap.
- If the last seed leaves an opponent's pit with **2 or 3** seeds it is captured, together with the
  opponent's pits just before it that also hold 2 or 3. A capture that would take every opponent
  seed (grand slam) captures nothing.
- If your opponent has no seeds you must make a move that gives them some; if no move can, the game
  ends.
- Capturing **more than 24** seeds wins at once. Otherwise, when the side to move cannot play, or
  after threefold repetition or 400 plies, each player keeps the seeds on their side and the larger
  total wins (24–24 is a draw).

## Modes and difficulty

vs Computer (South or North), Two Players, Watch AI. Generic alpha-beta; evaluation = captured
difference plus a quarter of the seeds on each row.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 4 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 10–0, Medium vs Easy 10–0,
Hard vs Medium 9–1.

## States and actions

Shared engine `src/games/shared/mancala/engine.ts`: `MancalaState` = `pits` (South 0…n−1 left to
right, North n…2n−1 right to left — sowing runs through increasing indices), `stores`, `toMove`,
`movers`, `history`, `keys`, `result`, validated by replay. Actions: the pit index.

## Achievements

| id                         | Condition                           |
| -------------------------- | ----------------------------------- |
| `first-win`                | Win against the computer.           |
| `beat-medium`, `beat-hard` | Beat each level.                    |
| `big-store`                | Win with 30 or more seeds captured. |
| `hot-seat`                 | Finish a two-player game.           |

## Controls

Tap one of your highlighted pits to sow it. Keyboard: ←/→ choose a pit, Enter sows;
`U`/`H`/`R`/`N`. The board turns so your row is at the bottom; the status line says when you sow
again.

## Graphics and audio

A carved wooden board with round pits and long stores, pebble seeds drawn in rings with exact
counts, the last pit and hint ringed. Sowing patter and a capture chime.

## Save format and AI interface

Shared match envelope (schema 1). Env `oware` v`1.0.0`; codec: the pit index (`actionSpaceSize`
13); tensor `[14]` (the observer's pits, the opponent's, both stores, scaled). Outcome carries
the final counts. Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared mancala tests (2–3 captures backward, grand slam refused, feeding rule, skipping the origin pit), module: strength ordering (seeded), South first, save round trip
and tamper rejection, contract suite, UI (sowing updates the pits), e2e desktop + mobile.
