# #055 Hnefatafl — Game Specification

## Ruleset (`hnefatafl-11x11-corner`)

- A 11×11 board: 24 attackers, 12 defenders and a king on the central throne. The **attackers** (seat 0, dark) always move first; the human
  picks a side in the menu.
- Every piece moves like a rook along a row or column through empty squares. Only the king may
  stop on the throne, or on a corner; other pieces may pass over the empty throne.
- Custodial capture: an enemy soldier sandwiched in a line between the moving piece and another
  friendly piece — or a hostile square (the corners and the empty throne) — is removed. Moving between two
  enemies is safe. The king takes part in captures.
- The defenders win when the king reaches **one of the four corners**.
- The attackers win by **capturing the king**: all four of his sides closed by attackers or the empty throne; he cannot be captured on the edge.
- A side with no legal move loses; threefold repetition or 300 plies is a draw.

## States and actions

Shared engine `src/games/shared/tafl/engine.ts`: `TaflState` = `board` (0 empty, 1 attacker, 2
defender, 3 king), `toMove`, `history`, `keys`, `result`, validated by replay. Actions: `f-t`
(from-to, squares row·11 + col from the top-left).

## Modes and difficulty

vs Computer (either side), Two Players, Watch AI. Evaluation (defenders' view): material
(defenders ×3, attackers ×1.5), king mobility, open escape routes (one open route is a threat, two
cannot both be blocked), attackers pressing on the king.

| Level  | Search                                                                          |
| ------ | ------------------------------------------------------------------------------- |
| Easy   | Generic alpha-beta, 1 ply; random move 25% of the time                          |
| Medium | Generic alpha-beta, 2 plies                                                     |
| Hard   | Fast mutable-board search (Zobrist TT, make/unmake), iterative deepening ~1.5 s |

Measured (seats alternated, 10 games per pair, seed 9): Easy vs Random 10–0, Medium vs Easy 7–3,
Hard vs Medium 9–0–1.
The first Hard (the generic agent with a 1.5 s budget) only split 4–5–1 with Medium: copying the
history on every node kept it at depth 2–3 on 11×11. The dedicated search fixed that.

## Achievements

| id                         | Condition                 |
| -------------------------- | ------------------------- |
| `first-win`                | Win against the computer. |
| `beat-medium`, `beat-hard` | Beat each level.          |
| `king-escapes`             | Win as the defenders.     |
| `king-taken`               | Win as the attackers.     |
| `hot-seat`                 | Finish a two-player game. |

## Controls

Tap one of your pieces, then a marked square. Keyboard: arrows, Enter, Esc; `U`/`H`/`R`/`N`. The
status line states the side to move's goal.

## Graphics and audio

A wooden board with hatched special squares, dark attackers, light defenders and an original
crowned king, landing dots, the last move outlined, a piece counter. Slide and capture sounds.

## Save format and AI interface

Shared match envelope (schema 1). Env `hnefatafl` v`1.0.0`; codec: from·121 + to (`actionSpaceSize`
14641); tensor `[3, 11, 11]` (attackers, defenders, king). Agents `random`, `easy`, `medium`, `hard`.

## Testing criteria

Shared: start counts, rook moves and restricted squares, sandwich captures (also against hostile
squares), safe entry, king capture rules of both variants, escapes, codec. Module: strength
ordering (seeded), attackers first, save round trip and tamper rejection, contract suite, UI
(selection, move, goal line), e2e desktop + mobile.
