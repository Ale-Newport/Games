# #019 Three-Check Chess — Game Specification

## Ruleset (`three-check`)

Standard chess (all rules of #015) with a second winning condition:

- Each check given is counted per side; a move that gives check counts **once**, even a double
  check. The player who gives their **third check wins immediately**, whether or not the checked
  king could escape.
- **Checkmate** still wins; stalemate, threefold repetition (positions are compared including
  castling and en passant rights) and the fifty-move rule draw.
- The only dead position is **king against king**: any other piece can still give checks, so a
  flag fall loses unless only the two kings remain.

Not implemented (documented): including the check counters in the repetition key (a repeated
position with different counters counts as a repetition here, which can only happen after checks
were given and both sides returned to the same placement).

## States and actions

Shared engine `src/games/shared/chess/` (variant `THREE_CHECK`); `ChessState.checks` holds the
counters and is verified by the history replay of saves; result reason `three-check`. Actions as
in #015.

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI. Same four levels as #015; the search tracks
checks along each line (a third check is scored as a mate at any depth reached) and the evaluation
adds 150 points per check of difference.

Measured (seeded, colors alternated, `chess-match` bench): Easy vs Random 8–0, Medium vs Easy 8–0, Hard vs
Medium 4–0, Expert vs Hard 4–0 (nearly all by the third check).

## Achievements

| id                                        | Condition                                           |
| ----------------------------------------- | --------------------------------------------------- |
| `first-win`                               | Win against the computer.                           |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                    |
| `untouchable`                             | Beat the computer without receiving a single check. |
| `mate-anyway`                             | Win Three-Check by checkmate.                       |
| `hot-seat`                                | Finish a two-player game.                           |

## Controls

As #015.

## Graphics and audio

Shared chess board; the status line shows "Checks — White n/3 · Black m/3" (plus "Check!" while a
king is in check). Result line: "White gave the third check."

## Save format and AI interface

Shared match envelope (schema 1). Env `three-check-chess` v`1.0.0`, ruleset `three-check`;
`stateKey` includes both counters; codec, tensor and agents as in #015.

## Testing criteria

Counting and the third-check win, a double check counts once, only bare kings are dead, the engine
takes the winning third check, strength ordering (seeded), save round trip and rejection of forged
counters, contract suite, UI (counters update after Bb5+), e2e desktop + mobile.
