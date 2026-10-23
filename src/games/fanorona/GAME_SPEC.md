# #054 Fanorona — Game Specification

## Ruleset (`fanorona-5x9`)

- A 5 × 9 grid of points joined by lines: orthogonal lines everywhere and diagonals from the
  "strong" points (row + column even). **White** (seat 0) has 22 pieces on the bottom rows,
  **Black** (seat 1) 22 on the top rows; the middle row alternates and its center is empty. White
  always opens.
- A move takes a piece one step along a line to an empty point.
- **Approach**: if the moving piece ends next to an enemy piece in its direction of travel, that
  piece and the unbroken line of enemy pieces behind it are captured. **Withdrawal**: moving
  straight away from an adjacent enemy piece captures it and its line. If a move allows both, the
  player chooses one.
- Capturing is **compulsory**; a non-capturing move (paika) is allowed only when no capture exists.
- After a capture the same piece may keep capturing, but never in the same direction twice in a
  row and never onto a point it already visited this turn; the player may stop at any time.
- Capturing every enemy piece (or leaving the opponent without a move) wins. To keep games finite:
  threefold repetition, or 30 full turns without a capture, is a draw.

## States and actions

`FanoronaState`: `board`, `toMove`, `chain` (piece, visited points, last direction while a chain
may continue), `movers`, `history`, `keys`, `quiet`, `result`, validated by replay. Actions: `f-t`
(paika), `f-tA` / `f-tW` (capture by approach / withdrawal), `stop`.

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. Generic alpha-beta with a transposition table
(the state key includes an open capture chain), captures ordered first, material evaluation; chain
continuations are consecutive moves by the same player.

| Level  | Search                             |
| ------ | ---------------------------------- |
| Easy   | 1 ply; random move 25% of the time |
| Medium | 3 plies                            |
| Hard   | Iterative deepening for about 1 s  |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 8–2, Medium vs Easy 10–0,
Hard vs Medium 10–0.

## Achievements

| id                         | Condition                                |
| -------------------------- | ---------------------------------------- |
| `first-win`                | Win against the computer.                |
| `beat-medium`, `beat-hard` | Beat each level.                         |
| `dominant`                 | Win with 10 or more of your pieces left. |
| `hot-seat`                 | Finish a two-player game.                |

## Controls

Tap a piece and a destination (green dot); when a destination allows both captures, choose with
the two buttons while the pieces that would fall are marked. During a chain keep tapping
destinations or press “End the turn”. Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`. The status
line says when a capture is compulsory and when a chain may continue.

## Graphics and audio

A wooden board with drawn lines, white and black pieces, landing dots, doomed pieces faded and
ringed red during a choice, the last move and hint outlined, a piece counter. Step and capture
sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `fanorona` v`1.0.0`; codec: (from·8 + direction)·3 + kind
(paika, approach, withdrawal), "stop" last (`actionSpaceSize` 1081); tensor `[2, 5, 9]`. Agents
`random`, `easy`, `medium`, `hard`.

## Testing criteria

Start position and compulsory opening captures, strong-point diagonals, approach and withdrawal
lines, chains (no repeated direction, stop), replay validation, codec, strength ordering (seeded),
save round trip and tamper rejection, contract suite, UI (compulsory capture status, capture), e2e
desktop + mobile.
