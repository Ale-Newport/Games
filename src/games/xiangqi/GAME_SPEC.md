# #023 Xiangqi — Game Specification

## Ruleset (`axf-basic`)

Xiangqi (Chinese chess), basic Asian Xiangqi Federation rules:

- Pieces stand on the 9×10 intersections. **Red** (seat 0, bottom) moves first; **Black** (seat 1).
  Files a–i from Red's left, ranks 0–9 from Red's side (coordinates used for actions and
  notation).
- General: one step orthogonally inside its palace. Advisor: one step diagonally inside the
  palace. Elephant: two steps diagonally, blocked by a piece on the middle point ("elephant eye"),
  never crossing the river. Horse: one step orthogonally then one diagonally outward, blocked by a
  piece on the first point ("hobbled leg"). Chariot: like a rook. Cannon: moves like a chariot,
  captures only by jumping exactly one piece (the screen, of either color). Soldier: one step
  forward; after crossing the river also one step sideways; never backward, no promotion.
- The two generals may never face each other on an open file (**flying general** rule); a move
  may never leave the own general in check.
- **Checkmate wins**, and a player with **no legal move loses** (stalemate is a loss in xiangqi).
- **Threefold repetition** is a draw, unless one side gave check with every one of its moves in the
  cycle — that side loses (perpetual check). Draws also after 60 moves by each side without a
  capture, and when neither side has a piece able to attack (only generals, advisors, elephants).
- Optional clocks (5+5, 10+5, 20+10), resignation and agreed draws (two players).

Not implemented (documented): the perpetual-chase rules (long chase of unprotected pieces) of the
full AXF rule book; repetitions involving chases are scored as draws.

## States and actions

Shared engine `src/games/shared/xiangqi/`: mutable `XiangqiPosition` (signed codes, Zobrist keys,
reverse attack detection) and immutable `XiangqiState` (`board`, `toMove`, `history`, `notation`,
`keys`, `checks`, `quiet` plies since the last capture, `result`), validated by replay. Actions are
`from` + `to` (`h2e2`). Notation: piece letter (K A E H R C P) + from + `-`/`x` + to (`Ch2-e2`).

## Modes and difficulty

vs Computer (Red or Black), Two Players, Watch AI. `XiangqiSearchAgent`: negamax alpha-beta,
quiescence on captures, transposition table, MVV-LVA + killers, iterative deepening, draw
contempt; evaluation = material (R 900, C 450, H 400, A/E 200, P 100) plus position (crossed
soldiers double and grow toward the palace, central horses/cannons, active chariots).

| Level  | Search                                                |
| ------ | ----------------------------------------------------- |
| Easy   | 1 ply + captures; a random legal move 30% of the time |
| Medium | 3 plies + captures (400 ms cap)                       |
| Hard   | Iterative deepening to 5 plies (1 s cap)              |
| Expert | Iterative deepening, as deep as 1.8 s allow           |

Measured (seeded, sides alternated, `xq-match` bench): Easy vs Random 6–0, Medium vs Easy 6–0, Hard vs
Medium 4–0, Expert vs Hard 4–0 (by checkmate or stalemate).

## Achievements

| id                                        | Condition                                  |
| ----------------------------------------- | ------------------------------------------ |
| `first-win`                               | Win against the computer.                  |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                           |
| `cannon-mate`                             | Checkmate the computer with a cannon move. |
| `horse-mate`                              | Checkmate the computer with a horse move.  |
| `hot-seat`                                | Finish a two-player game.                  |

## Controls

Tap a piece to show its moves (dots; red rings for captures), then the destination. Keyboard:
arrows move the cursor over the 90 points, Enter/Space select and move, Esc cancels; `U`/`H`/`R`/`N`.

## Graphics and audio

Wooden board drawn as lines through the intersections, river with "楚河 漢界", palace diagonals;
original round ivory pieces with red or black characters and a small Latin letter; last-move ring,
selection, check glow, dashed hint; side layout on wide screens. Synthesized move, capture and
check sounds.

## Save format and AI interface

Shared match envelope (schema 1, optional clock/adjudication). Env `xiangqi` v`1.0.0`, ruleset
`axf-basic`; `actionSpaceSize` 8 100 (`from·90 + to`); tensor `[14, 10, 9]`; `stateKey` = board +
side. Agents `random`, `easy`, `medium`, `hard`, `expert`.

## Testing criteria

Perft 44 / 1 920 / 79 666 / 3 290 240 (depth 1–4, the published values); horse legs, elephant
eyes and the river, cannon screens, soldiers sideways after the river, flying generals;
double-chariot mate, stalemate loss, threefold repetition draw and perpetual-check loss; random
games end and validate; engine finds the mate and wins material; strength ordering (seeded); codec
bijective; achievements (double-cannon mate); save round trip and tamper rejection; contract
suite; UI (cannon targets and capture, check); e2e desktop + mobile.
