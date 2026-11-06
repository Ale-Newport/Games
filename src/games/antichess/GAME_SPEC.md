# #017 Antichess — Game Specification

## Ruleset (`antichess-international`)

Antichess / losing chess with the international ("lichess") conventions:

- Standard start position and piece moves; **White** (seat 0) moves first.
- **Captures are compulsory**: if any capture is available the player must capture, choosing
  freely among all captures (no majority rule).
- The **king is an ordinary piece**: there is no check, checkmate or castling; kings may be
  captured and may move onto attacked squares. Pawns may also **promote to a king**.
- A player **wins** by losing all their pieces, or by having no legal move on their turn
  (stalemate wins for the stalemated side).
- Draws: threefold repetition, the fifty-move rule, and a dead position where only bishops remain
  with each side's bishops all on one square color and the two sides on different colors (they can
  never capture each other again). Clocks, resignation and agreed draws as in #015; a flag fall
  always loses (any material can still win).

Not implemented (documented): the older "suicide chess" scoring variants (FICS piece-count
stalemate rule), and en passant is kept as a normal (therefore compulsory) capture, as in the
international rules.

## States and actions

Shared engine `src/games/shared/chess/` (variant `ANTICHESS`: `castling: false`, `antichess: true`,
start castling field `-`). Move generation returns only captures when one exists; `inCheck` is
always false; SAN has no check marks; promotions include `k` (`a7a8k`, SAN `a8=K`).

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. Same four levels as #015 on the shared
`ChessSearchAgent`, whose antichess mode negates material (every piece counts the same, plus a
small centrality term), scores "no pieces or no moves" as a win for the side to move, and uses a
dedicated quiescence search without stand-pat while a capture is compulsory (every forced capture
chain is followed until the position is quiet).

Measured (seeded, colors alternated, `chess-match` bench): Easy vs Random 8–0, Medium vs Easy 8–0,
Hard vs Medium 3–1, Expert vs Hard 4–0 (all decided by running out of pieces or moves). Before the antichess quiescence fix Easy only scored 4–3–1 against Random.

## Achievements

| id                                        | Condition                                                   |
| ----------------------------------------- | ----------------------------------------------------------- |
| `first-win`                               | Win against the computer.                                   |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                            |
| `king-promotion`                          | Promote a pawn to a king against the computer.              |
| `blocked-win`                             | Win against the computer with pieces left (no legal moves). |
| `hot-seat`                                | Finish a two-player game.                                   |

## Controls

As #015. When a capture is compulsory only capturing pieces can be selected and only captures are
marked; the status line says "You must capture". The promotion picker offers a king as well.

## Graphics and audio

Shared chess board and original piece set; status line with the pieces left per side; no check
highlight (there is no check).

## Save format and AI interface

Shared match envelope (schema 1). Env `antichess` v`1.0.0`, ruleset `antichess-international`;
action codec as #015 (promotion index 5 = king), tensor `[12, 8, 8]`; agents `random`, `easy`,
`medium`, `hard`, `expert`.

## Testing criteria

Compulsory captures (only the capture is legal), non-royal king (stays attacked, can be captured),
wins by losing all pieces (both colors) and by being blocked, king promotion, opposite-colored
bishops dead draw, the engine hands over its last piece when that wins, strength ordering
(seeded), save round trip and tamper rejection, contract suite, UI (compulsory capture marking,
piece counts), e2e desktop + mobile.
