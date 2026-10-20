# #018 King of the Hill Chess — Game Specification

## Ruleset (`koth-center-4`)

Standard chess (all rules of #015) with a second winning condition:

- A player **wins immediately** when their king lands on one of the four central squares **d4, e4,
  d5 or e5** (the hill). The move must be legal, so the king can never step onto an attacked hill
  square; castling cannot reach the hill.
- **Checkmate** still wins; stalemate, threefold repetition and the fifty-move rule still draw.
- There is **no dead-position draw**: even a bare king can still win by reaching the hill.
  Consequently a flag fall always loses.

## States and actions

Shared engine `src/games/shared/chess/` (variant `KING_OF_THE_HILL`, goal `king-of-the-hill`);
result reason `hill`. Actions as in #015.

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. Same four levels as #015; in this variant the
search treats a hill arrival as a mate (found at any depth it reaches) and adds a
king-centralization term (60 points per step closer to the center, scaled by distance) to the
evaluation, so the computer both races and blocks.

Measured (seeded, colors alternated, `chess-match` bench): Easy vs Random 8–0, Medium vs Easy 8–0, Hard vs
Medium 2–0–2 (two repetitions), Expert vs Hard 4–0 (almost all games end on the hill).

## Achievements

| id                                        | Condition                                  |
| ----------------------------------------- | ------------------------------------------ |
| `first-win`                               | Win against the computer.                  |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                           |
| `summit`                                  | Win by bringing your king to the hill.     |
| `old-school`                              | Win King of the Hill by checkmate instead. |
| `hot-seat`                                | Finish a two-player game.                  |

## Controls

As #015.

## Graphics and audio

Shared chess board with the four hill squares tinted and outlined; the status line lists them.
Result line: "White's king reached the center."

## Save format and AI interface

Shared match envelope (schema 1). Env `king-of-the-hill` v`1.0.0`, ruleset `koth-center-4`;
codec, tensor and agents as in #015.

## Testing criteria

Hill wins for both colors on d4/e4/d5, bare kings are not a draw, attacked hill squares are
illegal, checkmate still wins, the engine races a king to the hill in three plies, strength ordering
(seeded), save round trip and tamper rejection, contract suite, UI (hill squares marked, status
line), e2e desktop + mobile (a king march wins).
