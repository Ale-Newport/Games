# #016 Chess960 — Game Specification

## Ruleset (`fide-chess960`)

Chess960 (Fischer random chess) as in the FIDE Laws of Chess, Guidelines on Chess960:

- The pawns stand on their usual squares; White's back-rank pieces are placed in one of **960**
  arrangements with the bishops on opposite-colored squares and the king somewhere between the two
  rooks; Black mirrors White. Start positions are numbered 0–959 with the standard numbering
  scheme (bishops, queen, knights, then rook–king–rook); **#518** is the classical setup.
- Each new round draws a start position uniformly at random; _Restart_ replays the same one.
- **Castling**: with neither the king nor that rook having moved, the king and rook end on the
  classical castled squares — king g1 and rook f1 (short, `O-O`), king c1 and rook d1 (long,
  `O-O-O`), g8/f8 and c8/d8 for Black — whatever their starting squares. Every square either piece
  crosses or lands on must be empty except for the king and that rook; the king may not be in check,
  cross or land on an attacked square. Castling may leave one of the pieces where it stood.
- All other rules — moves, en passant, promotion, check, mate, stalemate, threefold repetition,
  the fifty-move rule, dead positions, clocks with the insufficient-material flag rule,
  resignation, agreed draws — are exactly those of #015 Chess.

## States and actions

Shared engine `src/games/shared/chess/` (variant `CHESS960`). Castling rights are stored per rook
square (Shredder-style), so any setup is represented; `startFen` must be one of the 960 setups for a
save or deserialized state to be accepted (`isAllowedStart`). Actions as in #015 (`e2e4`, `e7e8q`,
`O-O`, `O-O-O`).

## Modes and difficulty

vs Computer (White or Black), Two Players, Watch AI with the same four levels as #015 (Easy,
Medium, Hard, Expert; one alpha-beta engine at increasing depth/time). Piece-square tables are the
classical ones — they still reward development and central control in shuffled setups.

Measured (seeded, start positions 0–7, colors alternated, `chess-match` bench): Easy vs Random
8–0, Medium vs Easy 8–0, Hard vs Medium 4–0, Expert vs Hard 4–0 (all by checkmate).

## Achievements

| id                                        | Condition                                          |
| ----------------------------------------- | -------------------------------------------------- |
| `first-win`                               | Win against the computer.                          |
| `beat-medium`, `beat-hard`, `beat-expert` | Beat each level.                                   |
| `castled-win`                             | Castle and win against the computer.               |
| `classical`                               | Win from start position 518 (the classical setup). |
| `hot-seat`                                | Finish a two-player game.                          |

## Controls

As #015. To castle, select the king and then **its rook** (or drag the king onto the rook); when
the king's destination square is not reachable by a normal king move, clicking it castles too.

## Graphics and audio

Shared chess board and original piece set; the status line shows "Start position #N".

## Save format and AI interface

Shared match envelope (schema 1, optional clock/adjudication). Env `chess960` v`1.0.0`, ruleset
`fide-chess960`; `reset(seed)` starts from position `seed mod 960`; action codec, observation
tensor `[12, 8, 8]` and agents as in #015.

## Testing criteria

Perft on three Chess960 positions (shared tests); numbering (#518 classical, 960 distinct valid
setups, Black mirrors White); castling to the classical squares from a king-b1 setup (both sides,
SAN); restart keeps the start; strength ordering (seeded); save round trip and rejection of a
non-960 start; contract suite; UI (start number matches the board, castling by king-onto-rook);
e2e desktop + mobile.
