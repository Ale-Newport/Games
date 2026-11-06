# #022 Animal Shogi 3×4 — Game Specification

Catalog entry "Dōbutsu Shōgi". The game is presented under the generic title **Animal Shogi
3×4** with artwork drawn for this project (no official characters, names or art are used).

## Ruleset (`animal-3x4`)

- 3 files × 4 ranks. Each side has a **lion** (royal; one step in any of the 8 directions), a
  **giraffe** (one step orthogonally), an **elephant** (one step diagonally) and a **chick** (one
  step forward). Start (from Sente's side, left to right): elephant, lion, giraffe on the back
  rank, chick in front of the lion; Gote mirrors it. **Sente** (bottom) moves first.
- A chick that reaches the far rank becomes a **hen** (compulsory), which moves like a gold general
  (orthogonally, or diagonally forward).
- **Drops**: captured animals join the captor's hand (a hen returns as a chick) and may be placed
  on any empty square instead of moving. A dropped chick may stand on the far rank; it does not
  promote and cannot move.
- **Winning**: capture the opponent's lion, or move your lion onto the far rank where the opponent
  cannot capture it (the **try**). If the lion arrives on a square the opponent can capture and
  the opponent does not capture it on the next move, the try succeeds. There is no check rule: a
  lion left capturable is simply lost.
- The same position (board, hands, side to move) for the **third time** is a draw; a 300-ply limit
  also draws. Optional clocks (2+2, 5+3), resignation and agreed draws as in #021.

## States and actions

Shared engine `src/games/shared/shogi/` (variant `ANIMAL`, goal `capture`, `tryRule`). Actions
like shogi: `2c2b`, `3b3a+`, `C*2c`. Result reasons `capture`, `try`, `no-moves`, `repetition`,
`move-limit`.

## Modes and difficulty

vs Computer (Sente or Gote), Two Players, Watch AI. The shared `ShogiSearchAgent` (royal capture
and try detected as wins at every node, lion advancement weighted for the try):

| Level  | Search                                                  |
| ------ | ------------------------------------------------------- |
| Easy   | 2 plies + captures; a random legal move 30% of the time |
| Medium | 4 plies (400 ms cap)                                    |
| Hard   | Iterative deepening to 8 plies (900 ms cap)             |
| Expert | Iterative deepening, as deep as 1.5 s allow             |

Measured (seeded, sides alternated, `shogi-match` bench with these presets): Easy vs Random 10–0, Medium vs Easy 10–0, Hard
vs Medium 6–0, Expert vs Hard 6–0. Before adding draw contempt to the search, Expert and Hard
repeated the position into a draw in all six games (0–0–6).

## Achievements

| id                                        | Condition                                        |
| ----------------------------------------- | ------------------------------------------------ |
| `first-win`                               | Win against the computer.                        |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                 |
| `hen`                                     | Promote a chick into a hen against the computer. |
| `home-run`                                | Win by the try (lion safely on the far row).     |
| `hot-seat`                                | Finish a two-player game.                        |

## Controls

As #021 (no promotion dialog: the chick always promotes).

## Graphics and audio

Pastel board with the two home rows tinted; rounded animal tiles drawn in SVG with movement dots
(warm for Sente, cool for Gote, Gote rotated); hands as trays; move list in Western notation.

## Save format and AI interface

Shared match envelope (schema 1). Env `dobutsu-shogi` v`1.0.0`, ruleset `animal-3x4`;
`actionSpaceSize` 360, tensor `[20, 4, 3]`; agents `random`, `easy`, `medium`, `hard`, `expert`.

## Testing criteria

Start position (4 moves), compulsory chick promotion, lion capture win, safe try, failed try
(capturable lion) both ways, chick drops anywhere incl. the far rank (shared engine tests); engine
captures a hanging lion and avoids losing its own; strength ordering (seeded); hen detection; save
round trip and tamper rejection; contract suite; UI (capture into the hand, drop back); e2e desktop

- mobile.
