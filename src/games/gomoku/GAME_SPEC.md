# #007 Gomoku — Game Specification

## Ruleset (`freestyle-15x15`)

Freestyle Gomoku:

- 15×15 board; play on the intersections. **Black** (seat 0) moves first in round 1, **White**
  (seat 1) second; stones are placed on empty points and never move or get captured.
- The first player with an unbroken line of **five or more** stones horizontally, vertically or
  diagonally wins (freestyle: overlines count). Black has no restrictions (that is Renju, #008).
- If the board fills with no five in a row, the game is a draw.
- Match option _Alternate who starts each round_ (default on).

Freestyle Gomoku on 15×15 is known to be a first-player win with perfect play; no level here is
perfect.

## States and actions

The shared m,n,k engine with `{ rows: 15, cols: 15, k: 5 }` (`lineThrough ≥ k` gives freestyle
overlines): `board[225]`, `toMove`, `firstPlayer`, `history`, `result`. Action: point 0–224.

## Modes and difficulty

vs Computer (Black or White), Two Players, Watch AI. Four levels, all built on
`src/games/shared/five/agent.ts` (candidates within distance 2 of stones; attack + defense window
scores; always wins/blocks fives):

| Level  | Agent                                                                                      |
| ------ | ------------------------------------------------------------------------------------------ |
| Easy   | Greedy (1 ply), picks among its top 5 moves and plays a random nearby move 30% of the time |
| Medium | Greedy attack/defense (1 ply)                                                              |
| Hard   | Alpha-beta 4 plies over the 8 best candidates (600 ms budget)                              |
| Expert | Iterative deepening to 6 plies over the 6 best candidates (800 ms budget)                  |

Measured (seeded): Easy vs Random 20–0, Medium vs Easy 20–0, Hard vs Medium 9–0–3,
Expert vs Hard 10–0.

## Achievements

| id                                        | Condition                                       |
| ----------------------------------------- | ----------------------------------------------- |
| `first-win`                               | Win against the computer.                       |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                |
| `swift-five`                              | Win with at most 7 of your stones on the board. |
| `hot-seat`                                | Finish a two-player game.                       |

## Controls

Click/tap an intersection. On touch screens the first tap previews the stone and the second tap
on the same point places it (tapping elsewhere moves the preview). Keyboard: arrows move the
cursor, Enter/Space place; `U`/`H`/`R`/`N`.

## Graphics and audio

Shared `GoBoard`: wooden board, grid with star points and coordinates (A–P without I, 1–15 from
the bottom), shaded stones with shadows, placement pop, last-move ring, hover/tap preview, hint
ring, red winning line with other stones dimmed. Stone click sounds.

## Save format and AI interface

Shared two-player match envelope (schema 1). Env `gomoku` v`1.0.0`, ruleset `freestyle-15x15`,
action = point 0–224 (`actionSpaceSize` 225), tensor `[3, 15, 15]`; agents `random`, `easy`,
`medium`, `hard`, `expert`.

## Testing criteria

Five in all four directions, overline wins, four does not, full-board draw; agent always takes a
five and blocks the opponent's five; strength ordering (seeded); contract suite; UI including touch
confirmation; e2e desktop + mobile.
