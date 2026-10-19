# #006 Connect Five Gravity — Game Specification

## Ruleset (`connect-five-9x7`)

A fully defined larger gravity variant:

- Vertical board of **9 columns × 7 rows** (63 cells). Two players: **Red** (seat 0) and **Yellow**
  (seat 1); Red moves first in round 1.
- On a turn a player drops one disc into a non-full column; it falls to the lowest empty cell.
- The first player with **five discs in a row** — horizontally, vertically or diagonally — wins
  immediately. Longer runs (six or more) also win. Four in a row does not.
- If all 63 cells fill with no five in a row, the game is a draw.
- Match option _Alternate who starts each round_ (default on).

No game-theoretic result is claimed for this board; no level is claimed to be perfect.

## States and actions

Shared gravity family (`src/games/shared/gravity/`): `board[63]`, `heights[9]`, `toMove`,
`firstPlayer`, `history` (columns), `result`. Action: column 0–8.

## Modes and difficulty

vs Computer, Two Players, Watch AI.

| Level  | Agent                                                                                      |
| ------ | ------------------------------------------------------------------------------------------ |
| Easy   | Negamax 2 plies; random column 40% of the time                                             |
| Medium | Negamax 4 plies with the 5-cell window heuristic                                           |
| Hard   | Iterative-deepening negamax up to 20 plies within 600 ms (≈ depth 12 from the empty board) |

Measured (seeded): Easy vs Random 29–0–1, Medium vs Easy 18–1–1, Hard vs Medium 12–0.

## Achievements

| id            | Condition                            |
| ------------- | ------------------------------------ |
| `first-win`   | Win against the computer.            |
| `beat-medium` | Beat Medium.                         |
| `beat-hard`   | Beat Hard.                           |
| `six-run`     | Win with a run of six or more discs. |
| `diagonal`    | Win with a diagonal line.            |
| `hot-seat`    | Finish a two-player game.            |

## Controls, graphics, audio, saves, AI interface

As #005 (shared gravity board and shell) with 9 columns: ←/→, ↓/Enter, digits 1–9, `U`/`H`/`R`/`N`.
Env `connect-five-gravity` v`1.0.0`, ruleset `connect-five-9x7`, action = column 0–8
(`actionSpaceSize` 9), tensor `[3, 7, 9]`, agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Five-in-a-row in all directions, four does not win, six wins, full-board draw, contract suite,
strength ordering (seeded), UI, e2e desktop + mobile.
